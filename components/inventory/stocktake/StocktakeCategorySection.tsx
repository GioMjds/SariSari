import { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { StocktakeCountRow } from './StocktakeCountRow';
import type { Product } from '@/types/products.types';
import type { StocktakeCount } from '@/types/stocktake.types';

interface StocktakeCategorySectionProps {
  categoryName: string;
  products: Product[];
  countsMap: Record<number, StocktakeCount>;
  onCountChange: (
    productId: number,
    expectedQty: number,
    countedQty: number,
  ) => void;
}

export function StocktakeCategorySection({
  categoryName,
  products,
  countsMap,
  onCountChange,
}: StocktakeCategorySectionProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <View className="mb-3">
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        className="bg-paper-100 p-3 rounded-xl border border-paper-300 flex-row items-center justify-between mb-2"
      >
        <StyledText variant="extrabold" className="text-ink-800 text-sm">
          {categoryName} ({products.length})
        </StyledText>
        <FontAwesome
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={12}
          color="#564E45"
        />
      </TouchableOpacity>

      {expanded ? (
        <View className="pl-1">
          {products.map((p) => {
            const count = countsMap[p.id];
            const expected = count ? count.expectedQty : p.quantity;
            const counted = count ? count.countedQty : 0;

            return (
              <StocktakeCountRow
                key={p.id}
                product={p}
                expectedQty={expected}
                countedQty={counted}
                onCountChange={(newQty) =>
                  onCountChange(p.id, expected, newQty)
                }
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
