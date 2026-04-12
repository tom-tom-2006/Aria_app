from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import httpx
from bson import ObjectId
from emergentintegrations.llm.chat import LlmChat, UserMessage

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'aria_db')]

# JWT
JWT_ALGORITHM = "HS256"

def get_jwt_secret():
    return os.environ["JWT_SECRET"]

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        "type": "access"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get("Authorization", "")
    token = None
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["id"] = str(user.pop("_id"))
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Pydantic Models
class RegisterInput(BaseModel):
    email: str
    password: str
    name: str
    city: str

class LoginInput(BaseModel):
    email: str
    password: str

class ProfileUpdateInput(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    password: Optional[str] = None

class ChatInput(BaseModel):
    message: str
    session_id: Optional[str] = None

class SavedLookInput(BaseModel):
    name: str
    products: List[str]
    notes: Optional[str] = ""

# App setup
app = FastAPI(title="ARIA API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ─── AUTH ENDPOINTS ───

def build_user_response(user_doc, user_id, email):
    return {
        "id": user_id,
        "email": email,
        "name": user_doc.get("name", ""),
        "city": user_doc.get("city", ""),
        "role": user_doc.get("role", "user"),
        "subscription": user_doc.get("subscription", "free"),
    }

@api_router.post("/auth/register")
async def register(data: RegisterInput):
    email = data.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà enregistré")
    user_doc = {
        "email": email,
        "password_hash": hash_password(data.password),
        "name": data.name.strip(),
        "city": data.city.strip(),
        "role": "user",
        "subscription": "free",
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    return {
        "access_token": access,
        "refresh_token": refresh,
        "user": build_user_response(user_doc, user_id, email)
    }

@api_router.post("/auth/login")
async def login(data: LoginInput):
    email = data.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    user_id = str(user["_id"])
    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    return {
        "access_token": access,
        "refresh_token": refresh,
        "user": build_user_response(user, user_id, email)
    }

@api_router.get("/auth/me")
async def get_me(user=Depends(get_current_user)):
    return user

@api_router.put("/auth/profile")
async def update_profile(data: ProfileUpdateInput, user=Depends(get_current_user)):
    update_fields = {}
    if data.name is not None:
        update_fields["name"] = data.name.strip()
    if data.city is not None:
        update_fields["city"] = data.city.strip()
    if data.email is not None:
        new_email = data.email.lower().strip()
        if new_email != user.get("email"):
            existing = await db.users.find_one({"email": new_email})
            if existing:
                raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
            update_fields["email"] = new_email
    if data.password is not None:
        if len(data.password) < 6:
            raise HTTPException(status_code=400, detail="Le mot de passe doit contenir au moins 6 caractères")
        update_fields["password_hash"] = hash_password(data.password)

    if not update_fields:
        raise HTTPException(status_code=400, detail="Aucune modification fournie")

    await db.users.update_one({"_id": ObjectId(user["id"])}, {"$set": update_fields})
    updated = await db.users.find_one({"_id": ObjectId(user["id"])})
    updated["id"] = str(updated.pop("_id"))
    updated.pop("password_hash", None)
    return updated

# ─── WEATHER ENDPOINT ───

@api_router.get("/weather")
async def get_weather(city: str):
    try:
        async with httpx.AsyncClient(timeout=10.0) as http_client:
            geo_resp = await http_client.get(
                "https://geocoding-api.open-meteo.com/v1/search",
                params={"name": city, "count": 1}
            )
            geo_data = geo_resp.json()
            if "results" not in geo_data or len(geo_data["results"]) == 0:
                raise HTTPException(status_code=404, detail="Ville non trouvée")
            lat = geo_data["results"][0]["latitude"]
            lon = geo_data["results"][0]["longitude"]
            city_name = geo_data["results"][0]["name"]
            weather_resp = await http_client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={"latitude": lat, "longitude": lon, "current_weather": True, "hourly": "relative_humidity_2m", "forecast_days": 1}
            )
            weather_data = weather_resp.json()
            current = weather_data["current_weather"]
            temp = current["temperature"]
            wcode = current.get("weathercode", 0)
            if temp < 5:
                advice = "Temps très froid ! Appliquez une crème riche et protectrice. Hydratez intensément votre peau."
                icon = "snow"
            elif temp < 15:
                advice = "Temps frais. Hydratez bien votre peau et utilisez un sérum nourrissant avant votre maquillage."
                icon = "cloud"
            elif temp < 25:
                advice = "Température idéale ! Crème hydratante légère et SPF 30 minimum."
                icon = "partly-sunny"
            elif temp < 35:
                advice = "Il fait chaud ! Maquillage léger et waterproof. N'oubliez pas le SPF 50."
                icon = "sunny"
            else:
                advice = "Canicule ! Évitez le maquillage lourd, hydratation et protection solaire maximale."
                icon = "sunny"
            if wcode in [71, 73, 75, 77, 85, 86]: icon = "snow"
            elif wcode in [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82]: icon = "rainy"
            elif wcode in [95, 96, 99]: icon = "thunderstorm"
            elif wcode in [45, 48]: icon = "cloud"
            elif wcode in [1, 2, 3]: icon = "partly-sunny"
            humidity_list = weather_data.get("hourly", {}).get("relative_humidity_2m", [50])
            humidity = humidity_list[0] if humidity_list else 50
            return {"city": city_name, "temperature": temp, "humidity": humidity, "weather_code": wcode, "icon": icon, "skin_advice": advice}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Weather API error: {e}")
        raise HTTPException(status_code=500, detail="Impossible de récupérer la météo")

# ─── CHAT ENDPOINT (GPT 5.2) ───

@api_router.post("/chat")
async def chat_message(data: ChatInput, user=Depends(get_current_user)):
    session_id = data.session_id or f"aria-{user['id']}"
    user_id = user["id"]
    await db.chat_messages.insert_one({"session_id": session_id, "user_id": user_id, "role": "user", "content": data.message, "created_at": datetime.now(timezone.utc)})
    history = await db.chat_messages.find({"session_id": session_id}, {"_id": 0}).sort("created_at", -1).limit(20).to_list(20)
    history.reverse()
    context_parts = []
    for msg in history[:-1]:
        role = "Utilisateur" if msg["role"] == "user" else "ARIA"
        context_parts.append(f"{role}: {msg['content']}")
    context_str = "\n".join(context_parts) if context_parts else "Début de conversation."
    system_msg = f"""Tu es ARIA, une assistante beauté IA experte en maquillage et soins de la peau.
Tu donnes des conseils personnalisés sur les techniques de maquillage, les soins, les produits et les tendances.
Réponds en français, chaleureusement et professionnellement. Sois concise.
L'utilisateur s'appelle {user.get('name', '')} et habite à {user.get('city', '')}.
Historique récent:\n{context_str}"""
    try:
        llm_chat = LlmChat(api_key=os.environ["EMERGENT_LLM_KEY"], session_id=f"aria-llm-{uuid.uuid4().hex[:8]}", system_message=system_msg).with_model("openai", "gpt-5.2")
        response_text = await llm_chat.send_message(UserMessage(text=data.message))
        await db.chat_messages.insert_one({"session_id": session_id, "user_id": user_id, "role": "assistant", "content": response_text, "created_at": datetime.now(timezone.utc)})
        return {"session_id": session_id, "response": response_text}
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail="Erreur du service de chat")

@api_router.get("/chat/history")
async def get_chat_history(session_id: str, user=Depends(get_current_user)):
    messages = await db.chat_messages.find({"session_id": session_id, "user_id": user["id"]}, {"_id": 0}).sort("created_at", 1).to_list(100)
    return messages

# ─── TUTORIALS ───

@api_router.get("/tutorials")
async def get_tutorials():
    tutorials = await db.tutorials.find({}, {"_id": 0}).to_list(100)
    return tutorials

@api_router.get("/tutorials/{tutorial_id}")
async def get_tutorial(tutorial_id: str):
    tutorial = await db.tutorials.find_one({"id": tutorial_id}, {"_id": 0})
    if not tutorial:
        raise HTTPException(status_code=404, detail="Tutoriel non trouvé")
    return tutorial

# ─── SAVED LOOKS ───

@api_router.get("/looks")
async def get_looks(user=Depends(get_current_user)):
    looks = await db.saved_looks.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return looks

@api_router.post("/looks")
async def save_look(data: SavedLookInput, user=Depends(get_current_user)):
    look_doc = {"id": str(uuid.uuid4()), "user_id": user["id"], "name": data.name, "products": data.products, "notes": data.notes, "created_at": datetime.now(timezone.utc)}
    await db.saved_looks.insert_one(look_doc)
    look_doc.pop("_id", None)
    look_doc["created_at"] = look_doc["created_at"].isoformat()
    return look_doc

@api_router.delete("/looks/{look_id}")
async def delete_look(look_id: str, user=Depends(get_current_user)):
    result = await db.saved_looks.delete_one({"id": look_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Look non trouvé")
    return {"message": "Look supprimé"}

# ─── ADMIN ENDPOINTS ───

@api_router.get("/admin/stats")
async def get_admin_stats(user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Accès admin requis")
    total_users = await db.users.count_documents({"role": "user"})
    total_admins = await db.users.count_documents({"role": "admin"})
    total_looks = await db.saved_looks.count_documents({})
    total_messages = await db.chat_messages.count_documents({})
    total_tutorials = await db.tutorials.count_documents({})
    free_users = await db.users.count_documents({"role": "user", "subscription": {"$in": ["free", None]}})
    premium_users = await db.users.count_documents({"role": "user", "subscription": "premium"})
    recent_users = await db.users.find({"role": "user"}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).limit(10).to_list(10)
    for u in recent_users:
        if "created_at" in u and isinstance(u["created_at"], datetime):
            u["created_at"] = u["created_at"].isoformat()
    return {
        "total_users": total_users,
        "total_admins": total_admins,
        "total_looks": total_looks,
        "total_messages": total_messages,
        "total_tutorials": total_tutorials,
        "subscriptions": {"free": free_users, "premium": premium_users},
        "recent_users": recent_users,
    }

# Include router
app.include_router(api_router)

app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ─── STARTUP ───

@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await seed_tutorials()
    await seed_admin()
    logger.info("ARIA backend started successfully")

async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "tom@gmail.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Tomcle62")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        old_admin = await db.users.find_one({"role": "admin"})
        if old_admin:
            await db.users.update_one({"_id": old_admin["_id"]}, {"$set": {"email": admin_email, "password_hash": hash_password(admin_password), "name": "Tom", "city": "Paris", "subscription": "premium"}})
            logger.info(f"Admin updated to: {admin_email}")
        else:
            await db.users.insert_one({"email": admin_email, "password_hash": hash_password(admin_password), "name": "Tom", "city": "Paris", "role": "admin", "subscription": "premium", "created_at": datetime.now(timezone.utc)})
            logger.info(f"Admin seeded: {admin_email}")
    else:
        updates = {"role": "admin", "subscription": "premium"}
        if not verify_password(admin_password, existing["password_hash"]):
            updates["password_hash"] = hash_password(admin_password)
        await db.users.update_one({"email": admin_email}, {"$set": updates})

async def seed_tutorials():
    first = await db.tutorials.find_one({})
    if first and "premium" not in first:
        await db.tutorials.drop()
        logger.info("Dropped old tutorials (missing premium field)")
    count = await db.tutorials.count_documents({})
    if count == 0:
        tutorials = [
            {"id": str(uuid.uuid4()), "title": "Maquillage Naturel Quotidien", "description": "Les bases d'un look naturel et frais pour tous les jours.", "duration": "15 min", "level": "Débutant", "category": "Quotidien", "premium": False, "image_index": 0,
             "steps": ["Préparer la peau avec une crème hydratante", "Appliquer un fond de teint léger au pinceau", "Estomper avec une éponge humide", "Ajouter un blush rosé sur les pommettes", "Mascara léger sur les cils", "Baume à lèvres teinté"]},
            {"id": str(uuid.uuid4()), "title": "Smoky Eyes Élégant", "description": "Maîtrisez le smoky eyes classique pour un regard intense.", "duration": "25 min", "level": "Intermédiaire", "category": "Soirée", "premium": False, "image_index": 1,
             "steps": ["Appliquer une base à paupières", "Poser une teinte claire sur la paupière", "Appliquer une ombre foncée dans le creux", "Estomper les transitions", "Liner fin le long des cils", "Mascara volumisant"]},
            {"id": str(uuid.uuid4()), "title": "Contouring et Sculpting", "description": "Sculptez votre visage comme une pro.", "duration": "20 min", "level": "Intermédiaire", "category": "Technique", "premium": True, "image_index": 2,
             "steps": ["Identifier la forme de votre visage", "Appliquer le contour sous les pommettes", "Éclaircir le centre avec le highlighter", "Estomper avec un pinceau adapté", "Fixer avec poudre translucide", "Blush pour la touche finale"]},
            {"id": str(uuid.uuid4()), "title": "Teint Parfait Zéro Défaut", "description": "Un teint impeccable et lumineux.", "duration": "18 min", "level": "Débutant", "category": "Base", "premium": False, "image_index": 0,
             "steps": ["Nettoyer et hydrater la peau", "Appliquer un primer adapté", "Choisir le bon fond de teint", "Appliquer au pinceau ou éponge", "Corriger les imperfections", "Fixer avec un spray fixateur"]},
            {"id": str(uuid.uuid4()), "title": "Lèvres Parfaites", "description": "Tous les secrets pour des lèvres sublimes.", "duration": "12 min", "level": "Débutant", "category": "Lèvres", "premium": False, "image_index": 1,
             "steps": ["Exfolier délicatement les lèvres", "Appliquer un baume hydratant", "Dessiner le contour au crayon", "Remplir avec le rouge à lèvres", "Estomper pour un rendu naturel", "Gloss au centre"]},
            {"id": str(uuid.uuid4()), "title": "Maquillage de Soirée Glamour", "description": "Un look sophistiqué pour vos soirées.", "duration": "30 min", "level": "Avancé", "category": "Soirée", "premium": True, "image_index": 2,
             "steps": ["Base avec primer illuminateur", "Fond de teint longue tenue", "Yeux charbonneux avec paillettes", "Faux cils dramatiques", "Contouring prononcé", "Rouge à lèvres bold", "Highlighter stratégique", "Spray fixateur"]},
        ]
        await db.tutorials.insert_many(tutorials)
        logger.info(f"Seeded {len(tutorials)} tutorials")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
