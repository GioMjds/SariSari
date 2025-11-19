import { ReactNode } from 'react';

export interface ModalButton {
	text: string;
	style?: 'default' | 'cancel' | 'destructive';
	onPress?: () => void;
}

export interface Modal {
	id: string;
	title?: string;
	description?: string;
	children?: ReactNode;
	buttons?: ModalButton[];
	variant?: 'default' | 'success' | 'warning' | 'danger';
	icon?: string; // FontAwesome icon name
	closeOnOverlay?: boolean;
	closeOnEscape?: boolean;
	showCloseButton?: boolean;
	onClose?: () => void;
	size?: 'sm' | 'md' | 'lg' | 'xl';
}
