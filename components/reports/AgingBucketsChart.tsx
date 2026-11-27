import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui';
import { AgingBucket, StockItem } from '@/types';
import { MotiView } from 'moti';
import { memo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

type CreditAgingChartProps = {
  buckets: AgingBucket[];
  totalOutstanding: number;
};

interface StampBackground {
  bg: string;
  border: string;
  text: string;
  tone: string;
}

const STAMP_BG = [
  {
    bg: 'bg-sage-50',
    border: 'border-sage-500',
    text: 'text-sage-700',
    tone: 'sage',
  },
  {
    bg: 'bg-semantic-info-50',
    border: 'border-semantic-info',
    text: 'text-semantic-info',
    tone: 'info',
  },
  {
    bg: 'bg-semantic-warning-50',
    border: 'border-semantic-warning',
    text: 'text-semantic-warning',
    tone: 'warning',
  },
  {
    bg: 'bg-semantic-danger-50',
    border: 'border-semantic-danger',
    text: 'text-semantic-danger',
    tone: 'danger',
  },
] satisfies StampBackground[];

export const CreditAgingChart = memo(function CreditAgingChart({
  buckets,
  totalOutstanding,
}: CreditAgingChartProps) {
  const { t } = useTranslation();
  const hasMounted = useRef(false);
  const animationKey = buckets.map((b) => `${b.range}:${b.amount}`).join('|');

  useEffect(() => {
    if (buckets.length > 0) {
      hasMounted.current = true;
    }
  }, [buckets.length]);

  if (buckets.length === 0) {
    return (
      <View className="py-4 items-center">
        <StyledText variant="extrabold" className="text-sm text-ink-500 mb-1">
          {t('common:reports.aging.emptyTitle')}
        </StyledText>
        <StyledText variant="medium" className="text-ink-500 text-xs">
          {t('common:reports.aging.emptyBody')}
        </StyledText>
      </View>
    );
  }

  const shouldAnimate = hasMounted.current;

  return (
    <View>
      {/* Stack of postage stamps */}
      <View className="flex-row flex-wrap justify-between gap-2">
        {buckets.map((bucket, index) => {
          const stampIndex = index % STAMP_BG.length;
          const stamp = STAMP_BG[stampIndex] as StampBackground;
          const safeTotal = totalOutstanding ?? 0;
          const safeAmount = bucket?.amount ?? 0;
          const pct = safeTotal > 0 ? (safeAmount / safeTotal) * 100 : 0;
          const rotate = index % 2 === 0 ? -1.5 : 1.5;

          return (
            <MotiView
              key={`bucket-${animationKey}-${index}`}
              from={{
                opacity: 0,
                scale: shouldAnimate ? 0.92 : 1,
                rotate: shouldAnimate ? '0deg' : `${rotate}deg`,
              }}
              animate={{ opacity: 1, scale: 1, rotate: `${rotate}deg` }}
              transition={{
                type: 'spring',
                damping: 14,
                stiffness: 180,
                delay: shouldAnimate ? 80 * index : 0,
              }}
              className={`flex-1 min-w-[45%] rounded-md ${stamp.bg} ${stamp.border} border-2 border-dashed p-3 shadow-paper`}
            >
              <StyledText
                variant="extrabold"
                className={`text-xs ${stamp.text}`}
              >
                {t(`common:reports.aging.range.${index}`, {
                  defaultValue: bucket.range,
                })}
              </StyledText>

              <View className="mt-2">
                <MoneyText
                  value={bucket.amount}
                  size="md"
                  variant="default"
                  className={`${stamp.text} text-base`}
                />
              </View>

              <View className="mt-2 flex-row items-baseline justify-between">
                <StyledText variant="medium" className="text-ink-500 text-xs">
                  {t('common:reports.aging.suki', { count: bucket.count })}
                </StyledText>
                <StyledText
                  variant="extrabold"
                  className={`text-xs ${stamp.text}`}
                >
                  {Math.round(pct)}%
                </StyledText>
              </View>

              {/* Stamp bar */}
              <View className="mt-1.5 h-1 bg-paper-50/50 rounded-full overflow-hidden">
                <View
                  className="h-full"
                  style={{
                    width: `${pct}%`,
                    backgroundColor:
                      stamp.tone === 'sage'
                        ? '#4F7A24'
                        : stamp.tone === 'info'
                          ? '#2E6FA8'
                          : stamp.tone === 'warning'
                            ? '#C77B0E'
                            : '#C13030',
                  }}
                />
              </View>
            </MotiView>
          );
        })}
      </View>
    </View>
  );
});

/**
 * StockMovementDetails — A small "stock ticker" style row showing
 * the day's inventory movement (sold, low, out). Designed to read
 * at a glance — like the side data table in a financial report.
 */
type StockMovementDetailsProps = {
  itemsSold: number;
  lowStockCount: number;
  outOfStockCount: number;
  fastMoving: StockItem[];
  slowMoving: StockItem[];
};

export const StockMovementDetails = memo(function StockMovementDetails({
  itemsSold,
  lowStockCount,
  outOfStockCount,
  fastMoving,
  slowMoving,
}: StockMovementDetailsProps) {
  const { t } = useTranslation();
  return (
    <View>
      {/* Ticker row */}
      <View className="flex-row items-stretch rounded-md border border-ink-200 overflow-hidden">
        <View className="flex-1 p-3 border-r border-dashed border-ink-200">
          <StyledText
            variant="extrabold"
            className="text-xs text-sage-600 mb-1"
            style={{ letterSpacing: 1.2 }}
          >
            {t('common:reports.stock.sold')}
          </StyledText>
          <StyledText
            variant="black"
            className="text-ink-900"
            style={{ fontSize: 24, lineHeight: 26, letterSpacing: -0.4 }}
          >
            {itemsSold}
          </StyledText>
          <StyledText variant="medium" className="text-ink-500 text-xs">
            {t('common:reports.stock.unitsOut')}
          </StyledText>
        </View>
        <View className="flex-1 p-3 border-r border-dashed border-ink-200">
          <StyledText
            variant="extrabold"
            className="text-xs text-semantic-warning-700 mb-1"
            style={{ letterSpacing: 1.2 }}
          >
            {t('common:reports.stock.low')}
          </StyledText>
          <StyledText
            variant="black"
            className="text-ink-900"
            style={{ fontSize: 24, lineHeight: 26, letterSpacing: -0.4 }}
          >
            {lowStockCount}
          </StyledText>
          <StyledText variant="medium" className="text-ink-500 text-xs">
            {t('common:reports.stock.needRestock')}
          </StyledText>
        </View>
        <View className="flex-1 p-3">
          <StyledText
            variant="extrabold"
            className="text-xs text-semantic-danger mb-1"
            style={{ letterSpacing: 1.2 }}
          >
            {t('common:reports.stock.out')}
          </StyledText>
          <StyledText
            variant="black"
            className="text-ink-900"
            style={{ fontSize: 24, lineHeight: 26, letterSpacing: -0.4 }}
          >
            {outOfStockCount}
          </StyledText>
          <StyledText variant="medium" className="text-ink-500 text-xs">
            {t('common:reports.stock.emptyShelves')}
          </StyledText>
        </View>
      </View>

      {/* Fast / Slow comparison */}
      <View className="mt-3 flex-row gap-3">
        <View className="flex-1 rounded-md border border-ink-200 p-3 bg-sage-50/50">
          <View className="flex-row items-center mb-2">
            <View className="w-1.5 h-1.5 rounded-full bg-sage-500 mr-1.5" />
            <StyledText variant="extrabold" className="text-xs text-sage-700">
              {t('common:reports.stock.fast')}
            </StyledText>
          </View>
          {fastMoving.length === 0 ? (
            <StyledText variant="medium" className="text-ink-500 text-xs">
              {t('common:reports.stock.none')}
            </StyledText>
          ) : (
            fastMoving.slice(0, 4).map((item) => (
              <StyledText
                key={item.id}
                variant="medium"
                className="text-ink-700 text-xs mt-1"
                numberOfLines={1}
              >
                · {item.name}
              </StyledText>
            ))
          )}
        </View>

        <View className="flex-1 rounded-md border border-ink-200 p-3 bg-semantic-warning-50/40">
          <View className="flex-row items-center mb-2">
            <View className="w-1.5 h-1.5 rounded-full bg-semantic-warning mr-1.5" />
            <StyledText
              variant="extrabold"
              className="text-xs text-semantic-warning-700"
            >
              {t('common:reports.stock.slow')}
            </StyledText>
          </View>
          {slowMoving.length === 0 ? (
            <StyledText variant="medium" className="text-ink-500 text-xs">
              {t('common:reports.stock.none')}
            </StyledText>
          ) : (
            slowMoving.slice(0, 4).map((item) => (
              <StyledText
                key={item.id}
                variant="medium"
                className="text-ink-700 text-xs mt-1"
                numberOfLines={1}
              >
                · {item.name}
              </StyledText>
            ))
          )}
        </View>
      </View>
    </View>
  );
});
