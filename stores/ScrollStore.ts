import { create } from 'zustand';

interface ScrollState {
	state: 'visible' | 'hidden';
	setTabVisibility: (visibility: 'visible' | 'hidden') => void;
}

export const useTabVisibilityStore = create<ScrollState>((set) => ({
	state: 'visible',
	setTabVisibility: (visibility) => set({ state: visibility }),
}));
