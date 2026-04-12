import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity,
  ActivityIndicator, Image, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiCall } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const TUTORIAL_IMAGES = [
  'https://images.unsplash.com/photo-1585049303349-6680e6179692?w=400&q=80',
  'https://images.unsplash.com/photo-1773387614632-61be4cb0e9d7?w=400&q=80',
  'https://images.unsplash.com/photo-1764269719546-afc8567db7c6?w=400&q=80',
];

type Tutorial = { id: string; title: string; description: string; duration: string; level: string; category: string; premium: boolean; image_index: number; steps: string[] };
const LEVEL_COLORS: Record<string, string> = { 'Débutant': '#34C759', 'Intermédiaire': '#FF9500', 'Avancé': '#FF2D55' };

export default function TutorialsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isPremium = user?.subscription === 'premium';

  useEffect(() => { fetchTutorials(); }, []);

  const fetchTutorials = async () => {
    try {
      const resp = await apiCall('/api/tutorials');
      if (resp.ok) setTutorials(await resp.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleTutorialPress = (tutorial: Tutorial) => {
    if (tutorial.premium && !isPremium) {
      Alert.alert('Contenu Premium', 'Ce tutoriel est réservé aux abonnés Premium. Passez à l\'offre Premium pour y accéder !', [{ text: 'OK' }]);
      return;
    }
    setExpandedId(expandedId === tutorial.id ? null : tutorial.id);
  };

  const launchTutorialStudio = (tutorial: Tutorial) => {
    router.push({ pathname: '/studio', params: { tutorialTitle: tutorial.title, products: JSON.stringify([]) } });
  };

  if (loading) {
    return (<SafeAreaView style={styles.safeArea}><View style={styles.loadingContainer}><ActivityIndicator size="large" color="#FF2D55" /></View></SafeAreaView>);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView testID="tutorials-screen" contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Cours</Text>
          <Text style={styles.subtitle}>{tutorials.length} tutoriels disponibles</Text>
        </View>

        {tutorials.map((tutorial) => {
          const isExpanded = expandedId === tutorial.id;
          const isLocked = tutorial.premium && !isPremium;
          const imageUri = TUTORIAL_IMAGES[tutorial.image_index % TUTORIAL_IMAGES.length];

          return (
            <TouchableOpacity testID={`tutorial-card-${tutorial.id}`} key={tutorial.id}
              style={[styles.card, isLocked && styles.cardLocked]} onPress={() => handleTutorialPress(tutorial)} activeOpacity={0.9}>
              <View style={styles.imageContainer}>
                <Image source={{ uri: imageUri }} style={styles.cardImage} resizeMode="cover" />
                {isLocked && (
                  <View style={styles.lockOverlay}>
                    <Ionicons name="lock-closed" size={28} color="#FFF" />
                    <Text style={styles.lockText}>PREMIUM</Text>
                  </View>
                )}
              </View>
              <View style={styles.cardContent}>
                <View style={styles.cardMeta}>
                  <View style={[styles.levelBadge, { backgroundColor: LEVEL_COLORS[tutorial.level] || '#8E8E93' }]}>
                    <Text style={styles.levelText}>{tutorial.level}</Text>
                  </View>
                  <View style={styles.durationBadge}>
                    <Ionicons name="time-outline" size={12} color="#8E8E93" />
                    <Text style={styles.durationText}>{tutorial.duration}</Text>
                  </View>
                  {tutorial.premium && <View style={styles.premBadge}><Text style={styles.premText}>PRO</Text></View>}
                </View>
                <Text style={[styles.cardTitle, isLocked && { color: '#8E8E93' }]}>{tutorial.title}</Text>
                <Text style={styles.cardDesc}>{tutorial.description}</Text>

                {isExpanded && !isLocked ? (
                  <View style={styles.stepsContainer}>
                    <View style={styles.stepsDivider} />
                    <Text style={styles.stepsTitle}>Étapes</Text>
                    {tutorial.steps.map((step, index) => (
                      <View key={index} style={styles.stepRow}>
                        <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{index + 1}</Text></View>
                        <Text style={styles.stepText}>{step}</Text>
                      </View>
                    ))}
                    <TouchableOpacity testID={`launch-tutorial-${tutorial.id}`} style={styles.launchBtn} onPress={() => launchTutorialStudio(tutorial)}>
                      <Ionicons name="videocam" size={18} color="#FFF" />
                      <Text style={styles.launchBtnText}>Lancer dans le Studio</Text>
                    </TouchableOpacity>
                  </View>
                ) : !isLocked ? (
                  <View style={styles.expandHint}>
                    <Text style={styles.expandHintText}>Voir les étapes</Text>
                    <Ionicons name="chevron-down" size={16} color="#FF2D55" />
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 12 : 48 },
  header: { marginBottom: 24 },
  title: { fontSize: 34, fontWeight: '700', color: '#000', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#8E8E93', marginTop: 4 },
  card: { backgroundColor: '#FFF', borderRadius: 24, marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E5EA', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  cardLocked: { opacity: 0.85 },
  imageContainer: { position: 'relative' },
  cardImage: { width: '100%', height: 180, backgroundColor: '#F2F2F7' },
  lockOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  lockText: { fontSize: 14, fontWeight: '700', color: '#FFF', marginTop: 4, letterSpacing: 2 },
  cardContent: { padding: 20 },
  cardMeta: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  levelBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  levelText: { fontSize: 12, fontWeight: '600', color: '#FFF' },
  durationBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F2F2F7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  durationText: { fontSize: 12, color: '#8E8E93', fontWeight: '500' },
  premBadge: { backgroundColor: '#FFD5DE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  premText: { fontSize: 11, fontWeight: '700', color: '#FF2D55' },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#000', marginBottom: 6, letterSpacing: -0.3 },
  cardDesc: { fontSize: 14, color: '#8E8E93', lineHeight: 20 },
  expandHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F2F2F7' },
  expandHintText: { fontSize: 14, color: '#FF2D55', fontWeight: '600' },
  stepsContainer: { marginTop: 8 },
  stepsDivider: { height: 1, backgroundColor: '#F2F2F7', marginBottom: 16 },
  stepsTitle: { fontSize: 16, fontWeight: '700', color: '#000', marginBottom: 14 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFD5DE', justifyContent: 'center', alignItems: 'center' },
  stepNumberText: { fontSize: 13, fontWeight: '700', color: '#FF2D55' },
  stepText: { flex: 1, fontSize: 14, color: '#000', lineHeight: 20 },
  launchBtn: { backgroundColor: '#FF2D55', borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 },
  launchBtnText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
});
