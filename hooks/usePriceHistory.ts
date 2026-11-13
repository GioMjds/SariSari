import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  applyReprice,
  dismissRepriceFlag,
  getPriceHistory,
  getRepriceFlags,
  getRepriceFlagsForReceipt,
} from '@/database/priceHistory';
import { invalidateProductDependencies } from '@/hooks/useProducts';
import type { RepriceFlag } from '@/types/pricing.types';

// Screens never import database/, so the named error and row types are
// re-exported from here.
export { InvalidRepriceError } from '@/database/priceHistory';
export type { PriceChange, RepriceFlag } from '@/types/pricing.types';

export const priceHistoryKeys = {
  all: ['price-history'] as const,
  flags: () => [...priceHistoryKeys.all, 'flags'] as const,
  flagsForReceipt: (receiptId: number) =>
    [...priceHistoryKeys.flags(), 'receipt', receiptId] as const,
  history: (productId: number) =>
    [...priceHistoryKeys.all, 'history', productId] as const,
};

export function useRepriceFlags() {
  return useQuery({
    queryKey: priceHistoryKeys.flags(),
    queryFn: () => getRepriceFlags(),
  });
}

export function useRepriceFlagsForReceipt(receiptId: number | null) {
  return useQuery({
    queryKey: priceHistoryKeys.flagsForReceipt(receiptId ?? -1),
    queryFn: () => getRepriceFlagsForReceipt(receiptId as number),
    enabled: receiptId !== null,
  });
}

export function usePriceHistory(productId: number) {
  return useQuery({
    queryKey: priceHistoryKeys.history(productId),
    queryFn: () => getPriceHistory(productId),
    enabled: Number.isFinite(productId),
  });
}

/**
 * One-shot read used right after a delivery commit, before any component is
 * subscribed to that receipt's flags. staleTime 0 forces a fresh read.
 */
export function useFetchRepriceFlagsForReceipt() {
  const queryClient = useQueryClient();
  return useCallback(
    (receiptId: number): Promise<RepriceFlag[]> =>
      queryClient.fetchQuery({
        queryKey: priceHistoryKeys.flagsForReceipt(receiptId),
        queryFn: () => getRepriceFlagsForReceipt(receiptId),
        staleTime: 0,
      }),
    [queryClient],
  );
}

export function useApplyReprice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (v: { productId: number; newPrice: number }) =>
      applyReprice(v.productId, v.newPrice),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: priceHistoryKeys.all });
      invalidateProductDependencies(queryClient, variables.productId);
    },
  });
}

export function useDismissRepriceFlag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: number) => dismissRepriceFlag(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: priceHistoryKeys.all });
    },
  });
}
