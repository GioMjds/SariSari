import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { MoneyText, StatusPill } from '@/components/ui';
import { StyledText } from '@/components/elements';
import { Product } from '@/types';
import { LOW_STOCK_THRESHOLD } from '@/constants';

interface InventoryRowProps {
  item: Product;
  index: number;
  onRestock: (product: Product) => void;
}

const InventoryRow = React.memo(function InventoryRow({
  item,
  index,
  onRestock,
}: InventoryRowProps) {
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
      <View className="bg-paper-50 rounded-2xl border border-ink-100 shadow-paper p-4 flex-row justify-between items-start">
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
            className="text-xs text-ink-500 mb-3"
          >
            SKU: {item.sku}
          </StyledText>

          {/* Mini-grid */}
          <View className="flex-row gap-8">
            <View>
              <StyledText
                variant="semibold"
                className="text-label text-ink-400 mb-0.5"
                style={{ letterSpacing: 0.8 }}
              >
                PRICE
              </StyledText>
              <MoneyText
                value={item.price}
                fromPesos
                size="lg"
                className="text-ink-900 font-extrabold"
              />
            </View>
            <View>
              <StyledText
                variant="semibold"
                className="text-label text-ink-400 mb-0.5"
                style={{ letterSpacing: 0.8 }}
              >
                STOCK
              </StyledText>
              <StyledText
                variant="extrabold"
                className={`text-lg ${item.quantity === 0 ? 'text-semantic-danger' : 'text-ink-900'}`}
              >
                {item.quantity}
              </StyledText>
            </View>
          </View>
        </View>

        {/* Right Column: Status & Action */}
        <View className="items-end justify-between self-stretch min-h-[84px]">
          <View>
            {item.quantity === 0 ? (
              <StatusPill variant="danger" size="sm">
                Out of Stock
              </StatusPill>
            ) : item.quantity < LOW_STOCK_THRESHOLD ? (
              <StatusPill variant="warning" size="sm">
                Low Stock
              </StatusPill>
            ) : null}
          </View>

          <TouchableOpacity
            onPress={() => onRestock(item)}
            activeOpacity={0.85}
            className="w-12 h-12 rounded-full bg-persimmon-500 items-center justify-center shadow-persimmon-glow mt-4"
            style={{
              shadowColor: '#E85A1F',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.18,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <FontAwesome name="plus" size={20} color="#FBF7EE" />
          </TouchableOpacity>
        </View>
      </View>
    </MotiView>
  );
});

export default InventoryRow;
