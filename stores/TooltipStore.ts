import { Tooltip, TooltipPosition } from '@/types/ui/Tooltip.types';
import { create } from 'zustand';

interface State {
	tooltips: Map<string, Tooltip>;
	showTooltip: (
		id: string,
		content: string,
		config?: Partial<Tooltip>
	) => void;
	hideTooltip: (id: string) => void;
	updateTooltipPosition: (id: string, position: TooltipPosition) => void;
	isTooltipVisible: (id: string) => boolean;
}

export const useTooltipStore = create<State>((set, get) => ({
	tooltips: new Map(),

	showTooltip: (id, content, config = {}) => {
		const delay = config.delay || 200;

		setTimeout(() => {
			set((state) => {
				const newTooltips = new Map(state.tooltips);
				newTooltips.set(id, {
					id,
					content,
					placement: config.placement || 'top',
					visible: true,
					...config,
				});
				return { tooltips: newTooltips };
			});
		}, delay);
	},

	hideTooltip: (id) =>
		set((state) => {
			const newTooltips = new Map(state.tooltips);
			newTooltips.delete(id);
			return { tooltips: newTooltips };
		}),

	updateTooltipPosition: (id, position) =>
		set((state) => {
			const newTooltips = new Map(state.tooltips);
			const tooltip = newTooltips.get(id);
			if (tooltip) {
				newTooltips.set(id, { ...tooltip, position });
			}
			return { tooltips: newTooltips };
		}),

	isTooltipVisible: (id) => get().tooltips.get(id)?.visible || false,
}));
