import { Product } from '@/db/products';
import { FontAwesome } from '@expo/vector-icons';
import { FC } from 'react';
import { TouchableOpacity, View } from 'react-native';
import StyledText from '../elements/StyledText';

interface Props {
	item: Product;
	onEdit: (id: number) => void;
	onDelete: (product: Product) => void;
	getStockColor: (quantity: number) => string;
	lowStockThreshold: number;
}

const ProductItem: FC<Props> = ({
	item,
	onEdit,
	onDelete,
	getStockColor,
	lowStockThreshold,
}) => {
	return (
		<View className="bg-white mx-4 mb-3 rounded-2xl p-4 shadow-sm">
			<View className="flex-row justify-between items-start">
				<View className="flex-1 pr-3">
					<StyledText
						variant="semibold"
						className="text-text-primary text-base mb-1"
					>
						{item.name}
					</StyledText>
					<StyledText
						variant="regular"
						className="text-text-secondary text-xs mb-2"
					>
						SKU: {item.sku}
					</StyledText>
					<View className="flex-row items-center gap-4">
						<View>
							<StyledText
								variant="extrabold"
								className="text-primary text-lg"
							>
								₱{item.price.toFixed(2)}
							</StyledText>
						</View>
						<View>
							<StyledText
								variant="medium"
								className={`${getStockColor(item.quantity)} text-sm`}
							>
								Stock: {item.quantity}
							</StyledText>
						</View>
					</View>
					{item.quantity < lowStockThreshold && item.quantity > 0 && (
						<View className="bg-yellow-100 px-2 py-1 rounded-md mt-2 self-start">
							<StyledText
								variant="medium"
								className="text-yellow-700 text-xs"
							>
								⚠️ Low Stock
							</StyledText>
						</View>
					)}
					{item.quantity === 0 && (
						<View className="bg-red-100 px-2 py-1 rounded-md mt-2 self-start">
							<StyledText
								variant="medium"
								className="text-red-700 text-xs"
							>
								❌ Out of Stock
							</StyledText>
						</View>
					)}
				</View>

				{/* Action Buttons */}
				<View className="flex-row gap-2">
					<TouchableOpacity
						onPress={() => onEdit(item.id)}
						className="p-3 bg-green-100 rounded-lg"
					>
						<FontAwesome name="edit" size={20} color="#7A1CAC" />
					</TouchableOpacity>
					
					<TouchableOpacity
						onPress={() => onDelete(item)}
						className="p-3 bg-red-100 rounded-lg"
					>
						<FontAwesome name="trash" size={20} color="#dc2626" />
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
};

export default ProductItem;
