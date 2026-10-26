// OJO: este archivo lo lee drizzle-kit con Node. No importar paquetes de Expo aquí.
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientId: text('client_id').notNull().unique(), // UUID: mismo producto en teléfono y nube
  name: text('name').notNull(),
  quantity: integer('quantity').notNull(),
  price: integer('price').notNull(), // pesos, sin decimales
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  syncedAt: integer('synced_at', { mode: 'timestamp_ms' }), // versión que quedó en la nube
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
