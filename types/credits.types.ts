export type LoyaltyTier = 'new' | 'regular' | 'loyal' | 'vip' | 'elite';

export interface Customer {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  birthday?: string;
  photo_uri?: string;
  notes?: string;
  total_credits: number;
  total_payments: number;
  outstanding_balance: number;
  total_spent?: number;
  total_orders?: number;
  favorite_product?: string;
  last_transaction_date: string | null;
  credit_limit?: number;
  tag?: 'good_payer' | 'frequent_borrower' | 'overdue' | null;
  loyalty_tier?: LoyaltyTier;
  created_at: string;
  updated_at: string;
}

export interface NewCustomer {
  name: string;
  phone?: string;
  address?: string;
  birthday?: string;
  photo_uri?: string;
  notes?: string;
  credit_limit?: number;
}

export interface CreditTransaction {
  id: number;
  customer_id: number;
  product_id?: number | null;
  product_name?: string | null;
  quantity?: number | null;
  amount: number;
  status: 'unpaid' | 'partial' | 'paid';
  amount_paid: number;
  date: string;
  due_date?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewCredit {
  customer_id: number;
  product_id?: number | null;
  product_name?: string | null;
  quantity?: number | null;
  amount: number;
  due_date?: string | null;
  notes?: string | null;
  overrideReasonCode?: OverrideReasonCode;
  overrideReasonNote?: string | null;
}

export interface Payment {
  id: number;
  customer_id: number;
  credit_transaction_id?: number | null;
  amount: number;
  payment_method: 'cash' | 'bank_transfer' | 'other';
  date: string;
  notes?: string | null;
  created_at: string;
}

export interface NewPayment {
  customer_id: number;
  credit_transaction_id?: number | null;
  amount: number;
  payment_method: 'cash' | 'bank_transfer' | 'other';
  date?: string;
  notes?: string | null;
}

export interface CustomerWithDetails extends Customer {
  credits: CreditTransaction[];
  payments: Payment[];
  days_overdue?: number;
}

export interface CreditKPIs {
  totalOutstanding: number;
  totalCustomersWithBalance: number;
  mostOwedCustomer: { name: string; amount: number } | null;
  totalCollectedToday: number;
  totalCreditsToday: number;
  totalOverdueAmount: number;
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

export interface CustomerTimelineItem {
  id: string;
  type: 'sale' | 'credit' | 'payment';
  amount: number;
  date: string;
  description: string;
  details?: string;
}

export interface CustomerInsights {
  topSpenders: (Customer & { total_spent: number })[];
  frequentBuyers: (Customer & { total_orders: number })[];
  loyaltyDistribution: Record<LoyaltyTier, number>;
  creditRecoveryRate: number;
  averageOrderValue: number;
}

export type CreditFilter = 'all' | 'with_balance' | 'paid' | 'overdue';

export type ExtendedCreditFilter =
  | 'all'
  | 'recent'
  | 'with_balance'
  | 'paid'
  | 'loyal'
  | 'new'
  | 'inactive'
  | 'overdue';

export type CreditSort =
  'name_asc' | 'name_desc' | 'balance_desc' | 'balance_asc' | 'recent';

export type OverrideReasonCode = 
  | 'regular_customer'
  | 'long_term_suki'
  | 'partial_payment_promised'
  | 'owner_discretion'
  | 'other';

export interface CustomerCreditSummary {
  customerId: number;
  balance: number;
  creditLimit: number | null;
  availableCredit: number | null;
  blockOnExceed: boolean;
  oldestUnpaidDueDate: string | null;
  overdueDays: number | null;
  overdueThresholdDays: number;
  isOverdue: boolean;
  isNearLimit: boolean;
  wouldExceedLimit: boolean;
}
