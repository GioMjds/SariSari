import { create } from 'zustand';

interface State {
	openDropdownId: string | null;
	openDropdown: (id: string) => void;
	closeDropdown: () => void;
	toggleDropdown: (id: string) => void;
	isDropdownOpen: (id: string) => boolean;
}

export const useDropdownStore = create<State>((set, get) => ({
	openDropdownId: null,

	openDropdown: (id) => set({ openDropdownId: id }),

	closeDropdown: () => set({ openDropdownId: null }),

	toggleDropdown: (id) =>
		set((state) => ({
			openDropdownId: state.openDropdownId === id ? null : id,
		})),

	isDropdownOpen: (id) => get().openDropdownId === id,
}));
