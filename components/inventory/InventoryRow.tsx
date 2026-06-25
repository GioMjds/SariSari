import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { StatusPill } from '@/components/ui';
import { StyledText } from '@/components/elements';
import { Product } from '@/types';
import { LOW_STOCK_THRESHOLD } from '@/constants';
import { formatPesos } from '@/lib/money';

interface InventoryRowProps {
  item: Product;
  index: number;
  onRestock: (product: Product) => void;
  onMore: (product: Product) => void;
}

export const InventoryRow = React.memo(function InventoryRow({
  item,
  index,
  onRestock,
  onMore,
}: InventoryRowProps) {
  const isOutOfStock = item.quantity === 0;
  const isLowStock = item.quantity > 0 && item.quantity < LOW_STOCK_THRESHOLD;

  const pillVariant = isOutOfStock
    ? 'danger'
    : isLowStock
    ? 'warning'
    : 'neutral';

  const pillText = isOutOfStock
    ? 'Out'
    : `${item.quantity} left`;

  const subtitle = `SKU: ${item.sku}${item.category ? ' · ' + item.category : ''} · ${formatPesos(item.price)}`;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 18 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: 'timing',
        duration: 400,
        delay: 200 + (index % 5) * 50,
      }}
      className="mx-4 mb-3"
    >
      <TouchableOpacity
        onLongPress={() => onMore(item)}
        delayLongPress={400}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, ${pillText}, ${subtitle}. Long press for actions.`}
      >
        <View className="bg-paper-50 rounded-2xl border border-ink-100 shadow-paper p-4 flex-row justify-between items-center">
          {/* Left Column: Product Info */}
          <View className="flex-1 mr-3">
            <StyledText
              variant="semibold"
              className="text-base text-ink-900 mb-1"
            >
              {item.name}
            </StyledText>
            <StyledText
              variant="regular"
              className="text-xs text-ink-500"
            >
              {subtitle}
            </StyledText>
          </View>

          {/* Right Column: Stock pill, Restock button, and More button */}
          <View className="flex-row items-center gap-2">
            <StatusPill variant={pillVariant} size="sm">
              {pillText}
            </StatusPill>

            <TouchableOpacity
              onPress={() => onRestock(item)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Restock ${item.name}`}
              className="w-10 h-10 rounded-full bg-persimmon-500 items-center justify-center shadow-persimmon-glow"
              style={{
                shadowColor: '#E85A1F',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.18,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              <FontAwesome name="plus" size={16} color="#FBF7EE" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onMore(item)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`More actions for ${item.name}`}
              className="w-10 h-10 rounded-full bg-ink-50 border border-ink-100 items-center justify-center"
            >
              <Ionicons name="ellipsis-horizontal" size={18} color="#4A2610" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </MotiView>
  );
});
