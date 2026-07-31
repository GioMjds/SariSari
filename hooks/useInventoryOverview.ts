import { useMemo } from 'react';
import { useProducts } from '@/hooks/useProducts';
import {
  getStatus,
  type InventoryOverviewCounts,
  type ProductStockStatus,
} from '@/types/inventory.types';
import { MAX_STOCK_THRESHOLD } from '@/constants/stocks';

export interface InventoryOverview {
  totalValue: number;
  productCount: number;
  unitCount: number;
  counts: InventoryOverviewCounts;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
}

const ZERO_COUNTS = {
  healthy: 0,
  low: 0,
  out: 0,
  nearExpiry: 0,
  overstock: 0,
} satisfies InventoryOverviewCounts;

export function useInventoryOverview(): InventoryOverview {
  const { getAllProductsQuery } = useProducts();
  const data = useMemo(
    () => getAllProductsQuery.data ?? [],
    [getAllProductsQuery.data],
  );

  const now = Date.now();

  const computed = useMemo(() => {
    let totalValue = 0;
    let unitCount = 0;
    const counts: InventoryOverviewCounts = { ...ZERO_COUNTS };

    for (const p of data) {
      const qty = p.quantity ?? 0;
      const price = p.price ?? 0;
      totalValue += qty * price;
      unitCount += qty;

      if (qty === 0) counts.out += 1;
      else if (qty > MAX_STOCK_THRESHOLD) counts.overstock += 1;

      const status: ProductStockStatus = getStatus(p, now);
      if (status === 'low_stock') counts.low += 1;
      else if (status === 'near_expiry') counts.nearExpiry += 1;
      else if (status === 'healthy' || status === 'newly_added')
        counts.healthy += 1;
    }

    return {
      totalValue,
      productCount: data.length,
      unitCount,
      counts,
    };
  }, [data, now]);

  return {
    ...computed,
    isLoading: getAllProductsQuery.isLoading,
    error: getAllProductsQuery.error,
    refetch: () => getAllProductsQuery.refetch?.(),
  };
}
