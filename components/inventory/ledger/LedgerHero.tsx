import { useMemo, memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { MotiView } from 'moti';
import { useTranslation } from 'react-i18next';
import { ReceiptHero, StatusPill } from '@/components/ui';
import { StyledText } from '@/components/elements';
import { LOW_STOCK_THRESHOLD } from '@/constants/stocks';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { InventoryTransaction } from '@/types/inventory.types';
import { Product } from '@/types/products.types';
import { bucketByDay, buildLedgerRows, summarizeLedger } from './ledgerMath';
import { StockStrip } from './StockStrip';

const STRIP_DAYS = 30;
const TABULAR = StyleSheet.create({ nums: { fontVariant: ['tabular-nums'] } }).nums;

interface LedgerHeroProps {
  product: Product;
  transactions: InventoryTransaction[];
  unitLabel: string;
}

export const LedgerHero = memo(function LedgerHero({
  product,
  transactions,
  unitLabel,
}: LedgerHeroProps) {
  const { t } = useTranslation('inventory');
  const reducedMotion = useReducedMotion();

  const { totals, buckets } = useMemo(() => {
    const rows = buildLedgerRows(transactions, product.quantity);
    return { totals: summarizeLedger(rows), buckets: bucketByDay(rows, STRIP_DAYS) };
  }, [transactions, product.quantity]);

  const status =
    product.quantity <= 0
      ? { variant: 'danger' as const, label: t('ledgerStatus_out') }
      : product.quantity <= LOW_STOCK_THRESHOLD
        ? { variant: 'warning' as const, label: t('ledgerStatus_low') }
        : { variant: 'success' as const, label: t('ledgerStatus_ok') };

  const netText = `${totals.net > 0 ? '+' : ''}${totals.net}`;
  const meta = [product.sku, product.category].filter(Boolean).join(' · ');

  return (
    <MotiView
      {...(reducedMotion ? {} : { from: { opacity: 0, translateY: 8 } })}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 220 }}
    >
      <ReceiptHero tone="cinnamon" headerLabel={t('ledger30Days')}>
        <View className="px-5 pt-4">
          <StyledText
            variant="black"
            accessibilityRole="header"
            className="text-ink-900 text-2xl"
            style={{ letterSpacing: -0.4 }}
            numberOfLines={2}
          >
            {product.name}
          </StyledText>
          {meta ? (
            <StyledText variant="medium" className="text-ink-500 text-xs mt-1" numberOfLines={1}>
              {meta}
            </StyledText>
          ) : null}
        </View>

        <View
          accessible
          accessibilityLabel={`${t('ledgerOnHand')}: ${product.quantity} ${unitLabel}. ${status.label}. ${t('ledgerNet30', { value: netText })}`}
          className="px-5 pt-4 flex-row items-end justify-between"
        >
          <View>
            <StyledText variant="semibold" className="text-ink-500 text-xs">
              {t('ledgerOnHand')}
            </StyledText>
            <View className="flex-row items-baseline">
              <StyledText
                variant="black"
                className="text-ink-900"
                style={[TABULAR, { fontSize: 44, lineHeight: 50, letterSpacing: -0.88 }]}
              >
                {product.quantity}
              </StyledText>
              <StyledText variant="semibold" className="text-ink-500 text-sm ml-1.5">
                {unitLabel}
              </StyledText>
            </View>
          </View>
          <View className="items-end pb-2 gap-y-1.5">
            <StatusPill variant={status.variant} size="sm" dot>
              {status.label}
            </StatusPill>
            <StyledText
              variant="semibold"
              className={`text-xs ${totals.net > 0 ? 'text-sage-600' : totals.net < 0 ? 'text-semantic-danger' : 'text-ink-500'}`}
              style={TABULAR}
            >
              {t('ledgerNet30', { value: netText })}
            </StyledText>
          </View>
        </View>

        <View className="px-5 pt-4">
          <StockStrip
            buckets={buckets}
            accessibilityLabel={t('ledgerStripA11y', {
              added: totals.added + Math.max(totals.corrected, 0),
              removed: totals.sold + totals.damaged + Math.max(-totals.corrected, 0),
            })}
          />
          <View className="flex-row justify-between mt-1.5">
            <StyledText variant="medium" className="text-ink-400 text-xs">
              {t('ledgerStripStart')}
            </StyledText>
            <StyledText variant="medium" className="text-ink-400 text-xs">
              {t('dayToday')}
            </StyledText>
          </View>
        </View>

        <View className="mx-5 mt-4 mb-4 pt-3 border-t border-dashed border-ink-200 flex-row">
          <Total label={t('movementFilterRestock')} value={totals.added} sign="+" tone="text-sage-600" />
          <Total label={t('movementFilterSale')} value={totals.sold} sign="−" tone="text-semantic-info" />
          <Total label={t('movementFilterDamaged')} value={totals.damaged} sign="−" tone="text-semantic-danger" />
          <Total
            label={t('movementFilterAdjust')}
            value={Math.abs(totals.corrected)}
            sign={totals.corrected < 0 ? '−' : '+'}
            tone="text-semantic-warning"
          />
        </View>
      </ReceiptHero>
    </MotiView>
  );
});

function Total({
  label,
  value,
  sign,
  tone,
}: {
  label: string;
  value: number;
  sign: '+' | '−';
  tone: string;
}) {
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} className="flex-1">
      <StyledText variant="semibold" className="text-ink-500 text-xs" numberOfLines={1}>
        {label}
      </StyledText>
      <StyledText
        variant="black"
        className={`text-lg mt-0.5 ${value === 0 ? 'text-ink-300' : tone}`}
        style={TABULAR}
      >
        {value === 0 ? '0' : `${sign}${value}`}
      </StyledText>
    </View>
  );
}
