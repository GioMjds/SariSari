import { Pesos } from '@/lib/money';

export type CashSessionStatus = 'open' | 'closed';

export interface CashSession {
  id: string;
  businessDate: string;
  openingCash: Pesos;
  actualCash: Pesos | null;
  expectedCash: Pesos | null;
  variance: Pesos | null;
  status: CashSessionStatus;
  openingTimestamp: string;
  closingTimestamp: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface CashSessionSummary {
  session: CashSession | null;
  expectedCash: Pesos;
  cashSales: Pesos;
  cashUtangPayments: Pesos;
  ownerAdditions: Pesos;
  expenses: Pesos;
  ownerDrawings: Pesos;
}

export type CashEntryType = 'expense' | 'owner_drawing' | 'owner_addition';

export interface CashEntry {
  id: string;
  sessionId: string;
  type: CashEntryType;
  amount: Pesos;
  notes: string;
  timestamp: string;
  createdAt: number;
}

export interface NewCashEntry {
  type: CashEntryType;
  amount: Pesos;
  notes: string;
}
