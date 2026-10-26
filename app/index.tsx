import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui';
import { colors } from '@/constants/theme';

export default function InventarioScreen() {
  const { session, signOut } = useAuth();
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Sesión iniciada como {session?.user.email}</Text>
      <Button title="Cerrar sesión" variant="secondary" onPress={signOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 16, backgroundColor: colors.background },
  text: { color: colors.text },
});
