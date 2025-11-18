import React, { FC, useEffect } from 'react';
import {
	View,
	TouchableWithoutFeedback,
	Modal as RNModal,
	type ModalProps as RNModalProps,
} from 'react-native';
import StyledText from '../elements/StyledText';
import { useModalStore } from '@/stores/ModalStore';

interface CustomModalProps extends Omit<RNModalProps, 'visible' | 'onRequestClose'> {
	id?: string;
	title?: string;
	description?: string;
	size?: 'sm' | 'md' | 'lg' | 'xl';
	closeOnOverlay?: boolean;
	closeOnEscape?: boolean;
	showCloseButton?: boolean;
	onClose?: () => void;
	children?: React.ReactNode;
}

const Modal: FC<CustomModalProps> = ({
	id,
	title,
	description,
	size = 'md',
	closeOnOverlay = true,
	closeOnEscape = true,
	showCloseButton = true,
	onClose,
	children,
	animationType = 'fade',
	transparent = true,
	presentationStyle,
	...rest
}) => {
	const { modals, closeModal } = useModalStore();
	const modal = id ? modals.find((m) => m.id === id) : null;
	const isVisible = !!modal;

	useEffect(() => {
		if (!isVisible || !closeOnEscape) return;

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				handleClose();
			}
		};

		if (typeof document !== 'undefined') {
			document.addEventListener('keydown', handleEscape);
			return () => document.removeEventListener('keydown', handleEscape);
		}
	}, [isVisible, closeOnEscape]);

	const handleClose = () => {
		if (id) closeModal(id);
		onClose?.();
	};

	const handleOverlayPress = () => {
		if (closeOnOverlay) {
			handleClose();
		}
	};

	const handleContentPress = (event: any) => {
		event.stopPropagation();
	};

	const getSizeClasses = () => {
		switch (size) {
			case 'sm':
				return 'max-w-sm w-11/12';
			case 'md':
				return 'max-w-md w-11/12';
			case 'lg':
				return 'max-w-lg w-11/12';
			case 'xl':
				return 'max-w-xl w-11/12';
			default:
				return 'max-w-md w-11/12';
		}
	};

	if (!isVisible) return null;

	return (
		<RNModal
			{...rest}
			visible={isVisible}
			transparent={transparent}
			animationType={animationType}
			presentationStyle={presentationStyle}
			onRequestClose={handleClose}
		>
			{/* Overlay */}
			<TouchableWithoutFeedback onPress={handleOverlayPress}>
				<View className="flex-1 justify-center items-center bg-black/50 p-4">
					{/* Modal Content */}
					<TouchableWithoutFeedback onPress={handleContentPress}>
						<View className={`bg-background rounded-2xl shadow-lg ${getSizeClasses()}`}>
							{/* Header */}
							{(title || description) && (
								<View className="p-6 border-b border-secondary/20">
									{title && (
										<StyledText className="text-primary text-xl font-stack-sans-semibold mb-2">
											{title}
										</StyledText>
									)}
									{description && (
										<StyledText className="text-text-secondary text-base font-stack-sans-light">
											{description}
										</StyledText>
									)}
								</View>
							)}

							{/* Close Button */}
							{showCloseButton && (
								<TouchableWithoutFeedback onPress={handleClose}>
									<View className="absolute top-4 right-4 z-10 w-8 h-8 justify-center items-center rounded-full bg-background border border-secondary/20">
										<StyledText className="text-primary text-lg font-stack-sans-bold">
											×
										</StyledText>
									</View>
								</TouchableWithoutFeedback>
							)}

							{/* Content */}
							<View className="p-6">{children}</View>
						</View>
					</TouchableWithoutFeedback>
				</View>
			</TouchableWithoutFeedback>
		</RNModal>
	);
};

export default Modal;