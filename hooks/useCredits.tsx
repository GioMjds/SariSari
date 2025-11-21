import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    insertCustomer,
    updateCustomer,
    deleteCustomer,
    getAllCustomers,
    getCustomer,
    getCustomerWithDetails,
    getCreditTransactionsByCustomer,
    getPaymentsByCustomer,
    getCreditKPIs,
    getCreditHistory,
    insertCreditTransaction,
    deleteCreditTransaction,
    insertPayment,
    deletePayment,
    markAllCreditsAsPaid,
    searchCustomers,
    updateCreditStatus,
} from '@/db/credits';
import type {
    CreditFilter,
    CreditSort,
    Customer,
    CustomerWithDetails,
    CreditTransaction,
    Payment,
    CreditKPIs,
    CreditHistory,
    NewCustomer,
    NewCredit,
    NewPayment,
} from '@/types/credits.types';
import { useToastStore } from '@/stores/ToastStore';
import { useRouter } from 'expo-router';
import { Alert } from '@/utils/alert';

export function useCredits() {
    const queryClient = useQueryClient();

	const router = useRouter();

	const { addToast } = useToastStore();

    // LIST / INDEX
    const useCustomers = (filter: CreditFilter = 'all', sort: CreditSort = 'name_asc', opts = {}) => {
        return useQuery<Customer[]>({
            queryKey: ['customers', filter, sort],
            queryFn: () => getAllCustomers(filter, sort),
            ...opts,
        });
    }

    // SINGLE CUSTOMER (summary)
    const useCustomer = (id?: number | string, opts = {}) => {
        const parsedId = typeof id === 'string' ? parseInt(id) : id;
        return useQuery<Customer | null>({
            queryKey: ['customer', parsedId],
            queryFn: () => (parsedId ? getCustomer(parsedId) : Promise.resolve(null)),
            enabled: !!parsedId,
            ...opts,
        });
    }

    // CUSTOMER DETAILS (credits + payments)
    const useCustomerDetails = (id?: number | string, opts = {}) => {
        const parsedId = typeof id === 'string' ? parseInt(id) : id;
        return useQuery<CustomerWithDetails | null>({
            queryKey: ['customer-details', parsedId],
            queryFn: () => (parsedId ? getCustomerWithDetails(parsedId) : Promise.resolve(null)),
            enabled: !!parsedId,
			staleTime: 2 * 60 * 1000, // 2 minutes
            ...opts,
        });
    }

    const useCustomerCredits = (id?: number | string, opts = {}) => {
        const parsedId = typeof id === 'string' ? parseInt(id) : id;
        return useQuery<CreditTransaction[]>({
            queryKey: ['customer-credits', parsedId],
            queryFn: () => (parsedId ? getCreditTransactionsByCustomer(parsedId) : Promise.resolve([])),
            enabled: !!parsedId,
            ...opts,
        });
    }

    const usePaymentsByCustomer = (id?: number | string, opts = {}) => {
        const parsedId = typeof id === 'string' ? parseInt(id) : id;
        return useQuery<Payment[]>({
            queryKey: ['payments-by-customer', parsedId],
            queryFn: () => (parsedId ? getPaymentsByCustomer(parsedId) : Promise.resolve([])),
            enabled: !!parsedId,
            ...opts,
        });
    }

    // KPIs / HISTORY / SEARCH
    const useCreditKPIs = (opts = {}) => {
        return useQuery<CreditKPIs>({
            queryKey: ['credit-kpis'],
            queryFn: getCreditKPIs,
            ...opts,
        });
    }

    const useCreditHistory = (customerId?: number | string, opts = {}) => {
        const parsedId = typeof customerId === 'string' ? parseInt(customerId) : customerId;
        return useQuery<CreditHistory[]>({
            queryKey: ['credit-history', parsedId],
            queryFn: () => (parsedId ? getCreditHistory(parsedId) : Promise.resolve([])),
            enabled: !!parsedId,
            ...opts,
        });
    }

    const useSearchCustomers = (query: string, opts = {}) => {
        return useQuery({
            queryKey: ['customers-search', query],
            queryFn: () => searchCustomers(query),
            enabled: !!query?.trim(),
			staleTime: 2 * 60 * 1000, // 2 minutes
            ...opts,
        });
    }

    // MUTATIONS
    const useInsertCustomer = () => {
        return useMutation({
            mutationFn: (data: NewCustomer) => insertCustomer(data),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['customers'] });
                queryClient.invalidateQueries({ queryKey: ['credit-kpis'] });
				Alert.alert('Success', 'Customer added successfully', [{
					text: 'OK',
					onPress: () => router.back(),
				}]);
            },
			onError: () => {
				Alert.alert('Error', 'Failed to add customer. Please try again.');
			}
        });
    }

    const useUpdateCustomer = () => {
        return useMutation({
            mutationFn: ({ id, data }: { id: number; data: NewCustomer }) => updateCustomer(id, data),
            onSuccess: (_res, vars) => {
                queryClient.invalidateQueries({ queryKey: ['customers'] });
                queryClient.invalidateQueries({ queryKey: ['customer', vars.id] });
                queryClient.invalidateQueries({ queryKey: ['customer-details', vars.id] });
                queryClient.invalidateQueries({ queryKey: ['credit-kpis'] });
            },
        });
    }

    const useDeleteCustomer = () => {
        return useMutation({
            mutationFn: (id: number) => deleteCustomer(id),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['customers'] });
				queryClient.invalidateQueries({ queryKey: ['credit-kpis'] });
				addToast({
					message: 'Customer deleted successfully',
					variant: 'success',
					duration: 5000,
					position: 'top-center',
				});
				router.back();
            },
			onError: () => {
				addToast({
					message: 'Failed to delete customer',
					variant: 'error',
					duration: 5000,
					position: 'top-center',
				});
			}
        });
    }

    const useInsertCredit = () => {
        return useMutation({
            mutationFn: (data: NewCredit) => insertCreditTransaction(data),
            onSuccess: (_res, vars) => {
                queryClient.invalidateQueries({ queryKey: ['customers'] });
                queryClient.invalidateQueries({ queryKey: ['customer', vars.customer_id] });
                queryClient.invalidateQueries({ queryKey: ['customer-details', vars.customer_id] });
                queryClient.invalidateQueries({ queryKey: ['credit-kpis'] });
				addToast({
					message: 'Credit transaction added successfully',
					variant: 'success',
					duration: 5000,
					position: 'top-center',
				});
				router.back();
			},
			onError: () => {
				addToast({
					message: 'Failed to add credit transaction',
					variant: 'error',
					duration: 5000,
					position: 'top-center',
				});
			}
        });
    }

    const useDeleteCredit = () => {
        return useMutation({
            mutationFn: (id: { id: number; customerId?: number }) => deleteCreditTransaction(id.id),
            onSuccess: (_res, vars) => {
                if (vars.customerId) {
                    queryClient.invalidateQueries({ queryKey: ['customer', vars.customerId] });
                    queryClient.invalidateQueries({ queryKey: ['customer-details', vars.customerId] });
                }
                queryClient.invalidateQueries({ queryKey: ['customers'] });
                queryClient.invalidateQueries({ queryKey: ['credit-kpis'] });
            },
        });
    }

    const useInsertPayment = () => {
        return useMutation({
            mutationFn: (data: NewPayment) => insertPayment({
				customer_id: data.customer_id,
				credit_transaction_id: data.credit_transaction_id,
				amount: data.amount,
			}),
            onSuccess: (_res, vars) => {
                queryClient.invalidateQueries({ queryKey: ['customers'] });
                queryClient.invalidateQueries({ queryKey: ['customer', vars.customer_id] });
                queryClient.invalidateQueries({ queryKey: ['customer-details', vars.customer_id] });
                queryClient.invalidateQueries({ queryKey: ['customer-credits', vars.customer_id] });
                queryClient.invalidateQueries({ queryKey: ['payments-by-customer', vars.customer_id] });
                queryClient.invalidateQueries({ queryKey: ['credit-kpis'] });
				addToast({
					message: 'Payment added successfully',
					variant: 'success',
					duration: 5000,
					position: 'top-center',	
				});
				router.back();
            },
			onError: () => {
				addToast({
					message: 'Failed to add payment',
					variant: 'error',
					duration: 5000,
					position: 'top-center',
				});
			}
        });
    }

    const useDeletePayment = () => {
        return useMutation({
            mutationFn: (params: { id: number; customerId?: number }) => deletePayment(params.id),
            onSuccess: (_res, vars) => {
                if (vars.customerId) {
                    queryClient.invalidateQueries({ queryKey: ['customer', vars.customerId] });
                    queryClient.invalidateQueries({ queryKey: ['customer-details', vars.customerId] });
                    queryClient.invalidateQueries({ queryKey: ['customer-credits', vars.customerId] });
                    queryClient.invalidateQueries({ queryKey: ['payments-by-customer', vars.customerId] });
                }
                queryClient.invalidateQueries({ queryKey: ['customers'] });
                queryClient.invalidateQueries({ queryKey: ['credit-kpis'] });
            },
        });
    }

    const useMarkAllCreditsAsPaid = () => {
        return useMutation({
            mutationFn: (customerId: number) => markAllCreditsAsPaid(customerId),
            onSuccess: (_res, customerId) => {
                queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
                queryClient.invalidateQueries({ queryKey: ['customer-details', customerId] });
                queryClient.invalidateQueries({ queryKey: ['customers'] });
                queryClient.invalidateQueries({ queryKey: ['credit-kpis'] });
				addToast({
					message: 'Customer deleted successfully',
					variant: 'success',
					duration: 5000,
					position: 'top-center',
				});
				router.back();
            },
			onError: (error) => {
				addToast({
					message: error.message || 'Failed to delete customer',
					variant: 'error',
					duration: 5000,
					position: 'top-center',
				});
			}
        });
    }

    const useUpdateCreditStatus = () => {
        return useMutation({
            mutationFn: ({ id, amount }: { id: number; amount: number }) => updateCreditStatus(id, amount),
            onSuccess: (_res, variables) => {
                queryClient.invalidateQueries({ queryKey: ['customers'] });
                queryClient.invalidateQueries({ queryKey: ['credit-kpis'] });
            },
			onError: (error) => {
				console.error('Error updating credit status:', error);
			}
        });
    }

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