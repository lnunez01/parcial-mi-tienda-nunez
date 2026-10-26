import { useMemo } from 'react';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { isPending, productsRepository, type Product } from '@/db/repositories/products';

export interface ProductRow extends Product {
  pending: boolean;
}

interface Totals {
  products: number;
  units: number;
  value: number;
  pending: number;
}

/**
 * Lista reactiva de productos (se actualiza sola al cambiar SQLite) y totales.
 * Los totales son de todo el inventario; la búsqueda solo filtra la lista visible.
 */
export function useProducts(search = '') {
  const { data, error } = useLiveQuery(productsRepository.listQuery());

  const rows = useMemo<ProductRow[]>(
    () => data.map((p) => ({ ...p, pending: isPending(p) })),
    [data]
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? rows.filter((p) => p.name.toLowerCase().includes(term)) : rows;
  }, [rows, search]);

  const totals = useMemo<Totals>(
    () =>
      rows.reduce<Totals>(
        (acc, p) => ({
          products: acc.products + 1,
          units: acc.units + p.quantity,
          value: acc.value + p.quantity * p.price,
          pending: acc.pending + (p.pending ? 1 : 0),
        }),
        { products: 0, units: 0, value: 0, pending: 0 }
      ),
    [rows]
  );

  return { products: visible, totals, error: error ? error.message : null };
}

export const productActions = {
  getById: productsRepository.getById,
  create: productsRepository.create,
  update: productsRepository.update,
  remove: productsRepository.remove,
};
