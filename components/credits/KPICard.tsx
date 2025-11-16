import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import StyledText from '../elements/StyledText';

interface KPICardProps {
	title: string;
	value: string | number;
	icon?: keyof typeof FontAwesome.glyphMap;
	iconColor?: string;
	trend?: 'up' | 'down' | 'neutral';
	subtitle?: string;
	onPress?: () => void;
}

export default function KPICard({ title, value, icon, iconColor = '#7A1CAC', trend, subtitle, onPress }: KPICardProps) {
	const Content = (
		<View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
			<View className="flex-row items-center justify-between mb-2">
				<StyledText variant="medium" className="text-gray-600 text-xs">
					{title}
				</StyledText>
				{icon && <FontAwesome name={icon} size={16} color={iconColor} />}
			</View>

			<View className="flex-row items-end justify-between">
				<StyledText variant="extrabold" className="text-2xl text-primary">
					{value}
				</StyledText>

				{trend && (
					<View className="flex-row items-center">
						<FontAwesome
							name={trend === 'up' ? 'arrow-up' : trend === 'down' ? 'arrow-down' : 'minus'}
							size={12}
							color={trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6b7280'}
						/>
					</View>
				)}
			</View>

			{subtitle && (
				<StyledText variant="regular" className="text-gray-500 text-xs mt-1">
					{subtitle}
				</StyledText>
			)}
		</View>
	);

	if (onPress) {
		return (
			<TouchableOpacity activeOpacity={0.7} onPress={onPress}>
				{Content}
			</TouchableOpacity>
		);
	}

	return Content;
}
