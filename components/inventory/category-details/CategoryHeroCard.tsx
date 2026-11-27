import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { StyledText } from '@/components/elements';
import { MoneyText, ReceiptHero, StatusStamp } from '@/components/ui';
import { CATEGORY_TINTS } from '@/components/inventory/category/CategoryCard';
import { formatPesos } from '@/lib/money';
import type { Category } from '@/types';
import type { CategorySummary } from './categoryInsights';

interface CategoryHeroCardProps {
  category: Category;
  summary: CategorySummary;
  catalogShare: number;
  salesLoading: boolean;
}

const TABULAR = { fontVariant: ['tabular-nums' as const] };

function stampFor(summary: CategorySummary, t: TFunction) {
  if (summary.productCount === 0)
    return {
      label: t('category_stampEmpty'),
      tone: 'ink' as const,
      rotate: -4,
    };
  if (summary.out > 0)
    return {
      label: t('category_stampOut', { count: summary.out }),
      tone: 'cinnamon' as const,
      rotate: -8,
    };
  if (summary.low > 0)
    return {
      label: t('category_stampLow', { count: summary.low }),
      tone: 'cinnamon' as const,
      rotate: -8,
    };
  return { label: t('category_stampGood'), tone: 'sage' as const, rotate: 6 };
}

function Stat({
  label,
  children,
  hint,
  hintTone = 'text-ink-500',
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  hintTone?: string;
}) {
  return (
    <View className="flex-1 p-3.5" accessible>
      <StyledText variant="semibold" className="text-caption text-ink-500">
        {label}
      </StyledText>
      <View className="mt-1">{children}</View>
      {hint ? (
        <StyledText
          variant="medium"
          className={`text-[12px] mt-0.5 ${hintTone}`}
          style={TABULAR}
        >
          {hint}
        </StyledText>
      ) : null}
    </View>
  );
}

// Half-width cells are narrow, so big totals shrink to fit instead of ellipsizing.
function FitMoney({ value, tone }: { value: number; tone: string }) {
  return (
    <StyledText
      variant="black"
      className={`text-xl ${tone}`}
      style={TABULAR}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.6}
    >
      {formatPesos(value)}
    </StyledText>
  );
}

function Count({ value, unit }: { value: number; unit: string }) {
  return (
    <View className="flex-row flex-wrap items-baseline">
      <StyledText
        variant="black"
        className="text-ink-900 text-2xl"
        style={TABULAR}
      >
        {value.toLocaleString('en-PH')}
      </StyledText>
      <StyledText variant="medium" className="text-ink-500 text-sm ml-1">
        {unit}
      </StyledText>
    </View>
  );
}

export function CategoryHeroCard({
  category,
  summary,
  catalogShare,
  salesLoading,
}: CategoryHeroCardProps) {
  const { t } = useTranslation('inventory');
  const tint = CATEGORY_TINTS[category.id % CATEGORY_TINTS.length]!;
  const stamp = stampFor(summary, t);
  const count = summary.productCount;
  const allPriced = summary.missingCost === 0;
  const pcs = t('category_unitPcs');

  return (
    <ReceiptHero tone="cinnamon" headerLabel={t('category_heroHeader')}>
      {/* Identity */}
      <View className="px-5 pt-5 pb-4 flex-row items-center">
        <View
          className={`w-14 h-14 rounded-xl items-center justify-center mr-3 ${tint.tile}`}
        >
          <StyledText variant="black" className={`text-2xl ${tint.text}`}>
            {category.name.trim().charAt(0).toUpperCase()}
          </StyledText>
        </View>
        <View className="flex-1 pr-2 min-w-0">
          <StyledText
            variant="black"
            accessibilityRole="header"
            className="text-ink-900 text-2xl"
            style={{ letterSpacing: -0.4 }}
            numberOfLines={2}
          >
            {category.name}
          </StyledText>
          <StyledText
            variant="medium"
            className="text-ink-500 text-sm mt-0.5"
            style={TABULAR}
          >
            {count === 0
              ? t('category_noProducts')
              : t('category_catalogShare', {
                  products: t('category_productCount', { count }),
                  share: catalogShare,
                })}
          </StyledText>
        </View>
        <StatusStamp
          label={stamp.label}
          tone={stamp.tone}
          size="sm"
          rotate={stamp.rotate}
        />
      </View>

      {/* Key numbers, 2 x 2 */}
      <View className="mx-4 mb-4 rounded-2xl bg-paper-100 border border-dashed border-ink-200">
        <View className="flex-row border-b border-dashed border-ink-200">
          <Stat
            label={t('category_statStockValue')}
            hint={t('category_statStockValueHint')}
          >
            <FitMoney value={summary.stockValue} tone="text-ink-900" />
          </Stat>
          <View className="w-px bg-ink-200" />
          <Stat
            label={t('category_statProfit')}
            hint={
              summary.pricedCount === 0
                ? t('category_statProfitNone')
                : allPriced
                  ? t('category_statProfitAll')
                  : t('category_statProfitPartial', {
                      priced: summary.pricedCount,
                      total: count,
                    })
            }
            hintTone={allPriced ? 'text-ink-500' : 'text-semantic-warning-700'}
          >
            {summary.pricedCount === 0 ? (
              <StyledText variant="black" className="text-ink-400 text-xl">
                —
              </StyledText>
            ) : (
              <FitMoney value={summary.potentialProfit} tone="text-sage-700" />
            )}
          </Stat>
        </View>
        <View className="flex-row">
          <Stat
            label={t('category_statShelf')}
            hint={
              summary.out > 0
                ? t('category_statShelfOut', { count: summary.out })
                : t('category_statShelfHint')
            }
          >
            <Count value={summary.units} unit={pcs} />
          </Stat>
          <View className="w-px bg-ink-200" />
          <Stat
            label={t('category_statSold')}
            hint={
              salesLoading
                ? t('category_statSoldCounting')
                : summary.utangUnits > 0
                  ? t('category_statSoldUtang', { count: summary.utangUnits })
                  : t('category_statSoldCash')
            }
          >
            <Count value={summary.soldUnits} unit={pcs} />
            {summary.revenue > 0 ? (
              <MoneyText
                value={summary.revenue}
                className="text-ink-700 text-sm"
              />
            ) : null}
          </Stat>
        </View>
      </View>
    </ReceiptHero>
  );
}
