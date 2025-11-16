import { Modal } from '@/types/ui/Modal.types';
import { create } from 'zustand';

interface State {
	modals: Modal[];
	openModal: (modal: Omit<Modal, 'id'>) => void;
	closeModal: (id: string) => void;
	closeAllModals: () => void;
	updateModal: (id: string, updatedProps: Partial<Modal>) => void;
}

export const useModalStore = create<State>((set) => ({
	modals: [],

	openModal: (modal) => {
		const id = `modal-${Date.now()}-${Math.random()
			.toString(36)
			.substring(2, 9)}`;
		const newModal: Modal = {
			...modal,
			id,
			size: modal.size || 'md',
			closeOnOverlay: modal.closeOnOverlay ?? true,
			closeOnEscape: modal.closeOnEscape ?? true,
			showCloseButton: modal.showCloseButton ?? true,
		};

		set((state) => ({ modals: [...state.modals, newModal] }));
		return id;
	},

	closeModal: (id) =>
		set((state) => {
			const modal = state.modals.find((m) => m.id === id);
			if (modal?.onClose) modal.onClose();
			return { modals: state.modals.filter((m) => m.id !== id) };
		}),

	closeAllModals: () =>
		set((state) => {
			state.modals.forEach((modal) => modal.onClose?.());
			return { modals: [] };
		}),

	updateModal: (id, updates) =>
		set((state) => ({
			modals: state.modals.map((modal) =>
				modal.id === id ? { ...modal, ...updates } : modal
			),
		})),
}));
