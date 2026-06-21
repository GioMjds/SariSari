import { StyledText } from '@/components/elements';
import { FontAwesome } from '@expo/vector-icons';
import { TouchableOpacity, View } from 'react-native';

interface SectionHeaderProps {
	title: string;
	icon: keyof typeof FontAwesome.glyphMap;
	onViewAll?: () => void;
}

export function SectionHeader({ title, icon, onViewAll }: SectionHeaderProps) {
	return (
		<View className="flex-row items-center justify-between mb-3">
			<View className="flex-row items-center">
				<FontAwesome name={icon} size={18} color="#B45309" />
				<StyledText variant="extrabold" className="text-primary-500 text-lg ml-2">
					{title}
				</StyledText>
			</View>
			{onViewAll && (
				<TouchableOpacity activeOpacity={0.7} onPress={onViewAll}>
					<StyledText variant="semibold" className="text-secondary-600 text-sm">
						View All
					</StyledText>
				</TouchableOpacity>
			)}
		</View>
	);
}
