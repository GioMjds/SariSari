import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

interface InventoryEmptyStateProps {
  onAddProduct: () => void;
}

export default function InventoryEmptyState({ onAddProduct }: InventoryEmptyStateProps) {
  return (
    <View className="items-center justify-center px-6 pt-24">
      <FontAwesome name="inbox" size={78} color="#E85A1F" />
      <StyledText
        variant="extrabold"
        className="text-ink-900 text-xl mt-4 mb-2"
      >
        No products yet
      </StyledText>
      <StyledText
        variant="regular"
        className="text-ink-500 text-center text-sm mb-6"
      >
        Add your first product to get started
      </StyledText>
      <TouchableOpacity
        onPress={onAddProduct}
        activeOpacity={0.85}
        className="bg-persimmon-500 rounded-pill px-7 py-3 flex-row items-center shadow-persimmon-glow"
      >
        <FontAwesome name="plus" size={14} color="#FBF7EE" style={{ marginRight: 8 }} />
        <StyledText variant="semibold" className="text-paper-50 text-sm">
          Add Product
        </StyledText>
      </TouchableOpacity>
    </View>
  );
}
