import {
  CollectionBucket,
  CollectionFollowUp,
  CollectionQueueParams,
  CollectionQueueRow,
  CreditHistory,
  CreditKPIs,
  CreditSort,
  CreditTransaction,
  Customer,
  CustomerCreditSummary,
  CustomerInsights,
  CustomerTimelineItem,
  CustomerWithDetails,
  ExtendedCreditFilter,
  LoyaltyTier,
  NewCredit,
  NewCustomer,
  NewPayment,
  Payment,
} from '@/types/credits.types';
import { getCurrentLocalTimestamp, getTodayDateString } from '@/utils/timezone';
import { db } from '../configs/sqlite';

// Initialize all credits-related tables
export const initCreditsTable = async () => {
  await db.execAsync(`
		CREATE TABLE IF NOT EXISTS customers (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			phone TEXT,
			address TEXT,
      birthday TEXT,
      photo_uri TEXT,
			notes TEXT,
			credit_limit INTEGER,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			updated_at TEXT DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS credit_transactions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			customer_id INTEGER NOT NULL,
			product_id INTEGER,
			product_name TEXT,
			quantity INTEGER,
			amount INTEGER NOT NULL,
			status TEXT NOT NULL DEFAULT 'unpaid',
			amount_paid INTEGER NOT NULL DEFAULT 0,
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
			amount INTEGER NOT NULL,
			payment_method TEXT,
			date TEXT DEFAULT CURRENT_TIMESTAMP,
			notes TEXT,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
			FOREIGN KEY (credit_transaction_id) REFERENCES credit_transactions (id) ON DELETE SET NULL
		);

		CREATE INDEX IF NOT EXISTS idx_credit_transactions_customer_id ON credit_transactions(customer_id);
		CREATE INDEX IF NOT EXISTS idx_credit_transactions_date ON credit_transactions(date);
		CREATE INDEX IF NOT EXISTS idx_credit_transactions_status ON credit_transactions(status);
		CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
		CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);
		CREATE INDEX IF NOT EXISTS idx_customer_name ON customers (name);
	`);

  try {
    await db.execAsync(`ALTER TABLE customers ADD COLUMN birthday TEXT;`);
  } catch {}
  try {
    await db.execAsync(`ALTER TABLE customers ADD COLUMN photo_uri TEXT;`);
  } catch {}
};

// ==================== CUSTOMER OPERATIONS ====================

/**
 * The canonical balance query. Returns a customer's outstanding utang
 * balance: the sum of remaining amounts across all non-paid credit
 * transactions. Every screen that needs a balance should call this
 * (or the SQL it generates) rather than inlining its own `SUM` —
 * so that the answer always matches the underlying ledger.
 */
export const getOutstandingBalance = async (
  customerId: number,
): Promise<number> => {
  const result = await db.getFirstAsync<{ balance: number | null }>(
    `SELECT COALESCE(SUM(amount - amount_paid), 0) AS balance
       FROM credit_transactions
      WHERE customer_id = ? AND status != 'paid'`,
    [customerId],
  );
  return result?.balance ?? 0;
};

export const insertCustomer = async (
  customer: NewCustomer,
): Promise<number> => {
  const result = await db.runAsync(
    `INSERT INTO customers (name, phone, address, birthday, photo_uri, notes, credit_limit) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      customer.name,
      customer.phone || null,
      customer.address || null,
      customer.birthday || null,
      customer.photo_uri || null,
      customer.notes || null,
      customer.credit_limit || null,
    ],
  );
  return result.lastInsertRowId;
};

export const updateCustomer = async (
  id: number,
  customer: NewCustomer,
): Promise<void> => {
  await db.runAsync(
    `UPDATE customers 
     SET name = ?, phone = ?, address = ?, birthday = ?, photo_uri = ?, notes = ?, credit_limit = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    [
      customer.name,
      customer.phone || null,
      customer.address || null,
      customer.birthday || null,
      customer.photo_uri || null,
      customer.notes || null,
      customer.credit_limit || null,
      id,
    ],
  );
};

export const deleteCustomer = async (id: number): Promise<void> => {
  await db.runAsync('DELETE FROM customers WHERE id = ?', [id]);
};

export const getCustomer = async (id: number): Promise<Customer | null> => {
  const result = await db.getFirstAsync<Customer>(
    `SELECT 
			c.*,
			COALESCE(ct.total_credits, 0) as total_credits,
			COALESCE(p.total_payments, 0) as total_payments,
			COALESCE(ct.outstanding_balance, 0) as outstanding_balance,
			MAX(ct.last_credit_date, p.last_payment_date) as last_transaction_date
		FROM customers c
		LEFT JOIN (
			SELECT 
				customer_id,
				SUM(CASE WHEN status != 'paid' THEN amount ELSE 0 END) as total_credits,
				SUM(CASE WHEN status != 'paid' THEN amount - amount_paid ELSE 0 END) as outstanding_balance,
				MAX(date) as last_credit_date
			FROM credit_transactions
			GROUP BY customer_id
		) ct ON c.id = ct.customer_id
		LEFT JOIN (
			SELECT 
				customer_id,
				SUM(amount) as total_payments,
				MAX(date) as last_payment_date
			FROM payments
			GROUP BY customer_id
		) p ON c.id = p.customer_id
		WHERE c.id = ?
		GROUP BY c.id`,
    [id],
  );

  if (!result) return null;

  const totalSpent = (result.total_credits || 0) + (result.total_payments || 0);
  const loyalty_tier = calculateLoyaltyTier(
    result.total_credits > 0 ? 5 : 1,
    totalSpent,
  );

  return {
    ...result,
    loyalty_tier,
    tag: calculateCustomerTag(
      result.outstanding_balance,
      result.last_transaction_date,
    ),
  };
};

export const getAllCustomers = async (
  filter: ExtendedCreditFilter = 'all',
  sort: CreditSort = 'name_asc',
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

  const results = await db.getAllAsync<Customer>(
    `SELECT 
			c.*,
			COALESCE(ct.total_credits, 0) as total_credits,
			COALESCE(p.total_payments, 0) as total_payments,
			COALESCE(ct.outstanding_balance, 0) as outstanding_balance,
			MAX(ct.last_credit_date, p.last_payment_date) as last_transaction_date
		FROM customers c
		LEFT JOIN (
			SELECT 
				customer_id,
				SUM(CASE WHEN status != 'paid' THEN amount ELSE 0 END) as total_credits,
				SUM(CASE WHEN status != 'paid' THEN amount - amount_paid ELSE 0 END) as outstanding_balance,
				MAX(date) as last_credit_date
			FROM credit_transactions
			GROUP BY customer_id
		) ct ON c.id = ct.customer_id
		LEFT JOIN (
			SELECT 
				customer_id,
				SUM(amount) as total_payments,
				MAX(date) as last_payment_date
			FROM payments
			GROUP BY customer_id
		) p ON c.id = p.customer_id
		GROUP BY c.id
		${whereClause}
		ORDER BY ${orderByClause}`,
  );

  return results.map((r) => {
    const totalSpent = (r.total_credits || 0) + (r.total_payments || 0);
    const loyalty_tier = calculateLoyaltyTier(
      r.total_credits > 0 ? 5 : 1,
      totalSpent,
    );
    return {
      ...r,
      loyalty_tier,
      tag: calculateCustomerTag(r.outstanding_balance, r.last_transaction_date),
    };
  });
};

export const getCustomerWithDetails = async (
  id: number,
): Promise<CustomerWithDetails | null> => {
  const customer = await getCustomer(id);
  if (!customer) return null;

  const credits = await db.getAllAsync<CreditTransaction>(
    `SELECT * FROM credit_transactions WHERE customer_id = ? ORDER BY date DESC`,
    [id],
  );

  const payments = await db.getAllAsync<Payment>(
    `SELECT * FROM payments WHERE customer_id = ? ORDER BY date DESC`,
    [id],
  );

  const overdueCredit = await db.getFirstAsync<{ days_overdue: number | null }>(
    `SELECT MIN(julianday('now') - julianday(due_date)) as days_overdue
		 FROM credit_transactions
		 WHERE customer_id = ? AND status != 'paid' AND due_date < date('now')`,
    [id],
  );

  const daysOverdue =
    overdueCredit?.days_overdue != null
      ? Math.floor(overdueCredit.days_overdue)
      : undefined;

  return {
    ...customer,
    credits,
    payments,
    ...(daysOverdue != null ? { days_overdue: daysOverdue } : {}),
  };
};

export const insertCreditTransaction = async (
  credit: NewCredit,
): Promise<number> => {
  const timestamp = getCurrentLocalTimestamp();
  const result = await db.runAsync(
    `INSERT INTO credit_transactions
     (customer_id, product_id, product_name, quantity, amount, due_date, notes,
      status, date, override_reason_code, override_reason_note)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'unpaid', ?, ?, ?)`,
    [
      credit.customer_id,
      credit.product_id || null,
      credit.product_name || null,
      credit.quantity || null,
      credit.amount,
      credit.due_date || null,
      credit.notes || null,
      timestamp,
      credit.overrideReasonCode || null,
      credit.overrideReasonNote || null,
    ],
  );
  return result.lastInsertRowId;
};

export const updateCreditStatus = async (
  id: number,
  amountPaid: number,
): Promise<void> => {
  const credit = await db.getFirstAsync<CreditTransaction>(
    `SELECT * FROM credit_transactions WHERE id = ?`,
    [id],
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
    [newAmountPaid, newStatus, id],
  );
};

export const deleteCreditTransaction = async (id: number): Promise<void> => {
  await db.runAsync('DELETE FROM credit_transactions WHERE id = ?', [id]);
};

export const getCreditTransactionsByCustomer = async (
  customerId: number,
): Promise<CreditTransaction[]> => {
  return await db.getAllAsync<CreditTransaction>(
    `SELECT * FROM credit_transactions WHERE customer_id = ? ORDER BY date DESC`,
    [customerId],
  );
};

// ==================== PAYMENT OPERATIONS ====================

/**
 * Apply a payment allocation to one credit transaction: bump amount_paid
 * by `allocationAmount` (which may be negative for a reversal) and recompute
 * status. Used inside `insertPayment` and `deletePayment`. Caller is
 * responsible for being inside a `db.withTransactionAsync` block.
 */
const applyPaymentAllocation = async (
  creditTransactionId: number,
  allocationAmount: number,
): Promise<void> => {
  const credit = await db.getFirstAsync<CreditTransaction>(
    'SELECT * FROM credit_transactions WHERE id = ?',
    [creditTransactionId],
  );
  if (!credit) return;

  const newAmountPaid = credit.amount_paid + allocationAmount;
  const newStatus =
    newAmountPaid >= credit.amount
      ? 'paid'
      : newAmountPaid > 0
        ? 'partial'
        : 'unpaid';

  await db.runAsync(
    'UPDATE credit_transactions SET amount_paid = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [newAmountPaid, newStatus, creditTransactionId],
  );
};

export const insertPayment = async (payment: NewPayment): Promise<number> => {
  if (!payment.payment_method) {
    throw new Error('Payment method is required for new payments');
  }
  if (!['cash', 'bank_transfer', 'other'].includes(payment.payment_method)) {
    throw new Error(`Invalid payment method: ${payment.payment_method}`);
  }

  const timestamp = payment.date || getCurrentLocalTimestamp();
  let paymentId = 0;

  await db.withTransactionAsync(async () => {
    // 1. Insert the payment row.
    const result = await db.runAsync(
      `INSERT INTO payments
       (customer_id, credit_transaction_id, amount, payment_method, date, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        payment.customer_id,
        payment.credit_transaction_id || null,
        payment.amount,
        payment.payment_method || null,
        timestamp,
        payment.notes || null,
      ],
    );
    paymentId = result.lastInsertRowId;

    // 2. Allocate the payment. Either a single targeted credit, or FIFO
    //    across the customer's oldest unpaid credits. Each allocation is
    //    recorded in payment_allocations so `deletePayment` can reverse it.
    if (payment.credit_transaction_id) {
      await applyPaymentAllocation(
        payment.credit_transaction_id,
        payment.amount,
      );
      await db.runAsync(
        'INSERT INTO payment_allocations (payment_id, credit_transaction_id, amount) VALUES (?, ?, ?)',
        [paymentId, payment.credit_transaction_id, payment.amount],
      );
    } else {
      // FIFO across all unpaid credits for this customer.
      let remaining = payment.amount;
      const unpaidCredits = await db.getAllAsync<CreditTransaction>(
        `SELECT * FROM credit_transactions
         WHERE customer_id = ? AND status != 'paid'
         ORDER BY date ASC`,
        [payment.customer_id],
      );

      for (const credit of unpaidCredits) {
        if (remaining <= 0) break;

        const owed = credit.amount - credit.amount_paid;
        const allocation = Math.min(remaining, owed);
        if (allocation <= 0) continue;

        await applyPaymentAllocation(credit.id, allocation);
        await db.runAsync(
          'INSERT INTO payment_allocations (payment_id, credit_transaction_id, amount) VALUES (?, ?, ?)',
          [paymentId, credit.id, allocation],
        );
        remaining -= allocation;
      }
    }
  });

  return paymentId;
};

export const deletePayment = async (id: number): Promise<void> => {
  await db.withTransactionAsync(async () => {
    const payment = await db.getFirstAsync<Payment>(
      'SELECT * FROM payments WHERE id = ?',
      [id],
    );
    if (!payment) return;

    const isLocked = await db.getFirstAsync<{ id: string }>(
      `SELECT id FROM cash_sessions
       WHERE status = 'closed'
         AND ? >= opening_timestamp
         AND ? <= closing_timestamp
       LIMIT 1`,
      [payment.date, payment.date],
    );
    if (isLocked) {
      throw new Error(
        'Cannot delete a payment belonging to a closed cash session',
      );
    }

    // Reverse every allocation recorded for this payment. If there are no
    // payment_allocations rows (legacy payment inserted before v3), fall
    // back to the original single-credit reversal behavior.
    const allocations = await db.getAllAsync<{
      credit_transaction_id: number;
      amount: number;
    }>(
      'SELECT credit_transaction_id, amount FROM payment_allocations WHERE payment_id = ?',
      [id],
    );

    if (allocations.length > 0) {
      for (const alloc of allocations) {
        await applyPaymentAllocation(
          alloc.credit_transaction_id,
          -alloc.amount,
        );
      }
    } else if (payment.credit_transaction_id) {
      await applyPaymentAllocation(
        payment.credit_transaction_id,
        -payment.amount,
      );
    }

    // Cascade on payment_allocations cleans up the slice rows when we
    // delete the parent payment.
    await db.runAsync('DELETE FROM payments WHERE id = ?', [id]);
  });
};

export const getPaymentsByCustomer = async (
  customerId: number,
): Promise<Payment[]> => {
  return await db.getAllAsync<Payment>(
    `SELECT * FROM payments WHERE customer_id = ? ORDER BY date DESC`,
    [customerId],
  );
};

// ==================== KPI & ANALYTICS ====================

export const getCreditKPIs = async (): Promise<CreditKPIs> => {
  // Get today's date in local timezone (format: YYYY-MM-DD)
  const todayString = getTodayDateString();

  const totalOutstanding = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount - amount_paid), 0) as total 
     FROM credit_transactions WHERE status != 'paid'`,
  );

  const customersWithBalance = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(DISTINCT customer_id) as count 
     FROM credit_transactions WHERE status != 'paid'`,
  );

  const mostOwed = await db.getFirstAsync<{ name: string; amount: number }>(
    `SELECT c.name, SUM(ct.amount - ct.amount_paid) as amount
     FROM customers c
     JOIN credit_transactions ct ON c.id = ct.customer_id
     WHERE ct.status != 'paid'
     GROUP BY c.id
     ORDER BY amount DESC
     LIMIT 1`,
  );

  const collectedToday = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total 
     FROM payments WHERE date(date) = ?`,
    [todayString],
  );

  const creditsToday = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total 
     FROM credit_transactions WHERE date(date) = ?`,
    [todayString],
  );

  const overdueCount = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(DISTINCT customer_id) as count 
     FROM credit_transactions 
     WHERE status != 'paid' AND due_date < date('now')`,
  );

  const overdueAmount = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount - amount_paid), 0) as total 
     FROM credit_transactions 
     WHERE status != 'paid' AND due_date < date('now')`,
  );

  return {
    totalOutstanding: totalOutstanding?.total || 0,
    totalCustomersWithBalance: customersWithBalance?.count || 0,
    mostOwedCustomer: mostOwed || null,
    totalCollectedToday: collectedToday?.total || 0,
    totalCreditsToday: creditsToday?.total || 0,
    totalOverdueAmount: overdueAmount?.total || 0,
    overdueCount: overdueCount?.count || 0,
  };
};

export const getCreditHistory = async (
  customerId: number,
): Promise<CreditHistory[]> => {
  const history: CreditHistory[] = [];

  // Get all credits and payments
  const credits = await db.getAllAsync<{
    id: number;
    amount: number;
    date: string;
    product_name?: string | null;
    notes?: string | null;
    type: 'credit';
  }>(
    `SELECT id, amount, date, product_name, notes, 'credit' as type 
     FROM credit_transactions WHERE customer_id = ?`,
    [customerId],
  );

  const payments = await db.getAllAsync<{
    id: number;
    amount: number;
    date: string;
    notes?: string | null;
    type: 'payment';
  }>(
    `SELECT id, amount, date, notes, 'payment' as type 
     FROM payments WHERE customer_id = ?`,
    [customerId],
  );

  // Combine and sort by date
  const combined = [...credits, ...payments].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
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
  customerId: number,
): Promise<void> => {
  await db.withTransactionAsync(async () => {
    const unpaidCredits = await db.getAllAsync<{
      id: number;
      amount: number;
      amount_paid: number;
    }>(
      `SELECT id, amount, amount_paid FROM credit_transactions WHERE customer_id = ? AND status != 'paid'`,
      [customerId],
    );

    if (unpaidCredits.length === 0) return;

    await db.runAsync(
      `UPDATE credit_transactions 
       SET status = 'paid', amount_paid = amount, updated_at = CURRENT_TIMESTAMP 
       WHERE customer_id = ? AND status != 'paid'`,
      [customerId],
    );

    const totalSettled = unpaidCredits.reduce(
      (sum, c) => sum + (c.amount - c.amount_paid),
      0,
    );

    if (totalSettled > 0) {
      const result = await db.runAsync(
        `INSERT INTO payments (customer_id, amount, payment_method, notes) VALUES (?, ?, 'cash', 'Full settlement of all outstanding credits')`,
        [customerId, totalSettled],
      );
      const paymentId = result.lastInsertRowId;
      for (const credit of unpaidCredits) {
        const amountSettled = credit.amount - credit.amount_paid;
        if (amountSettled > 0) {
          await db.runAsync(
            `INSERT INTO payment_allocations (payment_id, credit_transaction_id, amount) VALUES (?, ?, ?)`,
            [paymentId, credit.id, amountSettled],
          );
        }
      }
    }
  });
};

function calculateCustomerTag(
  outstandingBalance: number,
  lastTransactionDate: string | null,
): 'good_payer' | 'frequent_borrower' | 'overdue' | null {
  if (!lastTransactionDate || outstandingBalance === 0) return null;

  const daysSinceLastTransaction = Math.floor(
    (Date.now() - new Date(lastTransactionDate).getTime()) /
      (1000 * 60 * 60 * 24),
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
  const results = await db.getAllAsync<Customer>(
    `SELECT 
			c.*,
			COALESCE(ct.total_credits, 0) as total_credits,
			COALESCE(p.total_payments, 0) as total_payments,
			COALESCE(ct.outstanding_balance, 0) as outstanding_balance,
			MAX(ct.last_credit_date, p.last_payment_date) as last_transaction_date
		FROM customers c
		LEFT JOIN (
			SELECT 
				customer_id,
				SUM(CASE WHEN status != 'paid' THEN amount ELSE 0 END) as total_credits,
				SUM(CASE WHEN status != 'paid' THEN amount - amount_paid ELSE 0 END) as outstanding_balance,
				MAX(date) as last_credit_date
			FROM credit_transactions
			GROUP BY customer_id
		) ct ON c.id = ct.customer_id
		LEFT JOIN (
			SELECT 
				customer_id,
				SUM(amount) as total_payments,
				MAX(date) as last_payment_date
			FROM payments
			GROUP BY customer_id
		) p ON c.id = p.customer_id
		WHERE c.name LIKE ? OR c.phone LIKE ?
		GROUP BY c.id
		ORDER BY c.name ASC`,
    [`%${query}%`, `%${query}%`],
  );

  return results.map((r) => {
    const totalSpent = (r.total_credits || 0) + (r.total_payments || 0);
    const loyalty_tier = calculateLoyaltyTier(
      r.total_credits > 0 ? 5 : 1,
      totalSpent,
    );
    return {
      ...r,
      loyalty_tier,
      tag: calculateCustomerTag(r.outstanding_balance, r.last_transaction_date),
    };
  });
};

export const calculateLoyaltyTier = (
  orderCount: number,
  totalSpent: number,
): LoyaltyTier => {
  if (orderCount >= 50 || totalSpent >= 25000) return 'elite';
  if (orderCount >= 25 || totalSpent >= 10000) return 'vip';
  if (orderCount >= 10 || totalSpent >= 2500) return 'loyal';
  if (orderCount >= 3 || totalSpent >= 500) return 'regular';
  return 'new';
};

export const getCustomerTimeline = async (
  customerId: number,
): Promise<CustomerTimelineItem[]> => {
  const credits = await db.getAllAsync<{
    id: number;
    amount: number;
    product_name: string | null;
    date: string;
    notes: string | null;
  }>(
    `SELECT id, amount, product_name, date, notes 
       FROM credit_transactions 
      WHERE customer_id = ? 
      ORDER BY date DESC`,
    [customerId],
  );

  const payments = await db.getAllAsync<{
    id: number;
    amount: number;
    payment_method: string | null;
    date: string;
    notes: string | null;
  }>(
    `SELECT id, amount, payment_method, date, notes 
       FROM payments 
      WHERE customer_id = ? 
      ORDER BY date DESC`,
    [customerId],
  );

  const timeline: CustomerTimelineItem[] = [];

  for (const c of credits) {
    const details = c.product_name || c.notes;
    timeline.push({
      id: `credit-${c.id}`,
      type: 'credit',
      amount: c.amount,
      date: c.date,
      description: 'Added Credit',
      ...(details ? { details } : {}),
    });
  }

  for (const p of payments) {
    timeline.push({
      id: `payment-${p.id}`,
      type: 'payment',
      amount: p.amount,
      date: p.date,
      description: 'Paid Credit',
      ...(p.payment_method ? { details: `Method: ${p.payment_method}` } : {}),
    });
  }

  return timeline.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
};

export const getCustomerFavoriteProduct = async (
  customerId: number,
): Promise<string | null> => {
  const result = await db.getFirstAsync<{ product_name: string }>(
    `SELECT product_name, COUNT(*) as cnt 
       FROM credit_transactions 
      WHERE customer_id = ? AND product_name IS NOT NULL 
      GROUP BY product_name 
      ORDER BY cnt DESC 
      LIMIT 1`,
    [customerId],
  );
  return result?.product_name ?? null;
};

export const getCustomerInsights = async (): Promise<CustomerInsights> => {
  const customers = await getAllCustomers('all', 'name_asc');

  const topSpenders = [...customers]
    .map((c) => ({
      ...c,
      total_spent: c.total_credits + c.total_payments,
    }))
    .sort((a, b) => b.total_spent - a.total_spent)
    .slice(0, 5);

  const frequentBuyers = [...customers]
    .map((c) => ({
      ...c,
      total_orders: Math.ceil((c.total_credits + c.total_payments) / 150) || 1,
    }))
    .sort((a, b) => b.total_orders - a.total_orders)
    .slice(0, 5);

  const loyaltyDistribution = {
    new: 0,
    regular: 0,
    loyal: 0,
    vip: 0,
    elite: 0,
  } satisfies Record<LoyaltyTier, number>;

  for (const c of customers) {
    const totalSpent = c.total_credits + c.total_payments;
    const tier = calculateLoyaltyTier(c.total_credits > 0 ? 5 : 1, totalSpent);
    loyaltyDistribution[tier] += 1;
  }

  const kpis = await getCreditKPIs();
  const totalIssued = kpis.totalOutstanding + kpis.totalCollectedToday;
  const creditRecoveryRate =
    totalIssued > 0
      ? Math.round((kpis.totalCollectedToday / totalIssued) * 100)
      : 100;

  return {
    topSpenders,
    frequentBuyers,
    loyaltyDistribution,
    creditRecoveryRate,
    averageOrderValue: 185,
  };
};

/**
 * Returns a live credit-guardrail summary for a single customer.
 *
 * Three reads, no transaction — pure reads with no side effects.
 * isNearLimit and wouldExceedLimit are derived here from balance only
 * (no pendingTotal — callers project the cart total at their layer).
 *
 * Money is integer pesos throughout; no float arithmetic.
 */
export const getCustomerCreditSummary = async (
  customerId: number,
): Promise<CustomerCreditSummary | null> => {
  // 1. Customer config row
  const configRow = await db.getFirstAsync<{
    id: number;
    credit_limit: number | null;
    block_on_exceed: number;
    overdue_threshold_days: number;
  }>(
    `SELECT id, credit_limit, block_on_exceed, overdue_threshold_days
     FROM customers WHERE id = ?`,
    [customerId],
  );
  if (!configRow) return null;

  const creditLimit = configRow.credit_limit ?? null;
  const blockOnExceed = configRow.block_on_exceed === 1;
  const overdueThresholdDays = configRow.overdue_threshold_days;

  // 2. Balance — canonical query matching getOutstandingBalance
  const balanceRow = await db.getFirstAsync<{ balance: number }>(
    `SELECT COALESCE(SUM(amount - amount_paid), 0) AS balance
     FROM credit_transactions
     WHERE customer_id = ? AND status != 'paid'`,
    [customerId],
  );
  const balance = balanceRow?.balance ?? 0;

  // 3. Overdue — oldest unpaid past-due credit
  const overdueRow = await db.getFirstAsync<{
    days_overdue: number | null;
    oldest_due_date: string | null;
  }>(
    `SELECT MIN(julianday('now') - julianday(due_date)) AS days_overdue,
            MIN(due_date) AS oldest_due_date
     FROM credit_transactions
     WHERE customer_id = ? AND status != 'paid'
       AND due_date IS NOT NULL
       AND due_date < date('now')`,
    [customerId],
  );

  const rawDaysOverdue = overdueRow?.days_overdue ?? null;
  const overdueDays =
    rawDaysOverdue !== null ? Math.floor(rawDaysOverdue) : null;
  const oldestUnpaidDueDate = overdueRow?.oldest_due_date ?? null;
  const isOverdue = overdueDays !== null && overdueDays > overdueThresholdDays;

  // JS derivations — no pendingTotal here (callers apply projection)
  const availableCredit = creditLimit === null ? null : creditLimit - balance;

  const isNearLimit =
    creditLimit !== null &&
    availableCredit !== null &&
    availableCredit / creditLimit <= 0.2;

  const wouldExceedLimit =
    creditLimit !== null && availableCredit !== null && availableCredit < 0;

  return {
    customerId,
    balance,
    creditLimit,
    availableCredit,
    blockOnExceed,
    oldestUnpaidDueDate,
    overdueDays,
    overdueThresholdDays,
    isOverdue,
    isNearLimit,
    wouldExceedLimit,
  };
};

/**
 * Returns a ranked list of customers who owe money, bucketed by collection
 * priority: overdue (oldest first) → near_limit (highest % consumed first)
 * → oldest_balance (longest outstanding balance first).
 *
 * Eligibility: customer must have outstanding_balance > 0.
 *
 * Money is integer pesos throughout; no float arithmetic on balances.
 */
export const getCollectionQueue = async (
  params: CollectionQueueParams = {},
): Promise<CollectionQueueRow[]> => {
  const { overdueDays = 1, nearLimitPct = 0.2 } = params;

  type RawRow = {
    customer_id: number;
    name: string;
    phone: string | null;
    photo_uri: string | null;
    credit_limit: number | null;
    overdue_threshold_days: number;
    outstanding_balance: number;
    days_overdue: number | null;
    oldest_due_date: string | null;
    last_transaction_date: string | null;
    // collection_followups (LEFT JOIN; may be null)
    cf_id: number | null;
    cf_follow_up_by: string | null;
    cf_contacts_today: number | null;
    cf_last_contact_at: string | null;
  };

  const rows = await db.getAllAsync<RawRow>(
    `SELECT
       c.id AS customer_id,
       c.name,
       c.phone,
       c.photo_uri,
       c.credit_limit,
       c.overdue_threshold_days,
       COALESCE(SUM(CASE WHEN ct.status != 'paid' THEN ct.amount - ct.amount_paid ELSE 0 END), 0) AS outstanding_balance,
       (SELECT CAST(MAX(julianday('now') - julianday(ct2.due_date)) AS INTEGER)
          FROM credit_transactions ct2
          WHERE ct2.customer_id = c.id
            AND ct2.status != 'paid'
            AND ct2.due_date IS NOT NULL
            AND ct2.due_date < date('now')) AS days_overdue,
       (SELECT MIN(ct2.due_date)
          FROM credit_transactions ct2
          WHERE ct2.customer_id = c.id
            AND ct2.status != 'paid'
            AND ct2.due_date IS NOT NULL) AS oldest_due_date,
       (SELECT MAX(ct2.date)
          FROM credit_transactions ct2
          WHERE ct2.customer_id = c.id
            AND ct2.status != 'paid') AS last_transaction_date,
       cf.id AS cf_id,
       cf.follow_up_by AS cf_follow_up_by,
       cf.contacts_today AS cf_contacts_today,
       cf.last_contact_at AS cf_last_contact_at
     FROM customers c
     LEFT JOIN credit_transactions ct ON ct.customer_id = c.id
     LEFT JOIN collection_followups cf ON cf.customer_id = c.id
     GROUP BY c.id
     HAVING outstanding_balance > 0`,
  );

  const enriched = rows.map((r) => {
    const balance = r.outstanding_balance;
    const creditLimit = r.credit_limit;
    const nearLimitPctUsed =
      creditLimit != null && creditLimit > 0 ? balance / creditLimit : 0;
    const isNearLimit =
      creditLimit != null && 1 - nearLimitPctUsed <= nearLimitPct;
    const overdueDaysActual = r.days_overdue ?? 0;
    const isOverdue = overdueDaysActual >= overdueDays;
    const bucket: CollectionBucket = isOverdue
      ? 'overdue'
      : isNearLimit
        ? 'near_limit'
        : 'oldest_balance';

    return {
      customerId: r.customer_id,
      name: r.name,
      phone: r.phone,
      photoUri: r.photo_uri,
      creditLimit,
      balance,
      availableCredit:
        creditLimit != null ? Math.max(creditLimit - balance, 0) : null,
      oldestUnpaidDueDate: r.oldest_due_date,
      overdueDays: overdueDaysActual,
      overdueThresholdDays: r.overdue_threshold_days,
      isNearLimit,
      nearLimitPctUsed,
      bucket,
      lastTransactionDate: r.last_transaction_date,
      followUp:
        r.cf_id != null
          ? {
              followUpBy: r.cf_follow_up_by,
              contactsToday: r.cf_contacts_today ?? 0,
              lastContactAt: r.cf_last_contact_at,
            }
          : null,
    };
  }) satisfies CollectionQueueRow[];

  const bucketPriority = {
    overdue: 0,
    near_limit: 1,
    oldest_balance: 2,
  } satisfies Record<CollectionBucket, number>;

  enriched.sort((a, b) => {
    const bp = bucketPriority[a.bucket] - bucketPriority[b.bucket];
    if (bp !== 0) return bp;
    if (a.bucket === 'overdue') return b.overdueDays - a.overdueDays;
    if (a.bucket === 'near_limit')
      return b.nearLimitPctUsed - a.nearLimitPctUsed;

    if (a.lastTransactionDate == null) return -1;
    if (b.lastTransactionDate == null) return 1;
    return a.lastTransactionDate.localeCompare(b.lastTransactionDate);
  });

  return enriched;
};

/**
 * Reads the collection_followups row for a customer.
 * Returns null if no follow-up has been set yet.
 */
export const getCollectionFollowUp = async (
  customerId: number,
): Promise<CollectionFollowUp | null> => {
  const row = await db.getFirstAsync<{
    customer_id: number;
    follow_up_by: string | null;
    contacts_today: number;
    last_contact_at: string | null;
    status: 'open' | 'closed';
  }>(
    `SELECT customer_id, follow_up_by, contacts_today, last_contact_at, status
       FROM collection_followups
       WHERE customer_id = ?`,
    [customerId],
  );
  if (!row) return null;
  return {
    customerId: row.customer_id,
    followUpBy: row.follow_up_by,
    contactsToday: row.contacts_today,
    lastContactAt: row.last_contact_at,
    status: row.status,
  };
};

/**
 * Upsert: sets the follow-up date for a customer.
 * Pass `followUpBy: null` to clear.
 * Creates the row if it does not exist.
 */
export const setCollectionFollowUp = async ({
  customerId,
  followUpBy,
}: {
  customerId: number;
  followUpBy: string | null;
}): Promise<void> => {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT OR IGNORE INTO collection_followups (customer_id, status)
         VALUES (?, 'open');`,
      [customerId],
    );
    await db.runAsync(
      `UPDATE collection_followups
         SET follow_up_by = ?,
             status = CASE WHEN ? IS NOT NULL THEN 'open' ELSE status END,
             updated_at = CURRENT_TIMESTAMP
         WHERE customer_id = ?;`,
      [followUpBy, followUpBy, customerId],
    );
  });
};

/**
 * Records that the owner contacted the customer today.
 * Increments contacts_today if last_contact_at is from today; otherwise
 * resets to 1 and updates last_contact_at. Sets status='closed'.
 */
export const markCollectionContacted = async (
  customerId: number,
): Promise<void> => {
  const today = new Date().toDateString();
  await db.withTransactionAsync(async () => {
    const existing = await db.getFirstAsync<{
      contacts_today: number;
      last_contact_at: string | null;
    }>(
      `SELECT contacts_today, last_contact_at
         FROM collection_followups
         WHERE customer_id = ?`,
      [customerId],
    );

    if (!existing) {
      await db.runAsync(
        `INSERT INTO collection_followups
           (customer_id, contacts_today, last_contact_at, status)
           VALUES (?, 1, CURRENT_TIMESTAMP, 'closed');`,
        [customerId],
      );
      return;
    }

    const sameDay =
      existing.last_contact_at != null &&
      new Date(
        existing.last_contact_at.replace(' ', 'T') + 'Z',
      ).toDateString() === today;

    const nextCount = sameDay ? existing.contacts_today + 1 : 1;

    await db.runAsync(
      `UPDATE collection_followups
         SET contacts_today = ?,
             last_contact_at = CURRENT_TIMESTAMP,
             status = 'closed',
             updated_at = CURRENT_TIMESTAMP
         WHERE customer_id = ?;`,
      [nextCount, customerId],
    );
  });
};
