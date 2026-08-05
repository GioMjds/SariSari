import { create } from 'zustand';

interface InventorySelectionState {
  selectMode: boolean;
  selectedIds: Set<number>;
  enterSelectMode: (id: number) => void;
  toggle: (id: number) => void;
  selectAll: (ids: number[]) => void;
  clear: () => void;
}

export const useInventorySelection = create<InventorySelectionState>((set) => ({
  selectMode: false,
  selectedIds: new Set(),
  enterSelectMode: (id) =>
    set((s) => ({
      selectMode: true,
      selectedIds: new Set([...s.selectedIds, id]),
    })),
  toggle: (id) =>
    set((s) => {
      const next = new Set(s.selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedIds: next, selectMode: next.size > 0 };
    }),
  selectAll: (ids) => set({ selectMode: true, selectedIds: new Set(ids) }),
  clear: () => set({ selectMode: false, selectedIds: new Set() }),
}));
