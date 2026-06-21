import { Product } from '@/types';
import { calculateMarkup, calculateProfit } from '@/utils';
import { FontAwesome } from '@expo/vector-icons';
import { FC } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { StyledText } from '@/components/elements';

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
	const profit = calculateProfit(item.price, item.cost_price);
	const markup = calculateMarkup(item.price, item.cost_price);

	return (
		<View className="bg-white mx-4 mb-3 rounded-2xl p-4 shadow-sm border border-warm-100">
			<View className="flex-row justify-between items-start">
				<View className="flex-1 pr-3">
					<StyledText
						variant="semibold"
						className="text-warm-900 text-base mb-1"
					>
						{item.name}
					</StyledText>
					<StyledText
						variant="regular"
						className="text-warm-600 text-xs mb-2"
					>
						SKU: {item.sku}
					</StyledText>
					<View className="flex-row items-center gap-4 mb-2">
						<View>
							<StyledText
								variant="medium"
								className="text-warm-500 text-xs"
							>
								Selling Price
							</StyledText>
							<StyledText
								variant="extrabold"
								className="text-primary-500 text-lg"
							>
								₱{item.price.toFixed(2)}
							</StyledText>
						</View>
						{item.cost_price !== undefined && item.cost_price !== null && (
							<View>
								<StyledText
									variant="medium"
									className="text-warm-500 text-xs"
								>
									Cost
								</StyledText>
								<StyledText
									variant="semibold"
									className="text-warm-700 text-sm"
								>
									₱{item.cost_price.toFixed(2)}
								</StyledText>
							</View>
						)}
						<View>
							<StyledText
								variant="medium"
								className={`${getStockColor(item.quantity)} text-xs`}
							>
								Stock
							</StyledText>
							<StyledText
								variant="semibold"
								className={`${getStockColor(item.quantity)} text-sm`}
							>
								{item.quantity}
							</StyledText>
						</View>
					</View>

					{/* Profit/Tubo Display */}
					{profit !== null && markup !== null && (
						<View className="bg-secondary-50 rounded-lg px-3 py-2 mb-2 flex-row items-center justify-between">
							<View>
								<StyledText
									variant="regular"
									className="text-secondary-600 text-xs"
								>
									Profit per pc(s)
								</StyledText>
								<StyledText
									variant="extrabold"
									className="text-secondary-600 text-sm"
								>
									₱{profit.toFixed(2)}
								</StyledText>
							</View>
							<View className="items-end">
								<StyledText
									variant="regular"
									className="text-secondary-600 text-xs"
								>
									Markup
								</StyledText>
								<StyledText
									variant="extrabold"
									className="text-secondary-600 text-sm"
								>
									{markup.toFixed(1)}%
								</StyledText>
							</View>
						</View>
					)}

					{/* Stock Warnings */}
					{item.quantity < lowStockThreshold && item.quantity > 0 && (
						<View className="bg-amber-50 px-2 py-1 rounded-md mt-1 self-start">
							<StyledText
								variant="medium"
								className="text-amber-700 text-xs"
							>
								⚠️ Low Stock
							</StyledText>
						</View>
					)}
					{item.quantity === 0 && (
						<View className="bg-red-50 px-2 py-1 rounded-md mt-1 self-start">
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
						className="p-3 bg-secondary-50 rounded-lg"
					>
						<FontAwesome name="edit" size={20} color="#B45309" />
					</TouchableOpacity>
					
					<TouchableOpacity
						onPress={() => onDelete(item)}
						className="p-3 bg-red-50 rounded-lg"
					>
						<FontAwesome name="trash" size={20} color="#dc2626" />
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
};

export default ProductItem;
