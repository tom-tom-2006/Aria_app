import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { apiCall } from '../../utils/api';
import ChatModal from '../../components/ChatModal';

const TIPS = [
  { icon: 'water-outline' as const, text: 'Buvez 2L d\'eau par jour pour une peau éclatante' },
  { icon: 'brush-outline' as const, text: 'Nettoyez vos pinceaux chaque semaine' },
  { icon: 'sunny-outline' as const, text: 'Crème solaire même en hiver' },
  { icon: 'moon-outline' as const, text: 'Démaquillez-vous avant de dormir' },
  { icon: 'leaf-outline' as const, text: 'Exfoliez 2 fois par semaine' },
  { icon: 'nutrition-outline' as const, text: 'Vitamine C pour un teint lumineux' },
];

const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

type WeatherData = {
  city: string;
  temperature: number;
  humidity: number;
  icon: string;
  skin_advice: string;
};

export default function HomeScreen() {
  const { user } = useAuth();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [chatVisible, setChatVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const now = new Date();
  const dateStr = `${DAYS_FR[now.getDay()]} ${now.getDate()} ${MONTHS_FR[now.getMonth()]}`;

  const fetchWeather = useCallback(async () => {
    if (!user?.city) return;
    try {
      setWeatherLoading(true);
      const resp = await apiCall(`/api/weather?city=${encodeURIComponent(user.city)}`);
      if (resp.ok) {
        const data = await resp.json();
        setWeather(data);
      }
    } catch (e) {
      console.error('Weather fetch error:', e);
    } finally {
      setWeatherLoading(false);
    }
  }, [user?.city]);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWeather();
    setRefreshing(false);
  };

  const getWeatherIcon = (icon: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      sunny: 'sunny',
      'partly-sunny': 'partly-sunny',
      cloud: 'cloud',
      rainy: 'rainy',
      snow: 'snow',
      thunderstorm: 'thunderstorm',
    };
    return iconMap[icon] || 'sunny';
  };

  const getGreeting = () => {
    const hour = now.getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View testID="home-screen" style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF2D55" />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user?.name || 'Beauté'}</Text>
            <Text style={styles.dateText}>{dateStr}</Text>
          </View>

          {/* Weather Card */}
          <View style={styles.weatherCard}>
            {weatherLoading ? (
              <View style={styles.weatherLoading}>
                <ActivityIndicator color="#FF2D55" size="small" />
                <Text style={styles.weatherLoadingText}>Chargement météo...</Text>
              </View>
            ) : weather ? (
              <>
                <View style={styles.weatherTop}>
                  <View style={styles.weatherInfo}>
                    <View style={styles.cityRow}>
                      <Ionicons name="location-outline" size={14} color="#8E8E93" />
                      <Text style={styles.cityText}>{weather.city}</Text>
                    </View>
                    <Text style={styles.tempText}>{Math.round(weather.temperature)}°C</Text>
                    <Text style={styles.humidityText}>Humidité: {weather.humidity}%</Text>
                  </View>
                  <View style={styles.weatherIconContainer}>
                    <Ionicons
                      name={getWeatherIcon(weather.icon)}
                      size={52}
                      color="#FF2D55"
                    />
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.weatherError}>
                <Ionicons name="cloud-offline-outline" size={28} color="#8E8E93" />
                <Text style={styles.weatherErrorText}>Météo indisponible</Text>
              </View>
            )}
          </View>

          {/* Skin Advice Card */}
          {weather?.skin_advice ? (
            <View style={styles.adviceCard}>
              <View style={styles.adviceHeader}>
                <View style={styles.adviceIconBox}>
                  <Ionicons name="sparkles" size={18} color="#FF2D55" />
                </View>
                <Text style={styles.adviceTitle}>Conseil beauté du jour</Text>
              </View>
              <Text style={styles.adviceText}>{weather.skin_advice}</Text>
            </View>
          ) : null}

          {/* Quick Tips */}
          <View style={styles.tipsSection}>
            <Text style={styles.sectionTitle}>Astuces beauté</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tipsScroll}
            >
              {TIPS.map((tip, index) => (
                <View key={index} style={styles.tipCard}>
                  <View style={styles.tipIconBox}>
                    <Ionicons name={tip.icon} size={22} color="#FF2D55" />
                  </View>
                  <Text style={styles.tipText}>{tip.text}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Accès rapide</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity testID="quick-action-chat" style={styles.actionCard} onPress={() => setChatVisible(true)}>
                <View style={[styles.actionIconBox, { backgroundColor: '#000' }]}>
                  <Ionicons name="chatbubble" size={22} color="#FF2D55" />
                </View>
                <Text style={styles.actionText}>Chat IA</Text>
                <Text style={styles.actionSub}>Posez vos questions</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="quick-action-skincare" style={styles.actionCard}>
                <View style={[styles.actionIconBox, { backgroundColor: '#FFD5DE' }]}>
                  <Ionicons name="flower-outline" size={22} color="#FF2D55" />
                </View>
                <Text style={styles.actionText}>Soins</Text>
                <Text style={styles.actionSub}>Routine quotidienne</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Floating Chat Button */}
        <TouchableOpacity
          testID="floating-chat-button"
          style={styles.floatingButton}
          onPress={() => setChatVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="chatbubble-ellipses" size={26} color="#FF2D55" />
        </TouchableOpacity>

        {/* Chat Modal */}
        <ChatModal visible={chatVisible} onClose={() => setChatVisible(false)} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 12 : 48,
  },
  header: {
    marginBottom: 28,
  },
  greeting: {
    fontSize: 16,
    color: '#8E8E93',
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  // Weather Card
  weatherCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
  },
  weatherTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherInfo: {
    flex: 1,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  cityText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  tempText: {
    fontSize: 48,
    fontWeight: '200',
    color: '#000000',
    letterSpacing: -2,
  },
  humidityText: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
  weatherIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weatherLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  weatherLoadingText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  weatherError: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  weatherErrorText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  // Skin Advice
  adviceCard: {
    backgroundColor: '#000000',
    borderRadius: 24,
    padding: 24,
    marginBottom: 28,
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  adviceIconBox: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255,45,85,0.15)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adviceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  adviceText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 24,
  },
  // Tips
  tipsSection: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  tipsScroll: {
    paddingRight: 24,
    gap: 12,
  },
  tipCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    padding: 18,
    width: 160,
    minHeight: 120,
  },
  tipIconBox: {
    width: 40,
    height: 40,
    backgroundColor: '#FFD5DE',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 13,
    color: '#000000',
    lineHeight: 18,
    fontWeight: '500',
  },
  // Actions
  actionsSection: {
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    padding: 20,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  actionSub: {
    fontSize: 12,
    color: '#8E8E93',
  },
  // Floating Button
  floatingButton: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 110 : 90,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 100,
  },
});
