import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Platform, Alert, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useLanguage, LANG_NAMES, Lang } from '../../context/LanguageContext';
import { apiCall } from '../../utils/api';
import ChatModal from '../../components/ChatModal';

const DAYS: Record<string, string[]> = {
  fr: ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'],
  en: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
  es: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],
  ar: ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'],
};
const MONTHS: Record<string, string[]> = {
  fr: ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  es: ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'],
  ar: ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'],
};

type WeatherData = { city: string; temperature: number; humidity: number; icon: string; skin_advice: string };

export default function HomeScreen() {
  const { user } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const router = useRouter();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [chatVisible, setChatVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [langModal, setLangModal] = useState(false);

  const isPremium = user?.subscription === 'premium';
  const now = new Date();
  const d = DAYS[lang] || DAYS.fr;
  const m = MONTHS[lang] || MONTHS.fr;
  const dateStr = `${d[now.getDay()]} ${now.getDate()} ${m[now.getMonth()]}`;

  const fetchWeather = useCallback(async () => {
    if (!user?.city) return;
    try { setWeatherLoading(true); const r = await apiCall(`/api/weather?city=${encodeURIComponent(user.city)}`); if (r.ok) setWeather(await r.json()); } catch (e) {} finally { setWeatherLoading(false); }
  }, [user?.city]);
  useEffect(() => { fetchWeather(); }, [fetchWeather]);
  const onRefresh = async () => { setRefreshing(true); await fetchWeather(); setRefreshing(false); };

  const getWeatherIcon = (icon: string): keyof typeof Ionicons.glyphMap => ({ sunny:'sunny','partly-sunny':'partly-sunny',cloud:'cloud',rainy:'rainy',snow:'snow',thunderstorm:'thunderstorm' } as any)[icon] || 'sunny';
  const getGreeting = () => { const h = now.getHours(); return h < 12 ? t('hello') : h < 18 ? t('good_afternoon') : t('good_evening'); };

  return (
    <View testID="home-screen" style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF2D55" />}>

        {/* Header with language selector */}
        <View style={styles.headerRow}>
          <View style={styles.header}>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user?.name || 'Beauté'}</Text>
            <Text style={styles.dateText}>{dateStr}</Text>
          </View>
          <TouchableOpacity testID="lang-button" style={styles.langBtn} onPress={() => setLangModal(true)}>
            <Ionicons name="globe-outline" size={18} color="#FF2D55" />
            <Text style={styles.langBtnText}>{lang.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* Weather */}
        {weatherLoading ? (
          <View style={styles.weatherCompact}><ActivityIndicator color="#FF2D55" size="small" /><Text style={styles.weatherLoadText}>{t('weather_loading')}</Text></View>
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

        {/* Studio CTA */}
        <View style={styles.studioCard}>
          <View style={styles.studioHeader}>
            <View style={styles.studioIconBox}><Ionicons name="sparkles" size={28} color="#FF2D55" /></View>
            <View style={styles.studioTextBox}>
              <Text style={styles.studioTitle}>{t('ready_session')}</Text>
              <Text style={styles.studioSub}>{t('select_products')}</Text>
            </View>
          </View>
          <TouchableOpacity testID="start-studio-button" style={styles.studioButton} onPress={() => router.push('/product-selection')} activeOpacity={0.85}>
            <Ionicons name="color-wand" size={22} color="#FFF" />
            <Text style={styles.studioButtonText}>{t('access_studio')}</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>{t('quick_access')}</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity testID="quick-action-subscription" style={styles.goldCard} onPress={() => router.push('/subscription')} activeOpacity={0.85}>
            <View style={styles.goldIconBox}><Ionicons name="diamond" size={22} color="#B8860B" /></View>
            <Text style={styles.goldText}>{isPremium ? t('my_sub') : t('go_premium')}</Text>
            <Text style={styles.goldSub}>{isPremium ? t('premium_active') : t('unlock_all')}</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="quick-action-skin" style={styles.actionCard}
            onPress={() => { if (isPremium) router.push('/skin-analysis'); else Alert.alert(t('sub_required'), t('sub_required_msg')); }}>
            <View style={[styles.actionIconBox, { backgroundColor: isPremium ? '#FFD5DE' : '#F2F2F7' }]}>
              <Ionicons name={isPremium ? 'scan' : 'lock-closed'} size={20} color={isPremium ? '#FF2D55' : '#8E8E93'} />
            </View>
            <Text style={styles.actionText}>{t('skin_analysis')}</Text>
            {!isPremium && <View style={styles.premiumBadge}><Text style={styles.premiumBadgeText}>PREMIUM</Text></View>}
            {isPremium && <Text style={styles.actionSub}>{t('ai_diagnosis')}</Text>}
          </TouchableOpacity>
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

      <TouchableOpacity testID="floating-chat-button" style={styles.floatingButton} onPress={() => setChatVisible(true)} activeOpacity={0.85}>
        <Ionicons name="chatbubble-ellipses" size={26} color="#FF2D55" />
      </TouchableOpacity>
      <ChatModal visible={chatVisible} onClose={() => setChatVisible(false)} />

      {/* Language Modal */}
      <Modal visible={langModal} transparent animationType="fade" onRequestClose={() => setLangModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setLangModal(false)}>
          <View style={styles.langModal}>
            <Text style={styles.langModalTitle}>{t('language')}</Text>
            {(['fr','en','es','ar'] as Lang[]).map(l => (
              <TouchableOpacity key={l} testID={`lang-${l}`} style={[styles.langOption, lang === l && styles.langOptionActive]} onPress={() => { setLang(l); setLangModal(false); }}>
                <Text style={[styles.langOptionText, lang === l && styles.langOptionTextActive]}>{LANG_NAMES[l]}</Text>
                {lang === l && <Ionicons name="checkmark-circle" size={20} color="#FF2D55" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', paddingTop: Platform.OS === 'ios' ? 60 : 48 },
  scrollContent: { paddingHorizontal: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  header: { flex: 1 },
  greeting: { fontSize: 16, color: '#8E8E93', letterSpacing: 0.5 },
  userName: { fontSize: 34, fontWeight: '700', color: '#000', letterSpacing: -0.5, marginTop: 4 },
  dateText: { fontSize: 14, color: '#8E8E93', marginTop: 4, textTransform: 'capitalize' },
  langBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F2F2F7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginTop: 4 },
  langBtnText: { fontSize: 13, fontWeight: '700', color: '#FF2D55' },
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
  goldCard: { flex: 1, backgroundColor: '#FFF8E7', borderRadius: 20, padding: 20, borderWidth: 1.5, borderColor: '#D4AF37' },
  goldIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFF0C0', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  goldText: { fontSize: 15, fontWeight: '700', color: '#8B6914', marginBottom: 4 },
  goldSub: { fontSize: 12, color: '#B8860B' },
  actionCard: { flex: 1, backgroundColor: '#F2F2F7', borderRadius: 20, padding: 20 },
  actionIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  actionText: { fontSize: 15, fontWeight: '600', color: '#000', marginBottom: 4 },
  actionSub: { fontSize: 12, color: '#8E8E93' },
  premiumBadge: { backgroundColor: '#FFD5DE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', marginTop: 4 },
  premiumBadgeText: { fontSize: 10, fontWeight: '700', color: '#FF2D55' },
  floatingButton: { position: 'absolute', bottom: Platform.OS === 'ios' ? 110 : 90, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8, zIndex: 100 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  langModal: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, width: 280 },
  langModalTitle: { fontSize: 20, fontWeight: '700', color: '#000', marginBottom: 16, textAlign: 'center' },
  langOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, marginBottom: 4 },
  langOptionActive: { backgroundColor: '#FFD5DE' },
  langOptionText: { fontSize: 17, color: '#000', fontWeight: '500' },
  langOptionTextActive: { color: '#FF2D55', fontWeight: '700' },
});
