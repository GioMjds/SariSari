import {
  getAgingBuckets,
  getCreditsOverview,
  getInventoryMovement,
  getInventoryValue,
  getLowStockItems,
  getProductProfitability,
  getReportInsights,
  getReportKPIs,
  getSalesBreakdown,
  getSalesOverTime,
  getSlowMovingProducts,
  getTopSellingProducts,
  ProductProfitability,
} from '@/database/reports';
import type {
  AgingBucket,
  CreditsOverview,
  DateRange,
  InventoryMovement,
  InventoryValue,
  ReportInsight,
  ReportKPIs,
  SalesBreakdown,
  SalesDataPoint,
  StockItem,
  TopSellingProduct,
} from '@/types/reports.types';
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useCallback } from 'react';

// KPI
export const useReportKPIs = (dateRange: DateRange) =>
  useQuery<ReportKPIs>({
    queryKey: ['report-kpis', dateRange.startDate, dateRange.endDate],
    queryFn: () => getReportKPIs(dateRange),
    enabled: !!dateRange,
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });

// Sales
export const useSalesOverTime = (dateRange: DateRange) =>
  useQuery<SalesDataPoint[]>({
    queryKey: [
      'report-sales-over-time',
      dateRange.startDate,
      dateRange.endDate,
    ],
    queryFn: () => getSalesOverTime(dateRange),
    enabled: !!dateRange,
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });

export const useTopSellingProducts = (dateRange: DateRange, limit = 10) =>
  useQuery<TopSellingProduct[]>({
    queryKey: [
      'report-top-products',
      dateRange.startDate,
      dateRange.endDate,
      limit,
    ],
    queryFn: () => getTopSellingProducts(dateRange, limit),
    enabled: !!dateRange,
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });

export const useSalesBreakdown = (dateRange: DateRange) =>
  useQuery<SalesBreakdown>({
    queryKey: [
      'report-sales-breakdown',
      dateRange.startDate,
      dateRange.endDate,
    ],
    queryFn: () => getSalesBreakdown(dateRange),
    enabled: !!dateRange,
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });

// Inventory
export const useInventoryMovement = (dateRange: DateRange) =>
  useQuery<InventoryMovement>({
    queryKey: [
      'report-inventory-movement',
      dateRange.startDate,
      dateRange.endDate,
    ],
    queryFn: () => getInventoryMovement(dateRange),
    enabled: !!dateRange,
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });

export const useInventoryValue = () =>
  useQuery<InventoryValue>({
    queryKey: ['report-inventory-value'],
    queryFn: () => getInventoryValue(),
    staleTime: 2 * 60 * 1000,
  });

export const useLowStockItems = (threshold = 10) =>
  useQuery<StockItem[]>({
    queryKey: ['report-low-stock', threshold],
    queryFn: () => getLowStockItems(threshold),
    staleTime: 2 * 60 * 1000,
  });

export const useSlowMovingProducts = (dateRange: DateRange, limit = 10) =>
  useQuery<StockItem[]>({
    queryKey: [
      'report-slow-moving',
      dateRange.startDate,
      dateRange.endDate,
      limit,
    ],
    queryFn: () => getSlowMovingProducts(dateRange, limit),
    enabled: !!dateRange,
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });

// Credits
export const useCreditsOverview = (dateRange: DateRange) =>
  useQuery<CreditsOverview>({
    queryKey: [
      'report-credits-overview',
      dateRange.startDate,
      dateRange.endDate,
    ],
    queryFn: () => getCreditsOverview(dateRange),
    enabled: !!dateRange,
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });

export const useAgingBuckets = () =>
  useQuery<AgingBucket[]>({
    queryKey: ['report-aging-buckets'],
    queryFn: () => getAgingBuckets(),
    staleTime: 2 * 60 * 1000,
  });

// Profitability & insights

export const useProductProfitability = (dateRange: DateRange, limit = 10) =>
  useQuery<ProductProfitability[]>({
    queryKey: [
      'report-product-profitability',
      dateRange.startDate,
      dateRange.endDate,
      limit,
    ],
    queryFn: () => getProductProfitability(dateRange, limit),
    enabled: !!dateRange,
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });

export const useReportInsights = (dateRange: DateRange) =>
  useQuery<ReportInsight[]>({
    queryKey: ['report-insights', dateRange.startDate, dateRange.endDate],
    queryFn: () => getReportInsights(dateRange),
    enabled: !!dateRange,
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });

export function useReports() {
  const queryClient = useQueryClient();

  const invalidateReports = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['report-kpis'] }),
      queryClient.invalidateQueries({ queryKey: ['report-sales-over-time'] }),
      queryClient.invalidateQueries({ queryKey: ['report-top-products'] }),
      queryClient.invalidateQueries({ queryKey: ['report-sales-breakdown'] }),
      queryClient.invalidateQueries({
        queryKey: ['report-inventory-movement'],
      }),
      queryClient.invalidateQueries({ queryKey: ['report-inventory-value'] }),
      queryClient.invalidateQueries({ queryKey: ['report-low-stock'] }),
      queryClient.invalidateQueries({ queryKey: ['report-out-of-stock'] }),
      queryClient.invalidateQueries({ queryKey: ['report-slow-moving'] }),
      queryClient.invalidateQueries({ queryKey: ['report-credits-overview'] }),
      queryClient.invalidateQueries({ queryKey: ['report-aging-buckets'] }),
      queryClient.invalidateQueries({
        queryKey: ['report-product-profitability'],
      }),
      queryClient.invalidateQueries({ queryKey: ['report-insights'] }),
    ]);
  }, [queryClient]);

  return {
    invalidateReports,
  };
}
