import { useToastStore } from '@/stores/ToastStore';
import { Toast } from '@/types/ui/Toast.types';
import { FontAwesome } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    Animated,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StyledText from '../elements/StyledText';

interface ToastItemProps {
	toast: Toast;
	onDismiss: (id: string) => void;
}

const getToastStyles = (variant?: string) => {
	const variants = {
		success: {
			bg: 'bg-green-500',
			textColor: 'text-white',
			icon: 'check-circle',
			iconColor: '#FFFFFF',
		},
		error: {
			bg: 'bg-red-500',
			textColor: 'text-white',
			icon: 'exclamation-circle',
			iconColor: '#FFFFFF',
		},
		info: {
			bg: 'bg-blue-500',
			textColor: 'text-white',
			icon: 'info-circle',
			iconColor: '#FFFFFF',
		},
		warning: {
			bg: 'bg-yellow-600',
			textColor: 'text-white',
			icon: 'warning',
			iconColor: '#FFFFFF',
		},
		default: {
			bg: 'bg-secondary',
			textColor: 'text-white',
			icon: 'bell',
			iconColor: '#FFFFFF',
		},
	};

	return variants[variant as keyof typeof variants] || variants.default;
};

const ToastItem = ({ toast, onDismiss }: ToastItemProps) => {
	const { width } = useWindowDimensions();
	const [slideAnim] = useState(new Animated.Value(-150));

	useEffect(() => {
		Animated.timing(slideAnim, {
			toValue: 0,
			duration: 300,
			useNativeDriver: true,
		}).start();
	}, [slideAnim]);

	useEffect(() => {
		if (toast.duration && toast.duration > 0) {
			const timer = setTimeout(() => {
				Animated.timing(slideAnim, {
					toValue: -150,
					duration: 300,
					useNativeDriver: true,
				}).start(() => onDismiss(toast.id));
			}, toast.duration);

			return () => clearTimeout(timer);
		}
	}, [toast.duration, toast.id, slideAnim, onDismiss]);

	const styles = getToastStyles(toast.variant);

	return (
		<Animated.View
			style={{
				transform: [{ translateY: slideAnim }],
				width: width - 32,
				marginHorizontal: 16,
			}}
			pointerEvents="auto"
		>
			<View className={`${styles.bg} rounded-xl px-4 py-3 flex-row items-center gap-3 shadow-lg mb-3`}>
				<FontAwesome
					name={styles.icon as any}
					size={18}
					color={styles.iconColor}
				/>
				<StyledText
					variant="medium"
					className={`flex-1 ${styles.textColor} text-sm`}
					numberOfLines={2}
				>
					{toast.message}
				</StyledText>
				<TouchableOpacity
					onPress={() => onDismiss(toast.id)}
					hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
				>
					<FontAwesome
						name="times"
						size={16}
						color={styles.iconColor}
					/>
				</TouchableOpacity>
			</View>
		</Animated.View>
	);
};

/**
 * Sonner - A toast notification component for React Native
 * Displays toasts at the top of the screen with smooth animations
 * Used for user feedback on actions (restocking, sales, etc.)
 */
const Sonner = () => {
	const toasts = useToastStore((state) => state.toasts);
	const removeToast = useToastStore((state) => state.removeToast);
	const { top } = useSafeAreaInsets();

	// Filter toasts that should display at the top
	const topToasts = toasts.filter((t) => {
		const pos = t.position || 'top-center';
		return pos.startsWith('top');
	});

	if (topToasts.length === 0) return null;

	return (
		<View
			pointerEvents="box-none"
			className="absolute left-0 right-0 z-50"
			style={{ top: top + 32 }}
		>
			<View className="pt-4">
				{topToasts.map((toast) => (
					<ToastItem
						key={toast.id}
						toast={toast}
						onDismiss={removeToast}
					/>
				))}
			</View>
		</View>
	);
};

export default Sonner;
