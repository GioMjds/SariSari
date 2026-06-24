import {
    deleteSale,
    getAllSales,
    getSale,
    getSaleItems,
    getSalesByDateRange,
    getTodayStats,
    insertSale,
} from '@/database/sales';
import {
    GetSaleByDateRangeParams,
    InsertSaleParams,
} from '@/types/sales.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inventoryKeys } from './useInventory';

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

  // Query: Get sale by ID (accepts id parameter)
  const useGetSale = (id: number) => {
    return useQuery({
      queryKey: ['sale', id],
      queryFn: () => getSale(id),
    });
  };

  // Query: Get sale items by sale_id
  const useGetSaleItems = (saleId: number) => {
    return useQuery({
      queryKey: ['sale-items', saleId],
      queryFn: () => getSaleItems(saleId),
    });
  };

  // Query: Get sales by date range
  const useGetSalesByDateRange = (params: GetSaleByDateRangeParams) => {
    return useQuery({
      queryKey: ['sales-by-date', params.startDate, params.endDate],
      queryFn: () => getSalesByDateRange(params),
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

  // Mutation: Delete a sale
  const deleteSaleMutation = useMutation({
    mutationFn: (id: number) => deleteSale(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sales-stats'] });
      queryClient.invalidateQueries({ queryKey: ['sale'] });
      queryClient.invalidateQueries({ queryKey: ['sale-items'] });
    },
  });

  return {
    // Queries
    getTodayStatsQuery,
    getAllSalesQuery,
    useGetSale,
    useGetSaleItems,
    useGetSalesByDateRange,

    // Mutations
    insertSaleMutation,
    deleteSaleMutation,
  };
}
