import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Platform, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';

type Selection = { category: string; product: string; shade: string; shadeColor: string };

export default function StudioScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ products?: string; tutorialTitle?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('front');

  const selections: Selection[] = params.products ? JSON.parse(params.products) : [];
  const tutorialTitle = params.tutorialTitle || null;

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}><Text style={styles.loadText}>Chargement caméra...</Text></View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <View style={styles.permIconBox}>
            <Ionicons name="camera-outline" size={48} color="#FF2D55" />
          </View>
          <Text style={styles.permTitle}>Accès caméra requis</Text>
          <Text style={styles.permText}>ARIA a besoin de votre caméra pour le studio maquillage</Text>
          <TouchableOpacity testID="grant-camera-button" style={styles.permButton} onPress={requestPermission}>
            <Text style={styles.permButtonText}>Autoriser la caméra</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
            <Text style={styles.backLinkText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing}>
        {/* Top Bar */}
        <SafeAreaView style={styles.topOverlay}>
          <View style={styles.topBar}>
            <TouchableOpacity testID="studio-back-button" onPress={() => router.back()} style={styles.topBtn}>
              <Ionicons name="chevron-back" size={26} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.studioLabel}>
              {tutorialTitle ? tutorialTitle : 'Studio ARIA'}
            </Text>
            <TouchableOpacity testID="flip-camera-button" onPress={() => setFacing(f => f === 'front' ? 'back' : 'front')} style={styles.topBtn}>
              <Ionicons name="camera-reverse-outline" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Selected Products Overlay */}
        {selections.length > 0 && (
          <View style={styles.productsOverlay}>
            <Text style={styles.overlayTitle}>Produits sélectionnés</Text>
            {selections.map((s, i) => (
              <View key={i} style={styles.overlayItem}>
                <View style={[styles.overlayDot, { backgroundColor: s.shadeColor }]} />
                <Text style={styles.overlayText}>{s.product} — {s.shade}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Bottom Overlay */}
        <View style={styles.bottomOverlay}>
          <View style={styles.bottomBar}>
            <View style={styles.aiHint}>
              <Ionicons name="sparkles" size={16} color="#FF2D55" />
              <Text style={styles.aiHintText}>Guidage IA disponible prochainement</Text>
            </View>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  loadText: { fontSize: 16, color: '#8E8E93' },
  camera: { flex: 1 },
  // Permission
  permIconBox: { width: 100, height: 100, borderRadius: 32, backgroundColor: '#FFD5DE', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  permTitle: { fontSize: 24, fontWeight: '700', color: '#000', marginBottom: 8 },
  permText: { fontSize: 15, color: '#8E8E93', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  permButton: { backgroundColor: '#FF2D55', borderRadius: 14, paddingHorizontal: 32, paddingVertical: 16 },
  permButtonText: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  backLink: { marginTop: 20 },
  backLinkText: { fontSize: 15, color: '#FF2D55', fontWeight: '500' },
  // Top overlay
  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 8 : 40, paddingBottom: 12 },
  topBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  studioLabel: { fontSize: 17, fontWeight: '600', color: '#FFF', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  // Products overlay
  productsOverlay: { position: 'absolute', top: Platform.OS === 'ios' ? 100 : 100, left: 16, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 16, padding: 14, maxWidth: 260 },
  overlayTitle: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  overlayItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  overlayDot: { width: 12, height: 12, borderRadius: 6 },
  overlayText: { fontSize: 13, color: '#FFF' },
  // Bottom overlay
  bottomOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  bottomBar: { paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 24, paddingTop: 16 },
  aiHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, paddingVertical: 12, paddingHorizontal: 20 },
  aiHintText: { fontSize: 14, color: '#FFF', fontWeight: '500' },
});
