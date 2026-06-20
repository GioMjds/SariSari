import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

type ScreenHeaderProps = {
	title: string;
	subtitle?: string;
	right?: React.ReactNode;
	variant?: 'default' | 'dark';
};

export default function ScreenHeader({
	title,
	subtitle,
	right,
	variant = 'default'
}: ScreenHeaderProps) {
	const isDark = variant === 'dark';

	return (
		<View
			className={`px-4 ${isDark ? 'bg-primary-600 pt-4 pb-4' : 'bg-transparent pt-4 pb-2'}`}
		>
			<View className="flex-row justify-between items-start">
				<View className="flex-1">
					<Text
						className={`text-h1 font-extrabold ${isDark ? 'text-white' : 'text-warm-900'}`}
					>
						{title}
					</Text>
					{subtitle && (
						<Text
							className={`text-body ${isDark ? 'text-white opacity-80' : 'text-warm-700'}`}
						>
							{subtitle}
						</Text>
					)}
				</View>
				{right && <View className="flex-row items-center gap-2">{right}</View>}
			</View>
		</View>
	);
}

ScreenHeader.Back = ({ onPress, title }: { onPress: () => void; title?: string }) => (
	<View className="flex-row items-center gap-3 mb-2">
		<TouchableOpacity
			onPress={onPress}
			className="w-10 h-10 rounded-full bg-white border border-warm-100 items-center justify-center shadow-card"
		>
			<FontAwesome name="arrow-left" size={16} className="text-primary-500" />
		</TouchableOpacity>
		{title && (
			<Text className="text-body font-medium text-warm-700">{title}</Text>
		)}
	</View>
);

export { ScreenHeader };
