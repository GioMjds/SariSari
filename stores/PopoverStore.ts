import { Popover, PopoverPosition } from '@/types/ui/Popover.types';
import { create } from 'zustand';

interface State {
	popovers: Map<string, Popover>;
	openPopover: (id: string, config?: Partial<Popover>) => void;
	closePopover: (id: string) => void;
	togglePopover: (id: string, config?: Partial<Popover>) => void;
	isPopoverOpen: (id: string) => boolean;
	updatePosition: (id: string, position: PopoverPosition) => void;
	closeAllPopovers: () => void;
}

export const usePopoverStore = create<State>((set, get) => ({
	popovers: new Map(),

	openPopover: (id, config = {}) =>
		set((state) => {
			const newPopovers = new Map(state.popovers);
			newPopovers.set(id, {
				id,
				placement: config.placement || 'bottom',
				offset: config.offset || 8,
				closeOnClickOutside: config.closeOnClickOutside ?? true,
				...config,
			});
			return { popovers: newPopovers };
		}),

	closePopover: (id) =>
		set((state) => {
			const newPopovers = new Map(state.popovers);
			newPopovers.delete(id);
			return { popovers: newPopovers };
		}),

	togglePopover: (id, config = {}) => {
		const { isPopoverOpen, openPopover, closePopover } = get();
		if (isPopoverOpen(id)) {
			closePopover(id);
		} else {
			openPopover(id, config);
		}
	},

	isPopoverOpen: (id) => get().popovers.has(id),

	updatePosition: (id, position) =>
		set((state) => {
			const newPopovers = new Map(state.popovers);
			const popover = newPopovers.get(id);
			if (popover) {
				newPopovers.set(id, { ...popover, position });
			}
			return { popovers: newPopovers };
		}),

	closeAllPopovers: () => set({ popovers: new Map() }),
}));
