import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createFinancialEntry,
  deleteFinancialEntry,
  getFinancialTotals,
  updateFinancialEntry,
  listFinancialEntries,
} from '@/database/financial';
import { addEntryReceipt } from '@/database/receipts';
import { saveStagedReceipt } from '@/lib/receipt-storage';
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

export type CreateFinancialEntryInput = {
  entry: NewFinancialEntry;
  /** Picked image URIs; copied into app storage after the entry is saved. */
  receiptUris?: string[];
};

const receiptExtension = (uri: string): string => {
  const ext = uri.split('?')[0]?.split('.').pop()?.toLowerCase() ?? '';
  return /^[a-z0-9]{2,4}$/.test(ext) ? ext : 'jpg';
};

export function useCreateFinancialEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      entry,
      receiptUris = [],
    }: CreateFinancialEntryInput) => {
      const created = await createFinancialEntry(entry);
      // The entry is the source of truth; a receipt that fails to copy must
      // not undo it, so report the failures instead of throwing.
      let failedReceipts = 0;
      for (const [slot, uri] of receiptUris.slice(0, 5).entries()) {
        try {
          const relativePath = await saveStagedReceipt(
            uri,
            `${created.id}-${slot}.${receiptExtension(uri)}`,
          );
          await addEntryReceipt(created.id, relativePath, slot);
        } catch {
          failedReceipts += 1;
        }
      }
      return { entry: created, failedReceipts };
    },
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
