import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui';
import { TopSellingProduct } from '@/types';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

type TopProductsListProps = {
	products: TopSellingProduct[];
  maxValue?: number;
};

/**
 * TopProductsList — Editorial-style ranking list. Each row is
 * laid out like a row in a printed business almanac: a serif
 * rank numeral, a product name, a thin dashed rule, and a
 * right-aligned sales figure.
 */
export const TopProductsList = memo(function TopProductsList({
  products,
  maxValue,
}: TopProductsListProps) {
  const { t } = useTranslation();
  if (products.length === 0) {
    return (
      <View className="py-4 items-center">
        <StyledText variant="extrabold" className="text-sm text-ink-500 mb-1">
          {t('common:reports.top.emptyTitle')}
        </StyledText>
        <StyledText variant="medium" className="text-ink-500 text-xs">
          {t('common:reports.top.emptyBody')}
        </StyledText>
      </View>
    );
  }

  const candidateMax =
    maxValue ?? Math.max(...products.map((p) => p.revenue), 1);
  const max = candidateMax > 0 ? candidateMax : 1;

  return (
    <View>
      {products.map((product, index) => {
        const widthPct = Math.max(
          0,
          Math.min((product.revenue / max) * 100, 100),
        );
        const isLead = index === 0;

        return (
          <View
            key={product.id}
            className={
              index > 0 ? 'mt-3 pt-3 border-t border-dashed border-ink-200' : ''
            }
          >
            <View className="flex-row items-baseline justify-between">
              <View className="flex-row items-baseline flex-1 mr-3">
                <StyledText
                  variant="black"
                  className={`mr-3 ${
                    isLead ? 'text-persimmon-600' : 'text-ink-400'
                  }`}
                  style={{
                    fontSize: isLead ? 22 : 16,
                    lineHeight: isLead ? 24 : 18,
                    letterSpacing: -0.4,
                  }}
                >
                  {String(index + 1).padStart(2, '0')}
                </StyledText>
                <View className="flex-1">
                  <StyledText
                    variant="semibold"
                    className="text-ink-900 text-sm"
                    numberOfLines={1}
                  >
                    {product.name}
                  </StyledText>
                  <StyledText
                    variant="medium"
                    className="text-ink-500 text-xs mt-0.5"
                  >
                    {t('common:reports.top.units', { count: product.unitsSold })}
                  </StyledText>
                </View>
              </View>
              <MoneyText
                value={product.revenue}
                size="md"
                variant="default"
                className="text-ink-900 text-sm"
              />
            </View>

            {/* Editorial bar — like a bar in a printed report */}
            <View className="mt-2 flex-row items-center">
              <View className="flex-1 h-[3px] bg-ink-100 rounded-full overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: isLead ? '#E85A1F' : '#623418',
                  }}
                />
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
});
