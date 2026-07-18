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
  deleteProduct,
} from '../../database/products';
import { initInventoryTable, getInventoryTransactions } from '../../database/inventory';
import { initSalesTables } from '../../database/sales';
import { initCreditsTable } from '../../database/credits';
import { runMigrations } from '../../database/migrations';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';
import { db } from '../../configs/sqlite';
import { getCatalogProductByBarcode, insertCatalogProductIfMissing } from '../../database/catalog';

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

	test('getProductByBarcode resolves SKU-only rows via legacy SKU fallback', async () => {
		await insertProduct(
			'SKU-only',
			'SKU-ONLY-001',
			100,
			0,
			undefined,
			undefined,
			null,
		);
		const hit = await getProductByBarcode('SKU-ONLY-001');
		expect(hit).not.toBeNull();
		expect(hit?.name).toBe('SKU-only');
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

	test('insertProduct and updateProduct saves and updates image_uri', async () => {
		const id = await insertProduct(
			'Image Product',
			'IMG-001',
			1000,
			5,
			500,
			'Beverages',
			null,
			null,
			'product_images/coke.jpg'
		);

		let product = await getProduct(id);
		expect(product).not.toBeNull();
		expect(product?.image_uri).toBe('product_images/coke.jpg');

		await updateProduct(
			id,
			'Image Product Updated',
			'IMG-001',
			1000,
			5,
			500,
			'Beverages',
			null,
			null,
			'product_images/coke-diet.jpg'
		);

		product = await getProduct(id);
		expect(product?.image_uri).toBe('product_images/coke-diet.jpg');
	});

	test('insertProduct stores wholesale packaging details', async () => {
		const id = await insertProduct(
			'Coke 1.5L Case',
			'COK-15L-CS',
			60,
			24,
			50,
			'Beverages',
			'1111222233334',
			null,
			null,
			'Bottle',
			'Case',
			660,
			600,
			12,
			'9999888877776'
		);

		const product = await getProduct(id);
		expect(product).not.toBeNull();
		expect(product?.retail_unit_name).toBe('Bottle');
		expect(product?.wholesale_unit_name).toBe('Case');
		expect(product?.wholesale_price).toBe(660);
		expect(product?.wholesale_cost_price).toBe(600);
		expect(product?.conversion_factor).toBe(12);
		expect(product?.wholesale_barcode).toBe('9999888877776');
	});

	test('insertProduct throws when wholesale_barcode conflicts with an existing barcode', async () => {
		await expect(
			insertProduct(
				'Conflict Item',
				'CNF-001',
				10,
				1,
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				'Pc',
				'Case',
				120,
				undefined,
				12,
				'1111222233334' // matches Coke 1.5L Case retail barcode
			)
		).rejects.toThrow(BarcodeAlreadyExistsError);
	});

	test('learns a minimal retail catalog record in the product transaction', async () => {
		await insertProduct(
			'Merchant Mami',
			'MAMI-001',
			1800,
			3,
			1200,
			'Noodles',
			'4807770270017',
			undefined,
			null,
			'Pack',
		);

		await expect(
			getCatalogProductByBarcode(db, '4807770270017'),
		).resolves.toMatchObject({
			barcode: '4807770270017',
			name: 'Merchant Mami',
			brand: null,
			category: 'Noodles',
			unit: 'Pack',
			imageUrl: null,
		});
	});

	test('keeps catalog metadata when a store product uses the same barcode', async () => {
		await insertCatalogProductIfMissing(db, {
			barcode: '4800016551899',
			name: 'Bundled Coke',
			brand: null,
			category: 'Beverages',
			unit: 'Pc',
			imageUrl: null,
		});

		await insertProduct(
			'Store Coke',
			'STORE-COKE',
			2500,
			1,
			1800,
			'Store category',
			'4800016551899',
		);

		await expect(
			getCatalogProductByBarcode(db, '4800016551899'),
		).resolves.toMatchObject({
			name: 'Bundled Coke',
			category: 'Beverages',
			unit: 'Pc',
		});
	});

	test('product and inventory are committed even when catalog insertion trigger fails', async () => {
		// Per spec: "A catalog lookup or seed failure must not prevent store-product scans, a sale,
		// or manual registration." Catalog writes are non-fatal; the product save succeeds regardless.
		await db.execAsync(`
			CREATE TRIGGER IF NOT EXISTS fail_catalog_insert_test
			BEFORE INSERT ON product_catalog
			BEGIN
				SELECT RAISE(FAIL, 'Forced catalog insert failure');
			END;
		`);

		const txsBefore = await db.getAllAsync<{ id: number }>('SELECT * FROM inventory_transactions');

		try {
			// insertProduct should succeed even though the catalog trigger fires
			const productId = await insertProduct(
				'Rollback Product',
				'ROLLBACK-001',
				1000,
				5,
				500,
				'Snacks',
				'4800000000001',
			);
			expect(productId).toBeGreaterThan(0);

			// Product is in the store
			const product = await getProductBySku('ROLLBACK-001');
			expect(product).not.toBeNull();
			expect(product?.name).toBe('Rollback Product');

			// Inventory transaction for the opening stock was committed
			const txsAfter = await db.getAllAsync<{ id: number }>('SELECT * FROM inventory_transactions');
			expect(txsAfter.length).toBe(txsBefore.length + 1);

			// Catalog row was NOT written (trigger prevented it), which is acceptable
			const catalogRow = await getCatalogProductByBarcode(db, '4800000000001');
			expect(catalogRow).toBeNull();
		} finally {
			await db.execAsync('DROP TRIGGER IF EXISTS fail_catalog_insert_test;');
		}
	});

	test('updates a product with a new retail barcode and creates catalog row', async () => {
		const productId = await insertProduct(
			'Update Unknown Barcode',
			'UP-UNKNOWN-001',
			1000,
			0,
		);

		await updateProduct(
			productId,
			'Update Unknown Barcode',
			'UP-UNKNOWN-001',
			1000,
			0,
			undefined,
			'Snacks',
			'4800000000002',
			undefined,
			undefined,
			'Pack'
		);

		await expect(
			getCatalogProductByBarcode(db, '4800000000002'),
		).resolves.toMatchObject({
			barcode: '4800000000002',
			name: 'Update Unknown Barcode',
			brand: null,
			category: 'Snacks',
			unit: 'Pack',
			imageUrl: null,
		});
	});

	test('deleting a product does not remove its catalog row', async () => {
		const productId = await insertProduct(
			'To Be Deleted',
			'DEL-001',
			1000,
			0,
			undefined,
			'Snacks',
			'4800000000003',
		);

		await deleteProduct(productId);

		const product = await getProduct(productId);
		expect(product).toBeNull();

		await expect(
			getCatalogProductByBarcode(db, '4800000000003'),
		).resolves.not.toBeNull();
	});

	test('cross-row collisions between SKU, barcode, and wholesale_barcode', async () => {
		// 1. Existing product with numeric SKU '999111'
		const idA = await insertProduct('Product A', '999111', 100);

		// Inserting a new product with retail barcode '999111' should fail
		await expect(
			insertProduct('Product B', 'SKU-B', 100, 0, undefined, undefined, '999111')
		).rejects.toBeInstanceOf(BarcodeAlreadyExistsError);

		// 2. Existing product with retail barcode '999222'
		await insertProduct('Product C', 'SKU-C', 100, 0, undefined, undefined, '999222');

		// Inserting a new product with SKU '999222' should fail
		await expect(
			insertProduct('Product D', '999222', 100)
		).rejects.toBeInstanceOf(BarcodeAlreadyExistsError);

		// 3. Existing product with wholesale barcode '999333'
		await insertProduct(
			'Product E', 'SKU-E', 100, 0, undefined, undefined, '999334', undefined, undefined,
			'Pc', 'Case', 1200, undefined, 12, '999333'
		);

		// Updating a different product's wholesale barcode to '999333' should fail
		const idF = await insertProduct('Product F', 'SKU-F', 100);
		await expect(
			updateProduct(
				idF, 'Product F', 'SKU-F', 100, 0, undefined, undefined, undefined, undefined, undefined,
				'Pc', 'Case', 1200, undefined, 12, '999333'
			)
		).rejects.toBeInstanceOf(BarcodeAlreadyExistsError);
	});

	test('same-row compatibility: one product has identical SKU and retail barcode', async () => {
		const id = await insertProduct(
			'Same-row Product',
			'77777777',
			1500,
			0,
			undefined,
			'Snacks',
			'77777777'
		);

		const product = await getProduct(id);
		expect(product?.sku).toBe('77777777');
		expect(product?.barcode).toBe('77777777');

		// Can also update it without failing
		await expect(
			updateProduct(
				id,
				'Same-row Product Updated',
				'77777777',
				1600,
				0,
				undefined,
				'Snacks',
				'77777777'
			)
		).resolves.toBeUndefined();
	});
});