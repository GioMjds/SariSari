import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { PriceHistoryCard } from '@/components/pricing';
import { formatPesos } from '@/lib/money';
import type { Product } from '@/types';
import { marginPercent, type ProductInsights } from './productInsights';

const TABULAR = StyleSheet.create({ nums: { fontVariant: ['tabular-nums'] } }).nums;

interface ProductPricingTabProps {
  product: Product;
  insights: ProductInsights;
  unitLabel: string;
}

export const ProductPricingTab = memo(function ProductPricingTab({
  product,
  insights,
  unitLabel,
}: ProductPricingTabProps) {
  const { t } = useTranslation('inventory');
  const wholesaleUnit = product.wholesale_unit_name?.trim();
  const hasWholesale = !!wholesaleUnit && product.wholesale_price != null;
  const factor = product.conversion_factor ?? 0;

  return (
    <View>
      <PriceBlock
        title={t('details_retail', { unit: unitLabel })}
        price={product.price}
        cost={product.cost_price ?? null}
      >
        {insights.lastUnitCost !== null && insights.lastUnitCostAt !== null && (
          <StyledText variant="medium" className="text-ink-600 text-xs mt-3" style={TABULAR}>
            {`${t('details_lastPaid')}: ${t('details_onDate', {
              value: formatPesos(insights.lastUnitCost),
              date: format(insights.lastUnitCostAt, 'MMM d'),
            })}`}
          </StyledText>
        )}
      </PriceBlock>

      {hasWholesale && (
        <PriceBlock
          title={t('details_wholesale', { unit: wholesaleUnit })}
          price={product.wholesale_price!}
          cost={product.wholesale_cost_price ?? null}
        >
          {factor > 0 && (
            <View className="mt-3 pt-3 border-t border-dashed border-ink-200">
              <StyledText variant="semibold" className="text-ink-900 text-sm" style={TABULAR}>
                {t('details_conversion', { wholesale: wholesaleUnit, count: factor, unit: unitLabel })}
              </StyledText>
              <StyledText variant="medium" className="text-ink-600 text-xs mt-0.5" style={TABULAR}>
                {`${t('details_perUnitWholesale', { unit: unitLabel })}: ${formatPesos(
                  product.wholesale_price! / factor,
                )}`}
              </StyledText>
            </View>
          )}
        </PriceBlock>
      )}

      <PriceHistoryCard productId={product.id} />
    </View>
  );
});

function PriceBlock({
  title,
  price,
  cost,
  children,
}: {
  title: string;
  price: number;
  cost: number | null;
  children?: React.ReactNode;
}) {
  const { t } = useTranslation('inventory');
  const profit = cost !== null ? price - cost : null;
  const margin = cost !== null ? marginPercent(price, cost) : null;
  const isLoss = profit !== null && profit < 0;

  return (
    <View className="mx-4 mb-4 p-4 bg-paper-50 rounded-2xl border border-ink-100">
      <StyledText variant="extrabold" accessibilityRole="header" className="text-ink-900 text-sm mb-3">
        {title}
      </StyledText>
      <View className="flex-row">
        <Cell label={t('details_price')} value={formatPesos(price)} />
        <Cell label={t('details_cost')} value={cost !== null ? formatPesos(cost) : '—'} />
      </View>

      {profit !== null ? (
        <View
          className={`flex-row mt-3 p-3 rounded-xl ${isLoss ? 'bg-semantic-danger-50' : 'bg-sage-50'}`}
        >
          <Cell
            label={t('details_profit')}
            value={formatPesos(profit)}
            tone={isLoss ? 'text-semantic-danger' : 'text-sage-700'}
          />
          <Cell
            label={t('details_margin')}
            value={margin !== null ? `${margin.toFixed(1)}%` : '—'}
            tone={isLoss ? 'text-semantic-danger' : 'text-sage-700'}
          />
        </View>
      ) : (
        <View className="flex-row items-center mt-3 p-3 rounded-xl bg-paper-100">
          <Ionicons name="information-circle-outline" size={16} color="#564E45" />
          <StyledText variant="medium" className="text-ink-700 text-xs ml-2 flex-1">
            {t('details_noCost')}
          </StyledText>
        </View>
      )}

      {isLoss && (
        <View accessibilityRole="alert" className="flex-row items-center mt-2">
          <Ionicons name="alert-circle" size={14} color="#C13030" />
          <StyledText variant="semibold" className="text-semantic-danger text-xs ml-1.5 flex-1">
            {t('details_loss')}
          </StyledText>
        </View>
      )}

      {children}
    </View>
  );
}

function Cell({ label, value, tone = 'text-ink-900' }: { label: string; value: string; tone?: string }) {
  return (
    <View accessible accessibilityLabel={`${label}, ${value}`} className="flex-1">
      <StyledText variant="semibold" className="text-ink-500 text-xs">
        {label}
      </StyledText>
      <StyledText variant="black" className={`text-lg ${tone}`} style={TABULAR} numberOfLines={1}>
        {value}
      </StyledText>
    </View>
  );
}
