import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getCatalogProduct,
  insertCatalogProduct,
  getAllCatalogProducts,
} from '@/database/catalog';
import { NewCatalogProduct, CatalogProduct } from '@/types/catalog.types';
import { useToastStore } from '@/stores/ToastStore';

export const catalogKeys = {
  all: ['catalog'] as const,
  product: (barcode: string | null | undefined) =>
    [...catalogKeys.all, 'product', barcode] as const,
  list: () => [...catalogKeys.all, 'list'] as const,
};

export function useGetCatalogProduct(barcode: string | null | undefined) {
  return useQuery<CatalogProduct | null>({
    queryKey: catalogKeys.product(barcode),
    queryFn: () =>
      barcode && barcode.trim().length > 0
        ? getCatalogProduct(barcode.trim())
        : Promise.resolve(null),
    enabled: !!barcode && barcode.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
}

export function useCatalogProducts() {
  return useQuery<CatalogProduct[]>({
    queryKey: catalogKeys.list(),
    queryFn: getAllCatalogProducts,
  });
}

export function useCreateCatalogProduct() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);

  return useMutation({
    mutationFn: (newProduct: NewCatalogProduct) =>
      insertCatalogProduct(newProduct),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.all });
      queryClient.invalidateQueries({
        queryKey: catalogKeys.product(variables.barcode),
      });
      addToast({
        message: 'Product catalog entry saved',
        variant: 'success',
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error('Failed to save to product catalog:', error);
      addToast({
        message: 'Failed to save product catalog entry',
        variant: 'danger',
        duration: 5000,
      });
    },
  });
}
