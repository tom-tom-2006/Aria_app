import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiCall } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function ContactScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) { Alert.alert('Erreur', 'Remplissez tous les champs'); return; }
    setSending(true);
    try {
      // Save to DB
      const resp = await apiCall('/api/contact', { method: 'POST', body: JSON.stringify({ subject: subject.trim(), message: message.trim() }) });
      // Also open native email
      const mailTo = `mailto:tom.clement0814@gmail.com?subject=${encodeURIComponent(`[ARIA] ${subject.trim()}`)}&body=${encodeURIComponent(`De: ${user?.name} (${user?.email})\n\n${message.trim()}`)}`;
      await Linking.openURL(mailTo);
      if (resp.ok) {
        Alert.alert('Envoyé !', 'Votre message a été enregistré et l\'app email s\'est ouverte pour confirmer l\'envoi.', [{ text: 'OK', onPress: () => router.back() }]);
      }
    } catch (e) { Alert.alert('Erreur', 'Erreur réseau'); } finally { setSending(false); }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity testID="contact-back" onPress={() => router.back()} style={styles.backBtn}><Ionicons name="chevron-back" size={24} color="#000" /></TouchableOpacity>
        <Text style={styles.topTitle}>Contact</Text>
        <View style={{ width: 40 }} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.infoCard}>
            <Ionicons name="mail" size={24} color="#FF2D55" />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Besoin d'aide ?</Text>
              <Text style={styles.infoSub}>Notre équipe vous répondra à tom.clement0814@gmail.com</Text>
            </View>
          </View>
          <Text style={styles.label}>DE</Text>
          <View style={styles.fromBox}><Text style={styles.fromText}>{user?.name} ({user?.email})</Text></View>
          <Text style={styles.label}>SUJET</Text>
          <TextInput testID="contact-subject" style={styles.input} placeholder="Ex: Problème de compte" placeholderTextColor="#8E8E93" value={subject} onChangeText={setSubject} />
          <Text style={styles.label}>MESSAGE</Text>
          <TextInput testID="contact-message" style={[styles.input, styles.multiline]} placeholder="Décrivez votre problème..." placeholderTextColor="#8E8E93" value={message} onChangeText={setMessage} multiline numberOfLines={6} textAlignVertical="top" />
          <TouchableOpacity testID="contact-send-btn" style={[styles.sendBtn, sending && { opacity: 0.7 }]} onPress={handleSend} disabled={sending}>
            {sending ? <ActivityIndicator color="#FFF" /> : <><Ionicons name="send" size={18} color="#FFF" /><Text style={styles.sendText}>Envoyer</Text></>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: '#E5E5EA' },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  topTitle: { fontSize: 17, fontWeight: '600', color: '#000' },
  scroll: { paddingHorizontal: 24, paddingTop: 24 },
  infoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFD5DE', borderRadius: 16, padding: 18, gap: 14, marginBottom: 24 },
  infoText: { flex: 1 },
  infoTitle: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 4 },
  infoSub: { fontSize: 13, color: '#000', lineHeight: 18 },
  label: { fontSize: 12, fontWeight: '600', color: '#8E8E93', marginBottom: 8, letterSpacing: 0.5 },
  fromBox: { backgroundColor: '#F2F2F7', borderRadius: 14, padding: 16, marginBottom: 20 },
  fromText: { fontSize: 15, color: '#000' },
  input: { backgroundColor: '#F2F2F7', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#000', marginBottom: 20 },
  multiline: { minHeight: 120 },
  sendBtn: { backgroundColor: '#FF2D55', borderRadius: 14, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  sendText: { fontSize: 17, fontWeight: '600', color: '#FFF' },
});
