import { useModalStore } from '@/stores/ModalStore';
import { AlertButton, AlertOptions } from 'react-native';
import { ModalButton } from '@/types/ui/Modal.types';

const alert = (
	title: string,
	message?: string,
	buttons?: AlertButton[],
	options?: AlertOptions
) => {
	const { openModal } = useModalStore.getState();

	const modalButtons: ModalButton[] = buttons
		? buttons.map((btn) => ({
				text: btn.text || 'OK',
				style: btn.style,
				onPress: btn.onPress,
		  }))
		: [{ text: 'OK', style: 'default' }];

	// Determine variant based on buttons or content
	// If there is a destructive button, set variant to danger
	const hasDestructive = modalButtons.some((b) => b.style === 'destructive');
	const variant = hasDestructive ? 'danger' : 'default';

	openModal({
		title,
		description: message,
		buttons: modalButtons,
		variant,
		closeOnOverlay: options?.cancelable ?? true,
		closeOnEscape: options?.cancelable ?? true,
		onClose: options?.onDismiss,
	});
};

export const Alert = {
	alert,
};
