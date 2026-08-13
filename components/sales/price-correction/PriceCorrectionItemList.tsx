import React from 'react';
import { View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { Skeleton } from '@/components/ui';
import { PriceCorrectionItemRow } from './PriceCorrectionItemRow';

type PriceCorrectionItemListProps = {
  items:
    | {
        id: number;
        product_name: string;
        quantity: number;
        price: number;
      }[]
    | undefined;
  isLoading: boolean;
  edits: Record<number, string>;
  onChangeEdit: (saleItemId: number, value: string) => void;
  onResetItem: (saleItemId: number) => void;
};

export const PriceCorrectionItemList: React.FC<PriceCorrectionItemListProps> = ({
  items,
  isLoading,
  edits,
  onChangeEdit,
  onResetItem,
}) => {
  const itemCount = items?.length ?? 0;

  return (
    <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4 mb-4">
      {/* Section Header matching sale-correction Resibo Summary header */}
      <View className="flex-row items-center justify-between pb-3">
        <View className="flex-row items-center gap-2">
          <FontAwesome name="tags" size={14} color="#623418" />
          <StyledText
            variant="extrabold"
            className="label-caps text-cinnamon-500"
          >
            Adjust Unit Prices
          </StyledText>
        </View>
        <StyledText
          variant="semibold"
          className="text-ink-400 text-xs label-caps"
        >
          {itemCount} {itemCount === 1 ? 'ITEM' : 'ITEMS'}
        </StyledText>
      </View>

      {isLoading || !items ? (
        <View className="py-4 gap-2.5">
          <Skeleton height={56} borderRadius={12} shimmer />
          <Skeleton height={56} borderRadius={12} shimmer />
        </View>
      ) : items.length === 0 ? (
        <View className="py-6 items-center">
          <StyledText variant="medium" className="text-ink-400 text-sm">
            No items found in this sale.
          </StyledText>
        </View>
      ) : (
        <View className="gap-2.5">
          {items.map((item) => (
            <PriceCorrectionItemRow
              key={item.id}
              item={item}
              editValue={edits[item.id]}
              onChangeEdit={onChangeEdit}
              onResetItem={onResetItem}
            />
          ))}
        </View>
      )}
    </View>
  );
};
