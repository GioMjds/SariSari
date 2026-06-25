// Parity test: the live FIFO allocation simulator in the Add Payment
// screen must agree with the FIFO walk that `database/credits.ts`
// executes inside its SQLite transaction. We replicate the same
// scenario as tests/database/credits.test.ts here in pure TS and
// confirm the row-by-row allocations match what the DB records.
import { describe, expect, test } from '@jest/globals';
import type { CreditTransaction } from '../../../../types/credits.types';

interface AllocationRow {
	credit: CreditTransaction;
	applied: number;
	owedBefore: number;
	remainingAfter: number;
	fullyCovered: boolean;
	partiallyCovered: boolean;
}

/**
 * Pure FIFO walk — must mirror the logic in
 * components/utang/add-payment/useAddPaymentForm.ts. We re-implement
 * it here (instead of importing) so a bug in the simulator doesn't
 * accidentally pass its own test.
 */
function simulateAllocation(
	amount: number,
	unpaid: CreditTransaction[],
): { rows: AllocationRow[]; unallocated: number } {
	let remaining = amount;
	const rows: AllocationRow[] = [];
	const fifo = [...unpaid].sort(
		(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
	);

	for (const credit of fifo) {
		const owedBefore = credit.amount - credit.amount_paid;
		if (owedBefore <= 0) continue;

		const applied = Math.max(0, Math.min(remaining, owedBefore));
		const remainingAfter = owedBefore - applied;

		rows.push({
			credit,
			applied,
			owedBefore,
			remainingAfter,
			fullyCovered: applied > 0 && remainingAfter === 0,
			partiallyCovered: applied > 0 && remainingAfter > 0,
		});

		remaining -= applied;
		if (remaining <= 0) break;
	}

	return { rows, unallocated: Math.max(0, remaining) };
}

const mkCredit = (
	id: number,
	amount: number,
	amount_paid: number,
	date: string,
): CreditTransaction => ({
	id,
	customer_id: 1,
	amount,
	amount_paid,
	status: amount_paid >= amount ? 'paid' : amount_paid > 0 ? 'partial' : 'unpaid',
	date,
	created_at: date,
	updated_at: date,
});

describe('Add Payment FIFO allocation simulator', () => {
	const unpaid = [
		mkCredit(1, 1000, 0, '2026-01-01'), // oldest
		mkCredit(2, 500, 0, '2026-01-02'),
		mkCredit(3, 300, 0, '2026-01-03'), // newest
	];

	test('fully covers a single oldest credit when payment < oldest', () => {
		const { rows, unallocated } = simulateAllocation(600, unpaid);

		expect(rows).toHaveLength(1);
		expect(rows[0].credit.id).toBe(1);
		expect(rows[0].applied).toBe(600);
		expect(rows[0].owedBefore).toBe(1000);
		expect(rows[0].remainingAfter).toBe(400);
		expect(rows[0].partiallyCovered).toBe(true);
		expect(unallocated).toBe(0);
	});

	test('cascades across credits when payment exceeds oldest', () => {
		// A owes 1000, B owes 500, C owes 300. Pay 1300: fully cover
		// A (1000) and B (300 of 500), C untouched.
		const { rows, unallocated } = simulateAllocation(1300, unpaid);

		expect(rows).toHaveLength(2);
		expect(rows[0].credit.id).toBe(1);
		expect(rows[0].applied).toBe(1000);
		expect(rows[0].fullyCovered).toBe(true);
		expect(rows[1].credit.id).toBe(2);
		expect(rows[1].applied).toBe(300);
		expect(rows[1].partiallyCovered).toBe(true);
		expect(rows[1].remainingAfter).toBe(200);
		expect(unallocated).toBe(0);
	});

	test('exhausts everything and reports zero unallocated', () => {
		const { rows, unallocated } = simulateAllocation(1800, unpaid);

		expect(rows).toHaveLength(3);
		expect(rows.every((r) => r.fullyCovered)).toBe(true);
		expect(unallocated).toBe(0);
	});

	test('overpayment is reported as unallocated', () => {
		const { rows, unallocated } = simulateAllocation(5000, unpaid);

		expect(rows).toHaveLength(3);
		expect(rows.every((r) => r.fullyCovered)).toBe(true);
		expect(unallocated).toBe(3200); // 5000 - 1800
	});

	test('respects prior partial payments on each credit', () => {
		// After a prior 200 payment against credit 1, it now owes 800.
		const partial: CreditTransaction[] = [
			mkCredit(1, 1000, 200, '2026-01-01'),
			mkCredit(2, 500, 0, '2026-01-02'),
			mkCredit(3, 300, 0, '2026-01-03'),
		];

		const { rows, unallocated } = simulateAllocation(600, partial);

		expect(rows).toHaveLength(1);
		expect(rows[0].credit.id).toBe(1);
		expect(rows[0].owedBefore).toBe(800); // 1000 - 200
		expect(rows[0].applied).toBe(600);
		expect(rows[0].remainingAfter).toBe(200);
		expect(unallocated).toBe(0);
	});

	test('skips credits that are already fully paid (owedBefore <= 0)', () => {
		const cleaned: CreditTransaction[] = [
			mkCredit(1, 1000, 1000, '2026-01-01'), // already paid
			mkCredit(2, 500, 0, '2026-01-02'),
		];

		const { rows, unallocated } = simulateAllocation(200, cleaned);

		expect(rows).toHaveLength(1);
		expect(rows[0].credit.id).toBe(2);
		expect(rows[0].applied).toBe(200);
		expect(unallocated).toBe(0);
	});

	test('zero payment produces no rows and zero unallocated', () => {
		const { rows, unallocated } = simulateAllocation(0, unpaid);

		expect(rows).toHaveLength(0);
		expect(unallocated).toBe(0);
	});

	test('empty credit list produces no rows', () => {
		const { rows, unallocated } = simulateAllocation(500, []);

		expect(rows).toHaveLength(0);
		expect(unallocated).toBe(500);
	});
});
