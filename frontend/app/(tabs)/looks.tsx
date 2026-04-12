import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiCall } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { CATEGORIES, Selection } from '../../constants/products';

type SavedLook = { id: string; name: string; products: Selection[]; notes: string; created_at: string };

export default function LooksScreen() {
  const { user } = useAuth();
  const [looks, setLooks] = useState<SavedLook[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [selections, setSelections] = useState<Selection[]>([]);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isPremium = user?.subscription === 'premium';
  const maxLooks = isPremium ? 999 : 1;

  const fetchLooks = useCallback(async () => {
    try {
      const resp = await apiCall('/api/looks');
      if (resp.ok) setLooks(await resp.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLooks(); }, [fetchLooks]);

  const selectShade = (catName: string, prodName: string, shade: { name: string; color: string }) => {
    setSelections(prev => {
      const filtered = prev.filter(s => !(s.category === catName && s.product === prodName));
      return [...filtered, { category: catName, product: prodName, shade: shade.name, shadeColor: shade.color }];
    });
  };

  const isSelected = (catName: string, prodName: string, shadeName: string) =>
    selections.some(s => s.category === catName && s.product === prodName && s.shade === shadeName);

  const handleAdd = () => {
    if (looks.length >= maxLooks) {
      Alert.alert('Limite atteinte', `Votre abonnement gratuit est limité à ${maxLooks} look sauvegardé. Passez à Premium pour en créer plus !`);
      return;
    }
    setNewName('');
    setNewNotes('');
    setSelections([]);
    setExpandedCat(null);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!newName.trim()) { Alert.alert('Erreur', 'Donnez un nom à votre look'); return; }
    if (selections.length === 0) { Alert.alert('Erreur', 'Sélectionnez au moins un produit'); return; }
    setSaving(true);
    try {
      const resp = await apiCall('/api/looks', {
        method: 'POST',
        body: JSON.stringify({ name: newName.trim(), products: selections, notes: newNotes.trim() }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setLooks(prev => [data, ...prev]);
        setModalVisible(false);
      }
    } catch (e) { Alert.alert('Erreur', 'Impossible de sauvegarder'); } finally { setSaving(false); }
  };

  const handleDelete = (lookId: string) => {
    Alert.alert('Supprimer', 'Voulez-vous supprimer ce look ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try {
          const resp = await apiCall(`/api/looks/${lookId}`, { method: 'DELETE' });
          if (resp.ok) setLooks(prev => prev.filter(l => l.id !== lookId));
        } catch (e) { console.error(e); }
      }},
    ]);
  };

  if (loading) return <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator size="large" color="#FF2D55" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView testID="looks-screen" contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.headerRow}>
          <View>
            <Text style={s.title}>Mes Looks</Text>
            <Text style={s.sub}>{looks.length}/{maxLooks} look{maxLooks > 1 ? 's' : ''}</Text>
          </View>
          <TouchableOpacity testID="add-look-button" style={[s.addBtn, looks.length >= maxLooks && !isPremium && s.addBtnDisabled]} onPress={handleAdd}>
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {looks.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIcon}><Ionicons name="heart-outline" size={48} color="#FFD5DE" /></View>
            <Text style={s.emptyTitle}>Aucun look sauvegardé</Text>
            <Text style={s.emptyText}>Sauvegardez votre sélection maquillage pour la réutiliser chaque jour</Text>
            <TouchableOpacity testID="empty-add-btn" style={s.emptyBtn} onPress={handleAdd}><Text style={s.emptyBtnText}>Créer mon look</Text></TouchableOpacity>
          </View>
        ) : looks.map(look => (
          <View testID={`look-card-${look.id}`} key={look.id} style={s.card}>
            <View style={s.cardHeader}>
              <View style={s.cardIcon}><Ionicons name="color-palette" size={20} color="#FF2D55" /></View>
              <View style={s.cardInfo}><Text style={s.cardName}>{look.name}</Text><Text style={s.cardDate}>{look.created_at ? new Date(look.created_at).toLocaleDateString('fr-FR') : ''}</Text></View>
              <TouchableOpacity testID={`del-${look.id}`} onPress={() => handleDelete(look.id)} style={s.deleteBtn}>
                <Ionicons name="trash-outline" size={22} color="#FF3B30" />
              </TouchableOpacity>
            </View>
            <View style={s.productList}>
              {(look.products || []).map((p: any, i: number) => (
                <View key={i} style={s.productRow}>
                  <View style={[s.colorDot, { backgroundColor: p.shadeColor || p.color || '#ccc' }]} />
                  <Text style={s.productLabel}>{p.product || p} — <Text style={s.shadeTxt}>{p.shade || ''}</Text></Text>
                </View>
              ))}
            </View>
            {look.notes ? <Text style={s.notes}>{look.notes}</Text> : null}
          </View>
        ))}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Create Look Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.handle} />
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Nouveau Look</Text>
              <TouchableOpacity testID="close-modal" onPress={() => setModalVisible(false)}><Ionicons name="close" size={28} color="#8E8E93" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.label}>NOM</Text>
              <TextInput testID="look-name-input" style={s.input} placeholder="Ex: Mon look quotidien" placeholderTextColor="#8E8E93" value={newName} onChangeText={setNewName} />

              <Text style={s.label}>PRODUITS & TEINTES</Text>
              {CATEGORIES.map(cat => (
                <View key={cat.id} style={s.catCard}>
                  <TouchableOpacity testID={`modal-cat-${cat.id}`} style={s.catHead} onPress={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}>
                    <View style={s.catLeft}><View style={s.catIconBox}><Ionicons name={cat.icon as any} size={18} color="#FF2D55" /></View><Text style={s.catName}>{cat.name}</Text></View>
                    <Ionicons name={expandedCat === cat.id ? 'chevron-up' : 'chevron-down'} size={18} color="#8E8E93" />
                  </TouchableOpacity>
                  {expandedCat === cat.id && (
                    <View style={s.catBody}>
                      {cat.products.map(prod => (
                        <View key={prod.name} style={s.prodSec}>
                          <Text style={s.prodName}>{prod.name}</Text>
                          <View style={s.shadesRow}>
                            {prod.shades.map(shade => {
                              const sel = isSelected(cat.name, prod.name, shade.name);
                              return (
                                <TouchableOpacity key={shade.name} style={[s.shadeBtn, sel && s.shadeBtnSel]} onPress={() => selectShade(cat.name, prod.name, shade)}>
                                  <View style={[s.shadeCircle, { backgroundColor: shade.color }, sel && s.shadeCircleSel]} />
                                  <Text style={[s.shadeName, sel && s.shadeNameSel]}>{shade.name}</Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}

              <Text style={s.label}>NOTES (optionnel)</Text>
              <TextInput testID="look-notes-input" style={[s.input, { minHeight: 60, textAlignVertical: 'top' }]} placeholder="Ajoutez des notes..." placeholderTextColor="#8E8E93" value={newNotes} onChangeText={setNewNotes} multiline />

              <View style={s.selInfo}><Text style={s.selCount}>{selections.length} produit{selections.length !== 1 ? 's' : ''} sélectionné{selections.length !== 1 ? 's' : ''}</Text></View>

              <TouchableOpacity testID="save-look-button" style={[s.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFF" /> : <Text style={s.saveBtnText}>Sauvegarder</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 12 : 48 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontSize: 34, fontWeight: '700', color: '#000' },
  sub: { fontSize: 15, color: '#8E8E93', marginTop: 4 },
  addBtn: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#FF2D55', justifyContent: 'center', alignItems: 'center' },
  addBtnDisabled: { backgroundColor: '#E5E5EA' },
  // Empty
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon: { width: 100, height: 100, borderRadius: 32, backgroundColor: '#F2F2F7', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#000', marginBottom: 8 },
  emptyText: { fontSize: 15, color: '#8E8E93', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  emptyBtn: { backgroundColor: '#FF2D55', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  emptyBtnText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  // Card
  card: { backgroundColor: '#F2F2F7', borderRadius: 20, padding: 20, marginBottom: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  cardIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFD5DE', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 17, fontWeight: '600', color: '#000' },
  cardDate: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  productList: { gap: 6 },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colorDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  productLabel: { fontSize: 14, color: '#000' },
  shadeTxt: { color: '#8E8E93' },
  notes: { fontSize: 14, color: '#8E8E93', marginTop: 12, fontStyle: 'italic' },
  deleteBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF5F5', justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalBox: { backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, maxHeight: '90%' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E5EA', alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#000' },
  label: { fontSize: 12, fontWeight: '600', color: '#8E8E93', marginBottom: 8, letterSpacing: 0.5 },
  input: { backgroundColor: '#F2F2F7', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#000', marginBottom: 20 },
  // Categories in modal
  catCard: { backgroundColor: '#F2F2F7', borderRadius: 16, marginBottom: 8, overflow: 'hidden' },
  catHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  catLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  catIconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#FFD5DE', justifyContent: 'center', alignItems: 'center' },
  catName: { fontSize: 15, fontWeight: '600', color: '#000' },
  catBody: { paddingHorizontal: 14, paddingBottom: 14 },
  prodSec: { marginBottom: 12 },
  prodName: { fontSize: 12, fontWeight: '600', color: '#8E8E93', marginBottom: 8, textTransform: 'uppercase' },
  shadesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  shadeBtn: { alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 10, backgroundColor: '#FFF', borderWidth: 1.5, borderColor: 'transparent', minWidth: 70 },
  shadeBtnSel: { borderColor: '#FF2D55', backgroundColor: '#FFF5F7' },
  shadeCircle: { width: 22, height: 22, borderRadius: 11, marginBottom: 4, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  shadeCircleSel: { borderWidth: 2, borderColor: '#FF2D55' },
  shadeName: { fontSize: 10, color: '#000', textAlign: 'center', fontWeight: '500' },
  shadeNameSel: { color: '#FF2D55', fontWeight: '600' },
  selInfo: { alignItems: 'center', marginVertical: 8 },
  selCount: { fontSize: 14, fontWeight: '600', color: '#000' },
  saveBtn: { backgroundColor: '#FF2D55', borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginTop: 4, marginBottom: 20 },
  saveBtnText: { fontSize: 17, fontWeight: '600', color: '#FFF' },
});
