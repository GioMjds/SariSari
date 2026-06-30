// Phase 3 audit-safety test: `insertProduct` writes both the products column
// and the inventory_transactions row in the same transaction, so the source
// of truth (`products.quantity`) and the audit log (inventory ledger) never
// disagree.
//
// v5 additions: barcode column + partial unique index + lookup helper
// + BarcodeAlreadyExistsError on collision.
import {
  BarcodeAlreadyExistsError,
  getProduct,
  getProductByBarcode,
  getProductBySku,
  initProductsTable,
  insertProduct,
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

describe('Products Database — barcode column (v5)', () => {
	beforeAll(async () => {
		resetMockDb();
		await initProductsTable();
		await initInventoryTable();
		await initSalesTables();
		await initCreditsTable();
		await runMigrations();
	});

	test('insertProduct with barcode stores the value', async () => {
		const productId = await insertProduct(
			'Coke 330ml',
			'COKE-330',
			1500,
			10,
			undefined,
			'Beverages',
			'4800016551829',
		);
		const product = await getProduct(productId);
		expect(product?.barcode).toBe('4800016551829');
	});

	test('insertProduct without barcode stores NULL', async () => {
		const productId = await insertProduct(
			'Plain Item',
			'PLAIN-001',
			500,
			0,
		);
		const product = await getProduct(productId);
		expect(product?.barcode).toBeNull();
	});

	test('insertProduct with whitespace barcode stores NULL', async () => {
		const productId = await insertProduct(
			'Whitespace Item',
			'WS-001',
			500,
			0,
			undefined,
			undefined,
			'   ',
		);
		const product = await getProduct(productId);
		expect(product?.barcode).toBeNull();
	});

	test('getProductByBarcode returns the row with the matching barcode', async () => {
		await insertProduct(
			'Lookup Hit',
			'LKP-001',
			100,
			0,
			undefined,
			undefined,
			'4800016551820',
		);
		const product = await getProductByBarcode('4800016551820');
		expect(product).not.toBeNull();
		expect(product?.name).toBe('Lookup Hit');
	});

	test('getProductByBarcode returns null for a SKU-only row (barcode IS NULL)', async () => {
		await insertProduct(
			'SKU-only',
			'SKU-ONLY-001',
			100,
			0,
			undefined,
			undefined,
			null,
		);
		// Even if we ask for the SKU value, getProductByBarcode must
		// NOT match — it only consults the barcode column. The SKU
		// lookup is a separate path.
		const hit = await getProductByBarcode('SKU-ONLY-001');
		expect(hit).toBeNull();
	});

	test('getProductBySku still resolves SKU-only rows', async () => {
		await insertProduct(
			'SKU Lookup Hit',
			'SKL-001',
			200,
			0,
			undefined,
			undefined,
			null,
		);
		const hit = await getProductBySku('SKL-001');
		expect(hit).not.toBeNull();
	});

	test('insertProduct rejects duplicate non-null barcode with BarcodeAlreadyExistsError', async () => {
		await insertProduct(
			'First Coke',
			'FC-001',
			1500,
			0,
			undefined,
			undefined,
			'4800016551821',
		);
		await expect(
			insertProduct(
				'Second Coke',
				'SC-001',
				1500,
				0,
				undefined,
				undefined,
				'4800016551821',
			),
		).rejects.toBeInstanceOf(BarcodeAlreadyExistsError);
	});

	test('insertProduct allows multiple rows with barcode IS NULL', async () => {
		// Insert 5 rows with no barcode — partial unique index allows this.
		for (let i = 0; i < 5; i++) {
			await insertProduct(`Null Barcode ${i}`, `NB-${i}`, 100, 0);
		}
		const all = await require('../../database/products').getAllProducts();
		const nullCount = all.filter(
			(p: { barcode: string | null }) => p.barcode === null,
		).length;
		expect(nullCount).toBeGreaterThanOrEqual(5);
	});

	test('updateProduct rejects barcode collision with a different row', async () => {
		const idA = await insertProduct(
			'Update A',
			'UA-001',
			100,
			0,
			undefined,
			undefined,
			'4800016551822',
		);
		const idB = await insertProduct(
			'Update B',
			'UB-001',
			200,
			0,
			undefined,
			undefined,
			'4800016551823',
		);
		// Try to set B's barcode to A's value.
		await expect(
			updateProduct(idB, 'Update B', 'UB-001', 200, 0, undefined, undefined, '4800016551822'),
		).rejects.toBeInstanceOf(BarcodeAlreadyExistsError);
		// A is untouched.
		const a = await getProduct(idA);
		expect(a?.barcode).toBe('4800016551822');
	});

	test('updateProduct allows the same row to keep its own barcode', async () => {
		const id = await insertProduct(
			'Self Update',
			'SU-001',
			100,
			0,
			undefined,
			undefined,
			'4800016551824',
		);
		// Re-saving the same barcode should not raise.
		await expect(
			updateProduct(id, 'Self Update', 'SU-001', 100, 0, undefined, undefined, '4800016551824'),
		).resolves.toBeUndefined();
	});
});