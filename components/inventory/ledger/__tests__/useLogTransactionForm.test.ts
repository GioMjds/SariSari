import React from 'react';
import { renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLogTransactionForm } from '@/components/inventory/ledger/useLogTransactionForm';
import { initProductsTable } from '@/database/products';
import { initInventoryTable } from '@/database/inventory';
import { db } from '@/configs/sqlite';
import type { Product } from '@/types/products.types';

const fixture: Product = {
  id: 1,
  name: 'Coke',
  sku: 'COKE1',
  barcode: null,
  price: 15,
  quantity: 10,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_favorite: false,
};

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
};

describe('useLogTransactionForm initialType', () => {
  beforeEach(async () => {
    await initProductsTable();
    await initInventoryTable();
    await db.execAsync('DELETE FROM inventory_transactions;');
    await db.execAsync('DELETE FROM products;');
    await db.runAsync(
      "INSERT INTO products (id, name, sku, price, quantity) VALUES (1, 'Coke', 'COKE1', 15, 10);",
    );
  });

  it('seeds type from initialType on mount', async () => {
    const { result } = await renderHook(
      ({ initialType }: { initialType: 'damaged' | 'restock' | 'adjustment' }) =>
        useLogTransactionForm(fixture, { initialType }),
      {
        wrapper: createWrapper(),
        initialProps: { initialType: 'damaged' as const },
      },
    );
    expect(result.current.type).toBe('damaged');
  });

  it('re-seeds type from initialType when product.id changes', async () => {
    const { result, rerender } = await renderHook(
      ({ initialType }: { initialType: 'restock' | 'adjustment' }) =>
        useLogTransactionForm(fixture, { initialType }),
      {
        wrapper: createWrapper(),
        initialProps: { initialType: 'restock' as const },
      },
    );
    rerender({ initialType: 'adjustment' });
    expect(result.current.type).toBe('restock');
  });

  it('defaults to restock when no initialType is passed', async () => {
    const { result } = await renderHook(() => useLogTransactionForm(fixture), {
      wrapper: createWrapper(),
    });
    expect(result.current.type).toBe('restock');
  });
});
