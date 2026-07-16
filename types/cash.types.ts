export type CashSessionStatus = 'open' | 'closed';

export interface CashSession {
  id: string;
  businessDate: string;
  openingCash: number;
  actualCash: number | null;
  expectedCash: number | null;
  variance: number | null;
  status: CashSessionStatus;
  openingTimestamp: string;
  closingTimestamp: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface CashSessionSummary {
  session: CashSession | null;
  expectedCash: number;
  cashSales: number;
  cashUtangPayments: number;
  ownerAdditions: number;
  expenses: number;
  ownerDrawings: number;
}

export type CashEntryType = 'expense' | 'owner_drawing' | 'owner_addition';

export interface CashEntry {
  id: string;
  sessionId: string;
  type: CashEntryType;
  amount: number;
  notes: string;
  timestamp: string;
  createdAt: number;
}

export interface NewCashEntry {
  type: CashEntryType;
  amount: number;
  notes: string;
}
