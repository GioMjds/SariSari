export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipPosition {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface Tooltip {
	id: string;
	content: string;
	placement?: TooltipPlacement;
	visible: boolean;
	position?: TooltipPosition;
	delay?: number;
}