import { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { productActions, useProducts, type ProductRow } from '@/hooks/useProducts';
import { ProductItem } from '@/components/ProductItem';
import { Button, Message } from '@/components/ui';
import { colors } from '@/constants/theme';
import { formatPesos } from '@/lib/format';

export default function InventarioScreen() {
  const { session, signOut } = useAuth();
  const [search, setSearch] = useState('');
  const { products, totals, error } = useProducts(search);

  const confirmDelete = (product: ProductRow) => {
    Alert.alert('Eliminar producto', `¿Seguro que quieres eliminar "${product.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          productActions.remove(product.id).catch((e: unknown) =>
            Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo eliminar')
          );
        },
      },
    ]);
  };

  const header = (
    <View style={styles.header}>
      <Text style={styles.user}>👤 {session?.user.email}</Text>

      <View style={styles.stats}>
        <Stat label="Unidades" value={String(totals.units)} />
        <Stat label="Valor inventario" value={formatPesos(totals.value)} />
        <Stat label="Pendientes" value={String(totals.pending)} highlight={totals.pending > 0} />
      </View>

      <Button title="+ Agregar producto" onPress={() => router.push('/producto')} />

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="🔍 Buscar por nombre"
        placeholderTextColor={colors.muted}
        style={styles.search}
      />
      {error && <Message tone="error">{error}</Message>}
      <Text style={styles.hint}>Toca un producto para editarlo · mantenlo presionado para eliminarlo</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(p) => p.clientId}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          <Text style={styles.empty}>{search ? 'Ningún producto coincide.' : 'Aún no hay productos. ¡Agrega el primero!'}</Text>
        }
        renderItem={({ item }) => (
          <ProductItem
            product={item}
            onPress={() => router.push({ pathname: '/producto', params: { id: String(item.id) } })}
            onLongPress={() => confirmDelete(item)}
          />
        )}
        ListFooterComponent={
          <View style={{ marginTop: 24 }}>
            <Button title="Cerrar sesión" variant="secondary" onPress={signOut} />
          </View>
        }
      />
    </View>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={[styles.stat, highlight && { backgroundColor: colors.warningBg }]}>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16, paddingBottom: 40 },
  header: { gap: 12, marginBottom: 12 },
  user: { color: colors.muted },
  stats: { flexDirection: 'row', gap: 8 },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    alignItems: 'center',
  },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 12, color: colors.muted },
  search: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
  },
  hint: { fontSize: 12, color: colors.muted },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 24 },
});
