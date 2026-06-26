import {
  getAgingBuckets,
  getCreditsOverview,
  getFastMovingProducts,
  getInventoryMovement,
  getInventoryValue,
  getLowStockItems,
  getOutOfStockItems,
  getProductProfitability,
  getProfitabilityData,
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
  ProfitabilityData,
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

// KPI
export const useReportKPIs = (dateRange: DateRange) =>
  useQuery<ReportKPIs>({
    queryKey: ['report-kpis', dateRange.startDate, dateRange.endDate],
    queryFn: () => getReportKPIs(dateRange),
    enabled: !!dateRange,
    placeholderData: keepPreviousData,
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
  });

export const useInventoryValue = () =>
  useQuery<InventoryValue>({
    queryKey: ['report-inventory-value'],
    queryFn: () => getInventoryValue(),
  });

export const useLowStockItems = (threshold = 10) =>
  useQuery<StockItem[]>({
    queryKey: ['report-low-stock', threshold],
    queryFn: () => getLowStockItems(threshold),
  });

export const useOutOfStockItems = () =>
  useQuery<StockItem[]>({
    queryKey: ['report-out-of-stock'],
    queryFn: () => getOutOfStockItems(),
  });

export const useFastMovingProducts = (dateRange: DateRange, limit = 10) =>
  useQuery<StockItem[]>({
    queryKey: [
      'report-fast-moving',
      dateRange.startDate,
      dateRange.endDate,
      limit,
    ],
    queryFn: () => getFastMovingProducts(dateRange, limit),
    enabled: !!dateRange,
    placeholderData: keepPreviousData,
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
  });

export const useAgingBuckets = () =>
  useQuery<AgingBucket[]>({
    queryKey: ['report-aging-buckets'],
    queryFn: () => getAgingBuckets(),
  });

// Profitability & insights
export const useProfitability = (dateRange: DateRange) =>
  useQuery<ProfitabilityData>({
    queryKey: ['report-profitability', dateRange.startDate, dateRange.endDate],
    queryFn: () => getProfitabilityData(dateRange),
    enabled: !!dateRange,
    placeholderData: keepPreviousData,
  });

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
  });

export const useReportInsights = (dateRange: DateRange) =>
  useQuery<ReportInsight[]>({
    queryKey: ['report-insights', dateRange.startDate, dateRange.endDate],
    queryFn: () => getReportInsights(dateRange),
    enabled: !!dateRange,
    placeholderData: keepPreviousData,
  });

export function useReports() {
  const queryClient = useQueryClient();

  const invalidateReports = async () => {
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
      queryClient.invalidateQueries({ queryKey: ['report-fast-moving'] }),
      queryClient.invalidateQueries({ queryKey: ['report-slow-moving'] }),
      queryClient.invalidateQueries({ queryKey: ['report-credits-overview'] }),
      queryClient.invalidateQueries({ queryKey: ['report-aging-buckets'] }),
      queryClient.invalidateQueries({ queryKey: ['report-profitability'] }),
      queryClient.invalidateQueries({
        queryKey: ['report-product-profitability'],
      }),
      queryClient.invalidateQueries({ queryKey: ['report-insights'] }),
    ]);
  };

  return {
    useReportKPIs,
    useSalesOverTime,
    useTopSellingProducts,
    useSalesBreakdown,
    useInventoryMovement,
    useInventoryValue,
    useLowStockItems,
    useOutOfStockItems,
    useFastMovingProducts,
    useSlowMovingProducts,
    useCreditsOverview,
    useAgingBuckets,
    useProfitability,
    useProductProfitability,
    useReportInsights,
    invalidateReports,
  };
}
