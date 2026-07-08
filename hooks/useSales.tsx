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

// ─── Standalone hooks ─────────────────────────────────────────────────────────
// These are exported individually so screens that only need one query don't
// accidentally subscribe to the full useSales() bundle (getAllSales, getTodayStats).

/** Fetch a single sale by id — use this in detail screens. */
export function useGetSale(id: number) {
  return useQuery({
    queryKey: ['sale', id],
    queryFn: () => getSale(id),
  });
}

/** Mutation to delete a sale — use this in detail screens. */
export function useDeleteSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteSale(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sales-stats'] });
      queryClient.invalidateQueries({ queryKey: ['sale'] });
      queryClient.invalidateQueries({ queryKey: ['sale-items'] });
    },
  });
}

/** Fetch recent sales up to a limit — optimized for dashboard. */
export function useRecentSales(limit: number) {
  return useQuery({
    queryKey: ['sales', 'recent', limit],
    queryFn: () => getRecentSales(limit),
  });
}

/** Check if there are any sales in the store — optimized for onboarding/empty state. */
export function useHasSales() {
  return useQuery({
    queryKey: ['sales', 'has-any'],
    queryFn: () => hasSales(),
  });
}

export function useSales() {
  const queryClient = useQueryClient();

  // Query: Get today's stats
  const getTodayStatsQuery = useQuery({
    queryKey: ['sales-stats'],
    queryFn: () => getTodayStats(),
  });

  // Query: Get all sales
  const getAllSalesQuery = useQuery({
    queryKey: ['sales'],
    queryFn: () => getAllSales(),
  });

  // Query: Get sale by ID — delegates to the standalone export above.
  // Kept here so existing callers of useSales().useGetSale() still work.
  // Prefer importing useGetSale directly for new code.
  const useGetSaleById = (id: number) => useGetSale(id);

  // Query: Get sale items by sale_id
  const useGetSaleItems = (saleId: number) => {
    return useQuery({
      queryKey: ['sale-items', saleId],
      queryFn: () => getSaleItems(saleId),
    });
  };

  // Query: Get sales by date range
  const useGetSalesByDateRange = (params: GetSalesByDateRangeParams) => {
    return useQuery({
      queryKey: ['sales-by-date', params.startDate, params.endDate],
      queryFn: () => getSalesByDateRange(params.startDate, params.endDate),
      enabled: !!params.startDate && !!params.endDate,
    });
  };

  // Mutation: Insert a new sale
  const insertSaleMutation = useMutation({
    mutationFn: ({
      items,
      payment_type,
      customer_name,
      customer_credit_id,
    }: InsertSaleParams) =>
      insertSale(items, payment_type, customer_name, customer_credit_id),
    onSuccess: () => {
      // Sales mutate product.quantity and the inventory ledger, so all the
      // related caches need a refresh — products for stock state, sales
      // lists/today's stats for the resibo book, and reports so the
      // dashboard reflects the new totals.
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sales-stats'] });
      queryClient.invalidateQueries({ queryKey: ['sales-by-date'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: ['credit-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['credit-kpis'] });
    },
  });

  // Mutation: Delete a sale — delegates to the standalone export above.
  // Kept here so existing callers of useSales().deleteSaleMutation still work.
  // Prefer importing useDeleteSale directly for new code.
  const deleteSaleMutation = useDeleteSale();

  return {
    // Queries
    getTodayStatsQuery,
    getAllSalesQuery,
    useGetSale: useGetSaleById,
    useGetSaleItems,
    useGetSalesByDateRange,

    // Mutations
    insertSaleMutation,
    deleteSaleMutation,
  };
}
