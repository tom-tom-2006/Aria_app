import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiCall } from '../../utils/api';

type SavedLook = {
  id: string;
  name: string;
  products: string[];
  notes: string;
  created_at: string;
};

const PRODUCT_SUGGESTIONS = [
  'Fond de teint', 'Correcteur', 'Poudre', 'Blush', 'Bronzer',
  'Highlighter', 'Mascara', 'Eyeliner', 'Ombre à paupières',
  'Rouge à lèvres', 'Gloss', 'Crayon à lèvres', 'Primer',
  'Setting spray', 'Contour', 'Sourcils',
];

export default function LooksScreen() {
  const [looks, setLooks] = useState<SavedLook[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchLooks = useCallback(async () => {
    try {
      const resp = await apiCall('/api/looks');
      if (resp.ok) {
        const data = await resp.json();
        setLooks(data);
      }
    } catch (e) {
      console.error('Looks fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLooks();
  }, [fetchLooks]);

  const toggleProduct = (product: string) => {
    setSelectedProducts(prev =>
      prev.includes(product) ? prev.filter(p => p !== product) : [...prev, product]
    );
  };

  const handleSave = async () => {
    if (!newName.trim()) {
      Alert.alert('Erreur', 'Veuillez donner un nom à votre look');
      return;
    }
    if (selectedProducts.length === 0) {
      Alert.alert('Erreur', 'Sélectionnez au moins un produit');
      return;
    }
    setSaving(true);
    try {
      const resp = await apiCall('/api/looks', {
        method: 'POST',
        body: JSON.stringify({
          name: newName.trim(),
          products: selectedProducts,
          notes: newNotes.trim(),
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setLooks(prev => [data, ...prev]);
        setModalVisible(false);
        setNewName('');
        setNewNotes('');
        setSelectedProducts([]);
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de sauvegarder le look');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (lookId: string) => {
    Alert.alert(
      'Supprimer',
      'Voulez-vous supprimer ce look ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const resp = await apiCall(`/api/looks/${lookId}`, { method: 'DELETE' });
              if (resp.ok) {
                setLooks(prev => prev.filter(l => l.id !== lookId));
              }
            } catch (e) {
              console.error('Delete error:', e);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF2D55" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        testID="looks-screen"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Mes Looks</Text>
            <Text style={styles.subtitle}>{looks.length} look{looks.length !== 1 ? 's' : ''} sauvegardé{looks.length !== 1 ? 's' : ''}</Text>
          </View>
          <TouchableOpacity
            testID="add-look-button"
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {looks.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="heart-outline" size={48} color="#FFD5DE" />
            </View>
            <Text style={styles.emptyTitle}>Aucun look sauvegardé</Text>
            <Text style={styles.emptyText}>
              Sauvegardez vos sélections de maquillage pour ne pas avoir à les choisir chaque jour
            </Text>
            <TouchableOpacity
              testID="empty-add-look-button"
              style={styles.emptyButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.emptyButtonText}>Créer mon premier look</Text>
            </TouchableOpacity>
          </View>
        ) : (
          looks.map((look) => (
            <View testID={`look-card-${look.id}`} key={look.id} style={styles.lookCard}>
              <View style={styles.lookHeader}>
                <View style={styles.lookIconBox}>
                  <Ionicons name="color-palette" size={20} color="#FF2D55" />
                </View>
                <View style={styles.lookInfo}>
                  <Text style={styles.lookName}>{look.name}</Text>
                  <Text style={styles.lookDate}>
                    {look.created_at ? new Date(look.created_at).toLocaleDateString('fr-FR') : ''}
                  </Text>
                </View>
                <TouchableOpacity
                  testID={`delete-look-${look.id}`}
                  onPress={() => handleDelete(look.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
              <View style={styles.productTags}>
                {look.products.map((product, idx) => (
                  <View key={idx} style={styles.productTag}>
                    <Text style={styles.productTagText}>{product}</Text>
                  </View>
                ))}
              </View>
              {look.notes ? <Text style={styles.lookNotes}>{look.notes}</Text> : null}
            </View>
          ))
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Add Look Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouveau Look</Text>
              <TouchableOpacity
                testID="close-add-look-modal"
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={28} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Nom du look</Text>
              <TextInput
                testID="look-name-input"
                style={styles.input}
                placeholder="Ex: Mon look quotidien"
                placeholderTextColor="#8E8E93"
                value={newName}
                onChangeText={setNewName}
              />

              <Text style={styles.inputLabel}>Produits</Text>
              <View style={styles.productsGrid}>
                {PRODUCT_SUGGESTIONS.map((product) => {
                  const isSelected = selectedProducts.includes(product);
                  return (
                    <TouchableOpacity
                      key={product}
                      testID={`product-${product}`}
                      style={[styles.productChip, isSelected && styles.productChipSelected]}
                      onPress={() => toggleProduct(product)}
                    >
                      <Text style={[styles.productChipText, isSelected && styles.productChipTextSelected]}>
                        {product}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Notes (optionnel)</Text>
              <TextInput
                testID="look-notes-input"
                style={[styles.input, styles.inputMultiline]}
                placeholder="Ajoutez des notes..."
                placeholderTextColor="#8E8E93"
                value={newNotes}
                onChangeText={setNewNotes}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                testID="save-look-button"
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Sauvegarder</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 12 : 48,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 4,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FF2D55',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF2D55',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyIconBox: {
    width: 100,
    height: 100,
    borderRadius: 32,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  emptyButton: {
    backgroundColor: '#FF2D55',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Look Card
  lookCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
  },
  lookHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  lookIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFD5DE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lookInfo: {
    flex: 1,
  },
  lookName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  lookDate: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  productTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  productTag: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  productTagText: {
    fontSize: 13,
    color: '#000000',
    fontWeight: '500',
  },
  lookNotes: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 12,
    fontStyle: 'italic',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E5EA',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000000',
    marginBottom: 20,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  productChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  productChipSelected: {
    backgroundColor: '#FFD5DE',
    borderColor: '#FF2D55',
  },
  productChipText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  productChipTextSelected: {
    color: '#FF2D55',
  },
  saveButton: {
    backgroundColor: '#FF2D55',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
