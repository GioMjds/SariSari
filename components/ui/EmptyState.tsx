import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

type EmptyStateProps = {
	icon: string; // FontAwesome name
	title: string;
	subtitle?: string;
	action?: {
		label: string;
		onPress: () => void;
	};
};

export default function EmptyState({
	icon,
	title,
	subtitle,
	action
}: EmptyStateProps) {
	return (
		<View className="flex-1 items-center justify-center p-6 mt-3xl">
			<FontAwesome
				name={icon}
				size={64}
				className="text-primary-500 opacity-30 mb-4"
			/>
			<Text className="text-h2 font-bold text-warm-900 text-center">
				{title}
			</Text>
			{subtitle && (
				<Text className="text-body text-warm-700 text-center mt-2 px-4">
					{subtitle}
				</Text>
			)}
			{action && (
				<TouchableOpacity
					onPress={action.onPress}
					className="mt-6 bg-primary-500 text-white rounded-xl px-6 py-3 font-bold"
				>
					<Text className="text-white font-bold">{action.label}</Text>
				</TouchableOpacity>
			)}
		</View>
	);
}

export { EmptyState };
