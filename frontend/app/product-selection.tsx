import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type Shade = { name: string; color: string };
type Product = { name: string; shades: Shade[] };
type Category = { id: string; name: string; icon: keyof typeof Ionicons.glyphMap; products: Product[] };

const CATEGORIES: Category[] = [
  {
    id: 'lips', name: 'Lèvres', icon: 'heart',
    products: [
      { name: 'Rouge à lèvres', shades: [
        { name: 'Rouge classique', color: '#CC0033' }, { name: 'Rose nude', color: '#D4A0A0' },
        { name: 'Berry', color: '#8B2252' }, { name: 'Coral', color: '#FF6F61' },
        { name: 'Mauve', color: '#9B6B8E' }, { name: 'Bordeaux', color: '#722F37' },
      ]},
      { name: 'Gloss', shades: [
        { name: 'Transparent', color: '#FFE4E1' }, { name: 'Rose', color: '#FFB6C1' },
        { name: 'Pêche', color: '#FFDAB9' }, { name: 'Rouge', color: '#FF4040' },
      ]},
    ]
  },
  {
    id: 'eyes', name: 'Yeux', icon: 'eye',
    products: [
      { name: 'Ombre à paupières', shades: [
        { name: 'Smoky noir', color: '#2C2C2C' }, { name: 'Bronze doré', color: '#CD853F' },
        { name: 'Terre naturelle', color: '#8B7355' }, { name: 'Bleu nuit', color: '#191970' },
        { name: 'Violet', color: '#6A0DAD' }, { name: 'Rose gold', color: '#B76E79' },
      ]},
      { name: 'Mascara', shades: [
        { name: 'Noir intense', color: '#000000' }, { name: 'Brun', color: '#5C4033' },
      ]},
      { name: 'Eyeliner', shades: [
        { name: 'Noir', color: '#000000' }, { name: 'Brun foncé', color: '#3E2723' },
        { name: 'Bleu marine', color: '#001F3F' },
      ]},
    ]
  },
  {
    id: 'face', name: 'Teint', icon: 'sunny',
    products: [
      { name: 'Fond de teint', shades: [
        { name: 'Porcelaine', color: '#FFE4C4' }, { name: 'Beige clair', color: '#F5DEB3' },
        { name: 'Beige doré', color: '#DEB887' }, { name: 'Caramel', color: '#C4956A' },
        { name: 'Noisette', color: '#A0785A' }, { name: 'Ébène', color: '#6B4423' },
      ]},
      { name: 'Correcteur', shades: [
        { name: 'Clair', color: '#FFEFD5' }, { name: 'Moyen', color: '#E8C39E' },
        { name: 'Foncé', color: '#B8860B' },
      ]},
    ]
  },
  {
    id: 'cheeks', name: 'Joues', icon: 'flower',
    products: [
      { name: 'Blush', shades: [
        { name: 'Rose tendre', color: '#FFB7C5' }, { name: 'Pêche', color: '#FFCBA4' },
        { name: 'Corail', color: '#FF7F50' }, { name: 'Berry', color: '#C71585' },
      ]},
      { name: 'Highlighter', shades: [
        { name: 'Champagne', color: '#F7E7CE' }, { name: 'Or rose', color: '#E8B4B8' },
        { name: 'Doré', color: '#FFD700' },
      ]},
      { name: 'Bronzer', shades: [
        { name: 'Soleil léger', color: '#D2AA6A' }, { name: 'Soleil intense', color: '#A67B5B' },
      ]},
    ]
  },
];

type Selection = { category: string; product: string; shade: string; shadeColor: string };

export default function ProductSelectionScreen() {
  const router = useRouter();
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [selections, setSelections] = useState<Selection[]>([]);

  const toggleCategory = (id: string) => setExpandedCat(expandedCat === id ? null : id);

  const selectShade = (catName: string, prodName: string, shade: Shade) => {
    setSelections(prev => {
      const filtered = prev.filter(s => !(s.category === catName && s.product === prodName));
      return [...filtered, { category: catName, product: prodName, shade: shade.name, shadeColor: shade.color }];
    });
  };

  const isSelected = (catName: string, prodName: string, shadeName: string) =>
    selections.some(s => s.category === catName && s.product === prodName && s.shade === shadeName);

  const launchStudio = () => {
    router.push({ pathname: '/studio', params: { products: JSON.stringify(selections) } });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <TouchableOpacity testID="back-button" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Sélection Maquillage</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView testID="product-selection-screen" contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Choisissez vos produits et teintes</Text>

        {CATEGORIES.map(cat => (
          <View key={cat.id} style={styles.catCard}>
            <TouchableOpacity testID={`category-${cat.id}`} style={styles.catHeader} onPress={() => toggleCategory(cat.id)} activeOpacity={0.7}>
              <View style={styles.catLeft}>
                <View style={styles.catIconBox}>
                  <Ionicons name={cat.icon} size={20} color="#FF2D55" />
                </View>
                <Text style={styles.catName}>{cat.name}</Text>
              </View>
              <Ionicons name={expandedCat === cat.id ? 'chevron-up' : 'chevron-down'} size={20} color="#8E8E93" />
            </TouchableOpacity>

            {expandedCat === cat.id && (
              <View style={styles.catContent}>
                {cat.products.map(prod => (
                  <View key={prod.name} style={styles.prodSection}>
                    <Text style={styles.prodName}>{prod.name}</Text>
                    <View style={styles.shadesRow}>
                      {prod.shades.map(shade => {
                        const sel = isSelected(cat.name, prod.name, shade.name);
                        return (
                          <TouchableOpacity key={shade.name} testID={`shade-${cat.id}-${shade.name}`}
                            style={[styles.shadeItem, sel && styles.shadeItemSelected]}
                            onPress={() => selectShade(cat.name, prod.name, shade)}>
                            <View style={[styles.shadeCircle, { backgroundColor: shade.color }, sel && styles.shadeCircleSelected]} />
                            <Text style={[styles.shadeName, sel && styles.shadeNameSelected]}>{shade.name}</Text>
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

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Bottom Bar - Selected + Launch */}
      <View style={styles.bottomBar}>
        <View style={styles.selectedInfo}>
          <Text style={styles.selectedCount}>{selections.length} produit{selections.length !== 1 ? 's' : ''}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectedDots}>
            {selections.map((s, i) => <View key={i} style={[styles.selectedDot, { backgroundColor: s.shadeColor }]} />)}
          </ScrollView>
        </View>
        <TouchableOpacity testID="launch-studio-button" style={[styles.launchBtn, selections.length === 0 && styles.launchBtnDisabled]}
          onPress={launchStudio} disabled={selections.length === 0}>
          <Ionicons name="videocam" size={20} color="#FFF" />
          <Text style={styles.launchBtnText}>Lancer le Studio</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 8 : 40, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: '#E5E5EA' },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  topTitle: { fontSize: 17, fontWeight: '600', color: '#000' },
  scroll: { paddingHorizontal: 24, paddingTop: 20 },
  subtitle: { fontSize: 15, color: '#8E8E93', marginBottom: 20 },
  catCard: { backgroundColor: '#F2F2F7', borderRadius: 20, marginBottom: 12, overflow: 'hidden' },
  catHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 },
  catLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  catIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFD5DE', justifyContent: 'center', alignItems: 'center' },
  catName: { fontSize: 17, fontWeight: '600', color: '#000' },
  catContent: { paddingHorizontal: 18, paddingBottom: 18 },
  prodSection: { marginBottom: 16 },
  prodName: { fontSize: 14, fontWeight: '600', color: '#8E8E93', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  shadesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  shadeItem: { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 2, borderColor: 'transparent', minWidth: 80 },
  shadeItemSelected: { borderColor: '#FF2D55', backgroundColor: '#FFF5F7' },
  shadeCircle: { width: 28, height: 28, borderRadius: 14, marginBottom: 6, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  shadeCircleSelected: { borderWidth: 2, borderColor: '#FF2D55' },
  shadeName: { fontSize: 11, color: '#000', textAlign: 'center', fontWeight: '500' },
  shadeNameSelected: { color: '#FF2D55', fontWeight: '600' },
  // Bottom Bar
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', borderTopWidth: 0.5, borderTopColor: '#E5E5EA', paddingHorizontal: 24, paddingTop: 14, paddingBottom: Platform.OS === 'ios' ? 36 : 20 },
  selectedInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  selectedCount: { fontSize: 14, fontWeight: '600', color: '#000' },
  selectedDots: { gap: 4 },
  selectedDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  launchBtn: { backgroundColor: '#FF2D55', borderRadius: 16, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  launchBtnDisabled: { backgroundColor: '#E5E5EA' },
  launchBtnText: { fontSize: 17, fontWeight: '700', color: '#FFF' },
});
