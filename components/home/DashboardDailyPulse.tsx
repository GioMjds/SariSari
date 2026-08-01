import React, { memo } from 'react';
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

import { StyledText } from '@/components/elements';
import { useTranslation } from 'react-i18next';
import { formatPesos } from '@/lib/money';

export interface DashboardDailyPulseProps {
  totalPesos: number;
  transactionCount: number;
  onOpenReports: () => void;
  onOpenSales: () => void;
}

/**
 * DashboardDailyPulse — 2 side-by-side key metric cards for Today's Revenue and Today's Sales.
 */
export const DashboardDailyPulse = memo(function DashboardDailyPulse({
  totalPesos,
  transactionCount,
  onOpenReports,
  onOpenSales,
}: DashboardDailyPulseProps) {
  const { t } = useTranslation();

  const revenueLabel = t('common:dashboard.pulse.todayRevenue', {
    defaultValue: "Today's Revenue",
  });
  const salesLabel = t('common:dashboard.pulse.todaySales', {
    defaultValue: "Today's Sales",
  });

  return (
    <View testID="daily-pulse" className="px-4 mb-4">
      <View className="flex-row gap-2.5">

        {/* Card 1: Today's Revenue */}
        <Pressable
          onPress={onOpenReports}
          accessibilityRole="button"
          accessibilityLabel={revenueLabel}
          className="flex-1 bg-paper-50 rounded-2xl p-4 border border-ink-100 shadow-xs active:opacity-80"
        >
          <View className="flex-row items-center justify-between mb-2">
            <StyledText variant="semibold" className="text-xs text-ink-500 uppercase">
              {revenueLabel}
            </StyledText>
            <View className="w-6 h-6 rounded-full bg-persimmon-50 items-center justify-center">
              <FontAwesome name="line-chart" size={12} color="#E85A1F" />
            </View>
          </View>
          <StyledText variant="black" className="text-xl text-ink-900" numberOfLines={1}>
            {formatPesos(totalPesos)}
          </StyledText>
        </Pressable>

        {/* Card 2: Today's Sales */}
        <Pressable
          onPress={onOpenSales}
          accessibilityRole="button"
          accessibilityLabel={salesLabel}
          className="flex-1 bg-paper-50 rounded-2xl p-4 border border-ink-100 shadow-xs active:opacity-80"
        >
          <View className="flex-row items-center justify-between mb-2">
            <StyledText variant="semibold" className="text-xs text-ink-500 uppercase">
              {salesLabel}
            </StyledText>
            <View className="w-6 h-6 rounded-full bg-cinnamon-50 items-center justify-center">
              <FontAwesome name="shopping-cart" size={12} color="#623418" />
            </View>
          </View>
          <StyledText variant="black" className="text-xl text-ink-900">
            {transactionCount}
          </StyledText>
        </Pressable>
      </View>
    </View>
  );
});


