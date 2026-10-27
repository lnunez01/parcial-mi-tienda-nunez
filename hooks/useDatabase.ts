import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { db } from '@/db/client';
import migrations from '@/drizzle/migrations';

/** Aplica las migraciones de drizzle/ a SQLite antes de mostrar la app. */
export function useDatabase() {
  const { success, error } = useMigrations(db, migrations);
  return { isReady: success, error: error ? error.message : null };
}
