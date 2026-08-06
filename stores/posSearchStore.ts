import { create } from 'zustand';

/**
 * Search-bar state for the POS product catalog.
 *
 * Lives outside `useCart` so the search field can update without
 * re-rendering the parent screen. Subscribers are limited to:
 *   1. The TextInput inside `ProductSearchCatalog` (writes).
 *   2. The `usePaginatedProducts` hook inside `useCart` (reads via
 *      `useCartStore`-style subscription on `searchText`).
 *
 * AGENTS.md permits Zustand for transient UI state — a search input
 * qualifies.
 */
interface POSSearchState {
  searchText: string;
  setSearchText: (text: string) => void;
}

export const usePOSSearchStore = create<POSSearchState>((set) => ({
  searchText: '',
  setSearchText: (text) => set({ searchText: text }),
}));