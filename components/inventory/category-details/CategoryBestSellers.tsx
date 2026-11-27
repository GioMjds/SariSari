import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('inventory');
  if (!hasProducts) return null;
  const max = sellers[0]?.soldUnits ?? 0;

  return (
    <View className="mx-4 mt-6">
      <View className="flex-row flex-wrap items-baseline justify-between mb-2 px-1 gap-x-3">
        <StyledText
          variant="extrabold"
          accessibilityRole="header"
          className="text-ink-900 text-base"
        >
          {t('category_bestTitle')}
        </StyledText>
        <StyledText variant="medium" className="text-caption text-ink-500">
          {t('category_bestWindow')}
        </StyledText>
      </View>

      <View className="bg-paper-50 rounded-2xl border border-ink-100 overflow-hidden">
        {sellers.length === 0 ? (
          <StyledText
            variant="regular"
            className="text-ink-500 text-sm px-4 py-4"
          >
            {t('category_bestEmpty')}
          </StyledText>
        ) : (
          sellers.map((row, index) => (
            <Pressable
              key={row.product.id}
              onPress={() => onOpenProduct(row.product.id)}
              accessibilityRole="button"
              accessibilityLabel={t('category_bestRowA11y', {
                rank: index + 1,
                name: row.product.name,
                count: row.soldUnits,
              })}
              accessibilityHint={t('category_openProfileHint')}
              className={`flex-row items-center px-4 py-3 min-h-[64px] active:bg-paper-100 ${
                index > 0 ? 'border-t border-dashed border-ink-200' : ''
              }`}
            >
              <StyledText
                variant="black"
                className="text-ink-500 text-sm w-5"
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
                  numberOfLines={2}
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
                  {t('category_bestSold', { count: row.soldUnits })}
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
