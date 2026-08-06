import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui';
import { formatPesos } from '@/lib/money';
import type { NewSaleItem } from '@/types';

export interface CheckoutLineRowProps {
  item: NewSaleItem;
  onUpdateQuantity: (
    productId: number,
    delta: number,
    selectedUnit?: 'retail' | 'wholesale',
  ) => void;
  onRemove: (productId: number, selectedUnit?: 'retail' | 'wholesale') => void;
}

export function CheckoutLineRow({
  item,
  onUpdateQuantity,
  onRemove,
}: CheckoutLineRowProps) {
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);
  const subtotal = item.price * item.quantity;
  const isWholesale = item.selected_unit === 'wholesale';
  const unitName = isWholesale
    ? item.wholesale_unit_name || 'Pack'
    : item.retail_unit_name || 'Pc';

  return (
    <View className="px-5 py-3 border-b border-paper-200 bg-paper-50">
      <Pressable
        onLongPress={() => setShowConfirmRemove(true)}
        delayLongPress={400}
        accessibilityRole="button"
        accessibilityLabel={`${item.product_name} row`}
        accessibilityHint="Long press to remove item"
        className="flex-row items-center justify-between"
      >
        <View className="flex-1 mr-3 min-w-0">
          <StyledText
            variant="semibold"
            className="text-ink-900 text-base"
            numberOfLines={1}
          >
            {item.product_name}
          </StyledText>
          <View className="flex-row items-center gap-1.5 mt-0.5">
            <View
              className={`px-2 py-0.5 rounded-md border ${
                isWholesale
                  ? 'bg-amber-100/90 border-amber-300/60'
                  : 'bg-paper-200/80 border-paper-300/50'
              }`}
            >
              <StyledText
                variant="extrabold"
                className={`text-[10px] uppercase ${
                  isWholesale ? 'text-amber-900' : 'text-ink-600'
                }`}
              >
                {unitName}
              </StyledText>
            </View>
            <StyledText variant="medium" className="text-ink-500 text-xs">
              {formatPesos(item.price)} each
            </StyledText>
          </View>
        </View>

        {/* Right side: Stepper + Subtotal */}
        <View className="flex-row items-center gap-3">
          <View className="flex-row items-center bg-paper-100/90 rounded-2xl border border-paper-300 p-1">
            <Pressable
              onPress={() =>
                onUpdateQuantity(item.product_id, -1, item.selected_unit)
              }
              accessibilityRole="button"
              accessibilityLabel={`Decrease quantity of ${item.product_name}`}
              className="w-7 h-7 rounded-xl bg-paper-200/80 items-center justify-center active:opacity-60"
              hitSlop={4}
            >
              <FontAwesome name="minus" size={10} color="#0E0C0A" />
            </Pressable>

            <StyledText
              variant="extrabold"
              className="text-ink-900 text-sm px-2.5 min-w-[28px] text-center"
            >
              {item.quantity}
            </StyledText>

            <Pressable
              onPress={() =>
                onUpdateQuantity(item.product_id, 1, item.selected_unit)
              }
              accessibilityRole="button"
              accessibilityLabel={`Increase quantity of ${item.product_name}`}
              className="w-7 h-7 rounded-xl bg-persimmon-500 items-center justify-center active:opacity-75"
              hitSlop={4}
            >
              <FontAwesome name="plus" size={10} color="#FFFFFF" />
            </Pressable>
          </View>

          <View className="w-18 items-end">
            <MoneyText
              value={subtotal}
              size="sm"
              className="text-ink-900 font-extrabold"
            />
          </View>
        </View>
      </Pressable>

      {showConfirmRemove && (
        <View className="flex-row items-center justify-between mt-2.5 bg-semantic-danger-50 px-3.5 py-2 rounded-xl border border-semantic-danger/30">
          <StyledText
            variant="extrabold"
            className="text-semantic-danger text-xs flex-1 mr-2"
          >
            Remove this item from cart?
          </StyledText>
          <View className="flex-row items-center gap-1.5">
            <Pressable
              onPress={() => onRemove(item.product_id, item.selected_unit)}
              className="bg-semantic-danger px-3 py-1.5 rounded-lg active:opacity-80"
              hitSlop={4}
            >
              <StyledText variant="extrabold" className="text-white text-xs">
                Remove
              </StyledText>
            </Pressable>
            <Pressable
              onPress={() => setShowConfirmRemove(false)}
              className="bg-paper-200 border border-paper-300 px-3 py-1.5 rounded-lg active:bg-paper-300"
              hitSlop={4}
            >
              <StyledText variant="extrabold" className="text-ink-700 text-xs">
                Cancel
              </StyledText>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

