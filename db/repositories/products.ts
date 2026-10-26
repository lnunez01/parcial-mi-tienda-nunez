import * as Crypto from 'expo-crypto';
import { desc, eq, inArray, isNull, lt, or } from 'drizzle-orm';
import { db } from '@/db/client';
import { products, type Product } from '@/db/schema';

export type { Product };

export interface ProductInput {
  name: string;
  quantity: number;
  price: number;
}

/** Datos de un producto tal como llegan de Supabase. */
export interface RemoteProduct {
  clientId: string;
  name: string;
  quantity: number;
  price: number;
  updatedAt: Date;
}

/** Pendiente = nunca se subió, o se modificó después de la última subida. */
export function isPending(p: Pick<Product, 'syncedAt' | 'updatedAt'>): boolean {
  return p.syncedAt === null || p.syncedAt.getTime() < p.updatedAt.getTime();
}

const pendingCondition = or(isNull(products.syncedAt), lt(products.syncedAt, products.updatedAt));

export const productsRepository = {
  /** Consulta (sin ejecutar) para useLiveQuery: todos los productos, recientes primero. */
  listQuery() {
    return db.select().from(products).orderBy(desc(products.updatedAt));
  },

  async getById(id: number): Promise<Product | undefined> {
    const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return rows[0];
  },

  async create(input: ProductInput): Promise<void> {
    await db.insert(products).values({
      ...input,
      clientId: Crypto.randomUUID(),
      updatedAt: new Date(),
      syncedAt: null,
    });
  },

  async update(id: number, input: ProductInput): Promise<void> {
    // Cada edición escribe updatedAt: el producto vuelve a quedar pendiente
    await db.update(products).set({ ...input, updatedAt: new Date() }).where(eq(products.id, id));
  },

  async remove(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  },

  // ---- Usado por la sincronización ----

  async getPending(): Promise<Product[]> {
    return db.select().from(products).where(pendingCondition);
  },

  async getByClientIds(clientIds: string[]): Promise<Product[]> {
    if (clientIds.length === 0) return [];
    return db.select().from(products).where(inArray(products.clientId, clientIds));
  },

  /** Inserta un producto que vino de la nube, ya marcado como sincronizado. */
  async insertFromCloud(p: RemoteProduct): Promise<void> {
    await db.insert(products).values({ ...p, syncedAt: p.updatedAt });
  },

  /** "Gana el último cambio": reemplaza la versión local por la de la nube. */
  async replaceFromCloud(p: RemoteProduct): Promise<void> {
    await db
      .update(products)
      .set({ name: p.name, quantity: p.quantity, price: p.price, updatedAt: p.updatedAt, syncedAt: p.updatedAt })
      .where(eq(products.clientId, p.clientId));
  },

  /**
   * Marca como sincronizado con la versión que se subió. Si el producto se editó
   * mientras se subía, su updatedAt es mayor y sigue pendiente.
   */
  async markSynced(clientId: string, uploadedUpdatedAt: Date): Promise<void> {
    await db
      .update(products)
      .set({ syncedAt: uploadedUpdatedAt })
      .where(eq(products.clientId, clientId));
  },
};
