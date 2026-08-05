import { create } from 'zustand';

interface SheetSlice {
  productId: number | null;
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
  restock: { productId: null },
  damaged: { productId: null },
  adjust: { productId: null },

  requestRestock: (productId) => set({ restock: { productId } }),
  requestDamaged: (productId) => set({ damaged: { productId } }),
  requestAdjust: (productId) => set({ adjust: { productId } }),

  clearRestock: () => set({ restock: { productId: null } }),
  clearDamaged: () => set({ damaged: { productId: null } }),
  clearAdjust: () => set({ adjust: { productId: null } }),
}));
