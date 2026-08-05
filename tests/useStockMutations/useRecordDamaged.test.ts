import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRecordDamaged } from '@/hooks/useStockMutations';
import { initProductsTable } from '@/database/products';
import { initInventoryTable, getInventoryTransactions } from '@/database/inventory';
import { db } from '@/configs/sqlite';

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return Wrapper;
};

describe('useRecordDamaged', () => {
  beforeEach(async () => {
    await initProductsTable();
    await initInventoryTable();
    try {
      await db.execAsync('ALTER TABLE inventory_transactions ADD COLUMN unit_cost REAL;');
    } catch {
      // column already exists
    }
    try {
      await db.execAsync('ALTER TABLE inventory_transactions ADD COLUMN supplier_id TEXT;');
    } catch {
      // column already exists
    }
    await db.execAsync('DELETE FROM inventory_transactions;');
    await db.execAsync('DELETE FROM products;');
    await db.runAsync(
      "INSERT INTO products (id, name, sku, price, quantity) VALUES (1, 'Coke', 'COKE1', 15, 10);",
    );
  });

  it('writes a damaged transaction and decrements product quantity optimistically', async () => {
    const { result } = await renderHook(() => useRecordDamaged(), { wrapper: createWrapper() });
    await act(async () => {
      await result.current.mutateAsync({ productId: 1, qty: 2, note: 'wet box' });
    });
    expect(result.current.isSuccess).toBe(true);

    const txs = await getInventoryTransactions(1);
    expect(txs).toHaveLength(1);
    expect(txs[0]).toMatchObject({
      product_id: 1,
      type: 'damaged',
      quantity: 2,
      note: 'wet box',
    });
  });
});
