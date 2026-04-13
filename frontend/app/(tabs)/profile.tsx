import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Platform, ActivityIndicator, Alert, KeyboardAvoidingView, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { apiCall } from '../../utils/api';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [city, setCity] = useState(user?.city || '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleLogout = async () => { await logout(); router.replace('/(auth)/login'); };

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission requise', 'Autorisez l\'accès galerie'); return; }
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.3, base64: true, allowsEditing: true, aspect: [1, 1] });
    if (!r.canceled && r.assets[0]?.base64) {
      try {
        const resp = await apiCall('/api/auth/profile', { method: 'PUT', body: JSON.stringify({ avatar: r.assets[0].base64 }) });
        if (resp.ok) {
          const u = await resp.json();
          await updateUser({ id: u.id, email: u.email, name: u.name, city: u.city, role: u.role, avatar: u.avatar } as any);
          Alert.alert('Photo mise à jour !');
        }
      } catch (e) { Alert.alert('Erreur'); }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: any = {};
      if (name.trim() !== user?.name) body.name = name.trim();
      if (email.trim() !== user?.email) body.email = email.trim();
      if (city.trim() !== user?.city) body.city = city.trim();
      if (password.length > 0) body.password = password;

      if (Object.keys(body).length === 0) { setEditing(false); setSaving(false); return; }

      const resp = await apiCall('/api/auth/profile', { method: 'PUT', body: JSON.stringify(body) });
      if (resp.ok) {
        const updated = await resp.json();
        await updateUser({ id: updated.id, email: updated.email, name: updated.name, city: updated.city, role: updated.role });
        setPassword('');
        setEditing(false);
        Alert.alert('Succès', 'Profil mis à jour');
      } else {
        const err = await resp.json();
        Alert.alert('Erreur', typeof err.detail === 'string' ? err.detail : 'Impossible de mettre à jour');
      }
    } catch (e) { Alert.alert('Erreur', 'Erreur réseau'); } finally { setSaving(false); }
  };

  const getInitials = (n: string) => n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const isAdmin = user?.role === 'admin';

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView testID="profile-screen" contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Profil</Text>
            <TouchableOpacity testID="edit-profile-button" onPress={() => editing ? handleSave() : setEditing(true)} disabled={saving}>
              {saving ? <ActivityIndicator color="#FF2D55" /> : (
                <Text style={styles.editBtn}>{editing ? 'Sauvegarder' : 'Modifier'}</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Avatar Card */}
          <View style={styles.avatarCard}>
            <TouchableOpacity testID="pick-avatar-button" onPress={pickAvatar} style={styles.avatarTouchable}>
              {(user as any)?.avatar ? (
                <Image source={{ uri: `data:image/jpeg;base64,${(user as any).avatar}` }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarCircle}><Text style={styles.avatarText}>{user?.name ? getInitials(user.name) : 'U'}</Text></View>
              )}
              <View style={styles.cameraBadge}><Ionicons name="camera" size={14} color="#FFF" /></View>
            </TouchableOpacity>
            <View style={styles.avatarInfo}>
              {editing ? (
                <TextInput testID="edit-name-input" style={styles.editInput} value={name} onChangeText={setName} placeholder="Nom" placeholderTextColor="#8E8E93" />
              ) : (
                <Text style={styles.avatarName}>{user?.name || 'Utilisateur'}</Text>
              )}
              <Text style={styles.avatarRole}>{isAdmin ? 'Administrateur' : 'Membre gratuit'}</Text>
            </View>
          </View>

          {/* Editable Fields */}
          <View style={styles.fieldsSection}>
            <View style={styles.fieldRow}>
              <Ionicons name="mail-outline" size={20} color="#FF2D55" />
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Email</Text>
                {editing ? (
                  <TextInput testID="edit-email-input" style={styles.fieldInput} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                ) : (
                  <Text style={styles.fieldValue}>{user?.email || ''}</Text>
                )}
              </View>
            </View>
            <View style={styles.fieldDivider} />
            <View style={styles.fieldRow}>
              <Ionicons name="location-outline" size={20} color="#FF2D55" />
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Ville</Text>
                {editing ? (
                  <TextInput testID="edit-city-input" style={styles.fieldInput} value={city} onChangeText={setCity} autoCapitalize="words" />
                ) : (
                  <Text style={styles.fieldValue}>{user?.city || 'Non définie'}</Text>
                )}
              </View>
            </View>
            {editing && (
              <>
                <View style={styles.fieldDivider} />
                <View style={styles.fieldRow}>
                  <Ionicons name="lock-closed-outline" size={20} color="#FF2D55" />
                  <View style={styles.fieldContent}>
                    <Text style={styles.fieldLabel}>Nouveau mot de passe</Text>
                    <TextInput testID="edit-password-input" style={styles.fieldInput} value={password} onChangeText={setPassword} secureTextEntry placeholder="Laisser vide si inchangé" placeholderTextColor="#C7C7CC" />
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Subscription Card */}
          {isPremium ? (
            <View style={[styles.subscriptionCard, { backgroundColor: '#F0FFF4', borderWidth: 1.5, borderColor: '#34C759' }]}>
              <View style={styles.subLeft}>
                <View style={[styles.subBadge, { backgroundColor: '#34C759' }]}><Ionicons name="checkmark-circle" size={14} color="#FFF" /><Text style={[styles.subBadgeText, { color: '#FFF' }]}>Premium</Text></View>
                <Text style={styles.subText}>Vous avez accès à toutes les fonctionnalités ARIA</Text>
              </View>
            </View>
          ) : (
            <View style={styles.subscriptionCard}>
              <View style={styles.subLeft}>
                <View style={styles.subBadge}><Ionicons name="sparkles" size={14} color="#000" /><Text style={styles.subBadgeText}>Gratuit</Text></View>
                <Text style={styles.subText}>Passez à Premium pour l'analyse faciale et les cours avancés</Text>
              </View>
              <TouchableOpacity testID="upgrade-button" style={styles.upgradeButton} onPress={() => router.push('/subscription')}>
                <Text style={styles.upgradeText}>Découvrir</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Admin Button */}
          {isAdmin && (
            <TouchableOpacity testID="admin-dashboard-button" style={styles.adminButton} onPress={() => router.push('/admin')}>
              <View style={styles.adminIconBox}><Ionicons name="settings" size={20} color="#FFF" /></View>
              <View style={styles.adminInfo}>
                <Text style={styles.adminLabel}>Administration</Text>
                <Text style={styles.adminSub}>Dashboard & statistiques</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#FFF" />
            </TouchableOpacity>
          )}

          {/* Contact Admin */}
          <TouchableOpacity testID="contact-admin-button" style={styles.contactButton} onPress={() => router.push('/contact')}>
            <Ionicons name="headset" size={20} color="#FF2D55" />
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Contacter l'assistance</Text>
              <Text style={styles.contactSub}>En cas de problème de compte</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity testID="logout-button" style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  scrollContent: { paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 12 : 48 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 34, fontWeight: '700', color: '#000', letterSpacing: -0.5 },
  editBtn: { fontSize: 16, fontWeight: '600', color: '#FF2D55' },
  // Avatar
  avatarCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F7', borderRadius: 24, padding: 24, marginBottom: 16 },
  avatarTouchable: { position: 'relative', marginRight: 18 },
  avatarImage: { width: 64, height: 64, borderRadius: 32 },
  avatarCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  cameraBadge: { position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderRadius: 12, backgroundColor: '#FF2D55', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#F2F2F7' },
  avatarText: { fontSize: 24, fontWeight: '600', color: '#FF2D55' },
  avatarInfo: { flex: 1 },
  avatarName: { fontSize: 22, fontWeight: '700', color: '#000', marginBottom: 4 },
  avatarRole: { fontSize: 14, color: '#8E8E93' },
  editInput: { fontSize: 20, fontWeight: '700', color: '#000', borderBottomWidth: 1, borderBottomColor: '#FF2D55', paddingBottom: 4 },
  // Fields
  fieldsSection: { backgroundColor: '#F2F2F7', borderRadius: 20, overflow: 'hidden', marginBottom: 16 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16, gap: 14 },
  fieldDivider: { height: 0.5, backgroundColor: '#E5E5EA', marginLeft: 52 },
  fieldContent: { flex: 1 },
  fieldLabel: { fontSize: 12, color: '#8E8E93', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldValue: { fontSize: 16, color: '#000', fontWeight: '500' },
  fieldInput: { fontSize: 16, color: '#000', fontWeight: '500', borderBottomWidth: 1, borderBottomColor: '#FF2D55', paddingBottom: 2 },
  // Subscription
  subscriptionCard: { backgroundColor: '#FFD5DE', borderRadius: 20, padding: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'center' },
  subLeft: { flex: 1, marginRight: 12 },
  subBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 10 },
  subBadgeText: { fontSize: 12, fontWeight: '700', color: '#000' },
  subText: { fontSize: 13, color: '#000', lineHeight: 18 },
  upgradeButton: { backgroundColor: '#FF2D55', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12 },
  upgradeText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  // Admin
  adminButton: { backgroundColor: '#000', borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  adminIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FF2D55', justifyContent: 'center', alignItems: 'center' },
  adminInfo: { flex: 1 },
  adminLabel: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  adminSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  // Contact
  contactButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F7', borderRadius: 16, padding: 18, gap: 14, marginBottom: 16 },
  contactInfo: { flex: 1 },
  contactLabel: { fontSize: 15, fontWeight: '600', color: '#000' },
  contactSub: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  // Logout
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFF5F5', borderRadius: 16, paddingVertical: 16 },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#FF3B30' },
});
