import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProducts } from '@/hooks/useProducts';
import {
  AnalyticsCharts,
  AnalyticsSkeleton,
} from '@/components/inventory/analytics';
import { InventoryErrorState } from '@/components/inventory/InventoryErrorState';

export default function AnalyticsScreen() {
  const { getAllProductsQuery } = useProducts();
  const insets = useSafeAreaInsets();
  if (getAllProductsQuery.isLoading) return <AnalyticsSkeleton />;
  if (getAllProductsQuery.error)
    return (
      <InventoryErrorState onRetry={() => getAllProductsQuery.refetch?.()} />
    );
  return (
    <View
      className="flex-1 bg-paper-200"
      style={{ paddingBottom: insets.bottom }}
    >
      <AnalyticsCharts />
    </View>
  );
}
