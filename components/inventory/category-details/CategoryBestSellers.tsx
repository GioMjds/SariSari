import { Pressable, View } from 'react-native';
import { StyledText } from '@/components/elements';
import { MoneyText, ProductThumb } from '@/components/ui';
import type { CategoryRow } from './categoryInsights';

interface CategoryBestSellersProps {
  sellers: CategoryRow[];
  hasProducts: boolean;
  onOpenProduct: (productId: number) => void;
}

const TABULAR = { fontVariant: ['tabular-nums' as const] };

export function CategoryBestSellers({
  sellers,
  hasProducts,
  onOpenProduct,
}: CategoryBestSellersProps) {
  if (!hasProducts) return null;
  const max = sellers[0]?.soldUnits ?? 0;

  return (
    <View className="mx-4 mt-6">
      <View className="flex-row items-baseline justify-between mb-2 px-1">
        <StyledText
          variant="extrabold"
          accessibilityRole="header"
          className="text-ink-900 text-base"
        >
          Best sellers
        </StyledText>
        <StyledText variant="medium" className="text-caption text-ink-500">
          Last 28 days · cash
        </StyledText>
      </View>

      <View className="bg-paper-50 rounded-2xl border border-ink-100 overflow-hidden">
        {sellers.length === 0 ? (
          <StyledText
            variant="regular"
            className="text-ink-500 text-sm px-4 py-4"
          >
            No cash sales from this category in the last 28 days.
          </StyledText>
        ) : (
          sellers.map((row, index) => (
            <Pressable
              key={row.product.id}
              onPress={() => onOpenProduct(row.product.id)}
              accessibilityRole="button"
              accessibilityLabel={`Number ${index + 1}, ${row.product.name}, ${row.soldUnits} sold`}
              accessibilityHint="Opens the product profile"
              className={`flex-row items-center px-4 py-3 active:bg-paper-100 ${
                index > 0 ? 'border-t border-dashed border-ink-200' : ''
              }`}
            >
              <StyledText
                variant="black"
                className="text-ink-400 text-sm w-5"
                style={TABULAR}
              >
                {index + 1}
              </StyledText>
              <ProductThumb
                name={row.product.name}
                imageUri={row.product.image_uri}
                className="w-10 h-10 rounded-lg mr-3"
                initialsClassName="text-sm"
              />
              <View className="flex-1 pr-3">
                <StyledText
                  variant="extrabold"
                  className="text-ink-900 text-sm"
                  numberOfLines={1}
                >
                  {row.product.name}
                </StyledText>
                <View className="h-1.5 rounded-full bg-ink-100 mt-1.5 overflow-hidden">
                  <View
                    className="h-1.5 rounded-full bg-sage-500"
                    style={{
                      width: `${max > 0 ? (row.soldUnits / max) * 100 : 0}%`,
                    }}
                  />
                </View>
              </View>
              <View className="items-end">
                <StyledText
                  variant="extrabold"
                  className="text-ink-900 text-sm"
                  style={TABULAR}
                >
                  {row.soldUnits} sold
                </StyledText>
                <MoneyText
                  value={row.revenue}
                  className="text-ink-500 text-[12px]"
                />
              </View>
            </Pressable>
          ))
        )}
      </View>
    </View>
  );
}
