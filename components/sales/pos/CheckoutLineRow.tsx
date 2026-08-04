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
    <Pressable
      onLongPress={() => setShowConfirmRemove(true)}
      delayLongPress={400}
      accessibilityRole="button"
      accessibilityLabel={`${item.product_name} row`}
      className="py-3 px-4 border-b border-paper-200 bg-paper-50 flex-row items-center justify-between"
    >
      <View className="flex-1 mr-3">
        <StyledText variant="semibold" className="text-ink-900 text-base">
          {item.product_name}
        </StyledText>
        <StyledText variant="medium" className="text-ink-500 text-xs mt-0.5">
          {unitName} · {formatPesos(item.price)} each
        </StyledText>

        {showConfirmRemove && (
          <View className="flex-row items-center mt-2 bg-semantic-danger-50 p-2 rounded-xl border border-semantic-danger/20">
            <StyledText
              variant="extrabold"
              className="text-semantic-danger text-xs mr-3"
            >
              Remove item?
            </StyledText>
            <Pressable
              onPress={() => onRemove(item.product_id, item.selected_unit)}
              className="bg-semantic-danger px-2.5 py-1 rounded-lg mr-2"
            >
              <StyledText variant="extrabold" className="text-white text-xs">
                Remove
              </StyledText>
            </Pressable>
            <Pressable
              onPress={() => setShowConfirmRemove(false)}
              className="bg-paper-200 px-2.5 py-1 rounded-lg"
            >
              <StyledText variant="extrabold" className="text-ink-700 text-xs">
                Cancel
              </StyledText>
            </Pressable>
          </View>
        )}
      </View>

      {/* Right side: Stepper + Subtotal */}
      <View className="flex-row items-center">
        <View className="flex-row items-center bg-paper-100 rounded-full border border-ink-150 p-1 mr-3">
          <Pressable
            onPress={() =>
              onUpdateQuantity(item.product_id, -1, item.selected_unit)
            }
            accessibilityRole="button"
            accessibilityLabel={`Decrease quantity of ${item.product_name}`}
            className="w-7 h-7 rounded-full bg-paper-200 items-center justify-center active:opacity-60"
          >
            <FontAwesome name="minus" size={10} color="#0E0C0A" />
          </Pressable>

          <StyledText
            variant="extrabold"
            className="text-ink-900 text-sm px-2.5"
          >
            {item.quantity}
          </StyledText>

          <Pressable
            onPress={() =>
              onUpdateQuantity(item.product_id, 1, item.selected_unit)
            }
            accessibilityRole="button"
            accessibilityLabel={`Increase quantity of ${item.product_name}`}
            className="w-7 h-7 rounded-full bg-persimmon-500 items-center justify-center active:opacity-60"
          >
            <FontAwesome name="plus" size={10} color="#FFFFFF" />
          </Pressable>
        </View>

        <View className="w-16 items-end">
          <MoneyText
            value={subtotal}
            size="sm"
            className="text-ink-900 font-extrabold"
          />
        </View>
      </View>
    </Pressable>
  );
}
