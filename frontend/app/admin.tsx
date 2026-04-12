import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiCall } from '../utils/api';
import { useAuth } from '../context/AuthContext';

type Stats = {
  total_users: number;
  total_admins: number;
  total_looks: number;
  total_messages: number;
  total_tutorials: number;
  subscriptions: { free: number; premium: number };
  recent_users: Array<{ email: string; name: string; city: string; subscription: string; created_at: string }>;
};

export default function AdminScreen() {
  const router = useRouter();
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

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}><ActivityIndicator size="large" color="#FF2D55" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <TouchableOpacity testID="admin-back-button" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Administration</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView testID="admin-dashboard" contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.welcome}>Bonjour, {user?.name || 'Admin'}</Text>
        <Text style={styles.subtitle}>Tableau de bord ARIA</Text>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard icon="people" label="Utilisateurs" value={stats?.total_users || 0} color="#FF2D55" />
          <StatCard icon="heart" label="Looks sauvés" value={stats?.total_looks || 0} color="#34C759" />
          <StatCard icon="chatbubbles" label="Messages chat" value={stats?.total_messages || 0} color="#007AFF" />
          <StatCard icon="book" label="Tutoriels" value={stats?.total_tutorials || 0} color="#FF9500" />
        </View>

        {/* Subscriptions */}
        <View style={styles.subCard}>
          <Text style={styles.sectionTitle}>Abonnements</Text>
          <View style={styles.subRow}>
            <View style={styles.subItem}>
              <Text style={styles.subValue}>{stats?.subscriptions.free || 0}</Text>
              <Text style={styles.subLabel}>Gratuit</Text>
            </View>
            <View style={styles.subDivider} />
            <View style={styles.subItem}>
              <Text style={[styles.subValue, { color: '#FF2D55' }]}>{stats?.subscriptions.premium || 0}</Text>
              <Text style={styles.subLabel}>Premium</Text>
            </View>
          </View>
          <View style={styles.barContainer}>
            <View style={[styles.barFree, { flex: Math.max(stats?.subscriptions.free || 1, 1) }]} />
            <View style={[styles.barPremium, { flex: Math.max(stats?.subscriptions.premium || 0, 0.01) }]} />
          </View>
        </View>

        {/* Recent Users */}
        <Text style={styles.sectionTitle}>Utilisateurs récents</Text>
        {stats?.recent_users && stats.recent_users.length > 0 ? (
          stats.recent_users.map((u, i) => (
            <View key={i} style={styles.userRow}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>{u.name?.[0]?.toUpperCase() || '?'}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userNameText}>{u.name || 'Inconnu'}</Text>
                <Text style={styles.userEmail}>{u.email}</Text>
              </View>
              <View style={[styles.userBadge, u.subscription === 'premium' ? styles.premBadge : styles.freeBadge]}>
                <Text style={[styles.userBadgeText, u.subscription === 'premium' && styles.premBadgeText]}>
                  {u.subscription === 'premium' ? 'PRO' : 'FREE'}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Aucun utilisateur pour le moment</Text>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, label, value, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: number; color: string }) {
  return (
    <View style={sStyles.card}>
      <View style={[sStyles.iconBox, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={sStyles.value}>{value}</Text>
      <Text style={sStyles.label}>{label}</Text>
    </View>
  );
}

const sStyles = StyleSheet.create({
  card: { width: '48%', backgroundColor: '#F2F2F7', borderRadius: 20, padding: 18, marginBottom: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  value: { fontSize: 28, fontWeight: '700', color: '#000', marginBottom: 2 },
  label: { fontSize: 13, color: '#8E8E93', fontWeight: '500' },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 8 : 40, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: '#E5E5EA' },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  topTitle: { fontSize: 17, fontWeight: '600', color: '#000' },
  scroll: { paddingHorizontal: 24, paddingTop: 24 },
  welcome: { fontSize: 28, fontWeight: '700', color: '#000', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#8E8E93', marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#000', marginBottom: 14 },
  // Stats Grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 12 },
  // Subscriptions
  subCard: { backgroundColor: '#F2F2F7', borderRadius: 20, padding: 20, marginBottom: 24 },
  subRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  subItem: { flex: 1, alignItems: 'center' },
  subDivider: { width: 1, height: 40, backgroundColor: '#E5E5EA' },
  subValue: { fontSize: 32, fontWeight: '700', color: '#000' },
  subLabel: { fontSize: 13, color: '#8E8E93', marginTop: 4 },
  barContainer: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: '#E5E5EA' },
  barFree: { backgroundColor: '#8E8E93', borderRadius: 4 },
  barPremium: { backgroundColor: '#FF2D55', borderRadius: 4 },
  // Users
  userRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F7', borderRadius: 16, padding: 14, marginBottom: 8 },
  userAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  userAvatarText: { fontSize: 16, fontWeight: '600', color: '#FF2D55' },
  userInfo: { flex: 1 },
  userNameText: { fontSize: 15, fontWeight: '600', color: '#000' },
  userEmail: { fontSize: 13, color: '#8E8E93' },
  userBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  freeBadge: { backgroundColor: '#E5E5EA' },
  premBadge: { backgroundColor: '#FFD5DE' },
  userBadgeText: { fontSize: 11, fontWeight: '700', color: '#8E8E93' },
  premBadgeText: { color: '#FF2D55' },
  emptyText: { fontSize: 14, color: '#8E8E93', textAlign: 'center', paddingVertical: 20 },
});
