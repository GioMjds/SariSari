import { QueryClient } from '@tanstack/react-query';
import {
  insertProduct,
  updateProduct,
  deleteProduct,
  getProduct,
} from '@/database/products';
import {
  initProductsTable,
  initInventoryTable,
  initSalesTables,
  initSuppliersTable,
  initCreditsTable,
  runMigrations,
} from '@/database';
import { db } from '@/configs/sqlite';
import {
  invalidateProductDependencies,
  productKeys,
} from '@/hooks/useProducts';
import { resetMockDb } from './__setup__/expo-sqlite-mock';

describe('Products CRUD & Invalidation', () => {
  beforeAll(async () => {
    await initProductsTable();
    await initSuppliersTable();
    await initInventoryTable();
    await initSalesTables();
    await initCreditsTable();
    await runMigrations();
  });

  beforeEach(() => {
    resetMockDb();
  });

  it('inserts product without supplier and with initial stock without foreign key error', async () => {
    const id = await insertProduct(
      'Test Coke',
      'COKE-001',
      2000,
      10,
      1500,
      'Beverages',
      '480000000001',
      '', // empty supplier string
    );

    expect(id).toBeGreaterThan(0);
    const product = await getProduct(id);
    expect(product).not.toBeNull();
    expect(product?.name).toBe('Test Coke');
    expect(product?.supplier_id).toBeNull();
    expect(product?.quantity).toBe(10);

    const txs = await db.getAllAsync<{ type: string; quantity: number }>(
      'SELECT type, quantity FROM inventory_transactions WHERE product_id = ?',
      [id],
    );
    expect(txs.length).toBe(1);
    expect(txs[0]?.type).toBe('restock');
    expect(txs[0]?.quantity).toBe(10);
  });

  it('updates product and handles quantity reduction as adjustment', async () => {
    const id = await insertProduct(
      'Test Bread',
      'BREAD-001',
      1000,
      20,
      800,
    );

    // Reduce stock from 20 to 12
    await updateProduct(
      id,
      'Test Bread',
      'BREAD-001',
      1200,
      12,
      800,
      'Bakery',
      null,
      '', // empty string supplier
    );

    const updated = await getProduct(id);
    expect(updated?.quantity).toBe(12);
    expect(updated?.price).toBe(1200);

    const txs = await db.getAllAsync<{ type: string; quantity: number; adjustment_sign: string | null }>(
      'SELECT type, quantity, adjustment_sign FROM inventory_transactions WHERE product_id = ? ORDER BY id ASC',
      [id],
    );
    expect(txs.length).toBe(2);
    expect(txs[0]?.type).toBe('restock');
    expect(txs[1]?.type).toBe('adjustment');
    expect(txs[1]?.adjustment_sign).toBe('negative');
    expect(txs[1]?.quantity).toBe(8);
  });

  it('deletes product with inventory transactions and unlinks credit transactions', async () => {
    const id = await insertProduct(
      'Deletable Item',
      'DEL-001',
      500,
      5,
    );

    const custResult = await db.runAsync(
      'INSERT INTO customers (name) VALUES (?)',
      ['Test Customer'],
    );
    const customerId = custResult.lastInsertRowId;

    // Mock credit transaction referencing product
    await db.runAsync(
      'INSERT INTO credit_transactions (customer_id, product_id, product_name, quantity, amount, status) VALUES (?, ?, ?, ?, ?, ?)',
      [customerId, id, 'Deletable Item', 1, 500, 'unpaid'],
    );

    await deleteProduct(id);

    const product = await getProduct(id);
    expect(product).toBeNull();

    // Verify inventory transactions cleaned up
    const txs = await db.getAllAsync(
      'SELECT * FROM inventory_transactions WHERE product_id = ?',
      [id],
    );
    expect(txs.length).toBe(0);

    // Verify credit transaction kept with product_id set to null
    const creditTx = await db.getFirstAsync<{ product_id: number | null; product_name: string }>(
      'SELECT product_id, product_name FROM credit_transactions WHERE product_name = ?',
      ['Deletable Item'],
    );
    expect(creditTx?.product_id).toBeNull();
    expect(creditTx?.product_name).toBe('Deletable Item');
  });

  it('prevents product deletion if product has recorded sales items', async () => {
    const id = await insertProduct(
      'Sold Product',
      'SOLD-001',
      1000,
      10,
    );

    // Insert sale and sale_item
    const saleResult = await db.runAsync(
      'INSERT INTO sales (total, payment_type) VALUES (?, ?)',
      [1000, 'cash'],
    );
    await db.runAsync(
      'INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
      [saleResult.lastInsertRowId, id, 1, 1000],
    );

    await expect(deleteProduct(id)).rejects.toThrow(
      'Cannot delete product with recorded sales history.',
    );

    const product = await getProduct(id);
    expect(product).not.toBeNull();
  });

  it('invalidates all product dependencies with refetchType: all', () => {
    const queryClient = new QueryClient();
    const spy = jest.spyOn(queryClient, 'invalidateQueries');

    invalidateProductDependencies(queryClient, 99);

    expect(spy).toHaveBeenCalledWith({
      queryKey: productKeys.all,
      refetchType: 'all',
    });
    expect(spy).toHaveBeenCalledWith({
      queryKey: productKeys.detail(99),
      refetchType: 'all',
    });
  });
});
