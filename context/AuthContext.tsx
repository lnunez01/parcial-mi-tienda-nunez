import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextValue {
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function translateError(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'Correo o contraseña incorrectos.';
  if (/already registered/i.test(message)) return 'Ese correo ya está registrado.';
  if (/network|fetch/i.test(message)) return 'Sin conexión. Revisa tu internet e inténtalo de nuevo.';
  if (/email not confirmed/i.test(message)) return 'Debes confirmar tu correo antes de ingresar.';
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Recupera la sesión guardada en SecureStore (sobrevive al cerrar la app)
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .finally(() => setIsLoading(false));

    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isLoading,
      // Devuelven el mensaje de error o null si todo salió bien
      async signIn(email, password) {
        try {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          return error ? translateError(error.message) : null;
        } catch (e) {
          return translateError(e instanceof Error ? e.message : 'Error desconocido');
        }
      },
      async signUp(email, password) {
        try {
          const { data, error } = await supabase.auth.signUp({ email, password });
          if (error) return translateError(error.message);
          if (!data.session) {
            return 'Cuenta creada, pero no se inició sesión: desactiva "Confirm email" en Supabase.';
          }
          return null;
        } catch (e) {
          return translateError(e instanceof Error ? e.message : 'Error desconocido');
        }
      },
      async signOut() {
        await supabase.auth.signOut();
      },
    }),
    [session, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
