const Database = require('better-sqlite3');
const betterDb = new Database(':memory:');

// Mock the configs/sqlite module with a better-sqlite3 wrapper that mirrors the expo-sqlite API
const mockDb = {
  execAsync: async (sql: string) => {
    betterDb.exec(sql);
  },
  runAsync: async (sql: string, params: any[] = []) => {
    const stmt = betterDb.prepare(sql);
    const info = stmt.run(params);
    return {
      lastInsertRowId: info.changes > 0 ? Number(info.lastInsertRowid) : 0,
      changes: info.changes,
    };
  },
  getFirstAsync: async (sql: string, params: any[] = []) => {
    const stmt = betterDb.prepare(sql);
    return stmt.get(params) || null;
  },
  getAllAsync: async (sql: string, params: any[] = []) => {
    const stmt = betterDb.prepare(sql);
    return stmt.all(params);
  },
  withTransactionAsync: async (callback: () => Promise<any>) => {
    // better-sqlite3 transactions are synchronous, but we can wrap them in an async transaction
    let result;
    const transaction = betterDb.transaction(() => {
      // We run the callback. Since SQLite transactions roll back if an exception is thrown:
      // We must let exceptions propagate.
      // Because callback is async, we resolve it inside the transaction block.
      // Wait, in better-sqlite3, transaction function is synchronous.
      // An async function inside it will return a Promise immediately (without waiting for execution),
      // which means the transaction will commit before the async steps actually finish executing!
      // To run an async callback inside a synchronous better-sqlite3 transaction,
      // we can simulate the rollback manually or block.
      // Since it's a test environment, we can do manual SAVEPOINT / BEGIN TRANSACTION / ROLLBACK.
    });

    // Let's implement a robust async transaction simulation for better-sqlite3:
    betterDb.exec('SAVEPOINT test_savepoint');
    try {
      result = await callback();
      betterDb.exec('RELEASE SAVEPOINT test_savepoint');
      return result;
    } catch (err) {
      betterDb.exec('ROLLBACK TO SAVEPOINT test_savepoint');
      throw err;
    }
  },
};

jest.mock('../../configs/sqlite', () => ({
  db: mockDb,
}));

import { initProductsTable, insertProduct, getProduct } from '../../database/products';
import {
  initInventoryTable,
  insertInventoryTransaction,
  getInventoryTransactions,
} from '../../database/inventory';

describe('Inventory Database Transactions', () => {
  let productId: number;

  beforeAll(async () => {
    // Initialize schema
    await initProductsTable();
    await initInventoryTable();

    // Insert a test product
    productId = await insertProduct(
      'Test Pancit Canton',
      'TPC-001',
      1500, // ₱15.00
      10,   // Initial stock
      1000, // Cost ₱10.00
      'Snacks'
    );
  });

  afterEach(() => {
    // Reset any custom implementations on runAsync
    jest.restoreAllMocks();
  });

  test('restock updates product quantity and appends to ledger', async () => {
    const prevTxCount = (await getInventoryTransactions()).length;

    await insertInventoryTransaction({
      product_id: productId,
      type: 'restock',
      quantity: 5,
      note: 'Supplier delivery',
    });

    // Check quantity updated
    const product = await getProduct(productId);
    expect(product?.quantity).toBe(15);

    // Check ledger appended
    const txs = await getInventoryTransactions(productId);
    expect(txs.length).toBe(prevTxCount + 1);
    expect(txs[0].type).toBe('restock');
    expect(txs[0].quantity).toBe(5);
    expect(txs[0].note).toBe('Supplier delivery');
  });

  test('damaged reduces product quantity and appends to ledger', async () => {
    await insertInventoryTransaction({
      product_id: productId,
      type: 'damaged',
      quantity: 2,
      note: 'Expired pack',
    });

    const product = await getProduct(productId);
    expect(product?.quantity).toBe(13); // 15 - 2
  });

  test('transactional integrity: rolls back when product update fails', async () => {
    const txsBefore = await getInventoryTransactions(productId);
    const productBefore = await getProduct(productId);
    expect(productBefore?.quantity).toBe(13);

    // Monkey-patch runAsync to throw when updating the products table
    const originalRunAsync = mockDb.runAsync;
    mockDb.runAsync = jest.fn().mockImplementation(async (sql: string, params: any[] = []) => {
      if (sql.includes('UPDATE products')) {
        throw new Error('Simulated database failure during UPDATE products');
      }
      return await originalRunAsync(sql, params);
    });

    // Run insertInventoryTransaction, which should fail and throw
    await expect(
      insertInventoryTransaction({
        product_id: productId,
        type: 'restock',
        quantity: 10,
        note: 'Failed Restock',
      })
    ).rejects.toThrow('Simulated database failure during UPDATE products');

    // Restore original mock
    mockDb.runAsync = originalRunAsync;

    // Verify quantity was NOT updated (rolled back)
    const productAfter = await getProduct(productId);
    expect(productAfter?.quantity).toBe(13); // unchanged

    // Verify ledger row was NOT created (rolled back)
    const txsAfter = await getInventoryTransactions(productId);
    expect(txsAfter.length).toBe(txsBefore.length); // unchanged
  });
});
