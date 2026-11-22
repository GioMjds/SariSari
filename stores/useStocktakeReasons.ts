import { create } from 'zustand';
import type { StocktakeReason } from '@/configs/stocktakeReasons';

export interface StocktakeReasonLine {
  reasonCode: StocktakeReason;
  note: string;
}

interface StocktakeReasonsState {
  sessionId: string | null;
  reasons: Record<number, StocktakeReasonLine>;
  setLine: (
    sessionId: string,
    productId: number,
    patch: Partial<StocktakeReasonLine>,
  ) => void;
}

// Keeps variance reasons while the owner moves between the count and review screens.
export const useStocktakeReasons = create<StocktakeReasonsState>((set) => ({
  sessionId: null,
  reasons: {},
  setLine: (sessionId, productId, patch) =>
    set((s) => {
      const reasons = s.sessionId === sessionId ? s.reasons : {};
      const prev = reasons[productId];
      return {
        sessionId,
        reasons: {
          ...reasons,
          [productId]: {
            reasonCode: patch.reasonCode ?? prev?.reasonCode ?? 'unexplained',
            note: patch.note ?? prev?.note ?? '',
          },
        },
      };
    }),
}));
