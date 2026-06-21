import { View, Text } from 'react-native';

type ScreenHeaderProps = {
	title: string;
	subtitle?: string;
	right?: React.ReactNode;
	variant?: 'default' | 'dark';
};

export function ScreenHeader({
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

