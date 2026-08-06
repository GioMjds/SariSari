import { create } from 'zustand';

interface SheetSlice {
  productId: number | null;
  active: boolean;
}

interface StockSheetSignalState {
  restock: SheetSlice;
  damaged: SheetSlice;
  adjust: SheetSlice;

  requestRestock: (productId: number | null) => void;
  requestDamaged: (productId: number | null) => void;
  requestAdjust: (productId: number | null) => void;

  clearRestock: () => void;
  clearDamaged: () => void;
  clearAdjust: () => void;
}

export const useStockSheetSignal = create<StockSheetSignalState>((set) => ({
  restock: { productId: null, active: false },
  damaged: { productId: null, active: false },
  adjust: { productId: null, active: false },

  requestRestock: (productId) => set({ restock: { productId, active: true } }),
  requestDamaged: (productId) => set({ damaged: { productId, active: true } }),
  requestAdjust: (productId) => set({ adjust: { productId, active: true } }),

  clearRestock: () => set({ restock: { productId: null, active: false } }),
  clearDamaged: () => set({ damaged: { productId: null, active: false } }),
  clearAdjust: () => set({ adjust: { productId: null, active: false } }),
}));
