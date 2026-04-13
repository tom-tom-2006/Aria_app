from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends
from fastapi.responses import HTMLResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, logging, uuid, httpx, json as json_mod
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import bcrypt, jwt
from bson import ObjectId
from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContent
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'aria_db')]
JWT_ALGORITHM = "HS256"
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_jwt_secret(): return os.environ["JWT_SECRET"]
def hash_password(p): return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()
def verify_password(p, h): return bcrypt.checkpw(p.encode(), h.encode())
def create_access_token(uid, email):
    return jwt.encode({"sub": uid, "email": email, "exp": datetime.now(timezone.utc) + timedelta(hours=24), "type": "access"}, get_jwt_secret(), algorithm=JWT_ALGORITHM)
def create_refresh_token(uid):
    return jwt.encode({"sub": uid, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    token = auth[7:] if auth.startswith("Bearer ") else None
    if not token: raise HTTPException(401, "Not authenticated")
    try:
        p = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if p.get("type") != "access": raise HTTPException(401, "Invalid token")
        user = await db.users.find_one({"_id": ObjectId(p["sub"])})
        if not user: raise HTTPException(401, "User not found")
        user["id"] = str(user.pop("_id"))
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError: raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError: raise HTTPException(401, "Invalid token")

def build_user_response(doc, uid, email):
    return {"id": uid, "email": email, "name": doc.get("name",""), "city": doc.get("city",""), "role": doc.get("role","user"), "subscription": doc.get("subscription","free"), "avatar": doc.get("avatar","")}

# Models
class RegisterInput(BaseModel):
    email: str; password: str; name: str; city: str
class LoginInput(BaseModel):
    email: str; password: str
class ProfileUpdateInput(BaseModel):
    name: Optional[str] = None; email: Optional[str] = None; city: Optional[str] = None; password: Optional[str] = None; avatar: Optional[str] = None
class ChatInput(BaseModel):
    message: str; session_id: Optional[str] = None
class SavedLookInput(BaseModel):
    name: str; products: list; notes: Optional[str] = ""
class SkinAnalysisInput(BaseModel):
    image: str
class ContactInput(BaseModel):
    subject: str; message: str

app = FastAPI(title="ARIA API")
api_router = APIRouter(prefix="/api")

# ─── AUTH ───
@api_router.post("/auth/register")
async def register(data: RegisterInput):
    email = data.email.lower().strip()
    if await db.users.find_one({"email": email}): raise HTTPException(400, "Email déjà enregistré")
    doc = {"email": email, "password_hash": hash_password(data.password), "name": data.name.strip(), "city": data.city.strip(), "role": "user", "subscription": "free", "avatar": "", "created_at": datetime.now(timezone.utc)}
    r = await db.users.insert_one(doc)
    uid = str(r.inserted_id)
    return {"access_token": create_access_token(uid, email), "refresh_token": create_refresh_token(uid), "user": build_user_response(doc, uid, email)}

@api_router.post("/auth/login")
async def login(data: LoginInput):
    email = data.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user["password_hash"]): raise HTTPException(401, "Email ou mot de passe incorrect")
    uid = str(user["_id"])
    return {"access_token": create_access_token(uid, email), "refresh_token": create_refresh_token(uid), "user": build_user_response(user, uid, email)}

@api_router.get("/auth/me")
async def get_me(user=Depends(get_current_user)): return user

@api_router.put("/auth/profile")
async def update_profile(data: ProfileUpdateInput, user=Depends(get_current_user)):
    upd = {}
    if data.name is not None: upd["name"] = data.name.strip()
    if data.city is not None: upd["city"] = data.city.strip()
    if data.avatar is not None: upd["avatar"] = data.avatar
    if data.email is not None:
        ne = data.email.lower().strip()
        if ne != user.get("email") and await db.users.find_one({"email": ne}): raise HTTPException(400, "Email déjà utilisé")
        if ne != user.get("email"): upd["email"] = ne
    if data.password is not None:
        if len(data.password) < 6: raise HTTPException(400, "Mot de passe trop court")
        upd["password_hash"] = hash_password(data.password)
    if not upd: raise HTTPException(400, "Aucune modification")
    await db.users.update_one({"_id": ObjectId(user["id"])}, {"$set": upd})
    u = await db.users.find_one({"_id": ObjectId(user["id"])})
    u["id"] = str(u.pop("_id")); u.pop("password_hash", None)
    return u

# ─── WEATHER ───
@api_router.get("/weather")
async def get_weather(city: str):
    try:
        async with httpx.AsyncClient(timeout=10.0) as hc:
            gr = await hc.get("https://geocoding-api.open-meteo.com/v1/search", params={"name": city, "count": 1})
            gd = gr.json()
            if "results" not in gd or not gd["results"]: raise HTTPException(404, "Ville non trouvée")
            lat, lon, cn = gd["results"][0]["latitude"], gd["results"][0]["longitude"], gd["results"][0]["name"]
            wr = await hc.get("https://api.open-meteo.com/v1/forecast", params={"latitude": lat, "longitude": lon, "current_weather": True, "hourly": "relative_humidity_2m", "forecast_days": 1})
            wd = wr.json(); c = wd["current_weather"]; t = c["temperature"]; wc = c.get("weathercode", 0)
            if t < 5: adv, ic = "Temps très froid ! Crème riche et protectrice.", "snow"
            elif t < 15: adv, ic = "Temps frais. Hydratez bien et sérum nourrissant.", "cloud"
            elif t < 25: adv, ic = "Idéal ! Crème légère et SPF 30 minimum.", "partly-sunny"
            elif t < 35: adv, ic = "Chaud ! Maquillage léger, waterproof, SPF 50.", "sunny"
            else: adv, ic = "Canicule ! Hydratation max, pas de maquillage lourd.", "sunny"
            if wc in [71,73,75,77,85,86]: ic="snow"
            elif wc in [51,53,55,56,57,61,63,65,66,67,80,81,82]: ic="rainy"
            elif wc in [95,96,99]: ic="thunderstorm"
            elif wc in [45,48]: ic="cloud"
            elif wc in [1,2,3]: ic="partly-sunny"
            hl = wd.get("hourly",{}).get("relative_humidity_2m",[50]); hum = hl[0] if hl else 50
            return {"city": cn, "temperature": t, "humidity": hum, "weather_code": wc, "icon": ic, "skin_advice": adv}
    except HTTPException: raise
    except Exception as e: logger.error(f"Weather: {e}"); raise HTTPException(500, "Météo indisponible")

# ─── CHAT (Enhanced context) ───
@api_router.post("/chat")
async def chat_message(data: ChatInput, user=Depends(get_current_user)):
    sid = data.session_id or f"aria-{user['id']}"
    uid = user["id"]
    await db.chat_messages.insert_one({"session_id": sid, "user_id": uid, "role": "user", "content": data.message, "created_at": datetime.now(timezone.utc)})
    hist = await db.chat_messages.find({"session_id": sid}, {"_id": 0}).sort("created_at", -1).limit(15).to_list(15)
    hist.reverse()
    ctx = "\n".join([f"{'Utilisateur' if m['role']=='user' else 'ARIA'}: {m['content']}" for m in hist[:-1]]) or "Début."
    # Gather user context
    looks = await db.saved_looks.find({"user_id": uid}, {"_id": 0, "name": 1, "products": 1}).to_list(10)
    looks_ctx = ", ".join([l["name"] for l in looks]) if looks else "Aucun"
    skin = await db.skin_analyses.find({"user_id": uid}, {"_id": 0}).sort("created_at", -1).limit(1).to_list(1)
    skin_ctx = ""
    if skin:
        a = skin[0].get("analysis", {})
        skin_ctx = f"Type de peau: {a.get('type','?')}, Score: {a.get('score','?')}/100, Observations: {', '.join(a.get('observations',[]))}"
    weather_ctx = ""
    try:
        async with httpx.AsyncClient(timeout=5) as hc:
            wr = await hc.get(f"http://localhost:8001/api/weather", params={"city": user.get("city","Paris")})
            if wr.status_code == 200:
                w = wr.json()
                weather_ctx = f"Météo {w['city']}: {w['temperature']}°C, Humidité {w['humidity']}%, Conseil: {w['skin_advice']}"
    except: pass
    sys_msg = f"""Tu es ARIA, assistante beauté IA experte. Réponds en français, chaleureusement.
Infos utilisateur:
- Nom: {user.get('name','')}, Ville: {user.get('city','')}, Abo: {user.get('subscription','free')}
- Looks sauvegardés: {looks_ctx}
- {skin_ctx if skin_ctx else 'Pas encore d analyse de peau'}
- {weather_ctx if weather_ctx else ''}
Historique:\n{ctx}"""
    try:
        lc = LlmChat(api_key=os.environ["EMERGENT_LLM_KEY"], session_id=f"aria-{uuid.uuid4().hex[:8]}", system_message=sys_msg).with_model("openai", "gpt-5.2")
        rt = await lc.send_message(UserMessage(text=data.message))
        await db.chat_messages.insert_one({"session_id": sid, "user_id": uid, "role": "assistant", "content": rt, "created_at": datetime.now(timezone.utc)})
        return {"session_id": sid, "response": rt}
    except Exception as e: logger.error(f"Chat: {e}"); raise HTTPException(500, "Erreur chat")

@api_router.get("/chat/history")
async def get_chat_history(session_id: str, user=Depends(get_current_user)):
    return await db.chat_messages.find({"session_id": session_id, "user_id": user["id"]}, {"_id": 0}).sort("created_at", 1).to_list(100)

# ─── TUTORIALS ───
@api_router.get("/tutorials")
async def get_tutorials(): return await db.tutorials.find({}, {"_id": 0}).to_list(100)

# ─── SAVED LOOKS ───
@api_router.get("/looks")
async def get_looks(user=Depends(get_current_user)):
    return await db.saved_looks.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)

@api_router.post("/looks")
async def save_look(data: SavedLookInput, user=Depends(get_current_user)):
    doc = {"id": str(uuid.uuid4()), "user_id": user["id"], "name": data.name, "products": data.products, "notes": data.notes, "created_at": datetime.now(timezone.utc)}
    await db.saved_looks.insert_one(doc)
    doc.pop("_id", None); doc["created_at"] = doc["created_at"].isoformat()
    return doc

@api_router.delete("/looks/{look_id}")
async def delete_look(look_id: str, user=Depends(get_current_user)):
    r = await db.saved_looks.delete_one({"id": look_id, "user_id": user["id"]})
    if r.deleted_count == 0: raise HTTPException(404, "Look non trouvé")
    return {"message": "Supprimé"}

# ─── SKIN ANALYSIS ───
@api_router.post("/skin-analysis")
async def analyze_skin(data: SkinAnalysisInput, user=Depends(get_current_user)):
    if user.get("subscription") != "premium": raise HTTPException(403, "Fonctionnalité Premium requise")
    sys = """Tu es experte en dermatologie cosmétique. Analyse cette photo et réponds UNIQUEMENT en JSON:
{"type":"type peau","observations":["obs1","obs2","obs3"],"score":75,"products":[{"name":"produit","brand":"marque","reason":"raison"}],"routine":{"morning":["étape"],"evening":["étape"]},"summary":"résumé 2 phrases"}
Types: sèche, grasse, mixte, normale, sensible. Score /100. 3-5 produits marques réelles."""
    try:
        lc = LlmChat(api_key=os.environ["EMERGENT_LLM_KEY"], session_id=f"skin-{uuid.uuid4().hex[:8]}", system_message=sys).with_model("openai", "gpt-5.2")
        img_file = FileContent(content_type="image/jpeg", file_content_base64=data.image)
        rt = await lc.send_message(UserMessage(text="Analyse ma peau.", file_contents=[img_file]))
        try:
            clean = rt.strip()
            if clean.startswith("```"): clean = clean.split("\n",1)[1].rsplit("```",1)[0]
            analysis = json_mod.loads(clean)
        except: analysis = {"type":"mixte","observations":["Analyse textuelle"],"score":70,"products":[],"routine":{"morning":[],"evening":[]},"summary":rt[:300]}
        await db.skin_analyses.insert_one({"user_id": user["id"], "analysis": analysis, "created_at": datetime.now(timezone.utc)})
        return {"analysis": analysis}
    except HTTPException: raise
    except Exception as e: logger.error(f"Skin: {e}"); raise HTTPException(500, "Erreur analyse")

# ─── CONTACT ───
@api_router.post("/contact")
async def submit_contact(data: ContactInput, user=Depends(get_current_user)):
    doc = {"id": str(uuid.uuid4()), "user_id": user["id"], "user_name": user.get("name",""), "user_email": user.get("email",""), "subject": data.subject, "message": data.message, "status": "new", "admin_email": "tom.clement0814@gmail.com", "created_at": datetime.now(timezone.utc)}
    await db.contact_requests.insert_one(doc)
    doc.pop("_id", None); doc["created_at"] = doc["created_at"].isoformat()
    return {"message": "Message envoyé", "contact": doc}

# ─── STRIPE PAYMENT ───
PREMIUM_PRICE = 9.99

@api_router.post("/payment/create-checkout")
async def create_checkout(request: Request, user=Depends(get_current_user)):
    body = await request.json()
    host_url = body.get("host_url", str(request.base_url).rstrip("/"))
    success_url = f"{host_url}/api/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{host_url}/api/payment/cancel"
    webhook_url = f"{str(request.base_url).rstrip('/')}/api/webhook/stripe"
    sc = StripeCheckout(api_key=os.environ["STRIPE_API_KEY"], webhook_url=webhook_url)
    req = CheckoutSessionRequest(amount=PREMIUM_PRICE, currency="eur", success_url=success_url, cancel_url=cancel_url, metadata={"user_id": user["id"], "user_email": user.get("email",""), "plan": "premium"})
    session = await sc.create_checkout_session(req)
    await db.payment_transactions.insert_one({"session_id": session.session_id, "user_id": user["id"], "amount": PREMIUM_PRICE, "currency": "eur", "status": "pending", "payment_status": "initiated", "metadata": {"plan": "premium"}, "created_at": datetime.now(timezone.utc)})
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payment/status/{session_id}")
async def check_payment_status(session_id: str, request: Request, user=Depends(get_current_user)):
    webhook_url = f"{str(request.base_url).rstrip('/')}/api/webhook/stripe"
    sc = StripeCheckout(api_key=os.environ["STRIPE_API_KEY"], webhook_url=webhook_url)
    status = await sc.get_checkout_status(session_id)
    tx = await db.payment_transactions.find_one({"session_id": session_id})
    if tx and tx.get("payment_status") != "paid" and status.payment_status == "paid":
        await db.payment_transactions.update_one({"session_id": session_id}, {"$set": {"status": "complete", "payment_status": "paid"}})
        await db.users.update_one({"_id": ObjectId(user["id"])}, {"$set": {"subscription": "premium"}})
        logger.info(f"User {user['id']} upgraded to premium")
    elif tx and status.payment_status != "paid":
        await db.payment_transactions.update_one({"session_id": session_id}, {"$set": {"status": status.status, "payment_status": status.payment_status}})
    return {"status": status.status, "payment_status": status.payment_status, "amount": status.amount_total, "currency": status.currency}

@api_router.get("/payment/success", response_class=HTMLResponse)
async def payment_success(session_id: str):
    return f"""<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{{font-family:-apple-system,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#000;color:#fff;text-align:center;margin:0}}h1{{color:#FF2D55;font-size:28px}}p{{color:#8E8E93;margin-top:12px}}</style></head><body><div><h1>Paiement réussi !</h1><p>Votre abonnement Premium ARIA est activé.<br>Retournez dans l'application.</p></div></body></html>"""

@api_router.get("/payment/cancel", response_class=HTMLResponse)
async def payment_cancel():
    return """<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:-apple-system,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#000;color:#fff;text-align:center;margin:0}h1{color:#FF9500;font-size:28px}p{color:#8E8E93;margin-top:12px}</style></head><body><div><h1>Paiement annulé</h1><p>Aucun montant n'a été prélevé.<br>Retournez dans l'application.</p></div></body></html>"""

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    try:
        webhook_url = f"{str(request.base_url).rstrip('/')}/api/webhook/stripe"
        sc = StripeCheckout(api_key=os.environ["STRIPE_API_KEY"], webhook_url=webhook_url)
        event = await sc.handle_webhook(body, sig)
        if event.payment_status == "paid":
            tx = await db.payment_transactions.find_one({"session_id": event.session_id})
            if tx and tx.get("payment_status") != "paid":
                await db.payment_transactions.update_one({"session_id": event.session_id}, {"$set": {"status": "complete", "payment_status": "paid"}})
                uid = tx.get("user_id") or event.metadata.get("user_id")
                if uid: await db.users.update_one({"_id": ObjectId(uid)}, {"$set": {"subscription": "premium"}})
        return {"status": "ok"}
    except Exception as e: logger.error(f"Webhook: {e}"); return {"status": "error"}

# ─── ADMIN ───
@api_router.get("/admin/stats")
async def get_admin_stats(user=Depends(get_current_user)):
    if user.get("role") != "admin": raise HTTPException(403, "Admin requis")
    tu = await db.users.count_documents({"role":"user"})
    tl = await db.saved_looks.count_documents({})
    tm = await db.chat_messages.count_documents({})
    tt = await db.tutorials.count_documents({})
    fu = await db.users.count_documents({"role":"user","subscription":{"$in":["free",None]}})
    pu = await db.users.count_documents({"role":"user","subscription":"premium"})
    ru = await db.users.find({"role":"user"},{"_id":0,"password_hash":0}).sort("created_at",-1).limit(10).to_list(10)
    for u in ru:
        if isinstance(u.get("created_at"), datetime): u["created_at"] = u["created_at"].isoformat()
    contacts = await db.contact_requests.find({},{"_id":0}).sort("created_at",-1).limit(20).to_list(20)
    for c in contacts:
        if isinstance(c.get("created_at"), datetime): c["created_at"] = c["created_at"].isoformat()
    return {"total_users":tu,"total_looks":tl,"total_messages":tm,"total_tutorials":tt,"subscriptions":{"free":fu,"premium":pu},"recent_users":ru,"contacts":contacts}

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await seed_tutorials(); await seed_admin()
    logger.info("ARIA backend started")

async def seed_admin():
    ae = os.environ.get("ADMIN_EMAIL","tom@gmail.com"); ap = os.environ.get("ADMIN_PASSWORD","Tomcle62")
    ex = await db.users.find_one({"email": ae})
    if not ex:
        old = await db.users.find_one({"role":"admin"})
        if old: await db.users.update_one({"_id":old["_id"]},{"$set":{"email":ae,"password_hash":hash_password(ap),"name":"Tom","city":"Paris","subscription":"premium"}})
        else: await db.users.insert_one({"email":ae,"password_hash":hash_password(ap),"name":"Tom","city":"Paris","role":"admin","subscription":"premium","avatar":"","created_at":datetime.now(timezone.utc)})
    else: await db.users.update_one({"email":ae},{"$set":{"role":"admin","subscription":"premium"}})

async def seed_tutorials():
    f = await db.tutorials.find_one({}); 
    if f and "premium" not in f: await db.tutorials.drop()
    if await db.tutorials.count_documents({}) == 0:
        ts = [
            {"id":str(uuid.uuid4()),"title":"Maquillage Naturel Quotidien","description":"Les bases d'un look naturel et frais.","duration":"15 min","level":"Débutant","category":"Quotidien","premium":False,"image_index":0,"steps":["Préparer la peau","Fond de teint léger","Estomper","Blush rosé","Mascara","Baume à lèvres"]},
            {"id":str(uuid.uuid4()),"title":"Smoky Eyes Élégant","description":"Le smoky eyes classique.","duration":"25 min","level":"Intermédiaire","category":"Soirée","premium":False,"image_index":1,"steps":["Base à paupières","Teinte claire","Ombre foncée","Estomper","Liner","Mascara"]},
            {"id":str(uuid.uuid4()),"title":"Contouring et Sculpting","description":"Sculptez votre visage.","duration":"20 min","level":"Intermédiaire","category":"Technique","premium":True,"image_index":2,"steps":["Forme du visage","Contour pommettes","Highlighter","Estomper","Poudre","Blush"]},
            {"id":str(uuid.uuid4()),"title":"Teint Parfait","description":"Un teint impeccable.","duration":"18 min","level":"Débutant","category":"Base","premium":False,"image_index":0,"steps":["Nettoyer","Primer","Fond de teint","Appliquer","Correcteur","Spray fixateur"]},
            {"id":str(uuid.uuid4()),"title":"Lèvres Parfaites","description":"Secrets pour des lèvres sublimes.","duration":"12 min","level":"Débutant","category":"Lèvres","premium":False,"image_index":1,"steps":["Exfolier","Baume","Crayon contour","Rouge à lèvres","Estomper","Gloss"]},
            {"id":str(uuid.uuid4()),"title":"Soirée Glamour","description":"Look sophistiqué.","duration":"30 min","level":"Avancé","category":"Soirée","premium":True,"image_index":2,"steps":["Primer illuminateur","Fond de teint","Yeux charbonneux","Faux cils","Contouring","Rouge bold","Highlighter","Spray"]},
        ]
        await db.tutorials.insert_many(ts)

@app.on_event("shutdown")
async def shutdown(): client.close()
