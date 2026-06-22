import { memo } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { StyledText } from '@/components/elements';
import { StatusPill } from '@/components/ui';
import { Product } from '@/types';
import { calculateProfit, formatCurrency } from '@/utils';
import { LOW_STOCK_THRESHOLD } from '@/constants/stocks';

interface ProductCardProps {
  product: Product;
  index: number;
  onPress: (product: Product) => void;
  onLongPress: (product: Product) => void;
}

export const ProductCard = memo(function ProductCard({
  product,
  index,
  onPress,
  onLongPress,
}: ProductCardProps) {
  const statusColor =
    product.quantity === 0
      ? '#C13030'
      : product.quantity < LOW_STOCK_THRESHOLD
        ? '#C77B0E'
        : '#4F7A24';

  const statusVariant =
    product.quantity === 0
      ? 'danger'
      : product.quantity < LOW_STOCK_THRESHOLD
        ? 'warning'
        : 'success';

  const statusLabel =
    product.quantity === 0
      ? 'OUT'
      : product.quantity < LOW_STOCK_THRESHOLD
        ? 'LOW'
        : 'OK';

  const profit = calculateProfit(product.price, product.cost_price);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(product)}
      onLongPress={() => onLongPress(product)}
      className="bg-white mx-4 mb-3 rounded-2xl p-4 shadow-sm border border-ink-100"
      style={{
        borderLeftWidth: 4,
        borderLeftColor: statusColor,
      }}
    >
      {/* Header Row */}
      <View className="flex-row justify-between items-start">
        <View className="flex-1 pr-2">
          <StyledText
            variant="extrabold"
            className="text-h3 text-ink-900"
            numberOfLines={1}
          >
            {product.name}
          </StyledText>
          <StyledText variant="regular" className="text-caption text-ink-500 mt-1">
            {product.category || 'No Category'} · SKU: {product.sku}
          </StyledText>
        </View>

        <StatusPill variant={statusVariant} size="sm">
          {statusLabel}
        </StatusPill>
      </View>

      {/* Dotted Divider */}
      <View className="border-t border-dashed border-ink-200 my-3" />

      {/* Three-Column Stats Row */}
      <View className="flex-row justify-between items-center">
        {/* Price Column */}
        <View className="flex-1">
          <StyledText
            variant="medium"
            className="text-ink-400 text-[10px] uppercase tracking-wider"
          >
            Price
          </StyledText>
          <StyledText variant="extrabold" className="text-ink-900 text-sm mt-0.5">
            {formatCurrency(product.price)}
          </StyledText>
        </View>

        {/* Stock Column */}
        <View className="flex-1 items-center">
          <StyledText
            variant="medium"
            className="text-ink-400 text-[10px] uppercase tracking-wider"
          >
            Stock
          </StyledText>
          <StyledText
            variant="extrabold"
            className={`text-sm mt-0.5 ${
              product.quantity === 0
                ? 'text-semantic-danger'
                : product.quantity < LOW_STOCK_THRESHOLD
                  ? 'text-semantic-warning'
                  : 'text-ink-700'
            }`}
          >
            {product.quantity}
          </StyledText>
        </View>

        {/* Profit Column */}
        <View className="flex-1 items-end">
          <StyledText
            variant="medium"
            className="text-ink-400 text-[10px] uppercase tracking-wider"
          >
            Profit
          </StyledText>
          <StyledText
            variant="extrabold"
            className={`text-sm mt-0.5 ${
              profit !== null && profit > 0 ? 'text-sage-500' : 'text-ink-700'
            }`}
          >
            {profit !== null ? formatCurrency(profit) : '—'}
          </StyledText>
        </View>
      </View>
    </TouchableOpacity>
  );
});
