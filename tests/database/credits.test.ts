// Phase 3 audit-safety test: payment inserts/allocations/deletions are
// transactional, and FIFO slices are recorded in payment_allocations so
// deletePayment can reverse them precisely.
import {
	initCreditsTable,
	insertCustomer,
	insertCreditTransaction,
	insertPayment,
	getCreditTransactionsByCustomer,
	getOutstandingBalance,
	getPaymentsByCustomer,
	deletePayment,
} from '../../database/credits';
import { initProductsTable } from '../../database/products';
import { initInventoryTable } from '../../database/inventory';
import { initSalesTables } from '../../database/sales';
import { runMigrations } from '../../database/migrations';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';
import { db } from '../../configs/sqlite';

describe('Credits Database (utang audit-safety)', () => {
	let customerId: number;
	let creditA: number;
	let creditB: number;
	let creditC: number;

	beforeAll(async () => {
		resetMockDb();
		await initProductsTable();
		await initInventoryTable();
		await initSalesTables();
		await initCreditsTable();
		// v3 migration creates payment_allocations and links sales.credit_transaction_id
		await runMigrations();
		customerId = await insertCustomer({ name: 'Suki A' });
		// Three credit entries, ordered by date so FIFO is deterministic.
		creditA = await insertCreditTransaction({
			customer_id: customerId,
			amount: 1000, // ₱10.00 — oldest
			notes: 'First suki purchase',
		});
		creditB = await insertCreditTransaction({
			customer_id: customerId,
			amount: 500, // ₱5.00 — middle
			notes: 'Second suki purchase',
		});
		creditC = await insertCreditTransaction({
			customer_id: customerId,
			amount: 300, // ₱3.00 — newest
			notes: 'Third suki purchase',
		});
	});

	test('insertPayment with explicit credit_transaction_id applies to that one', async () => {
		const paymentId = await insertPayment({
			customer_id: customerId,
			credit_transaction_id: creditA,
			amount: 200,
			payment_method: 'cash',
		});
		expect(paymentId).toBeGreaterThan(0);

		const credits = await getCreditTransactionsByCustomer(customerId);
		const a = credits.find((c) => c.id === creditA)!;
		expect(a.amount_paid).toBe(200);
		expect(a.status).toBe('partial');

		// Allocation row recorded against creditA
		const allocs = await db.getAllAsync<{
			credit_transaction_id: number;
			amount: number;
		}>(
			'SELECT credit_transaction_id, amount FROM payment_allocations WHERE payment_id = ?',
			[paymentId],
		);
		expect(allocs).toEqual([{ credit_transaction_id: creditA, amount: 200 }]);
	});

	test('FIFO: payment without a target credit allocates to oldest unpaid', async () => {
		// Outstanding before: A=800 owed (paid 200), B=500, C=300
		const before = await getOutstandingBalance(customerId);
		expect(before).toBe(1600);

		const paymentId = await insertPayment({
			customer_id: customerId,
			amount: 600,
			payment_method: 'cash',
		});

		const credits = await getCreditTransactionsByCustomer(customerId);
		const a = credits.find((c) => c.id === creditA)!;
		const b = credits.find((c) => c.id === creditB)!;
		// A owed 800 after first test; pay 600 from A, leaves A at 200.
		expect(a.amount_paid).toBe(800);
		expect(a.status).toBe('partial');
		expect(b.amount_paid).toBe(0);

		const allocs = await db.getAllAsync<{
			credit_transaction_id: number;
			amount: number;
		}>(
			'SELECT credit_transaction_id, amount FROM payment_allocations WHERE payment_id = ?',
			[paymentId],
		);
		expect(allocs).toEqual([{ credit_transaction_id: creditA, amount: 600 }]);
	});

	test('FIFO cascades across multiple credits when payment exceeds the oldest', async () => {
		// Pay 700: 200 remaining on A, 500 on B — exactly exhausted.
		const paymentId = await insertPayment({
			customer_id: customerId,
			amount: 700,
			payment_method: 'cash',
		});

		const credits = await getCreditTransactionsByCustomer(customerId);
		const a = credits.find((c) => c.id === creditA)!;
		const b = credits.find((c) => c.id === creditB)!;
		const c = credits.find((c) => c.id === creditC)!;
		expect(a.status).toBe('paid');
		expect(b.status).toBe('paid');
		expect(c.amount_paid).toBe(0);

		const allocs = await db.getAllAsync<{
			credit_transaction_id: number;
			amount: number;
		}>(
			'SELECT credit_transaction_id, amount FROM payment_allocations WHERE payment_id = ? ORDER BY credit_transaction_id',
			[paymentId],
		);
		expect(allocs).toEqual([
			{ credit_transaction_id: creditA, amount: 200 },
			{ credit_transaction_id: creditB, amount: 500 },
		]);
	});

	test('deletePayment reverses exactly the recorded allocations', async () => {
		const payments = await getPaymentsByCustomer(customerId);
		expect(payments.length).toBe(3);

		// Delete the most recent (FIFO 700) — should re-open A and B.
		const target = payments.find((p) => p.amount === 700)!;
		await deletePayment(target.id);

		const credits = await getCreditTransactionsByCustomer(customerId);
		const a = credits.find((c) => c.id === creditA)!;
		const b = credits.find((c) => c.id === creditB)!;
		// A back to 800 paid, partial; B back to 0 paid, unpaid.
		expect(a.status).toBe('partial');
		expect(a.amount_paid).toBe(800);
		expect(b.status).toBe('unpaid');
		expect(b.amount_paid).toBe(0);

		// Outstanding balance goes back to 1000.
		const outstanding = await getOutstandingBalance(customerId);
		expect(outstanding).toBe(1000);

		// payment_allocations rows for the deleted payment are CASCADE'd.
		const orphanAllocs = await db.getAllAsync(
			'SELECT * FROM payment_allocations WHERE payment_id = ?',
			[target.id],
		);
		expect(orphanAllocs).toEqual([]);
	});
});
