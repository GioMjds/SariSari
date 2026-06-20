import StyledText from '@/components/elements/StyledText';
import { FontAwesome } from '@expo/vector-icons';
import { View } from 'react-native';

interface InsightCardProps {
	type: 'success' | 'warning' | 'info';
	title: string;
	message: string;
	icon: keyof typeof FontAwesome.glyphMap;
}

export default function InsightCard({ type, title, message, icon }: InsightCardProps) {
	const colors = {
		success: { bg: '#65A30D20', border: '#65A30D', text: '#65A30D' },
		warning: { bg: '#D9770620', border: '#D97706', text: '#D97706' },
		info: { bg: '#0EA5E920', border: '#0EA5E9', text: '#0EA5E9' },
	};

	const { bg, border, text } = colors[type];

	return (
		<View className="rounded-2xl p-4 mb-3" style={{ backgroundColor: bg, borderLeftWidth: 4, borderLeftColor: border }}>
			<View className="flex-row items-start">
				<View className="mr-3 mt-1">
					<FontAwesome name={icon} size={18} color={text} />
				</View>
				<View className="flex-1">
					<StyledText variant="semibold" className="text-sm mb-1" style={{ color: text }}>
						{title}
					</StyledText>
					<StyledText variant="regular" className="text-xs" style={{ color: text }}>
						{message}
					</StyledText>
				</View>
			</View>
		</View>
	);
}
