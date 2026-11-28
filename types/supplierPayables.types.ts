export type SupplierPaymentMethod = 'cash' | 'bank_transfer' | 'other';

/** One debt to a supplier: a committed delivery receipt or an opening balance. */
export interface SupplierPayable {
  id: number;
  supplierId: string;
  receiptId: number | null; // null = opening balance
  invoiceNo: string | null;
  amount: number;
  amountPaid: number;
  dueDate: string | null; // YYYY-MM-DD
  createdAt: string;
}

export interface SupplierPayment {
  id: number;
  supplierId: string;
  amount: number;
  paymentMethod: SupplierPaymentMethod;
  businessDate: string; // YYYY-MM-DD
  notes: string | null;
  createdAt: string;
}

export interface NewSupplierPayment {
  supplierId: string;
  amount: number;
  paymentMethod: SupplierPaymentMethod;
  notes?: string | null;
}

/** Per-supplier total still owed, for the payables list. */
export interface SupplierBalance {
  supplierId: string;
  supplierName: string;
  paymentTermsDays: number | null;
  owed: number;
  openCount: number;
  nextDueDate: string | null;
}

export interface PayablesDueSummary {
  overdueCount: number;
  overdueAmount: number;
  dueSoonCount: number;
  dueSoonAmount: number;
}

/** Payment choice made when committing a delivery receipt. */
export interface CommitPaymentChoice {
  paidNow: boolean;
  /** Pay later only: YYYY-MM-DD, null for no due date, omitted to use supplier terms. */
  dueDate?: string | null;
}
