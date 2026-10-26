import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ProductRow } from '@/hooks/useProducts';
import { colors } from '@/constants/theme';
import { formatPesos } from '@/lib/format';

interface Props {
  product: ProductRow;
  onPress: () => void;
  onLongPress: () => void;
}

export function ProductItem({ product, onPress, onLongPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.item, pressed && { opacity: 0.7 }]}
      accessibilityHint="Toca para editar, mantén presionado para eliminar"
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.detail}>
          {product.quantity} und · {formatPesos(product.price)} c/u
        </Text>
      </View>
      <View style={[styles.badge, product.pending ? styles.pending : styles.synced]}>
        <Text style={[styles.badgeText, { color: product.pending ? colors.warning : colors.success }]}>
          {product.pending ? '⏳ Pendiente' : '☁️ En la nube'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  detail: { color: colors.muted },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pending: { backgroundColor: colors.warningBg },
  synced: { backgroundColor: colors.successBg },
  badgeText: { fontSize: 12, fontWeight: '600' },
});
