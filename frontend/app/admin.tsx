import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiCall } from '../utils/api';
import { useAuth } from '../context/AuthContext';

type Stats = {
  total_users: number; total_admins: number; total_looks: number; total_messages: number; total_tutorials: number;
  subscriptions: { free: number; premium: number };
  recent_users: Array<{ email: string; name: string; city: string; subscription: string; created_at: string }>;
  contacts: Array<{ id: string; user_name: string; user_email: string; subject: string; message: string; status: string; created_at: string }>;
};

export default function AdminScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);
  const fetchStats = async () => {
    try {
      const resp = await apiCall('/api/admin/stats');
      if (resp.ok) setStats(await resp.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  if (loading) return <View style={[styles.container, { paddingTop: insets.top }]}><View style={styles.center}><ActivityIndicator size="large" color="#FF2D55" /></View></View>;

  const totalSubs = (stats?.subscriptions.free || 0) + (stats?.subscriptions.premium || 0);
  const premPct = totalSubs > 0 ? Math.round((stats?.subscriptions.premium || 0) / totalSubs * 100) : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity testID="admin-back" onPress={() => router.back()} style={styles.backBtn}><Ionicons name="chevron-back" size={24} color="#FFF" /></TouchableOpacity>
        <Text style={styles.topTitle}>Administration</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView testID="admin-dashboard" contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Welcome */}
        <Text style={styles.welcome}>Bonjour, {user?.name}</Text>
        <Text style={styles.subtitle}>Tableau de bord ARIA</Text>

        {/* Stats Row 1 */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#FF2D55' }]}>
            <Ionicons name="people" size={28} color="#FFF" />
            <Text style={styles.statNum}>{stats?.total_users || 0}</Text>
            <Text style={styles.statLabel}>Utilisateurs</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#000' }]}>
            <Ionicons name="chatbubbles" size={28} color="#FF2D55" />
            <Text style={styles.statNum}>{stats?.total_messages || 0}</Text>
            <Text style={styles.statLabel}>Messages IA</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#1C1C1E' }]}>
            <Ionicons name="heart" size={28} color="#FF2D55" />
            <Text style={styles.statNum}>{stats?.total_looks || 0}</Text>
            <Text style={styles.statLabel}>Looks sauvés</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#1C1C1E' }]}>
            <Ionicons name="book" size={28} color="#FF9500" />
            <Text style={styles.statNum}>{stats?.total_tutorials || 0}</Text>
            <Text style={styles.statLabel}>Tutoriels</Text>
          </View>
        </View>

        {/* Subscriptions */}
        <View style={styles.subSection}>
          <Text style={styles.sectionTitle}>Abonnements</Text>
          <View style={styles.subCard}>
            <View style={styles.subNumbers}>
              <View style={styles.subItem}>
                <Text style={styles.subValue}>{stats?.subscriptions.free || 0}</Text>
                <View style={styles.subDot}><View style={[styles.dot, { backgroundColor: '#8E8E93' }]} /><Text style={styles.subDotLabel}>Gratuit</Text></View>
              </View>
              <View style={styles.subDivider} />
              <View style={styles.subItem}>
                <Text style={[styles.subValue, { color: '#FF2D55' }]}>{stats?.subscriptions.premium || 0}</Text>
                <View style={styles.subDot}><View style={[styles.dot, { backgroundColor: '#FF2D55' }]} /><Text style={styles.subDotLabel}>Premium</Text></View>
              </View>
              <View style={styles.subDivider} />
              <View style={styles.subItem}>
                <Text style={[styles.subValue, { color: '#D4AF37' }]}>{premPct}%</Text>
                <Text style={styles.subDotLabel}>Conversion</Text>
              </View>
            </View>
            <View style={styles.barWrap}>
              <View style={[styles.barFree, { flex: Math.max(stats?.subscriptions.free || 1, 1) }]} />
              <View style={[styles.barPrem, { flex: Math.max(stats?.subscriptions.premium || 0, 0.01) }]} />
            </View>
          </View>
        </View>

        {/* Recent Users */}
        <Text style={styles.sectionTitle}>Utilisateurs récents</Text>
        {stats?.recent_users && stats.recent_users.length > 0 ? (
          stats.recent_users.map((u, i) => (
            <View key={i} style={styles.userRow}>
              <View style={styles.userAvatar}><Text style={styles.userInitial}>{u.name?.[0]?.toUpperCase() || '?'}</Text></View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{u.name || 'Inconnu'}</Text>
                <Text style={styles.userEmail}>{u.email} — {u.city || '?'}</Text>
              </View>
              <View style={[styles.badge, u.subscription === 'premium' ? styles.badgePrem : styles.badgeFree]}>
                <Text style={[styles.badgeText, u.subscription === 'premium' && { color: '#FFF' }]}>
                  {u.subscription === 'premium' ? 'PRO' : 'FREE'}
                </Text>
              </View>
            </View>
          ))
        ) : <Text style={styles.emptyText}>Aucun utilisateur</Text>}

        {/* Contact Requests */}
        {stats?.contacts && stats.contacts.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Demandes de contact</Text>
            {stats.contacts.map((c, i) => (
              <View key={i} style={styles.contactCard}>
                <View style={styles.contactHeader}>
                  <View style={styles.contactBadge}><Ionicons name="mail" size={14} color="#FF2D55" /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactName}>{c.user_name} ({c.user_email})</Text>
                    <Text style={styles.contactSubject}>{c.subject}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: c.status === 'new' ? '#FFD5DE' : '#E5E5EA' }]}>
                    <Text style={styles.statusText}>{c.status === 'new' ? 'Nouveau' : c.status}</Text>
                  </View>
                </View>
                <Text style={styles.contactMsg}>{c.message}</Text>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: '#222' },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  topTitle: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  scroll: { paddingHorizontal: 20, paddingTop: 20 },
  welcome: { fontSize: 28, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#8E8E93', marginBottom: 24 },
  // Stats
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1, borderRadius: 24, padding: 24, alignItems: 'center' },
  statNum: { fontSize: 36, fontWeight: '700', color: '#FFF', marginTop: 8, marginBottom: 4 },
  statLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  // Subs
  subSection: { marginTop: 12, marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#FFF', marginBottom: 14 },
  subCard: { backgroundColor: '#1C1C1E', borderRadius: 24, padding: 24 },
  subNumbers: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  subItem: { flex: 1, alignItems: 'center' },
  subDivider: { width: 1, height: 40, backgroundColor: '#333' },
  subValue: { fontSize: 32, fontWeight: '700', color: '#FFF' },
  subDot: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  subDotLabel: { fontSize: 12, color: '#8E8E93' },
  barWrap: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: '#333' },
  barFree: { backgroundColor: '#8E8E93', borderRadius: 4 },
  barPrem: { backgroundColor: '#FF2D55', borderRadius: 4 },
  // Users
  userRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', borderRadius: 16, padding: 14, marginBottom: 8 },
  userAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FF2D55', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  userInitial: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  userEmail: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeFree: { backgroundColor: '#333' },
  badgePrem: { backgroundColor: '#FF2D55' },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#8E8E93' },
  emptyText: { color: '#8E8E93', textAlign: 'center', paddingVertical: 20 },
  // Contacts
  contactCard: { backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, marginBottom: 10 },
  contactHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  contactBadge: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#FFD5DE22', justifyContent: 'center', alignItems: 'center' },
  contactName: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  contactSubject: { fontSize: 12, color: '#FF2D55' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700', color: '#FF2D55' },
  contactMsg: { fontSize: 13, color: '#8E8E93', lineHeight: 18 },
});
