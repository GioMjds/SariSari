import {
  createSupplierWithProducts,
  deleteSupplier,
  listSuppliers,
  getSupplier,
  updateSupplier,
  updateSupplierWithProducts,
} from '@/database/suppliers';
import { useToastStore } from '@/stores/ToastStore';
import { NewSupplier } from '@/types/suppliers.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface InsertSupplierParams {
  name: string;
  contact?: string | null;
  notes?: string | null;
  productIds?: number[];
}

export const supplierKeys = {
  all: ['suppliers'] as const,
  list: () => [...supplierKeys.all, 'list'] as const,
  detail: (id: string) => [...supplierKeys.all, 'detail', id] as const,
};

export function useGetSupplier(id: string) {
  return useQuery({
    queryKey: supplierKeys.detail(id),
    queryFn: () => getSupplier(id),
    enabled: !!id,
  });
}

export function useSuppliers() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);

  // Query: Get all suppliers
  const getAllSuppliersQuery = useQuery({
    queryKey: supplierKeys.list(),
    queryFn: listSuppliers,
  });

  // Mutation: Insert a new supplier
  const insertSupplierMutation = useMutation({
    mutationFn: ({ name, contact, notes, productIds }: InsertSupplierParams) =>
      createSupplierWithProducts(
        { name, contact: contact ?? null, notes: notes ?? null },
        productIds ?? []
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.all });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      addToast({
        message: 'Supplier added successfully',
        variant: 'success',
        duration: 5000,
      });
    },
    onError: (error: Error) => {
      addToast({
        message: error.message || 'Failed to add supplier',
        variant: 'danger',
        duration: 5000,
      });
    },
  });

  // Mutation: Update a supplier
  const updateSupplierMutation = useMutation({
    mutationFn: ({
      id,
      patch,
      productIds,
    }: {
      id: string;
      patch: Partial<NewSupplier>;
      productIds?: number[];
    }) =>
      productIds !== undefined
        ? updateSupplierWithProducts(id, patch, productIds)
        : updateSupplier(id, patch),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.all });
      queryClient.invalidateQueries({ queryKey: supplierKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      addToast({
        message: 'Supplier updated successfully',
        variant: 'success',
        duration: 5000,
      });
    },
    onError: (error: Error) => {
      addToast({
        message: error.message || 'Failed to update supplier',
        variant: 'danger',
        duration: 5000,
      });
    },
  });

  // Mutation: Delete a supplier
  const deleteSupplierMutation = useMutation({
    mutationFn: (id: string) => deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.all });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      addToast({
        message: 'Supplier deleted successfully',
        variant: 'success',
        duration: 5000,
      });
    },
    onError: (error: Error) => {
      addToast({
        message: error.message || 'Failed to delete supplier',
        variant: 'danger',
        duration: 5000,
      });
    },
  });

  return {
    // Queries
    getAllSuppliersQuery,

    // Mutations
    insertSupplierMutation,
    updateSupplierMutation,
    deleteSupplierMutation,
  };
}
