import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createFinancialEntry,
  deleteFinancialEntry,
  getFinancialTotals,
  updateFinancialEntry,
  listFinancialEntries,
} from '@/database/financial';
import {
  NewFinancialEntry,
  UpdateFinancialEntry,
} from '@/types/financial.types';

export const FINANCIAL_QUERY_KEY = 'financial';
export const REPORTS_QUERY_KEY = 'reports';

export function useFinancialEntries(startDate: string, endDate: string) {
  return useQuery({
    queryKey: [FINANCIAL_QUERY_KEY, 'entries', startDate, endDate],
    queryFn: () => listFinancialEntries(startDate, endDate),
  });
}

export function useFinancialTotals(startDate: string, endDate: string) {
  return useQuery({
    queryKey: [FINANCIAL_QUERY_KEY, 'totals', startDate, endDate],
    queryFn: () => getFinancialTotals(startDate, endDate),
  });
}

export function useCreateFinancialEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entry: NewFinancialEntry) => createFinancialEntry(entry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FINANCIAL_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [REPORTS_QUERY_KEY] });
    },
  });
}

export function useUpdateFinancialEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, entry }: { id: string; entry: UpdateFinancialEntry }) =>
      updateFinancialEntry(id, entry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FINANCIAL_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [REPORTS_QUERY_KEY] });
    },
  });
}

export function useDeleteFinancialEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFinancialEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FINANCIAL_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [REPORTS_QUERY_KEY] });
    },
  });
}
