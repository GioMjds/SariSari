import { StocktakeReason } from '@/configs/stocktakeReasons';

export type StocktakeStatus = 'in_progress' | 'completed' | 'abandoned';

type ReasonPerLine = {
  reasonCode: StocktakeReason;
  note?: string;
};

export interface StocktakeSession {
  id: string;
  startedAt: string;
  endedAt: string | null;
  status: StocktakeStatus;
  note: string | null;
  totalProductsCounted: number;
  totalVariancePesos: number;
  createdAt: number;
  updatedAt: number;
}

export interface StocktakeCount {
  id: string;
  sessionId: string;
  productId: number;
  expectedQty: number;
  countedQty: number;
  costPriceAtCount: number | null;
  reasonCode: StocktakeReason | null;
  note: string | null;
  committedAt: string | null;
}

export interface UpsertCountInput {
  sessionId: string;
  productId: number;
  expectedQty: number;
  countedQty: number;
}

export type CommitReasonPerLine = Record<number, ReasonPerLine>;
