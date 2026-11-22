import { create } from 'zustand';

interface AddCategorySheetState {
  open: boolean;
  show: () => void;
  hide: () => void;
}

/** One shared "New category" sheet, opened from the FAB, the products filters and the categories tab. */
export const useAddCategorySheet = create<AddCategorySheetState>((set) => ({
  open: false,
  show: () => set({ open: true }),
  hide: () => set({ open: false }),
}));
