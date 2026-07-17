import React from 'react';
import { View, Pressable } from 'react-native';
import { MotiView } from 'moti';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

interface CategoryStickyBarProps {
  totalValue: number;
  onAddProduct: () => void;
}

export function CategoryStickyBar({
  totalValue,
  onAddProduct,
}: CategoryStickyBarProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 30 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 520, delay: 220 }}
      className="absolute bottom-0 left-0 right-0"
    >
      <View className="px-4 pb-5 pt-3">
        <View className="bg-cinnamon-500 rounded-3xl shadow-paper-deep px-5 py-4 flex-row items-center justify-between overflow-hidden">
          <View className="flex-1">
            <StyledText
              variant="medium"
              className="label-caps text-paper-200 opacity-90"
            >
              Category value
            </StyledText>
            <View className="flex-row items-baseline mt-1">
              <StyledText
                variant="medium"
                className="text-paper-100 text-base mr-1"
                style={{ letterSpacing: -0.5 }}
              >
                ₱
              </StyledText>
              <StyledText
                variant="black"
                className="text-paper-50 text-3xl"
                style={{ letterSpacing: -0.5 }}
              >
                {totalValue.toLocaleString('en-PH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </StyledText>
            </View>
          </View>

          <Pressable
            onPress={onAddProduct}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Add product to this category"
            className="flex-row items-center bg-persimmon-500 rounded-pill px-5 py-3 ml-3 active:opacity-80"
            style={{
              shadowColor: '#E85A1F',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.32,
              shadowRadius: 10,
              elevation: 4,
            }}
          >
            <FontAwesome name="plus" size={14} color="#FBF7EE" />
            <StyledText
              variant="extrabold"
              className="text-paper-50 text-sm ml-2"
            >
              Add Product
            </StyledText>
          </Pressable>
        </View>
      </View>
    </MotiView>
  );
}
