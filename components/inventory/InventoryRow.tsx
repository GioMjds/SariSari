import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { StatusPill } from '@/components/ui';
import { StyledText } from '@/components/elements';
import { Product } from '@/types';
import { LOW_STOCK_THRESHOLD } from '@/constants';
import { formatPesos } from '@/lib/money';
import { Image } from 'expo-image';
import { getProductImageUri } from '@/lib';

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

  const subtitle = `${formatPesos(item.price)}`;

  const placeholderText = item.name.trim().charAt(0).toUpperCase();
  const displayImageUri = getProductImageUri(item.image_uri);

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
        className="active:scale-[0.96] transition-transform duration-100"
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, ${pillText}, ${subtitle}. Long press for actions.`}
      >
        <View className="bg-paper-50 rounded-2xl border border-ink-100 shadow-paper p-4 flex-row justify-between items-center">
          {/* Left Column: Product Image & Info */}
          <View className="flex-1 flex-row items-center mr-3">
            {/* Image box with concentric border radius: outer (20px) = inner (6px) + padding (16px) - rounded-md */}
            <View className="w-12 h-12 rounded-md bg-paper-100 border border-ink-150 overflow-hidden mr-3 items-center justify-center relative">
              {displayImageUri ? (
                <Image
                  source={{ uri: displayImageUri }}
                  className="w-full h-full rounded-md"
                  contentFit="cover"
                />
              ) : (
                <View className="w-full h-full bg-persimmon-50 items-center justify-center rounded-md">
                  <StyledText variant="black" className="text-persimmon-600 text-base">
                    {placeholderText}
                  </StyledText>
                </View>
              )}
              {/* Subtle 1px overlay outline to prevent image wash-out */}
              <View className="absolute inset-0 border border-black/10 rounded-md" pointerEvents="none" />
            </View>

            <View className="flex-1">
              <StyledText
                variant="semibold"
                className="text-base text-ink-900 mb-1"
              >
                {item.name}
              </StyledText>
              <StyledText
                variant="regular"
                className="text-xs text-ink-500"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {subtitle}
              </StyledText>
            </View>
          </View>

          {/* Right Column: Stock pill, Restock button, and More button */}
          <View className="flex-row items-center gap-2">
            <StatusPill variant={pillVariant} size="sm">
              {pillText}
            </StatusPill>

            <TouchableOpacity
              onPress={() => onRestock(item)}
              activeOpacity={0.85}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Restock ${item.name}`}
              className="w-10 h-10 rounded-full bg-persimmon-500 items-center justify-center shadow-persimmon-glow active:scale-[0.96] transition-transform"
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
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`More actions for ${item.name}`}
              className="w-10 h-10 rounded-full bg-ink-50 border border-ink-100 items-center justify-center active:scale-[0.96] transition-transform"
            >
              <Ionicons name="ellipsis-horizontal" size={18} color="#4A2610" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </MotiView>
  );
});
