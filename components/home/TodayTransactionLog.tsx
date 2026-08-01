import { StyledText } from '@/components/elements';
import { DashboardRecentSales } from './DashboardRecentSales';
import { View } from 'react-native';

export function TodayTransactionLog({
  sales,
  onOpenSale,
  onSeeAll,
}: {
  sales: any[];
  onOpenSale: (id: number) => void;
  onSeeAll?: () => void;
}) {
  return (
    <View className="mb-4">
      <DashboardRecentSales
        sales={sales}
        onOpenSale={onOpenSale}
        {...(onSeeAll ? { onSeeAll } : {})}
      />
    </View>
  );
}
