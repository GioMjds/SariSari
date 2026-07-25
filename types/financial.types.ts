import { Pesos } from '@/lib/money';

export type FinancialEntryType = 'expense' | 'owner_drawing';
export type ExpenseCategory =
  | 'transport'
  | 'utilities'
  | 'supplies_packaging'
  | 'rent'
  | 'repairs'
  | 'other';

export interface FinancialEntry {
  id: string;
  type: FinancialEntryType;
  amount: Pesos;
  businessDate: string;
  expenseCategory: ExpenseCategory | null;
  note: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface FinancialTotals {
  paidExpenses: Pesos;
  ownerDrawings: Pesos;
}

export interface NewFinancialEntry {
  type: FinancialEntryType;
  amount: Pesos;
  businessDate: string;
  expenseCategory: ExpenseCategory | null;
  note?: string | null;
}

export interface UpdateFinancialEntry {
  type?: FinancialEntryType;
  amount?: Pesos;
  businessDate?: string;
  expenseCategory?: ExpenseCategory | null;
  note?: string | null;
}
