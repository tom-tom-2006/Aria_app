import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Sel = { category: string; product: string; shade: string; shadeColor: string };

export default function ProductOrderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ products?: string }>();
  const initial: Sel[] = params.products ? JSON.parse(params.products) : [];
  const [items, setItems] = useState<Sel[]>(initial);

  const moveUp = (i: number) => {
    if (i === 0) return;
    const arr = [...items];
    [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
    setItems(arr);
  };
  const moveDown = (i: number) => {
    if (i === items.length - 1) return;
    const arr = [...items];
    [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
    setItems(arr);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity testID="order-back" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Ordre d'application</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Réorganisez vos produits dans l'ordre souhaité</Text>

        {items.map((item, i) => (
          <View key={`${item.product}-${item.shade}-${i}`} style={styles.card}>
            <View style={styles.orderNum}>
              <Text style={styles.orderNumText}>{i + 1}</Text>
            </View>
            <View style={[styles.colorDot, { backgroundColor: item.shadeColor }]} />
            <View style={styles.cardInfo}>
              <Text style={styles.cardProduct}>{item.product}</Text>
              <Text style={styles.cardShade}>{item.shade} — {item.category}</Text>
            </View>
            <View style={styles.arrows}>
              <TouchableOpacity testID={`move-up-${i}`} onPress={() => moveUp(i)} style={[styles.arrowBtn, i === 0 && styles.arrowDisabled]}>
                <Ionicons name="chevron-up" size={20} color={i === 0 ? '#E5E5EA' : '#000'} />
              </TouchableOpacity>
              <TouchableOpacity testID={`move-down-${i}`} onPress={() => moveDown(i)} style={[styles.arrowBtn, i === items.length - 1 && styles.arrowDisabled]}>
                <Ionicons name="chevron-down" size={20} color={i === items.length - 1 ? '#E5E5EA' : '#000'} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity testID="confirm-order-button" style={styles.confirmBtn}
          onPress={() => router.push({ pathname: '/studio', params: { products: JSON.stringify(items) } })}>
          <Ionicons name="videocam" size={20} color="#FFF" />
          <Text style={styles.confirmText}>Lancer le Studio</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: '#E5E5EA' },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  topTitle: { fontSize: 17, fontWeight: '600', color: '#000' },
  scroll: { paddingHorizontal: 24, paddingTop: 20 },
  subtitle: { fontSize: 15, color: '#8E8E93', marginBottom: 20 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F7', borderRadius: 16, padding: 16, marginBottom: 10 },
  orderNum: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FF2D55', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  orderNumText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  colorDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', marginRight: 12 },
  cardInfo: { flex: 1 },
  cardProduct: { fontSize: 16, fontWeight: '600', color: '#000' },
  cardShade: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  arrows: { gap: 2 },
  arrowBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  arrowDisabled: { opacity: 0.4 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', borderTopWidth: 0.5, borderTopColor: '#E5E5EA', paddingHorizontal: 24, paddingTop: 14 },
  confirmBtn: { backgroundColor: '#FF2D55', borderRadius: 16, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  confirmText: { fontSize: 17, fontWeight: '700', color: '#FFF' },
});
