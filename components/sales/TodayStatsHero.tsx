import React from 'react';
import { StyledText } from '@/components/elements';
import {
  MoneyText,
  ReceiptHero,
  ReceiptHeroDivider,
  ReceiptHeroMeta,
} from '@/components/ui';
import { SaleStats } from '@/types';
import { FontAwesome } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { View } from 'react-native';

interface TodayStatsHeroProps {
  /** Live stats row from `getTodayStats`. */
  stats: SaleStats;
  /** Header label (e.g. "Today Slip"). */
  headerLabel: string;
  /** Sub-header copy (e.g. "Today's Slip"). */
  headerSubLabel: string;
  /** Divider label between header and the total (e.g. "Amount Due"). */
  amountDueLabel: string;
  /** Localized labels for the meta rows. */
  itemsSoldLabel: string;
  creditsLabel: string;
}

export const TodayStatsHero = React.memo(function TodayStatsHero({
  stats,
  headerLabel,
  headerSubLabel,
  amountDueLabel,
  itemsSoldLabel,
  creditsLabel,
}: TodayStatsHeroProps) {
  const txnCount = String(stats.credit_sales + stats.items_sold).padStart(3, '0');

  return (
    <MotiView
      from={{ opacity: 0, translateY: 18 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 480, delay: 80 }}
    >
      <View className="px-4 mt-2 mb-4">
        <ReceiptHero tone="persimmon" headerLabel={headerLabel}>
          <View className="px-5 pt-5 pb-2 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <FontAwesome
                name="calendar"
                size={12}
                color="#FBF7EE"
                style={{ marginRight: 8 }}
              />
              <StyledText
                variant="extrabold"
                className="label-caps text-paper-50 opacity-95"
              >
                {headerSubLabel}
              </StyledText>
            </View>
            <View className="bg-persimmon-600/60 px-2 py-0.5 rounded-full border border-paper-50/20">
              <StyledText
                variant="semibold"
                className="text-mono text-paper-50 text-xs"
              >
                #{txnCount}
              </StyledText>
            </View>
          </View>

          <ReceiptHeroDivider label={amountDueLabel} tone="persimmon" />

          <View className="px-5 py-1">
            <MoneyText
              value={stats.total}
              size="display"
              className="text-ink-900"
            />
          </View>

          <ReceiptHeroMeta
            rows={[
              {
                label: itemsSoldLabel,
                value: String(stats.items_sold),
              },
              {
                label: creditsLabel,
                value: String(stats.credit_sales),
              },
            ]}
          />
        </ReceiptHero>
      </View>
    </MotiView>
  );
});