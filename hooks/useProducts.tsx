import {
  BarcodeAlreadyExistsError,
  deleteProduct,
  getAllProducts,
  getProduct,
  getProductBySku,
  getProductByBarcode,
  insertProduct,
  updateProduct,
} from '@/database/products';
import { useToastStore } from '@/stores/ToastStore';
import {
  InsertProductParams,
  UpdateProductParams,
} from '@/types/products.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const productKeys = {
  all: ['products'] as const,
  list: () => [...productKeys.all, 'list'] as const,
  barcode: (barcode: string) => [...productKeys.all, 'barcode', barcode] as const,
  sku: (sku: string) => [...productKeys.all, 'sku', sku] as const,
  detail: (id: number) => [...productKeys.all, 'detail', id] as const,
};

export function useProducts() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);

  // Query: Get all products
  const getAllProductsQuery = useQuery({
    queryKey: productKeys.list(),
    queryFn: getAllProducts,
  });

  // Query: Get product by ID (accepts id parameter)
  const useGetProduct = (id: number) => {
    return useQuery({
      queryKey: productKeys.detail(id),
      queryFn: () => getProduct(id),
      enabled: !!id,
    });
  };

  // Query: Get product by SKU
  const useGetProductBySku = (sku: string) => {
    return useQuery({
      queryKey: productKeys.sku(sku),
      queryFn: () => getProductBySku(sku),
      enabled: !!sku,
    });
  };

  // Query: Get product by barcode
  const useFindProductByBarcode = (barcode: string | null | undefined) => {
    return useQuery({
      queryKey: productKeys.barcode(barcode ?? ''),
      queryFn: () =>
        barcode && barcode.length > 0
          ? getProductByBarcode(barcode)
          : Promise.resolve(null),
      enabled: !!barcode && barcode.length > 0,
      staleTime: 60_000,
    });
  };

  // Mutation: Insert a new product
  const insertProductMutation = useMutation({
    mutationFn: ({
      name,
      sku,
      price,
      quantity = 0,
      cost_price,
      category,
      barcode,
    }: InsertProductParams) =>
      insertProduct(
        name,
        sku,
        price,
        quantity,
        cost_price,
        category,
        barcode,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      addToast({
        message: 'Product added successfully',
        variant: 'success',
        duration: 5000,
      });
    },
    onError: (error: Error) => {
      if (error instanceof BarcodeAlreadyExistsError) {
        addToast({
          message: `Barcode is already used by another product`,
          variant: 'danger',
          duration: 5000,
        });
        return;
      }
      addToast({
        message: error.message || 'Failed to add product',
        variant: 'danger',
        duration: 5000,
      });
    },
  });

  // Mutation: Update a product
  const updateProductMutation = useMutation({
    mutationFn: ({
      id,
      name,
      sku,
      price,
      quantity,
      cost_price,
      category,
      barcode,
    }: UpdateProductParams) =>
      updateProduct(
        id,
        name,
        sku,
        price,
        quantity,
        cost_price,
        category,
        barcode,
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      addToast({
        message: 'Product updated successfully',
        variant: 'success',
        duration: 5000,
      });
    },
    onError: (error: Error) => {
      if (error instanceof BarcodeAlreadyExistsError) {
        addToast({
          message: `Barcode is already used by another product`,
          variant: 'danger',
          duration: 5000,
        });
        return;
      }
      addToast({
        message: error.message || 'Failed to update product',
        variant: 'danger',
        duration: 5000,
      });
    },
  });

  // Mutation: Delete a product
  const deleteProductMutation = useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      addToast({
        message: 'Product deleted successfully',
        variant: 'success',
        duration: 5000,
      });
    },
    onError: (error: Error) => {
      addToast({
        message: error.message || 'Failed to delete product',
        variant: 'danger',
        duration: 5000,
      });
    },
  });

  return {
    // Queries
    getAllProductsQuery,
    useGetProduct,
    useGetProductBySku,
    useFindProductByBarcode,

    // Mutations
    insertProductMutation,
    updateProductMutation,
    deleteProductMutation,
  };
}