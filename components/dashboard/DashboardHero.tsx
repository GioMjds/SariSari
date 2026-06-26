import { StyledText } from '@/components/elements';
import { MoneyText, ReceiptHero, ReceiptHeroDivider } from '@/components/ui';
import { MotiView } from 'moti';
import { memo } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

interface DashboardHeroProps {
  totalpesos: number;
  transactionCount: number;
  itemsSold: number;
  creditSales: number;
}

/**
 * DashboardHero — today's "counter command center" headline.
 *
 * Mirrors the rest of the app's receipt-ledger language: a perforated
 * receipt card with the total in display weight, a small divider, and
 * a row of supporting metrics. The number is fed integer-pesos to
 * keep the financial invariant intact end-to-end.
 */
export const DashboardHero = memo(function DashboardHero({
  totalpesos,
  transactionCount,
  itemsSold,
  creditSales,
}: DashboardHeroProps) {
  const { t } = useTranslation();
  return (
    <MotiView
      from={{ opacity: 0, translateY: 18 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 480, delay: 80 }}
    >
      <View className="px-4 mt-2 mb-4">
        <ReceiptHero tone="cinnamon" headerLabel="COUNTER" headerCode="TODAY">
          {/* Eyebrow + supporting metrics strip */}
          <View className="px-5 pt-4 pb-1 flex-row items-center justify-between">
            <StyledText variant="extrabold" className="label-caps text-ink-400">
              {t('common:heroToday')}
            </StyledText>
            <StyledText variant="medium" className="text-mono text-ink-500">
              {t('common:heroTransactions', { count: transactionCount })}
            </StyledText>
          </View>

          {/* Hero total */}
          <View className="px-5 py-4 bg-paper-100 border-y border-dashed border-ink-200">
            <View className="flex-row items-baseline">
              <MoneyText
                value={totalpesos}
                size="display"
                className="text-ink-900 font-extrabold"
                style={{ fontSize: 44, letterSpacing: -1 }}
              />
            </View>
          </View>

          <ReceiptHeroDivider label={t('common:heroBreakdown')} tone="cinnamon" />

          {/* Supporting metrics — three small rows */}
          <View className="px-5 pt-3 pb-4">
            <MetricRow
              label={t('common:heroItemsSold')}
              value={String(itemsSold)}
            />
            <View className="h-px border-t border-dashed border-ink-200 my-1.5" />
            <MetricRow
              label={t('common:heroCreditSales')}
              value={String(creditSales)}
            />
          </View>
        </ReceiptHero>
      </View>
    </MotiView>
  );
});

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-baseline justify-between py-1.5">
      <StyledText variant="extrabold" className="label-caps text-ink-400">
        {label}
      </StyledText>
      <StyledText variant="medium" className="text-mono text-ink-700">
        {value}
      </StyledText>
    </View>
  );
}
