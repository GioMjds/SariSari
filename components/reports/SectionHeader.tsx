import { StyledText } from '@/components/elements';
import { FontAwesome } from '@expo/vector-icons';
import { TouchableOpacity, View } from 'react-native';

interface SectionHeaderProps {
	title: string;
	icon: keyof typeof FontAwesome.glyphMap;
	onViewAll?: () => void;
}

/**
 * SectionHeader — A horizontal section break with a small icon,
 * title, and optional "view all" link. Kept for backwards
 * compatibility with older reports layouts; the new layout
 * uses `EditorialEyebrow` instead.
 */
export function SectionHeader({ title, icon, onViewAll }: SectionHeaderProps) {
	return (
		<View className="flex-row items-center justify-between mb-3 px-4">
			<View className="flex-row items-center">
				<View className="w-7 h-7 rounded-md bg-persimmon-100 items-center justify-center mr-2">
					<FontAwesome name={icon} size={13} color="#A1370C" />
				</View>
				<StyledText
					variant="extrabold"
					className="text-ink-900 text-base"
					style={{ letterSpacing: -0.2 }}
				>
					{title}
				</StyledText>
			</View>
			{onViewAll && (
				<TouchableOpacity activeOpacity={0.7} onPress={onViewAll}>
					<StyledText
						variant="extrabold"
						className="text-label text-persimmon-600"
						style={{ letterSpacing: 1.4 }}
					>
						VIEW ALL →
					</StyledText>
				</TouchableOpacity>
			)}
		</View>
	);
}