import { supabase } from '@/lib/supabase';
import { productsRepository, type RemoteProduct } from '@/db/repositories/products';

export interface SyncResult {
  uploaded: number;
  downloaded: number;
  updated: number;
}

/** Fila de la tabla public.products de Supabase. */
interface CloudRow {
  client_id: string;
  name: string;
  quantity: number;
  price: number;
  updated_at: string;
}

function toRemote(row: CloudRow): RemoteProduct {
  return {
    clientId: row.client_id,
    name: row.name,
    quantity: row.quantity,
    price: row.price,
    updatedAt: new Date(row.updated_at),
  };
}

function friendlyError(message: string): Error {
  if (/network|fetch|failed to fetch|timed out/i.test(message)) {
    return new Error('Sin conexión a internet. Tus cambios siguen guardados en el teléfono.');
  }
  return new Error(message);
}

/**
 * Sincroniza SQLite (fuente de verdad) con Supabase (respaldo), en dos pasos:
 * 1. Bajar: trae los productos del usuario e inserta los que no existen en el teléfono.
 *    Si ya existe y la versión de la nube es más reciente, gana el último cambio.
 * 2. Subir: envía los pendientes con upsert por client_id (no duplica filas)
 *    y los marca con syncedAt = updatedAt que se subió.
 */
export async function syncProducts(userId: string): Promise<SyncResult> {
  const result: SyncResult = { uploaded: 0, downloaded: 0, updated: 0 };

  // ---- 1. Bajar ----
  const { data, error } = await supabase
    .from('products')
    .select('client_id, name, quantity, price, updated_at')
    .eq('user_id', userId);
  if (error) throw friendlyError(error.message);

  const remote = (data as CloudRow[]).map(toRemote);
  const local = await productsRepository.getByClientIds(remote.map((r) => r.clientId));
  const localByClientId = new Map(local.map((p) => [p.clientId, p]));

  for (const r of remote) {
    const existing = localByClientId.get(r.clientId);
    if (!existing) {
      await productsRepository.insertFromCloud(r);
      result.downloaded++;
    } else if (r.updatedAt.getTime() > existing.updatedAt.getTime()) {
      // Regla de conflicto: gana el último cambio
      await productsRepository.replaceFromCloud(r);
      result.updated++;
    }
  }

  // ---- 2. Subir ----
  const pending = await productsRepository.getPending();
  if (pending.length > 0) {
    const { error: upsertError } = await supabase.from('products').upsert(
      pending.map((p) => ({
        client_id: p.clientId,
        name: p.name,
        quantity: p.quantity,
        price: p.price,
        updated_at: p.updatedAt.toISOString(),
      })),
      { onConflict: 'client_id' }
    );
    if (upsertError) throw friendlyError(upsertError.message);

    for (const p of pending) {
      await productsRepository.markSynced(p.clientId, p.updatedAt);
    }
    result.uploaded = pending.length;
  }

  return result;
}

export function describeSync({ uploaded, downloaded, updated }: SyncResult): string {
  if (uploaded === 0 && downloaded === 0 && updated === 0) return 'Todo está al día ✅';
  const parts = [`${uploaded} subido${uploaded === 1 ? '' : 's'}`, `${downloaded} bajado${downloaded === 1 ? '' : 's'}`];
  if (updated > 0) parts.push(`${updated} actualizado${updated === 1 ? '' : 's'} desde la nube`);
  return parts.join(', ');
}
