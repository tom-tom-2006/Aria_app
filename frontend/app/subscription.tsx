import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { apiCall } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  { icon: 'scan', text: 'Analyse de peau IA avancée' },
  { icon: 'heart', text: 'Looks sauvegardés illimités' },
  { icon: 'play-circle', text: 'Tous les tutoriels débloqués' },
  { icon: 'flower', text: 'Routines soins personnalisées' },
  { icon: 'sparkles', text: 'Studio Face Mesh Pro' },
];

export default function SubscriptionScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const params = useLocalSearchParams<{ session_id?: string }>();
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const isPremium = user?.subscription === 'premium';

  useEffect(() => {
    if (params.session_id) { pollStatus(params.session_id); }
  }, [params.session_id]);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const host = process.env.EXPO_PUBLIC_BACKEND_URL || '';
      const resp = await apiCall('/api/payment/create-checkout', { method: 'POST', body: JSON.stringify({ host_url: host }) });
      if (resp.ok) {
        const data = await resp.json();
        await Linking.openURL(data.url);
        // After returning, poll
        setTimeout(() => pollStatus(data.session_id), 5000);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const pollStatus = async (sessionId: string, attempts = 0) => {
    if (attempts >= 8) { setPolling(false); return; }
    setPolling(true);
    try {
      const resp = await apiCall(`/api/payment/status/${sessionId}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data.payment_status === 'paid') {
          await updateUser({ ...user!, subscription: 'premium' });
          setPolling(false);
          return;
        }
      }
      setTimeout(() => pollStatus(sessionId, attempts + 1), 3000);
    } catch (e) { setPolling(false); }
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'ios' ? 52 : 40 }]}>
      <View style={styles.topBar}>
        <TouchableOpacity testID="sub-back" onPress={() => router.back()} style={styles.backBtn}><Ionicons name="chevron-back" size={24} color="#000" /></TouchableOpacity>
        <Text style={styles.topTitle}>Abonnement</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {isPremium ? (
          <View style={styles.activeCard}>
            <View style={styles.activeIcon}><Ionicons name="checkmark-circle" size={48} color="#34C759" /></View>
            <Text style={styles.activeTitle}>Premium actif</Text>
            <Text style={styles.activeSub}>Vous avez accès à toutes les fonctionnalités ARIA</Text>
          </View>
        ) : (
          <>
            <View style={styles.promoCard}>
              <Text style={styles.promoLabel}>ARIA PREMIUM</Text>
              <Text style={styles.promoPrice}>6,99€<Text style={styles.promoPer}>/mois</Text></Text>
              <Text style={styles.promoDesc}>Débloquez tout le potentiel d'ARIA</Text>
            </View>
            <View style={styles.featuresSection}>
              {FEATURES.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <View style={styles.featureIcon}><Ionicons name={f.icon as any} size={20} color="#FF2D55" /></View>
                  <Text style={styles.featureText}>{f.text}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity testID="subscribe-button" style={[styles.subBtn, loading && { opacity: 0.7 }]} onPress={handleSubscribe} disabled={loading || polling}>
              {loading ? <ActivityIndicator color="#FFF" /> : polling ? (
                <><ActivityIndicator color="#FFF" size="small" /><Text style={styles.subBtnText}>Vérification du paiement...</Text></>
              ) : (
                <><Ionicons name="diamond" size={20} color="#FFF" /><Text style={styles.subBtnText}>S'abonner — 6,99€/mois</Text></>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: '#E5E5EA' },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  topTitle: { fontSize: 17, fontWeight: '600', color: '#000' },
  scroll: { paddingHorizontal: 24, paddingTop: 32 },
  promoCard: { backgroundColor: '#000', borderRadius: 28, padding: 32, alignItems: 'center', marginBottom: 32 },
  promoLabel: { fontSize: 14, fontWeight: '700', color: '#D4AF37', letterSpacing: 3, marginBottom: 12 },
  promoPrice: { fontSize: 48, fontWeight: '200', color: '#FFF' },
  promoPer: { fontSize: 18, color: '#8E8E93' },
  promoDesc: { fontSize: 15, color: 'rgba(255,255,255,0.6)', marginTop: 8 },
  featuresSection: { marginBottom: 32 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  featureIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFD5DE', justifyContent: 'center', alignItems: 'center' },
  featureText: { fontSize: 16, color: '#000', fontWeight: '500' },
  subBtn: { backgroundColor: '#D4AF37', borderRadius: 16, paddingVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  subBtnText: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  activeCard: { alignItems: 'center', paddingTop: 40 },
  activeIcon: { marginBottom: 20 },
  activeTitle: { fontSize: 28, fontWeight: '700', color: '#000', marginBottom: 8 },
  activeSub: { fontSize: 15, color: '#8E8E93', textAlign: 'center' },
});
