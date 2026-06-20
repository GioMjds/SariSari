import StyledText from '@/components/elements/StyledText';
import { CategoryWithCount } from '@/types/categories.types';
import { FontAwesome } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

interface CategoryCardProps {
	category: CategoryWithCount;
	onPress: (category: CategoryWithCount) => void;
	onEdit: (category: CategoryWithCount) => void;
	onDelete: (category: CategoryWithCount) => void;
}

export default function CategoryCard({
	category,
	onPress,
	onEdit,
	onDelete,
}: CategoryCardProps) {
	return (
		<Pressable
			onPress={() => onPress(category)}
			className="bg-white rounded-2xl p-4 mb-3 mx-4 shadow-sm border border-warm-100 active:opacity-70"
		>
			<View className="flex-row items-center justify-between">
				<View className="flex-row items-center flex-1">
					{/* Simple folder icon */}
					<View
						className="w-12 h-12 rounded-full items-center justify-center mr-3 bg-warm-100"
					>
						<FontAwesome
							name={'folder' as any}
							size={20}
							color={'#B45309'}
						/>
					</View>

					{/* Category Info */}
					<View className="flex-1">
						<StyledText
							variant="semibold"
							className="text-warm-900 text-base mb-1"
						>
							{category.name}
						</StyledText>
						<StyledText
							variant="regular"
							className="text-warm-600 text-sm"
						>
							{category.product_count}{' '}
							{category.product_count === 1 ? 'product' : 'products'}
						</StyledText>
					</View>
				</View>

				{/* Action Buttons */}
				<View className="flex-row gap-2">
					<Pressable
						onPress={(e) => {
							e.stopPropagation();
							onEdit(category);
						}}
						className="w-10 h-10 rounded-lg bg-secondary-50 items-center justify-center active:opacity-50"
					>
						<FontAwesome name="edit" size={16} color="#65A30D" />
					</Pressable>
					<Pressable
						onPress={(e) => {
							e.stopPropagation();
							onDelete(category);
						}}
						className="w-10 h-10 rounded-lg bg-red-50 items-center justify-center active:opacity-50"
					>
						<FontAwesome name="trash" size={16} color="#DC2626" />
					</Pressable>
				</View>
			</View>
		</Pressable>
	);
}
