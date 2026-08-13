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
  voidSale,
  refundSale,
  correctSalePrice,
} from '@/database/sales';
import { getCorrectionsForSale } from '@/database/corrections';
import {
  GetSalesByDateRangeParams,
  InsertSaleParams,
} from '@/types/sales.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryKeys } from './useInventory';
import { invalidateProductDependencies } from './useProducts';

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

const invalidateSaleDependencies = (
  queryClient: ReturnType<typeof useQueryClient>,
  saleId?: number,
) => {
  invalidateProductDependencies(queryClient);
  queryClient.invalidateQueries({ queryKey: salesKeys.all });
  queryClient.invalidateQueries({ queryKey: salesKeys.salesStats });
  queryClient.invalidateQueries({
    queryKey: salesKeys.byDateRange('recent', '10'),
  });
  queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
  queryClient.invalidateQueries({ queryKey: salesKeys.creditTransactions });
  queryClient.invalidateQueries({ queryKey: salesKeys.customers });
  queryClient.invalidateQueries({ queryKey: salesKeys.creditKpis });
  queryClient.invalidateQueries({ queryKey: ['sale-corrections'] });
  if (saleId) {
    queryClient.invalidateQueries({ queryKey: salesKeys.byId(saleId) });
    queryClient.invalidateQueries({ queryKey: salesKeys.saleItems(saleId) });
  }
};

export function useDeleteSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteSale(id),
    onSuccess: (_data, id) => {
      invalidateSaleDependencies(queryClient, id);
    },
  });
}

export function useVoidSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      saleId: number;
      actorUser: string;
      witnessUser: string | null;
      reasonCode: string;
      note?: string;
    }) =>
      voidSale(args.saleId, {
        actorUser: args.actorUser,
        witnessUser: args.witnessUser,
        reasonCode: args.reasonCode,
        note: args.note,
      }),
    onSuccess: (_data, vars) => {
      invalidateSaleDependencies(queryClient, vars.saleId);
    },
  });
}

export function useRefundSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      saleId: number;
      actorUser: string;
      witnessUser: string | null;
      reasonCode: 'returned_damaged' | 'returned_other';
      note?: string;
    }) =>
      refundSale(args.saleId, {
        actorUser: args.actorUser,
        witnessUser: args.witnessUser,
        reasonCode: args.reasonCode,
        note: args.note,
      }),
    onSuccess: (_data, vars) => {
      invalidateSaleDependencies(queryClient, vars.saleId);
    },
  });
}

export function useCorrectSalePrice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      saleId: number;
      actorUser: string;
      witnessUser: string | null;
      reasonCode: string;
      note?: string;
      priceChanges: { saleItemId: number; newPrice: number }[];
    }) =>
      correctSalePrice(args.saleId, {
        actorUser: args.actorUser,
        witnessUser: args.witnessUser,
        reasonCode: args.reasonCode,
        note: args.note,
        priceChanges: args.priceChanges,
      }),
    onSuccess: (_data, vars) => {
      invalidateSaleDependencies(queryClient, vars.saleId);
    },
  });
}

export function useSaleCorrections(saleId: number | null) {
  return useQuery({
    enabled: saleId !== null,
    queryKey: ['sale-corrections', 'by-sale', saleId],
    queryFn: () => getCorrectionsForSale(saleId!),
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
      overrideReasonCode,
      overrideReasonNote,
    }: InsertSaleParams) =>
      insertSale(
        items,
        payment_type,
        customer_name,
        customer_credit_id,
        overrideReasonCode,
        overrideReasonNote,
      ),
    onSuccess: () => {
      invalidateSaleDependencies(queryClient);
    },
  });

  const deleteSaleMutation = useDeleteSale();
  const voidSaleMutation = useVoidSale();
  const refundSaleMutation = useRefundSale();
  const correctSalePriceMutation = useCorrectSalePrice();

  return {
    // Queries
    getTodayStatsQuery,
    getAllSalesQuery,

    // Mutations
    insertSaleMutation,
    deleteSaleMutation,
    voidSaleMutation,
    refundSaleMutation,
    correctSalePriceMutation,
  };
}
