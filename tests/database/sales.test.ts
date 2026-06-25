// Phase 3 audit-safety test: a credit sale writes a linked
// credit_transactions row, and `deleteSale` reverses it cleanly — no orphan
// ledger rows, no stale links.
import {
	initProductsTable,
	insertProduct,
	getProduct,
} from '../../database/products';
import {
	initSalesTables,
	insertSale,
	getSale,
	deleteSale,
} from '../../database/sales';
import {
	initInventoryTable,
	getInventoryTransactions,
} from '../../database/inventory';
import {
	initCreditsTable,
	insertCustomer,
	getCreditTransactionsByCustomer,
	getOutstandingBalance,
} from '../../database/credits';
import { runMigrations } from '../../database/migrations';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';

describe('Sales Database (credit-sale round-trip)', () => {
	let productId: number;
	let customerId: number;

	beforeAll(async () => {
		resetMockDb();
		await initProductsTable();
		await initInventoryTable();
		await initSalesTables();
		await initCreditsTable();
		// v3 migration fixes sales.customer_credit_id FK (was pointing at
		// the non-existent `customer_credits` table) and creates payment_allocations
		await runMigrations();

		productId = await insertProduct('Coke 250ml', 'COK-250', 2500, 50);
		customerId = await insertCustomer({ name: 'Sari-sari Suki' });
	});

	test('credit sale inserts sale + items + stock deduction + linked credit row', async () => {
		const saleId = await insertSale(
			[{ product_id: productId, quantity: 2, price: 2500 }], // ₱25.00 × 2 = ₱50.00
			'credit',
			'Sari-sari Suki',
			customerId,
		);
		expect(saleId).toBeGreaterThan(0);

		// Sale header has the credit_transaction_id back-pointer
		const sale = await getSale(saleId);
		expect(sale).not.toBeNull();
		expect(sale?.payment_type).toBe('credit');
		expect(sale?.credit_transaction_id).toBeGreaterThan(0);
		expect(sale?.total).toBe(5000); // ₱50.00

		// Stock deducted
		const product = await getProduct(productId);
		expect(product?.quantity).toBe(48);

		// Inventory ledger has the sale row
		const invTxs = await getInventoryTransactions(productId);
		expect(invTxs.some((t) => t.type === 'sale' && t.quantity === 2)).toBe(true);

		// Credit transaction was created and matches the sale total
		const credits = await getCreditTransactionsByCustomer(customerId);
		expect(credits.length).toBe(1);
		expect(credits[0].amount).toBe(5000);
		expect(credits[0].status).toBe('unpaid');

		// Outstanding balance is the credit amount
		const outstanding = await getOutstandingBalance(customerId);
		expect(outstanding).toBe(5000);

		// Now delete the sale; everything reverses.
		await deleteSale(saleId);

		// Sale gone
		const saleAfter = await getSale(saleId);
		expect(saleAfter).toBeNull();

		// Stock restored
		const productAfter = await getProduct(productId);
		expect(productAfter?.quantity).toBe(50);

		// Inventory ledger got a restock row
		const invTxsAfter = await getInventoryTransactions(productId);
		expect(invTxsAfter.some((t) => t.type === 'restock' && t.quantity === 2)).toBe(true);

		// Credit transaction gone (no orphan in the ledger)
		const creditsAfter = await getCreditTransactionsByCustomer(customerId);
		expect(creditsAfter.length).toBe(0);

		// Outstanding balance is back to zero
		const outstandingAfter = await getOutstandingBalance(customerId);
		expect(outstandingAfter).toBe(0);
	});

	test('cash sale does not create a credit row', async () => {
		const saleId = await insertSale(
			[{ product_id: productId, quantity: 1, price: 2500 }],
			'cash',
		);
		const sale = await getSale(saleId);
		expect(sale?.payment_type).toBe('cash');
		expect(sale?.credit_transaction_id).toBeNull();
		await deleteSale(saleId);
	});
});