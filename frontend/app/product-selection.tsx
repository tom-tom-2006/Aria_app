import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CATEGORIES, Selection } from '../constants/products';

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
    router.push({ pathname: '/product-order', params: { products: JSON.stringify(selections) } });
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
