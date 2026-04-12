import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle: string;
  action?: () => void;
  color?: string;
};

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const menuItems: MenuItem[] = [
    {
      icon: 'person-outline',
      label: 'Mon compte',
      subtitle: user?.email || '',
    },
    {
      icon: 'location-outline',
      label: 'Ma ville',
      subtitle: user?.city || 'Non définie',
    },
    {
      icon: 'notifications-outline',
      label: 'Notifications',
      subtitle: 'Gérer les alertes',
    },
    {
      icon: 'color-palette-outline',
      label: 'Préférences beauté',
      subtitle: 'Type de peau, teint',
    },
    {
      icon: 'shield-checkmark-outline',
      label: 'Confidentialité',
      subtitle: 'Données et sécurité',
    },
    {
      icon: 'information-circle-outline',
      label: 'À propos d\'ARIA',
      subtitle: 'Version 1.0.0',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        testID="profile-screen"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Profil</Text>

        {/* Avatar Card */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {user?.name ? getInitials(user.name) : 'U'}
            </Text>
          </View>
          <View style={styles.avatarInfo}>
            <Text style={styles.avatarName}>{user?.name || 'Utilisateur'}</Text>
            <Text style={styles.avatarEmail}>{user?.email || ''}</Text>
          </View>
        </View>

        {/* Subscription Card */}
        <View style={styles.subscriptionCard}>
          <View style={styles.subLeft}>
            <View style={styles.subBadge}>
              <Ionicons name="sparkles" size={14} color="#000" />
              <Text style={styles.subBadgeText}>Gratuit</Text>
            </View>
            <Text style={styles.subText}>
              Passez à Premium pour débloquer l'analyse faciale et les cours avancés
            </Text>
          </View>
          <TouchableOpacity testID="upgrade-button" style={styles.upgradeButton}>
            <Text style={styles.upgradeText}>Découvrir</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              testID={`menu-item-${item.label.toLowerCase().replace(/[^a-z]/g, '-')}`}
              key={index}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.menuItemLast,
              ]}
              onPress={item.action}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconBox}>
                <Ionicons name={item.icon} size={20} color="#FF2D55" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          testID="logout-button"
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 12 : 48,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
    marginBottom: 24,
  },
  // Avatar
  avatarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FF2D55',
  },
  avatarInfo: {
    flex: 1,
  },
  avatarName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  avatarEmail: {
    fontSize: 14,
    color: '#8E8E93',
  },
  // Subscription
  subscriptionCard: {
    backgroundColor: '#FFD5DE',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  subLeft: {
    flex: 1,
    marginRight: 12,
  },
  subBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  subBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  subText: {
    fontSize: 13,
    color: '#000000',
    lineHeight: 18,
  },
  upgradeButton: {
    backgroundColor: '#FF2D55',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  upgradeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Menu
  menuSection: {
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
  },
  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF5F5',
    borderRadius: 16,
    paddingVertical: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
});
