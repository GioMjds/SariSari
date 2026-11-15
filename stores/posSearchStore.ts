import { create } from 'zustand';

interface POSSearchState {
  searchText: string;
  setSearchText: (text: string) => void;
}

export const usePOSSearchStore = create<POSSearchState>((set) => ({
  searchText: '',
  setSearchText: (text) => set({ searchText: text }),
}));