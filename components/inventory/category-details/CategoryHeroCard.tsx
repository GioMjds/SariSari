import type { ReactNode } from 'react';
import { View } from 'react-native';
import { StyledText } from '@/components/elements';
import { MoneyText, ReceiptHero, StatusStamp } from '@/components/ui';
import { CATEGORY_TINTS } from '@/components/inventory/category/CategoryCard';
import type { Category } from '@/types';
import type { CategorySummary } from './categoryInsights';

interface CategoryHeroCardProps {
  category: Category;
  summary: CategorySummary;
  catalogShare: number;
  salesLoading: boolean;
}

const TABULAR = { fontVariant: ['tabular-nums' as const] };

function stampFor(summary: CategorySummary) {
  if (summary.productCount === 0)
    return { label: 'EMPTY', tone: 'ink' as const, rotate: -4 };
  if (summary.out > 0)
    return {
      label: `${summary.out} OUT`,
      tone: 'cinnamon' as const,
      rotate: -8,
    };
  if (summary.low > 0)
    return {
      label: `${summary.low} LOW`,
      tone: 'cinnamon' as const,
      rotate: -8,
    };
  return { label: 'ALL GOOD', tone: 'sage' as const, rotate: 6 };
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
          numberOfLines={2}
        >
          {hint}
        </StyledText>
      ) : null}
    </View>
  );
}

function Count({ value, unit }: { value: number; unit: string }) {
  return (
    <View className="flex-row items-baseline">
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
  const tint = CATEGORY_TINTS[category.id % CATEGORY_TINTS.length]!;
  const stamp = stampFor(summary);
  const count = summary.productCount;
  const countLabel = `${count} ${count === 1 ? 'product' : 'products'}`;
  const allPriced = summary.missingCost === 0;

  return (
    <ReceiptHero tone="cinnamon" headerLabel="CATEGORY">
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
              ? 'No products yet'
              : `${countLabel} · ${catalogShare}% of catalog`}
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
          <Stat label="Stock value" hint="At selling price">
            <MoneyText
              value={summary.stockValue}
              className="text-ink-900 text-xl font-extrabold"
              numberOfLines={1}
            />
          </Stat>
          <View className="w-px bg-ink-200" />
          <Stat
            label="Potential profit"
            hint={
              summary.pricedCount === 0
                ? 'Add cost prices to see profit'
                : allPriced
                  ? 'If all stock sells'
                  : `${summary.pricedCount} of ${count} have cost`
            }
            hintTone={allPriced ? 'text-ink-500' : 'text-semantic-warning'}
          >
            {summary.pricedCount === 0 ? (
              <StyledText variant="black" className="text-ink-400 text-xl">
                —
              </StyledText>
            ) : (
              <MoneyText
                value={summary.potentialProfit}
                className="text-sage-700 text-xl font-extrabold"
                numberOfLines={1}
              />
            )}
          </Stat>
        </View>
        <View className="flex-row">
          <Stat
            label="On the shelf"
            hint={
              summary.out > 0 ? `${summary.out} at zero` : 'Pieces in stock'
            }
          >
            <Count value={summary.units} unit="pcs" />
          </Stat>
          <View className="w-px bg-ink-200" />
          <Stat
            label="Sold · 28 days"
            hint={
              salesLoading
                ? 'Counting…'
                : summary.utangUnits > 0
                  ? `Cash only · ${summary.utangUnits} more on utang`
                  : 'Cash sales only'
            }
          >
            <Count value={summary.soldUnits} unit="pcs" />
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
