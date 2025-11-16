import {
	CreditFilter,
	CreditHistory,
	CreditKPIs,
	CreditSort,
	CreditTransaction,
	Customer,
	CustomerWithDetails,
	NewCredit,
	NewCustomer,
	NewPayment,
	Payment,
} from '@/types/credits.types';
import { db } from '../configs/sqlite';

// Initialize all credits-related tables
export const initCreditsTable = async () => {
	await db.execAsync(`
		CREATE TABLE IF NOT EXISTS customers (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			phone TEXT,
			address TEXT,
			notes TEXT,
			credit_limit REAL,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			updated_at TEXT DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS credit_transactions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			customer_id INTEGER NOT NULL,
			product_id INTEGER,
			product_name TEXT,
			quantity INTEGER,
			amount REAL NOT NULL,
			status TEXT NOT NULL DEFAULT 'unpaid',
			amount_paid REAL NOT NULL DEFAULT 0,
			date TEXT DEFAULT CURRENT_TIMESTAMP,
			due_date TEXT,
			notes TEXT,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
		);

		CREATE TABLE IF NOT EXISTS payments (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			customer_id INTEGER NOT NULL,
			credit_transaction_id INTEGER,
			amount REAL NOT NULL,
			payment_method TEXT,
			date TEXT DEFAULT CURRENT_TIMESTAMP,
			notes TEXT,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
			FOREIGN KEY (credit_transaction_id) REFERENCES credit_transactions (id) ON DELETE SET NULL
		);

		CREATE INDEX IF NOT EXISTS idx_customer_id ON credit_transactions (customer_id);
		CREATE INDEX IF NOT EXISTS idx_payment_customer_id ON payments (customer_id);
		CREATE INDEX IF NOT EXISTS idx_credit_status ON credit_transactions (status);
		CREATE INDEX IF NOT EXISTS idx_customer_name ON customers (name);
	`);
};

// ==================== CUSTOMER OPERATIONS ====================

export const insertCustomer = async (
	customer: NewCustomer
): Promise<number> => {
	const result = await db.runAsync(
		`INSERT INTO customers (name, phone, address, notes, credit_limit) 
     VALUES (?, ?, ?, ?, ?)`,
		[
			customer.name,
			customer.phone || null,
			customer.address || null,
			customer.notes || null,
			customer.credit_limit || null,
		]
	);
	return result.lastInsertRowId;
};

export const updateCustomer = async (
	id: number,
	customer: NewCustomer
): Promise<void> => {
	await db.runAsync(
		`UPDATE customers 
     SET name = ?, phone = ?, address = ?, notes = ?, credit_limit = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
		[
			customer.name,
			customer.phone || null,
			customer.address || null,
			customer.notes || null,
			customer.credit_limit || null,
			id,
		]
	);
};

export const deleteCustomer = async (id: number): Promise<void> => {
	await db.runAsync('DELETE FROM customers WHERE id = ?', [id]);
};

export const getCustomer = async (id: number): Promise<Customer | null> => {
	const result = await db.getFirstAsync<any>(
		`SELECT 
			c.*,
			COALESCE(SUM(CASE WHEN ct.status != 'paid' THEN ct.amount ELSE 0 END), 0) as total_credits,
			COALESCE(SUM(p.amount), 0) as total_payments,
			COALESCE(SUM(CASE WHEN ct.status != 'paid' THEN ct.amount - ct.amount_paid ELSE 0 END), 0) as outstanding_balance,
			MAX(COALESCE(ct.date, p.date)) as last_transaction_date
		FROM customers c
		LEFT JOIN credit_transactions ct ON c.id = ct.customer_id
		LEFT JOIN payments p ON c.id = p.customer_id
		WHERE c.id = ?
		GROUP BY c.id`,
		[id]
	);

	if (!result) return null;

	return {
		...result,
		tag: calculateCustomerTag(
			result.outstanding_balance,
			result.last_transaction_date
		),
	};
};

export const getAllCustomers = async (
	filter: CreditFilter = 'all',
	sort: CreditSort = 'name_asc'
): Promise<Customer[]> => {
	let whereClause = '';
	let orderByClause = 'c.name ASC';

	// Apply filters
	switch (filter) {
		case 'with_balance':
			whereClause = 'HAVING outstanding_balance > 0';
			break;
		case 'paid':
			whereClause = 'HAVING outstanding_balance = 0';
			break;
		case 'overdue':
			whereClause = `HAVING outstanding_balance > 0 AND EXISTS (
				SELECT 1 FROM credit_transactions 
				WHERE customer_id = c.id 
				AND status != 'paid' 
				AND due_date < date('now')
			)`;
			break;
	}

	// Apply sorting
	switch (sort) {
		case 'balance_desc':
			orderByClause = 'outstanding_balance DESC';
			break;
		case 'balance_asc':
			orderByClause = 'outstanding_balance ASC';
			break;
		case 'recent':
			orderByClause = 'last_transaction_date DESC';
			break;
		case 'name_desc':
			orderByClause = 'c.name DESC';
			break;
	}

	const results = await db.getAllAsync<any>(
		`SELECT 
			c.*,
			COALESCE(SUM(CASE WHEN ct.status != 'paid' THEN ct.amount ELSE 0 END), 0) as total_credits,
			COALESCE(SUM(p.amount), 0) as total_payments,
			COALESCE(SUM(CASE WHEN ct.status != 'paid' THEN ct.amount - ct.amount_paid ELSE 0 END), 0) as outstanding_balance,
			MAX(COALESCE(ct.date, p.date)) as last_transaction_date
		FROM customers c
		LEFT JOIN credit_transactions ct ON c.id = ct.customer_id
		LEFT JOIN payments p ON c.id = p.customer_id
		GROUP BY c.id
		${whereClause}
		ORDER BY ${orderByClause}`
	);

	return results.map((r) => ({
		...r,
		tag: calculateCustomerTag(
			r.outstanding_balance,
			r.last_transaction_date
		),
	}));
};

export const getCustomerWithDetails = async (
	id: number
): Promise<CustomerWithDetails | null> => {
	const customer = await getCustomer(id);
	if (!customer) return null;

	const credits = await db.getAllAsync<CreditTransaction>(
		`SELECT * FROM credit_transactions WHERE customer_id = ? ORDER BY date DESC`,
		[id]
	);

	const payments = await db.getAllAsync<Payment>(
		`SELECT * FROM payments WHERE customer_id = ? ORDER BY date DESC`,
		[id]
	);

	const overdueCredit = await db.getFirstAsync<any>(
		`SELECT MIN(julianday('now') - julianday(due_date)) as days_overdue
		 FROM credit_transactions
		 WHERE customer_id = ? AND status != 'paid' AND due_date < date('now')`,
		[id]
	);

	return {
		...customer,
		credits,
		payments,
		days_overdue: overdueCredit?.days_overdue
			? Math.floor(overdueCredit.days_overdue)
			: undefined,
	};
};

// ==================== CREDIT TRANSACTION OPERATIONS ====================

export const insertCreditTransaction = async (
	credit: NewCredit
): Promise<number> => {
	const result = await db.runAsync(
		`INSERT INTO credit_transactions 
     (customer_id, product_id, product_name, quantity, amount, due_date, notes, status) 
     VALUES (?, ?, ?, ?, ?, ?, ?, 'unpaid')`,
		[
			credit.customer_id,
			credit.product_id || null,
			credit.product_name || null,
			credit.quantity || null,
			credit.amount,
			credit.due_date || null,
			credit.notes || null,
		]
	);
	return result.lastInsertRowId;
};

export const updateCreditStatus = async (
	id: number,
	amountPaid: number
): Promise<void> => {
	const credit = await db.getFirstAsync<CreditTransaction>(
		`SELECT * FROM credit_transactions WHERE id = ?`,
		[id]
	);

	if (!credit) return;

	const newAmountPaid = credit.amount_paid + amountPaid;
	const newStatus =
		newAmountPaid >= credit.amount
			? 'paid'
			: newAmountPaid > 0
				? 'partial'
				: 'unpaid';

	await db.runAsync(
		`UPDATE credit_transactions 
     SET amount_paid = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
		[newAmountPaid, newStatus, id]
	);
};

export const deleteCreditTransaction = async (id: number): Promise<void> => {
	await db.runAsync('DELETE FROM credit_transactions WHERE id = ?', [id]);
};

export const getCreditTransactionsByCustomer = async (
	customerId: number
): Promise<CreditTransaction[]> => {
	return await db.getAllAsync<CreditTransaction>(
		`SELECT * FROM credit_transactions WHERE customer_id = ? ORDER BY date DESC`,
		[customerId]
	);
};

// ==================== PAYMENT OPERATIONS ====================

export const insertPayment = async (payment: NewPayment): Promise<number> => {
	const result = await db.runAsync(
		`INSERT INTO payments 
     (customer_id, credit_transaction_id, amount, payment_method, date, notes) 
     VALUES (?, ?, ?, ?, ?, ?)`,
		[
			payment.customer_id,
			payment.credit_transaction_id || null,
			payment.amount,
			payment.payment_method || null,
			payment.date || new Date().toISOString(),
			payment.notes || null,
		]
	);

	// Update credit transaction if specified
	if (payment.credit_transaction_id) {
		await updateCreditStatus(payment.credit_transaction_id, payment.amount);
	} else {
		// Distribute payment across unpaid credits (FIFO)
		let remainingAmount = payment.amount;
		const unpaidCredits = await db.getAllAsync<CreditTransaction>(
			`SELECT * FROM credit_transactions 
       WHERE customer_id = ? AND status != 'paid' 
       ORDER BY date ASC`,
			[payment.customer_id]
		);

		for (const credit of unpaidCredits) {
			if (remainingAmount <= 0) break;

			const amountOwed = credit.amount - credit.amount_paid;
			const paymentAmount = Math.min(remainingAmount, amountOwed);

			await updateCreditStatus(credit.id, paymentAmount);
			remainingAmount -= paymentAmount;
		}
	}

	return result.lastInsertRowId;
};

export const deletePayment = async (id: number): Promise<void> => {
	const payment = await db.getFirstAsync<Payment>(
		`SELECT * FROM payments WHERE id = ?`,
		[id]
	);
	if (!payment) return;

	// Reverse the payment from credit transaction
	if (payment.credit_transaction_id) {
		await updateCreditStatus(
			payment.credit_transaction_id,
			-payment.amount
		);
	}

	await db.runAsync('DELETE FROM payments WHERE id = ?', [id]);
};

export const getPaymentsByCustomer = async (
	customerId: number
): Promise<Payment[]> => {
	return await db.getAllAsync<Payment>(
		`SELECT * FROM payments WHERE customer_id = ? ORDER BY date DESC`,
		[customerId]
	);
};

// ==================== KPI & ANALYTICS ====================

export const getCreditKPIs = async (): Promise<CreditKPIs> => {
	const today = new Date().toISOString().split('T')[0];

	const totalOutstanding = await db.getFirstAsync<{ total: number }>(
		`SELECT COALESCE(SUM(amount - amount_paid), 0) as total 
     FROM credit_transactions WHERE status != 'paid'`
	);

	const customersWithBalance = await db.getFirstAsync<{ count: number }>(
		`SELECT COUNT(DISTINCT customer_id) as count 
     FROM credit_transactions WHERE status != 'paid'`
	);

	const mostOwed = await db.getFirstAsync<{ name: string; amount: number }>(
		`SELECT c.name, SUM(ct.amount - ct.amount_paid) as amount
     FROM customers c
     JOIN credit_transactions ct ON c.id = ct.customer_id
     WHERE ct.status != 'paid'
     GROUP BY c.id
     ORDER BY amount DESC
     LIMIT 1`
	);

	const collectedToday = await db.getFirstAsync<{ total: number }>(
		`SELECT COALESCE(SUM(amount), 0) as total 
     FROM payments WHERE date(date) = ?`,
		[today]
	);

	const creditsToday = await db.getFirstAsync<{ total: number }>(
		`SELECT COALESCE(SUM(amount), 0) as total 
     FROM credit_transactions WHERE date(date) = ?`,
		[today]
	);

	const overdueCount = await db.getFirstAsync<{ count: number }>(
		`SELECT COUNT(DISTINCT customer_id) as count 
     FROM credit_transactions 
     WHERE status != 'paid' AND due_date < date('now')`
	);

	return {
		totalOutstanding: totalOutstanding?.total || 0,
		totalCustomersWithBalance: customersWithBalance?.count || 0,
		mostOwedCustomer: mostOwed || null,
		totalCollectedToday: collectedToday?.total || 0,
		totalCreditsToday: creditsToday?.total || 0,
		overdueCount: overdueCount?.count || 0,
	};
};

export const getCreditHistory = async (
	customerId: number
): Promise<CreditHistory[]> => {
	const history: CreditHistory[] = [];

	// Get all credits and payments
	const credits = await db.getAllAsync<any>(
		`SELECT id, amount, date, product_name, notes, 'credit' as type 
     FROM credit_transactions WHERE customer_id = ?`,
		[customerId]
	);

	const payments = await db.getAllAsync<any>(
		`SELECT id, amount, date, notes, 'payment' as type 
     FROM payments WHERE customer_id = ?`,
		[customerId]
	);

	// Combine and sort by date
	const combined = [...credits, ...payments].sort(
		(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
	);

	let runningBalance = 0;
	for (const item of combined) {
		if (item.type === 'credit') {
			runningBalance += item.amount;
			history.push({
				id: item.id,
				customer_id: customerId,
				type: 'credit',
				amount: item.amount,
				running_balance: runningBalance,
				date: item.date,
				description: item.product_name || item.notes || 'Credit',
				created_at: item.date,
			});
		} else {
			runningBalance -= item.amount;
			history.push({
				id: item.id,
				customer_id: customerId,
				type: 'payment',
				amount: item.amount,
				running_balance: runningBalance,
				date: item.date,
				description: item.notes || 'Payment',
				created_at: item.date,
			});
		}
	}

	return history;
};

export const markAllCreditsAsPaid = async (
	customerId: number
): Promise<void> => {
	await db.runAsync(
		`UPDATE credit_transactions 
     SET status = 'paid', amount_paid = amount, updated_at = CURRENT_TIMESTAMP 
     WHERE customer_id = ? AND status != 'paid'`,
		[customerId]
	);
};

// ==================== UTILITY FUNCTIONS ====================

function calculateCustomerTag(
	outstandingBalance: number,
	lastTransactionDate: string | null
): 'good_payer' | 'frequent_borrower' | 'overdue' | null {
	if (!lastTransactionDate || outstandingBalance === 0) return null;

	const daysSinceLastTransaction = Math.floor(
		(Date.now() - new Date(lastTransactionDate).getTime()) /
			(1000 * 60 * 60 * 24)
	);

	if (outstandingBalance > 0 && daysSinceLastTransaction > 30) {
		return 'overdue';
	}

	if (outstandingBalance > 5000) {
		return 'frequent_borrower';
	}

	if (daysSinceLastTransaction < 7) {
		return 'good_payer';
	}

	return null;
}

export const searchCustomers = async (query: string): Promise<Customer[]> => {
	const results = await db.getAllAsync<any>(
		`SELECT 
			c.*,
			COALESCE(SUM(CASE WHEN ct.status != 'paid' THEN ct.amount ELSE 0 END), 0) as total_credits,
			COALESCE(SUM(p.amount), 0) as total_payments,
			COALESCE(SUM(CASE WHEN ct.status != 'paid' THEN ct.amount - ct.amount_paid ELSE 0 END), 0) as outstanding_balance,
			MAX(COALESCE(ct.date, p.date)) as last_transaction_date
		FROM customers c
		LEFT JOIN credit_transactions ct ON c.id = ct.customer_id
		LEFT JOIN payments p ON c.id = p.customer_id
		WHERE c.name LIKE ? OR c.phone LIKE ?
		GROUP BY c.id
		ORDER BY c.name ASC`,
		[`%${query}%`, `%${query}%`]
	);

	return results.map((r) => ({
		...r,
		tag: calculateCustomerTag(
			r.outstanding_balance,
			r.last_transaction_date
		),
	}));
};
