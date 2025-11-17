export interface Toast {
	id: string;
	message: string;
	variant?: 'default' | 'success' | 'error' | 'info' | 'warning';
	duration?: number;
	position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}
