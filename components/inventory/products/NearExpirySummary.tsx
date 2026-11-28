import { useMemo } from 'react';
import { View } from 'react-native';
import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui/MoneyText';
import { useNearExpiryDays } from '@/hooks/useAppSetting';
import { useWriteOffCost } from '@/hooks/useInventoryOverview';
import { useProducts } from '@/hooks/useProducts';
import { getStatus } from '@/types/inventory.types';

/** Money at risk on the near-expiry list plus what was already written off in the last 30 days. */
export function NearExpirySummary() {
  const { getAllProductsQuery } = useProducts();
  const windowDays = useNearExpiryDays();
  const { data: writtenOff = 0 } = useWriteOffCost(30);
  const products = getAllProductsQuery.data;

  const atRisk = useMemo(() => {
    const now = Date.now();
    return (products ?? []).reduce(
      (sum, p) =>
        getStatus(p, now, windowDays) === 'near_expiry'
          ? sum + p.quantity * (p.cost_price ?? 0)
          : sum,
      0,
    );
  }, [products, windowDays]);

  return (
    <View className="mx-4 mb-2 flex-row rounded-2xl border border-persimmon-100 bg-persimmon-50 p-3 gap-x-4">
      <View className="flex-1">
        <StyledText variant="medium" className="text-ink-600 text-xs">
          At risk (cost)
        </StyledText>
        <MoneyText value={atRisk} size="lg" className="text-persimmon-700" />
      </View>
      <View className="flex-1">
        <StyledText variant="medium" className="text-ink-600 text-xs">
          Written off, 30 days
        </StyledText>
        <MoneyText value={writtenOff} size="lg" className="text-ink-900" />
      </View>
    </View>
  );
}
