import StyledText from '@/components/elements/StyledText';
import { FontAwesome } from '@expo/vector-icons';
import { TouchableOpacity, View } from 'react-native';

interface SectionHeaderProps {
	title: string;
	icon: keyof typeof FontAwesome.glyphMap;
	onViewAll?: () => void;
}

export default function SectionHeader({ title, icon, onViewAll }: SectionHeaderProps) {
	return (
		<View className="flex-row items-center justify-between mb-3">
			<View className="flex-row items-center">
				<FontAwesome name={icon} size={18} color="#2E073F" />
				<StyledText variant="extrabold" className="text-primary text-lg ml-2">
					{title}
				</StyledText>
			</View>
			{onViewAll && (
				<TouchableOpacity activeOpacity={0.7} onPress={onViewAll}>
					<StyledText variant="semibold" className="text-secondary text-sm">
						View All
					</StyledText>
				</TouchableOpacity>
			)}
		</View>
	);
}
