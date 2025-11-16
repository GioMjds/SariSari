export interface Customer {
	id: number;
	name: string;
	phone?: string;
	address?: string;
	notes?: string;
	total_credits: number;
	total_payments: number;
	outstanding_balance: number;
	last_transaction_date: string | null;
	credit_limit?: number;
	tag?: 'good_payer' | 'frequent_borrower' | 'overdue' | null;
	created_at: string;
	updated_at: string;
}

export interface CreditTransaction {
	id: number;
	customer_id: number;
	product_id?: number;
	product_name?: string;
	quantity?: number;
	amount: number;
	status: 'unpaid' | 'partial' | 'paid';
	amount_paid: number;
	date: string;
	due_date?: string;
	notes?: string;
	created_at: string;
	updated_at: string;
}

export interface Payment {
	id: number;
	customer_id: number;
	credit_transaction_id?: number;
	amount: number;
	payment_method?: 'cash' | 'bank_transfer' | 'other';
	date: string;
	notes?: string;
	created_at: string;
}

export interface CustomerWithDetails extends Customer {
	credits: CreditTransaction[];
	payments: Payment[];
	days_overdue?: number;
}

export interface CreditKPIs {
	totalOutstanding: number;
	totalCustomersWithBalance: number;
	mostOwedCustomer: {
		name: string;
		amount: number;
	} | null;
	totalCollectedToday: number;
	totalCreditsToday: number;
	overdueCount: number;
}

export interface CreditHistory {
	id: number;
	customer_id: number;
	type: 'credit' | 'payment';
	amount: number;
	running_balance: number;
	date: string;
	description: string;
	created_at: string;
}

export type CreditFilter = 'all' | 'with_balance' | 'paid' | 'overdue';
export type CreditSort = 'balance_desc' | 'balance_asc' | 'recent' | 'name_asc' | 'name_desc';

export interface NewCredit {
	customer_id: number;
	product_id?: number;
	product_name?: string;
	quantity?: number;
	amount: number;
	due_date?: string;
	notes?: string;
}

export interface NewPayment {
	customer_id: number;
	credit_transaction_id?: number;
	amount: number;
	payment_method?: 'cash' | 'bank_transfer' | 'other';
	date?: string;
	notes?: string;
}

export interface NewCustomer {
	name: string;
	phone?: string;
	address?: string;
	notes?: string;
	credit_limit?: number;
}
