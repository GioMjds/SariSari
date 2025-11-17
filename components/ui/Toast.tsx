import StyledText from '@/components/elements/StyledText';
import { useToastStore } from '@/stores/ToastStore';
import React from 'react';
import { Animated, TouchableOpacity, View } from 'react-native';

export const ToastContainer = () => {
	const toasts = useToastStore((state) => state.toasts);
	const removeToast = useToastStore((state) => state.removeToast);

	const getVariantStyles = (variant?: string) => {
		switch (variant) {
			case 'success':
				return { bg: 'bg-green-500', icon: '✓' };
			case 'error':
				return { bg: 'bg-red-500', icon: '✕' };
			case 'info':
				return { bg: 'bg-blue-500', icon: 'ℹ' };
			case 'warning':
				return { bg: 'bg-yellow-500', icon: '⚠' };
			default:
				return { bg: 'bg-primary', icon: '•' };
		}
	};

	const getPositionStyle = (position?: string) => {
		const baseStyle = {
			position: 'absolute' as const,
			left: 24,
			right: 24,
			zIndex: 9999,
		};

		switch (position) {
			case 'top-left':
				return { ...baseStyle, left: 24, top: 24, right: undefined };
			case 'top-center':
				return { ...baseStyle, top: 24 };
			case 'top-right':
				return { ...baseStyle, top: 24, right: 24, left: undefined };
			case 'bottom-left':
				return { ...baseStyle, bottom: 32, left: 24, right: undefined };
			case 'bottom-center':
				return { ...baseStyle, bottom: 32 };
			case 'bottom-right':
			default:
				return { ...baseStyle, bottom: 32, right: 24, left: undefined };
		}
	};

	if (toasts.length === 0) return null;

	return (
		<View pointerEvents="box-none" style={{ position: 'absolute', inset: 0 }}>
			{toasts.map((toast) => {
				const variantStyles = getVariantStyles(toast.variant);
				const positionStyle = getPositionStyle(toast.position);

				return (
					<Animated.View
						key={toast.id}
						style={positionStyle}
						pointerEvents="auto"
					>
						<View className={`${variantStyles.bg} px-5 py-3 rounded-xl shadow-lg flex-row items-center gap-3`}>
							<StyledText variant="semibold" className="text-white text-sm">
								{variantStyles.icon}
							</StyledText>
							<StyledText
								variant="medium"
								className="text-white text-sm flex-1"
								numberOfLines={2}
							>
								{toast.message}
							</StyledText>
							<TouchableOpacity
								onPress={() => removeToast(toast.id)}
								hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
							>
								<StyledText variant="semibold" className="text-white text-base">
									✕
								</StyledText>
							</TouchableOpacity>
						</View>
					</Animated.View>
				);
			})}
		</View>
	);
};

export default ToastContainer;
