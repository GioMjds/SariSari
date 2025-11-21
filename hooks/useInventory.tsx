import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    insertInventoryTransaction,
    getInventoryTransactions,
    getInventoryTransactionsByDateRange,
} from '@/db/inventory';
import { InventoryTransaction } from '@/types/inventory.types';
import { useToastStore } from '@/stores/ToastStore';

export function useInventory() {
    const queryClient = useQueryClient();
    const { addToast } = useToastStore();

    const getInventoryTransactionsQuery = useQuery<InventoryTransaction[]>({
        queryKey: ['inventory-transactions'],
        queryFn: () => getInventoryTransactions(),
    });

    // Get transactions for a single product (enabled only when productId provided)
    const useGetInventoryTransactions = (productId?: number) => {
        return useQuery<InventoryTransaction[]>({
            queryKey: ['inventory-transactions', productId],
            queryFn: () => getInventoryTransactions(productId),
            enabled: typeof productId === 'number' && !Number.isNaN(productId),
        });
	}

    const useGetInventoryTransactionsByDateRange = (startDate?: string, endDate?: string) => {
        return useQuery<InventoryTransaction[]>({
            queryKey: ['inventory-transactions-by-date', startDate, endDate],
            queryFn: () => getInventoryTransactionsByDateRange(startDate!, endDate!),
            enabled: !!startDate && !!endDate,
        });
	}

	const insertInventoryMutation = () => {
		return useMutation({
			mutationFn: async ({
				product_id,
				type,
				quantity,
			}: {
				product_id: number;
				type: 'restock' | 'sale';
				quantity: number;
			}) => {
				return await insertInventoryTransaction(product_id, type, quantity);
			},
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ['products'] });
				queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
				queryClient.invalidateQueries({ queryKey: ['inventory-transactions-by-date'] });
				queryClient.invalidateQueries({ queryKey: ['products'] });
				addToast({
					message: 'Stock updated successfully',
					variant: 'success',
					duration: 4000,
					position: 'top-center',
				});
			},
			onError: () => {
				addToast({
					message: 'Failed to update stock',
					variant: 'error',
					duration: 4000,
					position: 'top-center',
				});
			},
		})
	}

    return {
        // Queries
        getInventoryTransactionsQuery,
        useGetInventoryTransactions,
        useGetInventoryTransactionsByDateRange,

        // Mutation
        insertInventoryMutation,
    };
}