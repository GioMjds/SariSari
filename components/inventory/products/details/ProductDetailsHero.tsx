import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { MotiView } from 'moti';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { LOW_STOCK_THRESHOLD } from '@/constants/stocks';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ProductThumb } from '@/components/ui/ProductThumb';
import { ReceiptHero, StatusStamp } from '@/components/ui';
import { formatPesos } from '@/lib/money';
import type { Product } from '@/types';
import type { ProductInsights } from './productInsights';

const TABULAR = StyleSheet.create({
  nums: { fontVariant: ['tabular-nums'] },
}).nums;
// Below this many days of cover the hero warns even when stock is above the low threshold.
const RUNS_OUT_SOON_DAYS = 7;

interface ProductDetailsHeroProps {
  product: Product;
  insights: ProductInsights;
  unitLabel: string;
}

type Hint = { tone: 'danger' | 'warning'; text: string };

export const ProductDetailsHero = memo(function ProductDetailsHero({
  product,
  insights,
  unitLabel,
}: ProductDetailsHeroProps) {
  const { t } = useTranslation('inventory');
  const reducedMotion = useReducedMotion();
  const isOut = product.quantity <= 0;
  const isLow = !isOut && product.quantity <= LOW_STOCK_THRESHOLD;
  const { daysLeft } = insights;

  const stamp = isOut
    ? { tone: 'persimmon' as const, label: t('ledgerStatus_out') }
    : isLow
      ? { tone: 'cinnamon' as const, label: t('ledgerStatus_low') }
      : { tone: 'sage' as const, label: t('ledgerStatus_ok') };

  let hint: Hint | null = null;
  if (isOut) hint = { tone: 'danger', text: t('details_hint_out') };
  else if (isLow)
    hint = {
      tone: 'warning',
      text:
        daysLeft !== null
          ? t('details_hint_lowPace', { count: daysLeft })
          : t('details_hint_low'),
    };
  else if (daysLeft !== null && daysLeft <= RUNS_OUT_SOON_DAYS)
    hint = {
      tone: 'warning',
      text: t('details_hint_soon', { count: daysLeft }),
    };

  const codes = [product.sku, product.barcode].filter(Boolean).join(' · ');

  return (
    <MotiView
      {...(reducedMotion ? {} : { from: { opacity: 0, translateY: 8 } })}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 220 }}
    >
      <ReceiptHero
        tone="cinnamon"
        headerLabel={product.category?.trim() || t('details_uncategorized')}
      >
        {/* Identity */}
        <View className="px-5 pt-5 flex-row items-start">
          <ProductThumb
            name={product.name}
            imageUri={product.image_uri}
            className="w-16 h-16 rounded-xl border border-paper-300"
            initialsClassName="text-2xl"
          />
          <View className="flex-1 ml-4 pr-2">
            <StyledText
              variant="black"
              accessibilityRole="header"
              className="text-ink-900 text-2xl"
              style={{ letterSpacing: -0.4 }}
              numberOfLines={2}
            >
              {product.name}
            </StyledText>
            {codes ? (
              <View className="flex-row items-center mt-1">
                <Ionicons
                  name="barcode-outline"
                  size={14}
                  className="text-ink-400"
                />
                <StyledText
                  variant="medium"
                  className="text-ink-500 text-xs ml-1.5"
                  style={TABULAR}
                  numberOfLines={1}
                >
                  {codes}
                </StyledText>
              </View>
            ) : null}
          </View>
          <StatusStamp
            label={stamp.label}
            tone={stamp.tone}
            size="sm"
            rotate={6}
          />
        </View>

        {/* Key numbers */}
        <View className="px-5 pt-5 pb-4 flex-row">
          <View
            accessible
            accessibilityLabel={`${t('details_onHand')}, ${product.quantity} ${unitLabel}`}
            className="flex-1"
          >
            <StyledText
              variant="semibold"
              className="text-ink-500 text-xs mb-1"
            >
              {t('details_onHand')}
            </StyledText>
            <View className="flex-row items-baseline">
              <StyledText
                variant="black"
                className={`text-hero shrink ${isOut ? 'text-semantic-danger' : 'text-ink-900'}`}
                style={TABULAR}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {product.quantity}
              </StyledText>
              <StyledText
                variant="medium"
                className="text-ink-500 text-base ml-1.5"
                numberOfLines={1}
              >
                {unitLabel}
              </StyledText>
            </View>
          </View>
          <View className="w-px bg-ink-100 mx-4" />
          <View
            accessible
            accessibilityLabel={`${t('details_sellingPrice', { unit: unitLabel })}, ${formatPesos(product.price)}`}
            className="flex-1"
          >
            <StyledText
              variant="semibold"
              className="text-ink-500 text-xs mb-1"
              numberOfLines={2}
            >
              {t('details_sellingPrice', { unit: unitLabel })}
            </StyledText>
            <StyledText
              variant="black"
              className="text-ink-900 text-3xl"
              style={TABULAR}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatPesos(product.price)}
            </StyledText>
          </View>
        </View>

        {/* Pace strip */}
        <View className="mx-5 mb-4 flex-row bg-paper-100 rounded-xl border border-dashed border-ink-200">
          <InsightCell
            label={t('details_sold28')}
            value={
              insights.sold28 > 0
                ? t('details_qtyUnit', {
                    count: insights.sold28,
                    unit: unitLabel,
                  })
                : t('details_noSalesYet')
            }
          />
          <View className="w-px bg-ink-200 my-2" />
          <InsightCell
            label={t('details_daysLeft')}
            value={daysLeft === null ? '—' : String(daysLeft)}
            spokenValue={
              daysLeft === null ? t('details_notEnoughSales') : undefined
            }
          />
          <View className="w-px bg-ink-200 my-2" />
          <InsightCell
            label={t('details_lastRestock')}
            value={
              insights.lastRestockAt
                ? format(insights.lastRestockAt, 'MMM d')
                : t('details_never')
            }
          />
        </View>

        {hint && (
          <View
            accessibilityRole="alert"
            className={`mx-5 mb-5 px-3 py-2.5 rounded-xl flex-row items-center ${
              hint.tone === 'danger'
                ? 'bg-semantic-danger-50'
                : 'bg-semantic-warning-50'
            }`}
          >
            <Ionicons
              name={hint.tone === 'danger' ? 'alert-circle' : 'time-outline'}
              size={18}
              className={
                hint.tone === 'danger'
                  ? 'text-semantic-danger'
                  : 'text-semantic-warning'
              }
            />
            <StyledText
              variant="semibold"
              className="flex-1 ml-2 text-ink-900 text-sm"
            >
              {hint.text}
            </StyledText>
          </View>
        )}
      </ReceiptHero>
    </MotiView>
  );
});

// Labels and values wrap rather than truncate, so long Tagalog copy and large text stay readable.
function InsightCell({
  label,
  value,
  spokenValue,
}: {
  label: string;
  value: string;
  spokenValue?: string;
}) {
  return (
    <View
      accessible
      accessibilityLabel={`${label}, ${spokenValue ?? value}`}
      className="flex-1 px-3 py-2.5"
    >
      <StyledText variant="semibold" className="text-ink-500 text-xs">
        {label}
      </StyledText>
      <StyledText
        variant="extrabold"
        className="text-ink-900 text-sm mt-0.5"
        style={TABULAR}
      >
        {value}
      </StyledText>
    </View>
  );
}
