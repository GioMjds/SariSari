import React, { FC, useEffect } from 'react';
import {
	View,
	TouchableWithoutFeedback,
	Modal as RNModal,
	Pressable,
	ActivityIndicator,
	type ModalProps as RNModalProps,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import StyledText from '../elements/StyledText';
import { useModalStore } from '@/stores/ModalStore';
import { ModalButton } from '@/types/ui/Modal.types';

interface CustomModalProps extends Omit<RNModalProps, 'visible' | 'onRequestClose'> {
	id?: string;
	visible?: boolean;
	title?: string;
	description?: string;
	buttons?: ModalButton[];
	variant?: 'default' | 'success' | 'warning' | 'danger';
	icon?: keyof typeof FontAwesome.glyphMap;
	size?: 'sm' | 'md' | 'lg' | 'xl';
	closeOnOverlay?: boolean;
	closeOnEscape?: boolean;
	showCloseButton?: boolean;
	onClose?: () => void;
	children?: React.ReactNode;
	loading?: boolean;
}

const Modal: FC<CustomModalProps> = ({
	id,
	visible,
	title,
	description,
	buttons,
	variant = 'default',
	icon,
	size = 'sm',
	closeOnOverlay = true,
	closeOnEscape = true,
	showCloseButton = true,
	onClose,
	children,
	loading = false,
	animationType = 'fade',
	transparent = true,
	presentationStyle,
	...rest
}) => {
	const { modals, closeModal } = useModalStore();
	
	// Determine if we are using store or props
	const storeModal = id ? modals.find((m) => m.id === id) : null;
	
	// Merge props: store takes precedence if id is present
	const isVisible = id ? !!storeModal : !!visible;
	const finalTitle = storeModal?.title ?? title;
	const finalDescription = storeModal?.description ?? description;
	const finalButtons = storeModal?.buttons ?? buttons;
	const finalVariant = storeModal?.variant ?? variant;
	const finalIcon = storeModal?.icon ? (storeModal.icon as keyof typeof FontAwesome.glyphMap) : icon;
	const finalChildren = storeModal?.children ?? children;
	const finalCloseOnOverlay = storeModal?.closeOnOverlay ?? closeOnOverlay;
	const finalShowCloseButton = storeModal?.showCloseButton ?? showCloseButton;

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
		if (finalCloseOnOverlay) {
			handleClose();
		}
	};

	const handleContentPress = (event: any) => {
		event.stopPropagation();
	};

	const getSizeClasses = () => {
		switch (size) {
			case 'sm':
				return 'max-w-sm w-full';
			case 'md':
				return 'max-w-md w-full';
			case 'lg':
				return 'max-w-lg w-full';
			case 'xl':
				return 'max-w-xl w-full';
			default:
				return 'max-w-md w-full';
		}
	};

	const getVariantStyles = () => {
		switch (finalVariant) {
			case 'danger':
				return {
					iconBg: 'bg-red-100',
					iconColor: '#dc2626',
					defaultIcon: 'exclamation-triangle',
				};
			case 'success':
				return {
					iconBg: 'bg-green-100',
					iconColor: '#16a34a',
					defaultIcon: 'check-circle',
				};
			case 'warning':
				return {
					iconBg: 'bg-yellow-100',
					iconColor: '#ca8a04',
					defaultIcon: 'exclamation-circle',
				};
			default:
				return {
					iconBg: 'bg-primary/10',
					iconColor: '#2E073F',
					defaultIcon: 'info-circle',
				};
		}
	};

	const variantStyles = getVariantStyles();
	const displayIcon = finalIcon || variantStyles.defaultIcon;

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
			<TouchableWithoutFeedback onPress={handleOverlayPress}>
				<View className="flex-1 bg-black/40 justify-center items-center px-6">
					<TouchableWithoutFeedback onPress={handleContentPress}>
						<View className={`bg-white rounded-2xl p-6 ${getSizeClasses()}`}>
							{/* Header / Icon */}
							{(finalTitle || finalDescription || finalIcon || finalVariant !== 'default') && (
								<View className="items-center mb-4">
									{(finalIcon || finalVariant !== 'default') && (
										<View className={`${variantStyles.iconBg} rounded-full p-4 mb-3`}>
											<FontAwesome
												name={displayIcon as any}
												size={32}
												color={variantStyles.iconColor}
											/>
										</View>
									)}
									{finalTitle && (
										<StyledText
											variant="extrabold"
											className="text-text-primary text-xl mb-2 text-center"
										>
											{finalTitle}
										</StyledText>
									)}
									{finalDescription && (
										<StyledText
											variant="regular"
											className="text-text-secondary text-sm text-center"
										>
											{finalDescription}
										</StyledText>
									)}
								</View>
							)}

							{/* Custom Content */}
							{finalChildren && <View className="mb-4">{finalChildren}</View>}

							{/* Buttons */}
							{finalButtons && finalButtons.length > 0 && (
								<View className="gap-3">
									{finalButtons.map((button: ModalButton, index: number) => {
										const isDestructive = button.style === 'destructive';
										const isCancel = button.style === 'cancel';
										
										let bgClass = 'bg-primary';
										let textClass = 'text-white';

										if (isDestructive) {
											bgClass = 'bg-red-600';
										} else if (isCancel) {
											bgClass = 'bg-gray-200';
											textClass = 'text-text-primary';
										}

										return (
											<Pressable
												key={index}
												onPress={() => {
													button.onPress?.();
													// If it's a store modal, we might want to close it automatically?
													// Usually Alert buttons close the alert.
													if (id) closeModal(id);
												}}
												disabled={loading}
												className={`${bgClass} rounded-xl py-3 active:opacity-70`}
											>
												{loading && index === 0 ? (
													<ActivityIndicator color="#fff" />
												) : (
													<StyledText
														variant={isCancel ? 'semibold' : 'extrabold'}
														className={`${textClass} text-center text-base`}
													>
														{button.text}
													</StyledText>
												)}
											</Pressable>
										);
									})}
								</View>
							)}

							{/* Close Button (if no buttons and showCloseButton is true) */}
							{finalShowCloseButton && (!finalButtons || finalButtons.length === 0) && (
								<Pressable
									onPress={handleClose}
									className="absolute top-4 right-4 z-10 w-8 h-8 justify-center items-center rounded-full bg-gray-100"
								>
									<StyledText className="text-gray-500 text-lg font-stack-sans-bold">
										×
									</StyledText>
								</Pressable>
							)}
						</View>
					</TouchableWithoutFeedback>
				</View>
			</TouchableWithoutFeedback>
		</RNModal>
	);
};

export default Modal;