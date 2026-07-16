import {
  deleteCreditTransaction,
  deleteCustomer,
  deletePayment,
  getAllCustomers,
  getCreditHistory,
  getCreditKPIs,
  getCreditTransactionsByCustomer,
  getCustomer,
  getCustomerWithDetails,
  getPaymentsByCustomer,
  insertCreditTransaction,
  insertCustomer,
  insertPayment,
  markAllCreditsAsPaid,
  searchCustomers,
  updateCreditStatus,
  updateCustomer,
} from '@/database/credits';
import { useToastStore } from '@/stores/ToastStore';
import type {
  CreditFilter,
  CreditHistory,
  CreditKPIs,
  CreditSort,
  CreditTransaction,
  Customer,
  CustomerWithDetails,
  NewCredit,
  NewCustomer,
  NewPayment,
  Payment,
} from '@/types/credits.types';
import { Alert } from '@/utils/alert';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

export function useCustomers(
  filter: CreditFilter = 'all',
  sort: CreditSort = 'name_asc',
  opts = {},
) {
  return useQuery<Customer[]>({
    queryKey: ['customers', filter, sort],
    queryFn: () => getAllCustomers(filter, sort),
    ...opts,
  });
}

export function useCustomer(id?: number | string, opts = {}) {
  const parsedId = typeof id === 'string' ? parseInt(id) : id;
  return useQuery<Customer | null>({
    queryKey: ['customer', parsedId],
    queryFn: () => (parsedId ? getCustomer(parsedId) : Promise.resolve(null)),
    enabled: !!parsedId,
    ...opts,
  });
}

export function useCustomerDetails(id?: number | string, opts = {}) {
  const parsedId = typeof id === 'string' ? parseInt(id) : id;
  return useQuery<CustomerWithDetails | null>({
    queryKey: ['customer-details', parsedId],
    queryFn: () =>
      parsedId ? getCustomerWithDetails(parsedId) : Promise.resolve(null),
    enabled: !!parsedId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...opts,
  });
}

export function useCustomerCredits(id?: number | string, opts = {}) {
  const parsedId = typeof id === 'string' ? parseInt(id) : id;
  return useQuery<CreditTransaction[]>({
    queryKey: ['customer-credits', parsedId],
    queryFn: () =>
      parsedId
        ? getCreditTransactionsByCustomer(parsedId)
        : Promise.resolve([]),
    enabled: !!parsedId,
    ...opts,
  });
}

export function usePaymentsByCustomer(id?: number | string, opts = {}) {
  const parsedId = typeof id === 'string' ? parseInt(id) : id;
  return useQuery<Payment[]>({
    queryKey: ['payments-by-customer', parsedId],
    queryFn: () =>
      parsedId ? getPaymentsByCustomer(parsedId) : Promise.resolve([]),
    enabled: !!parsedId,
    ...opts,
  });
}

export function useCreditKPIs(opts = {}) {
  return useQuery<CreditKPIs>({
    queryKey: ['credit-kpis'],
    queryFn: getCreditKPIs,
    ...opts,
  });
}

export function useCreditHistory(customerId?: number | string, opts = {}) {
  const parsedId =
    typeof customerId === 'string' ? parseInt(customerId) : customerId;
  return useQuery<CreditHistory[]>({
    queryKey: ['credit-history', parsedId],
    queryFn: () =>
      parsedId ? getCreditHistory(parsedId) : Promise.resolve([]),
    enabled: !!parsedId,
    ...opts,
  });
}

export function useSearchCustomers(query: string, opts = {}) {
  return useQuery({
    queryKey: ['customers-search', query],
    queryFn: () => searchCustomers(query),
    enabled: !!query?.trim(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...opts,
  });
}

export function useInsertCustomer() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (data: NewCustomer) => insertCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['credit-kpis'] });
      Alert.alert('Success', 'Customer added successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    },
    onError: () => {
      Alert.alert('Error', 'Failed to add customer. Please try again.');
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: NewCustomer }) =>
      updateCustomer(id, data),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', vars.id] });
      queryClient.invalidateQueries({
        queryKey: ['customer-details', vars.id],
      });
      queryClient.invalidateQueries({ queryKey: ['credit-kpis'] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { addToast } = useToastStore();
  return useMutation({
    mutationFn: (id: number) => deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['credit-kpis'] });
      addToast({
        message: 'Customer deleted successfully',
        variant: 'success',
        duration: 5000,
      });
      router.back();
    },
    onError: () => {
      addToast({
        message: 'Failed to delete customer',
        variant: 'danger',
        duration: 5000,
      });
    },
  });
}

export function useInsertCredit() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { addToast } = useToastStore();
  return useMutation({
    mutationFn: async (data: NewCredit | NewCredit[]) => {
      const credits = Array.isArray(data) ? data : [data];
      const { db } = await import('@/configs/sqlite');
      await db.withTransactionAsync(async () => {
        for (const credit of credits) {
          await insertCreditTransaction(credit);
        }
      });
    },
    onSuccess: (_res, vars) => {
      const customerId = Array.isArray(vars)
        ? vars[0]?.customer_id
        : vars?.customer_id;
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      if (customerId) {
        queryClient.invalidateQueries({
          queryKey: ['customer', customerId],
        });
        queryClient.invalidateQueries({
          queryKey: ['customer-details', customerId],
        });
        queryClient.invalidateQueries({
          queryKey: ['credit-history', customerId],
        });
      }
      queryClient.invalidateQueries({ queryKey: ['credit-kpis'] });
      addToast({
        message: 'Credit transaction(s) added successfully',
        variant: 'success',
        duration: 5000,
      });
      router.back();
    },
    onError: () => {
      addToast({
        message: 'Failed to add credit transaction(s)',
        variant: 'danger',
        duration: 5000,
      });
    },
  });
}

export function useDeleteCredit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: { id: number; customerId?: number }) =>
      deleteCreditTransaction(id.id),
    onSuccess: (_res, vars) => {
      if (vars.customerId) {
        queryClient.invalidateQueries({
          queryKey: ['customer', vars.customerId],
        });
        queryClient.invalidateQueries({
          queryKey: ['customer-details', vars.customerId],
        });
        queryClient.invalidateQueries({
          queryKey: ['credit-history', vars.customerId],
        });
      }
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['credit-kpis'] });
    },
  });
}

export function useInsertPayment() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { addToast } = useToastStore();
  return useMutation({
    mutationFn: (data: NewPayment) =>
      insertPayment(data),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({
        queryKey: ['customer', vars.customer_id],
      });
      queryClient.invalidateQueries({
        queryKey: ['customer-details', vars.customer_id],
      });
      queryClient.invalidateQueries({
        queryKey: ['customer-credits', vars.customer_id],
      });
      queryClient.invalidateQueries({
        queryKey: ['payments-by-customer', vars.customer_id],
      });
      queryClient.invalidateQueries({
        queryKey: ['credit-history', vars.customer_id],
      });
      queryClient.invalidateQueries({ queryKey: ['credit-kpis'] });
      addToast({
        message: 'Payment added successfully',
        variant: 'success',
        duration: 5000,
      });
      router.back();
    },
    onError: () => {
      addToast({
        message: 'Failed to add payment',
        variant: 'danger',
        duration: 5000,
      });
    },
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: number; customerId?: number }) =>
      deletePayment(params.id),
    onSuccess: (_res, vars) => {
      if (vars.customerId) {
        queryClient.invalidateQueries({
          queryKey: ['customer', vars.customerId],
        });
        queryClient.invalidateQueries({
          queryKey: ['customer-details', vars.customerId],
        });
        queryClient.invalidateQueries({
          queryKey: ['customer-credits', vars.customerId],
        });
        queryClient.invalidateQueries({
          queryKey: ['payments-by-customer', vars.customerId],
        });
        queryClient.invalidateQueries({
          queryKey: ['credit-history', vars.customerId],
        });
      }
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['credit-kpis'] });
    },
  });
}

export function useMarkAllCreditsAsPaid() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { addToast } = useToastStore();
  return useMutation({
    mutationFn: (customerId: number) => markAllCreditsAsPaid(customerId),
    onSuccess: (_res, customerId) => {
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      queryClient.invalidateQueries({
        queryKey: ['customer-details', customerId],
      });
      queryClient.invalidateQueries({
        queryKey: ['credit-history', customerId],
      });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['credit-kpis'] });
      addToast({
        message: 'Customer deleted successfully',
        variant: 'success',
        duration: 5000,
      });
      router.back();
    },
    onError: (error) => {
      addToast({
        message: error.message || 'Failed to delete customer',
        variant: 'danger',
        duration: 5000,
      });
    },
  });
}

export function useUpdateCreditStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount }: { id: number; amount: number }) =>
      updateCreditStatus(id, amount),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['credit-kpis'] });
    },
    onError: (error) => {
      console.error('Error updating credit status:', error);
    },
  });
}

export function useCredits() {
  return {
    // Queries
    useCustomers,
    useCustomer,
    useCustomerDetails,
    useCustomerCredits,
    usePaymentsByCustomer,
    useCreditKPIs,
    useCreditHistory,
    useSearchCustomers,

    // Mutations
    useInsertCustomer,
    useUpdateCustomer,
    useDeleteCustomer,
    useInsertCredit,
    useDeleteCredit,
    useInsertPayment,
    useDeletePayment,
    useMarkAllCreditsAsPaid,
    useUpdateCreditStatus,
  };
}
