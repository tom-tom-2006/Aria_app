import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { apiCall } from '../../utils/api';
import ChatModal from '../../components/ChatModal';

const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

type WeatherData = { city: string; temperature: number; humidity: number; icon: string; skin_advice: string };

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [chatVisible, setChatVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isPremium = user?.subscription === 'premium';
  const now = new Date();
  const dateStr = `${DAYS_FR[now.getDay()]} ${now.getDate()} ${MONTHS_FR[now.getMonth()]}`;

  const fetchWeather = useCallback(async () => {
    if (!user?.city) return;
    try {
      setWeatherLoading(true);
      const resp = await apiCall(`/api/weather?city=${encodeURIComponent(user.city)}`);
      if (resp.ok) setWeather(await resp.json());
    } catch (e) { console.error(e); } finally { setWeatherLoading(false); }
  }, [user?.city]);

  useEffect(() => { fetchWeather(); }, [fetchWeather]);
  const onRefresh = async () => { setRefreshing(true); await fetchWeather(); setRefreshing(false); };

  const getWeatherIcon = (icon: string): keyof typeof Ionicons.glyphMap => {
    const m: Record<string, keyof typeof Ionicons.glyphMap> = { sunny: 'sunny', 'partly-sunny': 'partly-sunny', cloud: 'cloud', rainy: 'rainy', snow: 'snow', thunderstorm: 'thunderstorm' };
    return m[icon] || 'sunny';
  };

  const getGreeting = () => { const h = now.getHours(); return h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir'; };

  return (
    <View testID="home-screen" style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF2D55" />}>

        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.userName}>{user?.name || 'Beauté'}</Text>
          <Text style={styles.dateText}>{dateStr}</Text>
        </View>

        {/* Compact Weather */}
        {weatherLoading ? (
          <View style={styles.weatherCompact}><ActivityIndicator color="#FF2D55" size="small" /><Text style={styles.weatherLoadText}>Chargement météo...</Text></View>
        ) : weather ? (
          <View style={styles.weatherCompact}>
            <View style={styles.weatherRow}>
              <Ionicons name={getWeatherIcon(weather.icon)} size={24} color="#FF2D55" />
              <Text style={styles.weatherTemp}>{Math.round(weather.temperature)}°C</Text>
              <Text style={styles.weatherCity}>{weather.city}</Text>
              <Text style={styles.weatherHumidity}>| {weather.humidity}%</Text>
            </View>
            <Text style={styles.skinAdvice}>{weather.skin_advice}</Text>
          </View>
        ) : null}

        {/* MAIN CTA - Studio */}
        <View style={styles.studioCard}>
          <View style={styles.studioHeader}>
            <View style={styles.studioIconBox}><Ionicons name="sparkles" size={28} color="#FF2D55" /></View>
            <View style={styles.studioTextBox}>
              <Text style={styles.studioTitle}>Prête pour votre session ?</Text>
              <Text style={styles.studioSub}>Sélectionnez vos produits et lancez le studio</Text>
            </View>
          </View>
          <TouchableOpacity testID="start-studio-button" style={styles.studioButton} onPress={() => router.push('/product-selection')} activeOpacity={0.85}>
            <Ionicons name="color-wand" size={22} color="#FFF" />
            <Text style={styles.studioButtonText}>Accéder au Studio</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Accès rapide</Text>
        <View style={styles.actionsGrid}>
          {/* Gold Subscription Card */}
          <TouchableOpacity testID="quick-action-subscription" style={styles.goldCard} onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.85}>
            <View style={styles.goldIconBox}><Ionicons name="diamond" size={22} color="#B8860B" /></View>
            <Text style={styles.goldText}>{isPremium ? 'Mon abonnement' : 'Passer Premium'}</Text>
            <Text style={styles.goldSub}>{isPremium ? 'Premium actif' : 'Débloquer tout'}</Text>
          </TouchableOpacity>

          {/* Skin Analysis */}
          <TouchableOpacity testID="quick-action-skin" style={styles.actionCard}
            onPress={() => {
              if (isPremium) { router.push('/skin-analysis'); }
              else { Alert.alert('Abonnement requis', 'L\'analyse de peau est réservée aux abonnés Premium.'); }
            }}>
            <View style={[styles.actionIconBox, { backgroundColor: isPremium ? '#FFD5DE' : '#F2F2F7' }]}>
              <Ionicons name={isPremium ? 'scan' : 'lock-closed'} size={20} color={isPremium ? '#FF2D55' : '#8E8E93'} />
            </View>
            <Text style={styles.actionText}>Analyse peau</Text>
            {!isPremium && <View style={styles.premiumBadge}><Text style={styles.premiumBadgeText}>PREMIUM</Text></View>}
            {isPremium && <Text style={styles.actionSub}>Diagnostic IA</Text>}
          </TouchableOpacity>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Chat */}
      <TouchableOpacity testID="floating-chat-button" style={styles.floatingButton} onPress={() => setChatVisible(true)} activeOpacity={0.85}>
        <Ionicons name="chatbubble-ellipses" size={26} color="#FF2D55" />
      </TouchableOpacity>
      <ChatModal visible={chatVisible} onClose={() => setChatVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  scrollContent: { paddingHorizontal: 24, paddingTop: 12 },
  header: { marginBottom: 20 },
  greeting: { fontSize: 16, color: '#8E8E93', letterSpacing: 0.5 },
  userName: { fontSize: 34, fontWeight: '700', color: '#000', letterSpacing: -0.5, marginTop: 4 },
  dateText: { fontSize: 14, color: '#8E8E93', marginTop: 4, textTransform: 'capitalize' },
  weatherCompact: { backgroundColor: '#F2F2F7', borderRadius: 16, padding: 16, marginBottom: 20 },
  weatherRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  weatherTemp: { fontSize: 20, fontWeight: '600', color: '#000' },
  weatherCity: { fontSize: 14, color: '#8E8E93' },
  weatherHumidity: { fontSize: 13, color: '#8E8E93' },
  weatherLoadText: { fontSize: 14, color: '#8E8E93', marginLeft: 8 },
  skinAdvice: { fontSize: 13, color: '#000', lineHeight: 19 },
  studioCard: { backgroundColor: '#000', borderRadius: 24, padding: 24, marginBottom: 24 },
  studioHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  studioIconBox: { width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(255,45,85,0.15)', justifyContent: 'center', alignItems: 'center' },
  studioTextBox: { flex: 1 },
  studioTitle: { fontSize: 20, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  studioSub: { fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 20 },
  studioButton: { backgroundColor: '#FF2D55', borderRadius: 16, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  studioButtonText: { fontSize: 17, fontWeight: '700', color: '#FFF' },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#000', marginBottom: 14, letterSpacing: -0.3 },
  actionsGrid: { flexDirection: 'row', gap: 12 },
  // Gold card
  goldCard: { flex: 1, backgroundColor: '#FFF8E7', borderRadius: 20, padding: 20, borderWidth: 1.5, borderColor: '#D4AF37' },
  goldIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFF0C0', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  goldText: { fontSize: 15, fontWeight: '700', color: '#8B6914', marginBottom: 4 },
  goldSub: { fontSize: 12, color: '#B8860B' },
  // Action card
  actionCard: { flex: 1, backgroundColor: '#F2F2F7', borderRadius: 20, padding: 20 },
  actionIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  actionText: { fontSize: 15, fontWeight: '600', color: '#000', marginBottom: 4 },
  actionSub: { fontSize: 12, color: '#8E8E93' },
  premiumBadge: { backgroundColor: '#FFD5DE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', marginTop: 4 },
  premiumBadgeText: { fontSize: 10, fontWeight: '700', color: '#FF2D55' },
  floatingButton: { position: 'absolute', bottom: Platform.OS === 'ios' ? 110 : 90, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8, zIndex: 100 },
});
