import { Toast } from '@/types/ui/Toast.types';
import { create } from 'zustand';

interface State {
	toasts: Toast[];
	addToast: (toast: Omit<Toast, 'id'>) => string;
	removeToast: (id: string) => void;
	clearToasts: () => void;
}

export const useToastStore = create<State>((set) => ({
	toasts: [],

	addToast: (toast) => {
        const id = `toast-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 11)}`;
		const newToast: Toast = {
			...toast,
			id,
			variant: toast.variant || 'default',
			duration: toast.duration || 3000,
			position: toast.position || 'bottom-right',
		};

		set((state) => ({ toasts: [...state.toasts, newToast] }));

		if (newToast.duration && newToast.duration > 0) {
			setTimeout(() => {
				set((state) => ({
					toasts: state.toasts.filter((t) => t.id !== id),
				}));
			}, newToast.duration);
		}

		return id;
	},

	removeToast: (id) =>
		set((state) => ({
			toasts: state.toasts.filter((toast) => toast.id !== id),
		})),

	clearToasts: () => set({ toasts: [] }),
}));
