import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function StudioScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ products?: string; tutorialTitle?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const tutorialTitle = params.tutorialTitle || null;

  if (!permission) {
    return <View style={styles.container}><View style={styles.center}><Text style={styles.loadText}>Chargement...</Text></View></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <View style={styles.permIcon}><Ionicons name="camera-outline" size={48} color="#FF2D55" /></View>
          <Text style={styles.permTitle}>Accès caméra requis</Text>
          <Text style={styles.permDesc}>ARIA a besoin de votre caméra pour le studio maquillage</Text>
          <TouchableOpacity testID="grant-camera" style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Autoriser la caméra</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
            <Text style={styles.backLinkText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing}>
        {/* Top bar */}
        <View style={[styles.topBar, { paddingTop: Platform.OS === 'ios' ? 56 : 40 }]}>
          <TouchableOpacity testID="studio-back-button" onPress={() => router.back()} style={styles.topBtn}>
            <Ionicons name="chevron-back" size={26} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.label}>{tutorialTitle || 'Studio ARIA'}</Text>
          <TouchableOpacity testID="flip-camera" onPress={() => setFacing(f => f === 'front' ? 'back' : 'front')} style={styles.topBtn}>
            <Ionicons name="camera-reverse-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Bottom hint */}
        <View style={[styles.bottomHint, { paddingBottom: Platform.OS === 'ios' ? 36 : 20 }]}>
          <View style={styles.hintBox}>
            <Ionicons name="sparkles" size={16} color="#FF2D55" />
            <Text style={styles.hintText}>Guidage IA Face Mesh — bientôt disponible</Text>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  loadText: { color: '#8E8E93', fontSize: 16 },
  permIcon: { width: 100, height: 100, borderRadius: 32, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  permTitle: { fontSize: 24, fontWeight: '700', color: '#FFF', marginBottom: 12 },
  permDesc: { fontSize: 15, color: '#8E8E93', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  permBtn: { backgroundColor: '#FF2D55', borderRadius: 14, paddingHorizontal: 32, paddingVertical: 16 },
  permBtnText: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  backLink: { marginTop: 20 },
  backLinkText: { fontSize: 15, color: '#FF2D55', fontWeight: '500' },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, zIndex: 10 },
  topBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  bottomHint: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', paddingHorizontal: 24 },
  hintBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, paddingVertical: 12, paddingHorizontal: 20 },
  hintText: { fontSize: 14, color: '#FFF', fontWeight: '500' },
});
