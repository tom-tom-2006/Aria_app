import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';

const FACEMESH_HTML = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;overflow:hidden;width:100vw;height:100vh;font-family:-apple-system,sans-serif}
#c{position:relative;width:100%;height:100%}
video{position:absolute;width:100%;height:100%;object-fit:cover;transform:scaleX(-1)}
canvas{position:absolute;width:100%;height:100%;object-fit:cover;transform:scaleX(-1)}
#st{position:absolute;bottom:80px;left:50%;transform:translateX(-50%);color:#fff;font-size:13px;background:rgba(0,0,0,0.6);padding:8px 16px;border-radius:20px;z-index:10;white-space:nowrap}
#ld{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;text-align:center;z-index:10}
.sp{width:40px;height:40px;border:3px solid rgba(255,255,255,0.3);border-top:3px solid #FF2D55;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 12px}
@keyframes spin{to{transform:rotate(360deg)}}
#pr{position:absolute;top:16px;left:16px;background:rgba(0,0,0,0.6);border-radius:16px;padding:12px;max-width:220px;z-index:10}
.pi{display:flex;align-items:center;gap:6px;margin-bottom:4px;font-size:12px;color:#fff}
.pd{width:10px;height:10px;border-radius:5px;flex-shrink:0}
#pt{font-size:10px;color:rgba(255,255,255,0.6);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px}
</style>
</head><body>
<div id="c">
<video id="v" autoplay playsinline muted></video>
<canvas id="cv"></canvas>
<div id="ld"><div class="sp"></div><div>Chargement Face Mesh...</div><div style="font-size:12px;color:#8E8E93;margin-top:8px">Modèle IA ~10MB</div></div>
<div id="pr" style="display:none"><div id="pt">Produits sélectionnés</div><div id="pl"></div></div>
<div id="st" style="display:none"></div>
</div>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/face_mesh.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3/camera_utils.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3/drawing_utils.js" crossorigin="anonymous"></script>
<script>
var prods=[];
window.addEventListener('message',function(e){try{var d=JSON.parse(e.data);if(d.type==='products'){prods=d.products;showProds()}}catch(x){}});
document.addEventListener('message',function(e){try{var d=JSON.parse(e.data);if(d.type==='products'){prods=d.products;showProds()}}catch(x){}});
function showProds(){var el=document.getElementById('pl');var pr=document.getElementById('pr');if(prods.length===0){pr.style.display='none';return}
pr.style.display='block';el.innerHTML='';prods.forEach(function(p){el.innerHTML+='<div class="pi"><div class="pd" style="background:'+p.shadeColor+'"></div>'+p.product+' - '+p.shade+'</div>'});}
var v=document.getElementById('v'),cv=document.getElementById('cv'),ctx=cv.getContext('2d'),ld=document.getElementById('ld'),st=document.getElementById('st');
var LO=[61,146,91,181,84,17,314,405,321,375,291,308,324,318,402,317,14,87,178,88,95];
var LE=[33,246,161,160,159,158,157,173,133,155,154,153,145,144,163,7];
var RE=[362,398,384,385,386,387,388,466,263,249,390,373,374,380,381,382];
var LC=[116,117,118,119,120,121,128,229,230,231];
var RC=[345,346,347,348,349,350,357,449,450,451];
var FO=[10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109];
function gc(cat,tp){var p=prods.find(function(x){return x.category===cat||x.product===tp});return p?p.shadeColor:null}
function drawMakeup(lm,w,h){
var lc=gc('Lèvres','Rouge à lèvres')||gc('Lèvres','Gloss');
if(lc){ctx.beginPath();ctx.moveTo(lm[LO[0]].x*w,lm[LO[0]].y*h);for(var i=1;i<LO.length;i++)ctx.lineTo(lm[LO[i]].x*w,lm[LO[i]].y*h);ctx.closePath();ctx.fillStyle=lc+'77';ctx.fill()}
var ec=gc('Yeux','Ombre à paupières');
if(ec){[LE,RE].forEach(function(eye){ctx.beginPath();ctx.moveTo(lm[eye[0]].x*w,lm[eye[0]].y*h);for(var i=1;i<eye.length;i++)ctx.lineTo(lm[eye[i]].x*w,lm[eye[i]].y*h);ctx.closePath();ctx.fillStyle=ec+'44';ctx.fill()})}
var bc=gc('Joues','Blush');
if(bc){[LC,RC].forEach(function(ch){var cx=0,cy=0;ch.forEach(function(i){cx+=lm[i].x;cy+=lm[i].y});cx=cx/ch.length*w;cy=cy/ch.length*h;var r=w*0.045;var g=ctx.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,bc+'55');g.addColorStop(1,bc+'00');ctx.beginPath();ctx.arc(cx,cy,r,0,2*Math.PI);ctx.fillStyle=g;ctx.fill()})}
ctx.fillStyle='#FF2D5522';FO.forEach(function(i){ctx.beginPath();ctx.arc(lm[i].x*w,lm[i].y*h,1.5,0,2*Math.PI);ctx.fill()})
}
function onR(r){var w=cv.width,h=cv.height;ctx.save();ctx.clearRect(0,0,w,h);
if(r.multiFaceLandmarks&&r.multiFaceLandmarks.length>0){var lm=r.multiFaceLandmarks[0];
drawConnectors(ctx,lm,FACEMESH_TESSELATION,{color:'#FF2D5508',lineWidth:0.5});
drawConnectors(ctx,lm,FACEMESH_RIGHT_EYE,{color:'#FF2D5540',lineWidth:1});
drawConnectors(ctx,lm,FACEMESH_LEFT_EYE,{color:'#FF2D5540',lineWidth:1});
drawConnectors(ctx,lm,FACEMESH_FACE_OVAL,{color:'#FF2D5525',lineWidth:1});
drawConnectors(ctx,lm,FACEMESH_LIPS,{color:'#FF2D5550',lineWidth:1.5});
drawMakeup(lm,w,h);
st.textContent='468 points • Face Mesh actif';st.style.display='block';ld.style.display='none'}
else{st.textContent='Recherche du visage...';st.style.display='block'}
ctx.restore()}
var fm=new FaceMesh({locateFile:function(f){return'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/'+f}});
fm.setOptions({maxNumFaces:1,refineLandmarks:true,minDetectionConfidence:0.5,minTrackingConfidence:0.5});
fm.onResults(onR);
async function start(){try{
var s=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480}}});
v.srcObject=s;v.onloadedmetadata=function(){cv.width=v.videoWidth;cv.height=v.videoHeight;v.play();loop()}}
catch(e){ld.innerHTML='<div style="color:#FF2D55;font-size:18px">Caméra non disponible</div><div style="margin-top:8px;font-size:14px">Autorisez l\\'accès caméra</div>'}}
async function loop(){if(v.readyState>=2)await fm.send({image:v});requestAnimationFrame(loop)}
start();
</script></body></html>`;

type Sel = { category: string; product: string; shade: string; shadeColor: string };

export default function StudioScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ products?: string; tutorialTitle?: string }>();
  const webRef = useRef<WebView>(null);

  const selections: Sel[] = params.products ? JSON.parse(params.products) : [];
  const tutorialTitle = params.tutorialTitle || null;

  useEffect(() => {
    // Send product data to WebView once loaded
    const timer = setTimeout(() => {
      if (webRef.current) {
        webRef.current.postMessage(JSON.stringify({ type: 'products', products: selections }));
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // For web, use iframe; for mobile, use WebView
  const isWeb = Platform.OS === 'web';

  return (
    <View style={styles.container}>
      {isWeb ? (
        <iframe
          srcDoc={FACEMESH_HTML}
          style={{ flex: 1, width: '100%', height: '100%', border: 'none' } as any}
          allow="camera;microphone"
        />
      ) : (
        <WebView
          ref={webRef}
          source={{ html: FACEMESH_HTML }}
          style={styles.webview}
          javaScriptEnabled
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
          mediaCapturePermissionGrantType="grant"
          onMessage={() => {}}
        />
      )}

      {/* Top overlay */}
      <SafeAreaView style={styles.topOverlay}>
        <View style={styles.topBar}>
          <TouchableOpacity testID="studio-back-button" onPress={() => router.back()} style={styles.topBtn}>
            <Ionicons name="chevron-back" size={26} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.studioLabel}>{tutorialTitle || 'Studio ARIA'}</Text>
          <View style={styles.topBtn}>
            <Ionicons name="sparkles" size={20} color="#FF2D55" />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  webview: { flex: 1, backgroundColor: '#000' },
  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 8 : 40, paddingBottom: 12 },
  topBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  studioLabel: { fontSize: 17, fontWeight: '600', color: '#FFF' },
});
