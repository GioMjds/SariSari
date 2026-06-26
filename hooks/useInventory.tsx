import {
  getInventoryTransactions,
  getInventoryTransactionsByDateRange,
  getInventoryTransactionsByProductAndDateRange,
  insertInventoryTransaction,
} from '@/database/inventory';
import { useToastStore } from '@/stores/ToastStore';
import {
  InsertInventoryV2,
  InventoryTransaction,
} from '@/types/inventory.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const inventoryKeys = {
  all: ['inventory'] as const,
  transactions: () => [...inventoryKeys.all, 'transactions'] as const,
  byProduct: (productId: number) =>
    [...inventoryKeys.all, 'transactions', productId] as const,
  byDateRange: (startDate: string, endDate: string) =>
    [...inventoryKeys.all, 'transactions-by-date', startDate, endDate] as const,
};

export function useInsertInventory() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async (tx: InsertInventoryV2) => {
      return await insertInventoryTransaction(tx);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      addToast({
        message: 'Stock updated',
        variant: 'success',
        duration: 4000,
      });
    },
    onError: () => {
      addToast({
        message: "Couldn't update stock",
        variant: 'danger',
        duration: 4000,
      });
    },
  });
}

export function useInventoryTransactionsByProduct(productId: number) {
  return useQuery<InventoryTransaction[]>({
    queryKey: inventoryKeys.byProduct(productId),
    queryFn: () => {
      const endDate = new Date().toISOString();
      const startDate = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString();
      return getInventoryTransactionsByProductAndDateRange(
        productId,
        startDate,
        endDate,
      );
    },
    enabled: typeof productId === 'number' && !Number.isNaN(productId),
  });
}

// Keep the useInventory hook with updated queries/mutations for backwards compatibility
export function useInventory() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  const getInventoryTransactionsQuery = useQuery<InventoryTransaction[]>({
    queryKey: inventoryKeys.transactions(),
    queryFn: () => getInventoryTransactions(),
  });

  const useGetInventoryTransactions = (productId?: number) => {
    return useQuery<InventoryTransaction[]>({
      queryKey:
        typeof productId === 'number'
          ? inventoryKeys.byProduct(productId)
          : inventoryKeys.transactions(),
      queryFn: () => getInventoryTransactions(productId),
      enabled: typeof productId === 'number' && !Number.isNaN(productId),
    });
  };

  const useGetInventoryTransactionsByDateRange = (
    startDate?: string,
    endDate?: string,
  ) => {
    return useQuery<InventoryTransaction[]>({
      queryKey: inventoryKeys.byDateRange(startDate || '', endDate || ''),
      queryFn: () => getInventoryTransactionsByDateRange(startDate!, endDate!),
      enabled: !!startDate && !!endDate,
    });
  };

  const insertInventoryMutation = useMutation({
    mutationFn: async (tx: InsertInventoryV2) => {
      return await insertInventoryTransaction(tx);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      addToast({
        message: 'Stock updated',
        variant: 'success',
        duration: 4000,
      });
    },
    onError: () => {
      addToast({
        message: "Couldn't update stock",
        variant: 'danger',
        duration: 4000,
      });
    },
  });

  return {
    getInventoryTransactionsQuery,
    useGetInventoryTransactions,
    useGetInventoryTransactionsByDateRange,
    insertInventoryMutation,
  };
}
