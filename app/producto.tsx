import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { productActions } from '@/hooks/useProducts';
import { Button, Field, Message } from '@/components/ui';
import { colors } from '@/constants/theme';

interface Errors {
  name?: string;
  quantity?: string;
  price?: string;
}

const INTEGER_REGEX = /^\d+$/; // enteros >= 0, sin signos ni decimales

function validate(name: string, quantity: string, price: string): Errors {
  const errors: Errors = {};
  if (!name.trim()) errors.name = 'El nombre es obligatorio.';
  if (!INTEGER_REGEX.test(quantity.trim())) errors.quantity = 'La cantidad debe ser un número entero mayor o igual a 0.';
  if (!INTEGER_REGEX.test(price.trim())) errors.price = 'El precio debe ser un número entero mayor o igual a 0 (sin decimales).';
  return errors;
}

export default function ProductoScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ? Number(params.id) : null;
  const isEditing = id !== null;

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  // Si recibe id, carga el producto para editarlo
  useEffect(() => {
    if (id === null) return;
    let cancelled = false;
    productActions
      .getById(id)
      .then((p) => {
        if (cancelled) return;
        if (!p) {
          setSaveError('El producto no existe.');
          return;
        }
        setName(p.name);
        setQuantity(String(p.quantity));
        setPrice(String(p.price));
      })
      .catch((e: unknown) => !cancelled && setSaveError(e instanceof Error ? e.message : 'Error al cargar'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSave = async () => {
    const found = validate(name, quantity, price);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const input = { name: name.trim(), quantity: Number(quantity), price: Number(price) };
    setSaving(true);
    try {
      if (isEditing) await productActions.update(id, input);
      else await productActions.create(input);
      router.back();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'No se pudo guardar');
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: isEditing ? 'Editar producto' : 'Nuevo producto' }} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {loading ? (
          <Text style={styles.muted}>Cargando…</Text>
        ) : (
          <>
            <Field label="Nombre" value={name} onChangeText={setName} placeholder="Ej. Arroz Diana 500 g" error={errors.name} />
            <Field
              label="Cantidad (unidades)"
              value={quantity}
              onChangeText={setQuantity}
              placeholder="0"
              keyboardType="number-pad"
              error={errors.quantity}
            />
            <Field
              label="Precio (pesos)"
              value={price}
              onChangeText={setPrice}
              placeholder="0"
              keyboardType="number-pad"
              error={errors.price}
            />
            {saveError && <Message tone="error">{saveError}</Message>}
            <Button title={isEditing ? 'Guardar cambios' : 'Agregar producto'} onPress={handleSave} loading={saving} />
            <Button title="Cancelar" variant="secondary" onPress={() => router.back()} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 16, backgroundColor: colors.background, flexGrow: 1 },
  muted: { color: colors.muted },
});
