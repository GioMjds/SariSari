import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    getAgingBuckets,
    getCreditsOverview,
    getFastMovingProducts,
    getInventoryMovement,
    getInventoryValue,
    getLowStockItems,
    getOutOfStockItems,
    getProfitabilityData,
    getReportInsights,
    getReportKPIs,
    getSalesBreakdown,
    getSalesOverTime,
    getSlowMovingProducts,
    getTopSellingProducts,
} from '@/db/reports';
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

export function useReports() {
    const queryClient = useQueryClient();

    // KPI
    const useReportKPIs = (dateRange: DateRange) =>
        useQuery<ReportKPIs>({
            queryKey: ['report-kpis', dateRange.startDate, dateRange.endDate],
            queryFn: () => getReportKPIs(dateRange),
            enabled: !!dateRange,
        });

    // Sales
    const useSalesOverTime = (dateRange: DateRange) =>
        useQuery<SalesDataPoint[]>({
            queryKey: ['report-sales-over-time', dateRange.startDate, dateRange.endDate],
            queryFn: () => getSalesOverTime(dateRange),
            enabled: !!dateRange,
        });

    const useTopSellingProducts = (dateRange: DateRange, limit = 10) =>
        useQuery<TopSellingProduct[]>({
            queryKey: ['report-top-products', dateRange.startDate, dateRange.endDate, limit],
            queryFn: () => getTopSellingProducts(dateRange, limit),
            enabled: !!dateRange,
        });

    const useSalesBreakdown = (dateRange: DateRange) =>
        useQuery<SalesBreakdown>({
            queryKey: ['report-sales-breakdown', dateRange.startDate, dateRange.endDate],
            queryFn: () => getSalesBreakdown(dateRange),
            enabled: !!dateRange,
        });

    // Inventory
    const useInventoryMovement = (dateRange: DateRange) =>
        useQuery<InventoryMovement>({
            queryKey: ['report-inventory-movement', dateRange.startDate, dateRange.endDate],
            queryFn: () => getInventoryMovement(dateRange),
            enabled: !!dateRange,
        });

    const useInventoryValue = () =>
        useQuery<InventoryValue>({
            queryKey: ['report-inventory-value'],
            queryFn: () => getInventoryValue(),
        });

    const useLowStockItems = (threshold = 10) =>
        useQuery<StockItem[]>({
            queryKey: ['report-low-stock', threshold],
            queryFn: () => getLowStockItems(threshold),
        });

    const useOutOfStockItems = () =>
        useQuery<StockItem[]>({
            queryKey: ['report-out-of-stock'],
            queryFn: () => getOutOfStockItems(),
        });

    const useFastMovingProducts = (dateRange: DateRange, limit = 10) =>
        useQuery<StockItem[]>({
            queryKey: ['report-fast-moving', dateRange.startDate, dateRange.endDate, limit],
            queryFn: () => getFastMovingProducts(dateRange, limit),
            enabled: !!dateRange,
        });

    const useSlowMovingProducts = (dateRange: DateRange, limit = 10) =>
        useQuery<StockItem[]>({
            queryKey: ['report-slow-moving', dateRange.startDate, dateRange.endDate, limit],
            queryFn: () => getSlowMovingProducts(dateRange, limit),
            enabled: !!dateRange,
        });

    // Credits
    const useCreditsOverview = (dateRange: DateRange) =>
        useQuery<CreditsOverview>({
            queryKey: ['report-credits-overview', dateRange.startDate, dateRange.endDate],
            queryFn: () => getCreditsOverview(dateRange),
            enabled: !!dateRange,
        });

    const useAgingBuckets = () =>
        useQuery<AgingBucket[]>({
            queryKey: ['report-aging-buckets'],
            queryFn: () => getAgingBuckets(),
        });

    // Profitability & insights
    const useProfitability = (dateRange: DateRange) =>
        useQuery<ProfitabilityData>({
            queryKey: ['report-profitability', dateRange.startDate, dateRange.endDate],
            queryFn: () => getProfitabilityData(dateRange),
            enabled: !!dateRange,
        });

    const useReportInsights = (dateRange: DateRange) =>
        useQuery<ReportInsight[]>({
            queryKey: ['report-insights', dateRange.startDate, dateRange.endDate],
            queryFn: () => getReportInsights(dateRange),
            enabled: !!dateRange,
        });

    const invalidateReports = async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['report-kpis'] }),
            queryClient.invalidateQueries({ queryKey: ['report-sales-over-time'] }),
            queryClient.invalidateQueries({ queryKey: ['report-top-products'] }),
            queryClient.invalidateQueries({ queryKey: ['report-sales-breakdown'] }),
            queryClient.invalidateQueries({ queryKey: ['report-inventory-movement'] }),
            queryClient.invalidateQueries({ queryKey: ['report-inventory-value'] }),
            queryClient.invalidateQueries({ queryKey: ['report-low-stock'] }),
            queryClient.invalidateQueries({ queryKey: ['report-out-of-stock'] }),
            queryClient.invalidateQueries({ queryKey: ['report-fast-moving'] }),
            queryClient.invalidateQueries({ queryKey: ['report-slow-moving'] }),
            queryClient.invalidateQueries({ queryKey: ['report-credits-overview'] }),
            queryClient.invalidateQueries({ queryKey: ['report-aging-buckets'] }),
            queryClient.invalidateQueries({ queryKey: ['report-profitability'] }),
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
        useReportInsights,
        invalidateReports,
    };
}