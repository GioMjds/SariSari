// Phase 3 audit-safety test: `insertProduct` writes both the products column
// and the inventory_transactions row in the same transaction, so the source
// of truth (`products.quantity`) and the audit log (inventory ledger) never
// disagree.
import {
	initProductsTable,
	insertProduct,
	getProduct,
	updateProduct,
} from '../../database/products';
import { initInventoryTable, getInventoryTransactions } from '../../database/inventory';
import { initSalesTables } from '../../database/sales';
import { initCreditsTable } from '../../database/credits';
import { runMigrations } from '../../database/migrations';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';

describe('Products Database', () => {
	beforeAll(async () => {
		resetMockDb();
		await initProductsTable();
		await initInventoryTable();
		await initSalesTables();
		await initCreditsTable();
		await runMigrations();
	});

	test('insertProduct with initial stock writes both rows', async () => {
		const productId = await insertProduct(
			'Sari-sari Snack',
			'SSN-001',
			1500, // ₱15.00
			10, // initial stock
			1000, // cost
			'Snacks',
		);

		// Column is set
		const product = await getProduct(productId);
		expect(product).not.toBeNull();
		expect(product?.quantity).toBe(10);
		expect(product?.name).toBe('Sari-sari Snack');

		// Ledger has the matching restock row
		const txs = await getInventoryTransactions(productId);
		expect(txs.length).toBe(1);
		expect(txs[0].type).toBe('restock');
		expect(txs[0].quantity).toBe(10);
	});

	test('insertProduct with zero initial stock does NOT write a ledger row', async () => {
		const productId = await insertProduct(
			'No Stock Item',
			'NSI-001',
			500,
			0,
		);
		const product = await getProduct(productId);
		expect(product?.quantity).toBe(0);
		const txs = await getInventoryTransactions(productId);
		expect(txs.length).toBe(0);
	});

	test('updateProduct that changes quantity appends a restock row', async () => {
		const productId = await insertProduct('Restock Me', 'RSM-001', 2000, 0);
		const txsBefore = (await getInventoryTransactions(productId)).length;

		await updateProduct(productId, 'Restock Me', 'RSM-001', 2000, 7, undefined, undefined);

		const product = await getProduct(productId);
		expect(product?.quantity).toBe(7);
		const txsAfter = await getInventoryTransactions(productId);
		expect(txsAfter.length).toBe(txsBefore + 1);
		// Default timestamp is `CURRENT_TIMESTAMP`; two transactions in the
		// same second produce identical timestamps, so query by content.
		const newRestock = txsAfter.find((t) => t.quantity === 7);
		expect(newRestock?.type).toBe('restock');
	});

	test('updateProduct that does NOT change quantity does NOT touch the ledger', async () => {
		const productId = await insertProduct('No Change', 'NCH-001', 800, 5);
		const txsBefore = (await getInventoryTransactions(productId)).length;

		await updateProduct(productId, 'No Change Renamed', 'NCH-001', 800, 5);

		const txsAfter = await getInventoryTransactions(productId);
		expect(txsAfter.length).toBe(txsBefore);
	});
});
