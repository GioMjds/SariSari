import React from 'react';
import { View } from 'react-native';
import { StyledText } from '@/components/elements';
import { DashboardRecentSales } from '@/components/dashboard/DashboardRecentSales';

export function TodayTransactionLog({
  sales,
  onOpenSale,
}: {
  sales: any[];
  onOpenSale: (id: number) => void;
}) {
  return (
    <View className="mb-4">
      <View className="px-4 mb-2">
        <StyledText variant="extrabold" className="text-ink-900 text-base">
          Today&apos;s Transactions Log
        </StyledText>
      </View>
      <DashboardRecentSales
        sales={sales}
        onOpenSale={onOpenSale}
        onSeeAll={() => {}}
      />
    </View>
  );
}
