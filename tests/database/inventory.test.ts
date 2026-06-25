// Shared better-sqlite3 mock is installed in `jest.setup.ts` via
// `jest.mock('@/configs/sqlite', ...)`. Every `database/*` test gets a
// real transactional SQLite under the hood.

import { initProductsTable, insertProduct, getProduct } from '../../database/products';
import {
	initInventoryTable,
	insertInventoryTransaction,
	getInventoryTransactions,
} from '../../database/inventory';
import { initSalesTables } from '../../database/sales';
import { initCreditsTable } from '../../database/credits';
import { runMigrations } from '../../database/migrations';
import { db } from '../../configs/sqlite';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';

describe('Inventory Database Transactions', () => {
	let productId: number;

	beforeAll(async () => {
		// Reset to a known-empty state before initializing. Tests share a
		// single in-memory mock DB via `jest.mock('@/configs/sqlite', ...)`,
		// so any state left by an earlier test file (or migration) must be
		// cleared before we start.
		resetMockDb();
		// Initialize all schemas (matches production startup order in
		// configs/startup.ts) so `runMigrations()` finds every table it
		// expects to migrate.
		await initProductsTable();
		await initInventoryTable();
		await initSalesTables();
		await initCreditsTable();
		await runMigrations();

		// Insert a test product
		productId = await insertProduct(
			'Test Pancit Canton',
			'TPC-001',
			1500, // ₱15.00
			10, // Initial stock
			1000, // Cost ₱10.00
			'Snacks',
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
		// The new restock is the most recent row. Don't rely on a specific
		// sort order — `timestamp` defaults to `CURRENT_TIMESTAMP`, which
		// can collide between transactions in the same second.
		const newRestock = txs.find((t) => t.note === 'Supplier delivery');
		expect(newRestock).toBeDefined();
		expect(newRestock?.type).toBe('restock');
		expect(newRestock?.quantity).toBe(5);
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
		const originalRunAsync = db.runAsync;
		(db as any).runAsync = jest
			.fn()
			.mockImplementation(async (sql: string, params: any[] = []) => {
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
			}),
		).rejects.toThrow('Simulated database failure during UPDATE products');

		// Restore original mock
		(db as any).runAsync = originalRunAsync;

		// Verify quantity was NOT updated (rolled back)
		const productAfter = await getProduct(productId);
		expect(productAfter?.quantity).toBe(13); // unchanged

		// Verify ledger row was NOT created (rolled back)
		const txsAfter = await getInventoryTransactions(productId);
		expect(txsAfter.length).toBe(txsBefore.length); // unchanged
	});
});
