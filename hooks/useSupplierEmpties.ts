import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createEmptiesType,
  getAllEmptiesOwed,
  getEmptiesBalances,
  previewSwapCount,
  recordSwapCount,
} from '@/database/supplierEmpties';
import type { SwapCountInput } from '@/types/supplierEmpties.types';

export const supplierEmptiesKeys = {
  all: ['supplier-empties'] as const,
  balances: (supplierId: string) =>
    [...supplierEmptiesKeys.all, supplierId] as const,
};

export const useEmptiesBalances = (supplierId: string) =>
  useQuery({
    queryKey: supplierEmptiesKeys.balances(supplierId),
    queryFn: () => getEmptiesBalances(supplierId),
    enabled: !!supplierId,
  });

export const useAllEmptiesOwed = () =>
  useQuery({
    queryKey: [...supplierEmptiesKeys.all, 'owed'] as const,
    queryFn: getAllEmptiesOwed,
  });

/** Live shortfall preview for the swap form; reads only. */
export const useSwapPreview = (input: SwapCountInput | null) =>
  useQuery({
    queryKey: [...supplierEmptiesKeys.all, 'preview', input],
    queryFn: () => previewSwapCount(input as SwapCountInput),
    enabled: input !== null,
  });

export function useCreateEmptiesType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (v: {
      supplierId: string;
      name: string;
      depositPesos: number;
    }) => createEmptiesType(v.supplierId, v.name, v.depositPesos),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: supplierEmptiesKeys.all }),
  });
}

export function useRecordSwapCount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (v: { input: SwapCountInput; note?: string | null }) =>
      recordSwapCount(v.input, v.note ?? null),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: supplierEmptiesKeys.all }),
  });
}
