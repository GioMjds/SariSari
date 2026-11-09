import type { Pesos } from '@/lib/money';

export type DigitalWalletType =
  | 'gcash'
  | 'maya'
  | 'telco_load'
  | 'bank'
  | 'other';

export type DigitalTransactionType =
  | 'cash_in'
  | 'cash_out'
  | 'eload'
  | 'replenish'
  | 'adjustment';

export interface DigitalWallet {
  id: number;
  name: string;
  walletType: DigitalWalletType;
  currentBalance: Pesos;
  isActive: boolean;
  createdAt: string;
}

export interface NewDigitalWallet {
  name: string;
  walletType: DigitalWalletType;
  openingBalance: Pesos;
}

export interface UpdateDigitalWallet {
  name?: string;
  isActive?: boolean;
}

export interface DigitalTransaction {
  id: number;
  walletId: number;
  walletName: string;
  transactionType: DigitalTransactionType;
  principalAmount: Pesos;
  serviceFee: Pesos;
  walletDelta: number;
  cashDrawerDelta: number;
  referenceNumber: string | null;
  customerPhone: string | null;
  note: string | null;
  createdAt: string;
  voidedAt: string | null;
}

export interface NewDigitalTransaction {
  walletId: number;
  transactionType: DigitalTransactionType;
  principalAmount: Pesos;
  serviceFee?: Pesos;
  /** Replenish only: true when the money came out of the cash drawer. */
  fundedFromDrawer?: boolean;
  /** Adjustment only: signed correction applied to the wallet balance. */
  adjustmentDelta?: number;
  referenceNumber?: string | null;
  customerPhone?: string | null;
  note?: string | null;
}

export interface DigitalServicesSummary {
  serviceIncome: Pesos;
  transactionCount: number;
  cashDrawerNet: number;
  byType: Record<DigitalTransactionType, { count: number; fees: Pesos }>;
}

export interface CashMovement {
  source:
    | 'cash_sale'
    | 'utang_payment'
    | 'expense'
    | 'owner_drawing'
    | 'e_service';
  sourceId: string;
  businessDate: string;
  amountDelta: number;
  label: string;
}
