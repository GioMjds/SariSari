import StyledText from '@/components/elements/StyledText';
import { FontAwesome } from '@expo/vector-icons';
import { TouchableOpacity, View } from 'react-native';

interface ReportKPICardProps {
	title: string;
	value: string;
	icon: keyof typeof FontAwesome.glyphMap;
	color?: string;
	onPress?: () => void;
	subtitle?: string;
	trend?: {
		value: string;
		isPositive: boolean;
	};
}

export default function ReportKPICard({
	title,
	value,
	icon,
	color = '#7A1CAC',
	onPress,
	subtitle,
	trend,
}: ReportKPICardProps) {
	const CardWrapper = onPress ? TouchableOpacity : View;

	return (
		<CardWrapper
			activeOpacity={onPress ? 0.7 : 1}
			onPress={onPress}
			className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex-1"
		>
			<View className="flex-row items-center justify-between mb-2">
				<View
					className="w-10 h-10 rounded-full items-center justify-center"
					style={{ backgroundColor: `${color}20` }}
				>
					<FontAwesome name={icon} size={18} color={color} />
				</View>
				{trend && (
					<View className="flex-row items-center">
						<FontAwesome
							name={trend.isPositive ? 'arrow-up' : 'arrow-down'}
							size={12}
							color={trend.isPositive ? '#10b981' : '#ef4444'}
						/>
						<StyledText
							variant="semibold"
							style={{ color: trend.isPositive ? '#10b981' : '#ef4444', fontSize: 12, marginLeft: 4 }}
						>
							{trend.value}
						</StyledText>
					</View>
				)}
			</View>

			<StyledText variant="semibold" className="text-gray-600 text-xs mb-1">
				{title}
			</StyledText>

			<StyledText variant="extrabold" className="text-primary text-2xl mb-1">
				{value}
			</StyledText>

			{subtitle && (
				<StyledText variant="regular" className="text-gray-500 text-xs">
					{subtitle}
				</StyledText>
			)}
		</CardWrapper>
	);
}
