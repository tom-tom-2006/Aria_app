import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { apiCall } from '../utils/api';

type Analysis = {
  type: string;
  observations: string[];
  score: number;
  products: { name: string; brand: string; reason: string }[];
  routine: { morning: string[]; evening: string[] };
  summary?: string;
  raw?: string;
};

export default function SkinAnalysisScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [photo, setPhoto] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<Analysis | null>(null);
  const [error, setError] = useState('');

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { setError('Permission caméra requise'); return; }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.4,
      base64: true,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!res.canceled && res.assets[0]?.base64) {
      setPhoto(res.assets[0].uri);
      analyzePhoto(res.assets[0].base64);
    }
  };

  const analyzePhoto = async (base64: string) => {
    setAnalyzing(true);
    setError('');
    setResult(null);
    try {
      const resp = await apiCall('/api/skin-analysis', {
        method: 'POST',
        body: JSON.stringify({ image: base64 }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setResult(data.analysis);
      } else {
        const err = await resp.json();
        setError(typeof err.detail === 'string' ? err.detail : 'Erreur d\'analyse');
      }
    } catch (e) { setError('Erreur réseau'); } finally { setAnalyzing(false); }
  };

  const getScoreColor = (score: number) => score >= 80 ? '#34C759' : score >= 60 ? '#FF9500' : '#FF3B30';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity testID="skin-back" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Analyse de peau</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* No result yet */}
        {!result && !analyzing && (
          <View style={styles.introSection}>
            <View style={styles.introIcon}><Ionicons name="scan" size={48} color="#FF2D55" /></View>
            <Text style={styles.introTitle}>Diagnostic IA de votre peau</Text>
            <Text style={styles.introText}>
              Prenez un selfie en lumière naturelle.{'\n'}Notre IA analysera votre peau et vous recommandera des produits adaptés.
            </Text>
            <TouchableOpacity testID="take-photo-btn" style={styles.photoBtn} onPress={takePhoto}>
              <Ionicons name="camera" size={22} color="#FFF" />
              <Text style={styles.photoBtnText}>Prendre une photo</Text>
            </TouchableOpacity>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        )}

        {/* Analyzing */}
        {analyzing && (
          <View style={styles.analyzingSection}>
            {photo && <Image source={{ uri: photo }} style={styles.previewImg} />}
            <ActivityIndicator size="large" color="#FF2D55" style={{ marginTop: 24 }} />
            <Text style={styles.analyzingText}>Analyse en cours...</Text>
            <Text style={styles.analyzingSub}>Notre IA étudie votre peau</Text>
          </View>
        )}

        {/* Results */}
        {result && (
          <View>
            {photo && <Image source={{ uri: photo }} style={styles.resultImg} />}

            {/* Score + Type */}
            <View style={styles.scoreCard}>
              <View style={styles.scoreCircle}>
                <Text style={[styles.scoreNum, { color: getScoreColor(result.score || 70) }]}>{result.score || 70}</Text>
                <Text style={styles.scoreLabel}>/100</Text>
              </View>
              <View style={styles.scoreInfo}>
                <Text style={styles.skinType}>Peau {result.type || 'mixte'}</Text>
                <Text style={styles.scoreSummary}>{result.summary || ''}</Text>
              </View>
            </View>

            {/* Observations */}
            {result.observations && result.observations.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Observations</Text>
                {result.observations.map((obs, i) => (
                  <View key={i} style={styles.obsRow}>
                    <Ionicons name="checkmark-circle" size={18} color="#FF2D55" />
                    <Text style={styles.obsText}>{obs}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Products */}
            {result.products && result.products.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Produits recommandés</Text>
                {result.products.map((p, i) => (
                  <View key={i} style={styles.productCard}>
                    <View style={styles.productIcon}><Ionicons name="flask" size={20} color="#FF2D55" /></View>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{p.name}</Text>
                      <Text style={styles.productBrand}>{p.brand}</Text>
                      <Text style={styles.productReason}>{p.reason}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Routine */}
            {result.routine && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Routine conseillée</Text>
                {result.routine.morning && result.routine.morning.length > 0 && (
                  <View style={styles.routineBlock}>
                    <View style={styles.routineHeader}><Ionicons name="sunny" size={16} color="#FF9500" /><Text style={styles.routineLabel}>Matin</Text></View>
                    {result.routine.morning.map((s, i) => <Text key={i} style={styles.routineStep}>{i + 1}. {s}</Text>)}
                  </View>
                )}
                {result.routine.evening && result.routine.evening.length > 0 && (
                  <View style={styles.routineBlock}>
                    <View style={styles.routineHeader}><Ionicons name="moon" size={16} color="#5856D6" /><Text style={styles.routineLabel}>Soir</Text></View>
                    {result.routine.evening.map((s, i) => <Text key={i} style={styles.routineStep}>{i + 1}. {s}</Text>)}
                  </View>
                )}
              </View>
            )}

            {/* Retry */}
            <TouchableOpacity testID="retry-analysis" style={styles.retryBtn} onPress={() => { setResult(null); setPhoto(null); }}>
              <Text style={styles.retryText}>Refaire une analyse</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: '#E5E5EA' },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  topTitle: { fontSize: 17, fontWeight: '600', color: '#000' },
  scroll: { paddingHorizontal: 24, paddingTop: 24 },
  // Intro
  introSection: { alignItems: 'center', paddingTop: 40 },
  introIcon: { width: 100, height: 100, borderRadius: 32, backgroundColor: '#FFD5DE', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  introTitle: { fontSize: 24, fontWeight: '700', color: '#000', marginBottom: 12, textAlign: 'center' },
  introText: { fontSize: 15, color: '#8E8E93', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  photoBtn: { backgroundColor: '#FF2D55', borderRadius: 16, paddingVertical: 18, paddingHorizontal: 32, flexDirection: 'row', alignItems: 'center', gap: 10 },
  photoBtnText: { fontSize: 17, fontWeight: '700', color: '#FFF' },
  errorText: { color: '#FF3B30', marginTop: 16, fontSize: 14 },
  // Analyzing
  analyzingSection: { alignItems: 'center', paddingTop: 20 },
  previewImg: { width: 200, height: 200, borderRadius: 100, borderWidth: 3, borderColor: '#FF2D55' },
  analyzingText: { fontSize: 20, fontWeight: '700', color: '#000', marginTop: 16 },
  analyzingSub: { fontSize: 14, color: '#8E8E93', marginTop: 4 },
  // Results
  resultImg: { width: 120, height: 120, borderRadius: 60, alignSelf: 'center', borderWidth: 3, borderColor: '#FF2D55', marginBottom: 20 },
  scoreCard: { flexDirection: 'row', backgroundColor: '#F2F2F7', borderRadius: 24, padding: 24, marginBottom: 20, alignItems: 'center' },
  scoreCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginRight: 20, borderWidth: 3, borderColor: '#E5E5EA' },
  scoreNum: { fontSize: 32, fontWeight: '700' },
  scoreLabel: { fontSize: 14, color: '#8E8E93', marginTop: -4 },
  scoreInfo: { flex: 1 },
  skinType: { fontSize: 22, fontWeight: '700', color: '#000', textTransform: 'capitalize', marginBottom: 4 },
  scoreSummary: { fontSize: 14, color: '#8E8E93', lineHeight: 20 },
  // Section
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#000', marginBottom: 14 },
  obsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  obsText: { flex: 1, fontSize: 15, color: '#000', lineHeight: 22 },
  // Products
  productCard: { flexDirection: 'row', backgroundColor: '#F2F2F7', borderRadius: 16, padding: 16, marginBottom: 10, alignItems: 'flex-start' },
  productIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFD5DE', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 2 },
  productBrand: { fontSize: 13, color: '#FF2D55', fontWeight: '500', marginBottom: 4 },
  productReason: { fontSize: 13, color: '#8E8E93', lineHeight: 18 },
  // Routine
  routineBlock: { backgroundColor: '#F2F2F7', borderRadius: 16, padding: 18, marginBottom: 10 },
  routineHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  routineLabel: { fontSize: 16, fontWeight: '600', color: '#000' },
  routineStep: { fontSize: 14, color: '#000', lineHeight: 22, marginBottom: 4 },
  retryBtn: { backgroundColor: '#F2F2F7', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  retryText: { fontSize: 16, fontWeight: '600', color: '#FF2D55' },
});
