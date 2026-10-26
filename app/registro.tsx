import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Button, Field, Message } from '@/components/ui';
import { colors } from '@/constants/theme';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Errors {
  email?: string;
  password?: string;
  confirm?: string;
}

function validate(email: string, password: string, confirm: string): Errors {
  const errors: Errors = {};
  if (!EMAIL_REGEX.test(email.trim())) errors.email = 'Escribe un correo válido.';
  if (password.length < 6) errors.password = 'La contraseña debe tener al menos 6 caracteres.';
  if (confirm !== password) errors.confirm = 'Las contraseñas no coinciden.';
  return errors;
}

export default function RegistroScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const found = validate(email, password, confirm);
    setErrors(found);
    setServerError(null);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    setServerError(await signUp(email.trim(), password));
    setLoading(false);
    // Si se crea la cuenta con sesión, Stack.Protected lleva a la pantalla principal
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Field
          label="Correo"
          value={email}
          onChangeText={setEmail}
          placeholder="tucorreo@ejemplo.com"
          autoCapitalize="none"
          keyboardType="email-address"
          error={errors.email}
        />
        <Field
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          placeholder="Mínimo 6 caracteres"
          secureTextEntry
          error={errors.password}
        />
        <Field
          label="Confirmar contraseña"
          value={confirm}
          onChangeText={setConfirm}
          placeholder="Repite la contraseña"
          secureTextEntry
          error={errors.confirm}
        />

        {serverError && <Message tone="error">{serverError}</Message>}

        <Button title="Crear cuenta" onPress={handleRegister} loading={loading} />

        <Link href="/login" style={styles.link}>
          ¿Ya tienes cuenta? Volver al inicio de sesión
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 16, backgroundColor: colors.background, flexGrow: 1 },
  link: { color: colors.primary, fontWeight: '600', textAlign: 'center', paddingVertical: 8 },
});
