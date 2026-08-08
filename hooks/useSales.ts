import {
  deleteSale,
  getAllSales,
  getRecentSales,
  getSale,
  getSaleItems,
  getSalesByDateRange,
  getTodayStats,
  hasSales,
  insertSale,
} from '@/database/sales';
import {
  GetSalesByDateRangeParams,
  InsertSaleParams,
} from '@/types/sales.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryKeys } from './useInventory';

export const salesKeys = {
  all: ['sales'] as const,
  byId: (id: number) => [...salesKeys.all, id] as const,
  byDateRange: (startDate: string, endDate: string) =>
    [...salesKeys.all, 'by-date', startDate, endDate] as const,
  salesStats: ['sales-stats'] as const,
  saleItems: (saleId: number) => [...salesKeys.all, 'items', saleId] as const,
  product: (productId: number) =>
    [...salesKeys.all, 'product', productId] as const,
  creditTransactions: ['credit-transactions'] as const,
  customers: ['customers'] as const,
  creditKpis: ['credit-kpis'] as const,
};

export function useGetSale(id: number) {
  return useQuery({
    queryKey: salesKeys.byId(id),
    queryFn: () => getSale(id),
  });
}

export function useDeleteSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteSale(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.all });
      queryClient.invalidateQueries({ queryKey: salesKeys.salesStats });
      queryClient.invalidateQueries({ queryKey: salesKeys.byId(0) });
      queryClient.invalidateQueries({ queryKey: salesKeys.saleItems(0) });
    },
  });
}

export function useRecentSales(limit: number) {
  return useQuery({
    queryKey: salesKeys.byDateRange('recent', limit.toString()),
    queryFn: () => getRecentSales(limit),
  });
}

export function useHasSales() {
  return useQuery({
    queryKey: salesKeys.all,
    queryFn: () => hasSales(),
  });
}

export function useGetSaleItems(saleId: number) {
  return useQuery({
    queryKey: salesKeys.saleItems(saleId),
    queryFn: () => getSaleItems(saleId),
  });
}

export function useGetSalesByDateRange(params: GetSalesByDateRangeParams) {
  return useQuery({
    queryKey: salesKeys.byDateRange(params.startDate, params.endDate),
    queryFn: () => getSalesByDateRange(params.startDate, params.endDate),
    enabled: !!params.startDate && !!params.endDate,
  });
}

export function useTodayStats() {
  return useQuery({
    queryKey: salesKeys.salesStats,
    queryFn: () => getTodayStats(),
  });
}

export function useSales() {
  const queryClient = useQueryClient();

  const getTodayStatsQuery = useQuery({
    queryKey: salesKeys.salesStats,
    queryFn: () => getTodayStats(),
  });

  const getAllSalesQuery = useQuery({
    queryKey: salesKeys.all,
    queryFn: () => getAllSales(),
  });

  const insertSaleMutation = useMutation({
    mutationFn: ({
      items,
      payment_type,
      customer_name,
      customer_credit_id,
    }: InsertSaleParams) =>
      insertSale(items, payment_type, customer_name, customer_credit_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.all });
      queryClient.invalidateQueries({ queryKey: salesKeys.salesStats });
      queryClient.invalidateQueries({
        queryKey: salesKeys.byDateRange('recent', '10'),
      });
      queryClient.invalidateQueries({ queryKey: salesKeys.product(0) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: salesKeys.creditTransactions });
      queryClient.invalidateQueries({ queryKey: salesKeys.customers });
      queryClient.invalidateQueries({ queryKey: salesKeys.creditKpis });
    },
  });

  const deleteSaleMutation = useDeleteSale();

  return {
    // Queries
    getTodayStatsQuery,
    getAllSalesQuery,

    // Mutations
    insertSaleMutation,
    deleteSaleMutation,
  };
}
