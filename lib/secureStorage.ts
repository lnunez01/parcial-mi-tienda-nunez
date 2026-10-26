import * as SecureStore from 'expo-secure-store';

/**
 * Adaptador de almacenamiento para Supabase Auth sobre SecureStore.
 * SecureStore limita cada valor a ~2048 bytes y la sesión de Supabase
 * (tokens JWT) suele ser más grande, así que se guarda por fragmentos:
 *   <key>.count = número de fragmentos
 *   <key>.0, <key>.1, ... = cada fragmento
 */
const CHUNK_SIZE = 1800;

// SecureStore solo acepta letras, números, ".", "-" y "_" en las llaves
function safeKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function removeChunks(base: string): Promise<void> {
  const countRaw = await SecureStore.getItemAsync(`${base}.count`);
  const count = countRaw ? Number(countRaw) : 0;
  for (let i = 0; i < count; i++) {
    await SecureStore.deleteItemAsync(`${base}.${i}`);
  }
  await SecureStore.deleteItemAsync(`${base}.count`);
}

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    const base = safeKey(key);
    const countRaw = await SecureStore.getItemAsync(`${base}.count`);
    if (!countRaw) return null;
    const parts: string[] = [];
    for (let i = 0; i < Number(countRaw); i++) {
      const part = await SecureStore.getItemAsync(`${base}.${i}`);
      if (part === null) return null; // datos incompletos
      parts.push(part);
    }
    return parts.join('');
  },

  async setItem(key: string, value: string): Promise<void> {
    const base = safeKey(key);
    await removeChunks(base);
    const count = Math.ceil(value.length / CHUNK_SIZE);
    for (let i = 0; i < count; i++) {
      await SecureStore.setItemAsync(`${base}.${i}`, value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
    }
    await SecureStore.setItemAsync(`${base}.count`, String(count));
  },

  async removeItem(key: string): Promise<void> {
    await removeChunks(safeKey(key));
  },
};
