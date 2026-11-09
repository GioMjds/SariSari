import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  commitDeliveryReceipt,
  discardDeliveryDraft,
  getDeliveryReceipt,
  getDeliveryShortageReport,
  getOpenDraftForSupplier,
  getSupplierShortageLines,
  listDeliveryReceipts,
  saveDeliveryDraft,
  voidDeliveryReceipt,
} from '@/database/deliveries';
import { inventoryKeys } from '@/hooks/useInventory';
import { invalidateProductDependencies } from '@/hooks/useProducts';
import { stockIntelligenceKeys } from '@/hooks/useStockIntelligence';
import type {
  DeliveryReceiptStatus,
  SaveDeliveryDraftInput,
} from '@/types/deliveries.types';

export const deliveryKeys = {
  all: ['delivery-receipts'] as const,
  list: (status?: DeliveryReceiptStatus, supplierId?: string) =>
    [
      ...deliveryKeys.all,
      'list',
      status ?? 'all',
      supplierId ?? 'all',
    ] as const,
  detail: (id: number) => [...deliveryKeys.all, 'detail', id] as const,
  openDraft: (supplierId: string) =>
    [...deliveryKeys.all, 'open-draft', supplierId] as const,
  report: (since?: string, until?: string) =>
    [...deliveryKeys.all, 'report', since ?? '', until ?? ''] as const,
  shortLines: (supplierId: string, since?: string, until?: string) =>
    [
      ...deliveryKeys.all,
      'short-lines',
      supplierId,
      since ?? '',
      until ?? '',
    ] as const,
};

export function useDeliveryReceipts(
  filter: { status?: DeliveryReceiptStatus; supplierId?: string } = {},
) {
  return useQuery({
    queryKey: deliveryKeys.list(filter.status, filter.supplierId),
    queryFn: () => listDeliveryReceipts(filter),
  });
}

export function useDeliveryReceipt(id: number | null) {
  return useQuery({
    queryKey: deliveryKeys.detail(id ?? -1),
    queryFn: () => getDeliveryReceipt(id as number),
    enabled: id !== null,
  });
}

export function useOpenDraftForSupplier(supplierId: string | null) {
  return useQuery({
    queryKey: deliveryKeys.openDraft(supplierId ?? ''),
    queryFn: () => getOpenDraftForSupplier(supplierId as string),
    enabled: supplierId !== null,
  });
}

export function useSaveDeliveryDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveDeliveryDraftInput) => saveDeliveryDraft(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.all });
    },
  });
}

export function useDiscardDeliveryDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => discardDeliveryDraft(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.all });
    },
  });
}

function invalidateAfterStockChange(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  queryClient.invalidateQueries({ queryKey: deliveryKeys.all });
  invalidateProductDependencies(queryClient);
  queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
  queryClient.invalidateQueries({ queryKey: stockIntelligenceKeys.all });
}

export function useCommitDeliveryReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (receiptId: number) => commitDeliveryReceipt(receiptId),
    onSuccess: () => invalidateAfterStockChange(queryClient),
  });
}

// Owner-PIN gate for void lives in the UI, not here.
export function useVoidDeliveryReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (v: { receiptId: number; reason: string }) =>
      voidDeliveryReceipt(v.receiptId, v.reason),
    onSuccess: () => invalidateAfterStockChange(queryClient),
  });
}

// since/until compare against committed_at, which is an ISO timestamp. Callers
// must pass full ISO timestamps (not date-only strings): a date-only `until`
// would sort before any same-day timestamp and drop that day's receipts.
export function useDeliveryShortageReport(
  range: { since?: string; until?: string } = {},
) {
  return useQuery({
    queryKey: deliveryKeys.report(range.since, range.until),
    queryFn: () => getDeliveryShortageReport(range),
  });
}

export function useSupplierShortageLines(
  supplierId: string | null,
  range: { since?: string; until?: string } = {},
) {
  return useQuery({
    queryKey: deliveryKeys.shortLines(
      supplierId ?? '',
      range.since,
      range.until,
    ),
    queryFn: () => getSupplierShortageLines(supplierId as string, range),
    enabled: supplierId !== null,
  });
}
