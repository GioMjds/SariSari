import { StyledText } from '@/components/elements';
import { DashboardRecentSales } from './DashboardRecentSales';
import { View } from 'react-native';

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
