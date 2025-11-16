import { ContextMenu, ContextMenuItem } from '@/types/ui/ContextMenu.types';
import { create } from 'zustand';

interface State {
	activeMenu: ContextMenu | null;
	openContextMenu: (
		id: string,
		x: number,
		y: number,
		items: ContextMenuItem[]
	) => void;
	closeContextMenu: () => void;
	isContextMenuOpen: (id: string) => boolean;
}

export const useContextMenuStore = create<State>((set, get) => ({
	activeMenu: null,

	openContextMenu: (id, x, y, items) =>
		set({
			activeMenu: {
				id,
				x,
				y,
				items,
			},
		}),

	closeContextMenu: () => set({ activeMenu: null }),

	isContextMenuOpen: (id) => get().activeMenu?.id === id,
}));
