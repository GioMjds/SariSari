import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createOpeningBalance,
  deleteSupplierPayment,
  getPayablesDueSummary,
  getSupplierBalances,
  getSupplierPayables,
  getSupplierPaymentHistory,
  insertSupplierPayment,
} from '@/database/supplierPayables';
import { deliveryKeys } from '@/hooks/useDeliveryReceipts';
import { digitalServicesKeys } from '@/hooks/useDigitalServices';
import type { NewSupplierPayment } from '@/types/supplierPayables.types';

// Screens never import database/, so the named payable errors are re-exported here.
export {
  OpeningBalanceExistsError,
  ReceiptHasPaymentsError,
  SupplierOverpaymentError,
} from '@/database/supplierPayables';

export const supplierPayableKeys = {
  all: ['supplier-payables'] as const,
  balances: () => [...supplierPayableKeys.all, 'balances'] as const,
  open: (supplierId: string) => [...supplierPayableKeys.all, 'open', supplierId] as const,
  payments: (supplierId: string) => [...supplierPayableKeys.all, 'payments', supplierId] as const,
  due: (today: string) => [...supplierPayableKeys.all, 'due', today] as const,
};

export const useSupplierBalances = () =>
  useQuery({ queryKey: supplierPayableKeys.balances(), queryFn: getSupplierBalances });

export const useSupplierPayables = (supplierId: string) =>
  useQuery({
    queryKey: supplierPayableKeys.open(supplierId),
    queryFn: () => getSupplierPayables(supplierId),
    enabled: !!supplierId,
  });

export const useSupplierPaymentHistory = (supplierId: string) =>
  useQuery({
    queryKey: supplierPayableKeys.payments(supplierId),
    queryFn: () => getSupplierPaymentHistory(supplierId),
    enabled: !!supplierId,
  });

export const usePayablesDueSummary = (today: string) =>
  useQuery({
    queryKey: supplierPayableKeys.due(today),
    queryFn: () => getPayablesDueSummary(today),
  });

// Payments move drawer cash and receipt void eligibility, so those caches go too.
const invalidateAfterPayment = (queryClient: ReturnType<typeof useQueryClient>) => {
  void queryClient.invalidateQueries({ queryKey: supplierPayableKeys.all });
  void queryClient.invalidateQueries({ queryKey: digitalServicesKeys.all });
  void queryClient.invalidateQueries({ queryKey: deliveryKeys.all });
};

// Owner-PIN gates for these writes live in the UI, not here.
export function useRecordSupplierPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payment: NewSupplierPayment) => insertSupplierPayment(payment),
    onSuccess: () => invalidateAfterPayment(queryClient),
  });
}

export function useDeleteSupplierPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteSupplierPayment(id),
    onSuccess: () => invalidateAfterPayment(queryClient),
  });
}

export function useCreateOpeningBalance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (v: { supplierId: string; amount: number; dueDate: string | null }) =>
      createOpeningBalance(v.supplierId, v.amount, v.dueDate),
    onSuccess: () => invalidateAfterPayment(queryClient),
  });
}
