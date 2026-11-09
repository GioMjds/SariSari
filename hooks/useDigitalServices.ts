import {
  createDigitalTransaction,
  createWallet,
  getDigitalServicesSummary,
  listDigitalTransactions,
  listWallets,
  updateWallet,
  voidDigitalTransaction,
} from '@/database/digitalServices';
import type {
  NewDigitalTransaction,
  NewDigitalWallet,
  UpdateDigitalWallet,
} from '@/types/digitalServices.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const digitalServicesKeys = {
  all: ['digital-services'] as const,
  wallets: (includeInactive: boolean) =>
    [...digitalServicesKeys.all, 'wallets', includeInactive] as const,
  transactions: (start: string, end: string, walletId?: number) =>
    [...digitalServicesKeys.all, 'transactions', start, end, walletId] as const,
  summary: (start: string, end: string) =>
    [...digitalServicesKeys.all, 'summary', start, end] as const,
};

export function useWallets(includeInactive = false) {
  return useQuery({
    queryKey: digitalServicesKeys.wallets(includeInactive),
    queryFn: () => listWallets(includeInactive),
  });
}

export function useDigitalTransactions(
  startDate: string,
  endDate: string,
  walletId?: number,
) {
  return useQuery({
    queryKey: digitalServicesKeys.transactions(startDate, endDate, walletId),
    queryFn: () => listDigitalTransactions(startDate, endDate, walletId),
  });
}

export function useDigitalServicesSummary(startDate: string, endDate: string) {
  return useQuery({
    queryKey: digitalServicesKeys.summary(startDate, endDate),
    queryFn: () => getDigitalServicesSummary(startDate, endDate),
  });
}

/** Wallet balances, history, drawer cash and reports all change together. */
const useInvalidateDigitalServices = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: digitalServicesKeys.all });
    queryClient.invalidateQueries({ queryKey: ['reports'] });
    queryClient.invalidateQueries({ queryKey: ['cash'] });
  };
};

export function useCreateWallet() {
  const invalidate = useInvalidateDigitalServices();
  return useMutation({
    mutationFn: (input: NewDigitalWallet) => createWallet(input),
    onSuccess: invalidate,
  });
}

export function useUpdateWallet() {
  const invalidate = useInvalidateDigitalServices();
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: UpdateDigitalWallet }) =>
      updateWallet(id, patch),
    onSuccess: invalidate,
  });
}

export function useRecordDigitalTransaction() {
  const invalidate = useInvalidateDigitalServices();
  return useMutation({
    mutationFn: (input: NewDigitalTransaction) =>
      createDigitalTransaction(input),
    onSuccess: invalidate,
  });
}

export function useReplenishWallet() {
  const record = useRecordDigitalTransaction();
  return {
    ...record,
    mutate: (
      input: Pick<NewDigitalTransaction, 'walletId' | 'principalAmount'> & {
        fundedFromDrawer: boolean;
        note?: string | null;
      },
      options?: Parameters<typeof record.mutate>[1],
    ) => record.mutate({ ...input, transactionType: 'replenish' }, options),
  };
}

export function useVoidDigitalTransaction() {
  const invalidate = useInvalidateDigitalServices();
  return useMutation({
    mutationFn: (id: number) => voidDigitalTransaction(id),
    onSuccess: invalidate,
  });
}
