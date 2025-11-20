import {
    deleteSale,
    getAllSales,
    getSale,
    getSaleItems,
    getSalesByDateRange,
    getTodayStats,
    insertSale,
} from '@/db/sales';
import { GetSaleByDateRangeParams, InsertSaleParams } from '@/types/sales.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useSalesMutation() {
    const queryClient = useQueryClient();

    // Query: Get today's stats
    const getTodayStatsQuery = useQuery({
        queryKey: ['sales-stats'],
        queryFn: getTodayStats,
    });

    // Query: Get all sales
    const getAllSalesQuery = useQuery({
        queryKey: ['sales'],
        queryFn: getAllSales,
    });

    // Query: Get sale by ID (accepts id parameter)
    const useGetSale = (id: number) => {
        return useQuery({
            queryKey: ['sale', id],
            queryFn: () => getSale(id),
            enabled: !!id,
        });
    };

    // Query: Get sale items by sale_id
    const useGetSaleItems = (saleId: number) => {
        return useQuery({
            queryKey: ['sale-items', saleId],
            queryFn: () => getSaleItems(saleId),
            enabled: !!saleId,
        });
    };

    // Query: Get sales by date range
    const useGetSalesByDateRange = (params: GetSaleByDateRangeParams) => {
        return useQuery({
            queryKey: ['sales-by-date', params.startDate, params.endDate],
            queryFn: () => getSalesByDateRange(params.startDate, params.endDate),
            enabled: !!params.startDate && !!params.endDate,
        });
    };

    // Mutation: Insert a new sale
    const insertSaleMutation = useMutation({
        mutationFn: ({ items, payment_type, customer_name, customer_credit_id }: InsertSaleParams) => 
            insertSale(items, payment_type, customer_name, customer_credit_id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            queryClient.invalidateQueries({ queryKey: ['sales-stats'] });
            queryClient.invalidateQueries({ queryKey: ['sales-by-date'] });
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