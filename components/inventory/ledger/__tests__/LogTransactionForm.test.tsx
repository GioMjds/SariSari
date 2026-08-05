import React from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LogTransactionForm } from '@/components/inventory/ledger/LogTransactionForm';
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
};

describe('LogTransactionForm product picker', () => {
  beforeEach(async () => {
    await initProductsTable();
    await initInventoryTable();
    await db.execAsync('DELETE FROM products;');
    await db.runAsync(
      "INSERT INTO products (id, name, sku, price, quantity) VALUES (1, 'Coke', 'COKE1', 15, 10);",
    );
  });

  it('renders ProductPicker search input when product is null', async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { getByLabelText } = await render(
      <QueryClientProvider client={qc}>
        <LogTransactionForm product={null} visible onClose={() => {}} />
      </QueryClientProvider>,
    );
    expect(getByLabelText('Product picker search')).toBeTruthy();
  });

  it('does not render Type chooser when initialType is damaged', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { queryByLabelText } = await render(
      <QueryClientProvider client={qc}>
        <LogTransactionForm
          product={fixture}
          initialType="damaged"
          visible
          onClose={() => {}}
        />
      </QueryClientProvider>,
    );
    expect(queryByLabelText('Select type Restock')).toBeNull();
    expect(queryByLabelText('Select type Damaged')).toBeNull();
    expect(queryByLabelText('Select type Adjust')).toBeNull();
  });
});
