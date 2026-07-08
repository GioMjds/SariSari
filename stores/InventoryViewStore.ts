import { create } from 'zustand';

type ViewMode = 'list' | 'grid';

interface InventoryViewState {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export const useInventoryViewStore = create<InventoryViewState>((set) => ({
  viewMode: 'list',
  setViewMode: (viewMode) => set({ viewMode }),
}));
