import {
    deleteProduct,
    getAllProducts,
    getProduct,
    getProductBySku,
    insertProduct,
    updateProduct,
} from '@/db/products';
import { useToastStore } from '@/stores/ToastStore';
import { InsertProductParams, UpdateProductParams } from '@/types/products.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useProducts() {
    const queryClient = useQueryClient();
    const addToast = useToastStore((state) => state.addToast);

	// Query: Get all products
	const getAllProductsQuery = () => {
		return useQuery({
			queryKey: ['products'],
			queryFn: getAllProducts,
		})
	}

	// Query: Get product by ID (accepts id parameter)
	const useGetProduct = (id: number) => {
		return useQuery({
			queryKey: ['product', id],
			queryFn: () => getProduct(id),
			enabled: !!id,
		});
	};

	// Query: Get product by SKU
	const useGetProductBySku = (sku: string) => {
		return useQuery({
			queryKey: ['product-sku', sku],
			queryFn: () => getProductBySku(sku),
			enabled: !!sku,
		});
	};

	// Mutation: Insert a new product
	const insertProductMutation = useMutation({
		mutationFn: ({ name, sku, price, quantity = 0, cost_price, category }: InsertProductParams) => 
			insertProduct(name, sku, price, quantity, cost_price, category),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['products'] });
			queryClient.invalidateQueries({ queryKey: ['categories'] });
			addToast({
				message: 'Product added successfully',
				variant: 'success',
				duration: 5000,
				position: 'top-center',
			});
		},
		onError: (error: Error) => {
			addToast({
				message: error.message || 'Failed to add product',
				variant: 'error',
				duration: 5000,
				position: 'top-center',
			});
		},
	});

	// Mutation: Update a product
	const updateProductMutation = useMutation({
		mutationFn: ({ id, name, sku, price, quantity, cost_price, category }: UpdateProductParams) => 
			updateProduct(id, name, sku, price, quantity, cost_price, category),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ['products'] });
			queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
			queryClient.invalidateQueries({ queryKey: ['categories'] });
			addToast({
				message: 'Product updated successfully',
				variant: 'success',
				duration: 5000,
				position: 'top-center',
			});
		},
		onError: (error: Error) => {
			addToast({
				message: error.message || 'Failed to update product',
				variant: 'error',
				duration: 5000,
				position: 'top-center',
			});
		},
	});

	// Mutation: Delete a product
    const deleteProductMutation = useMutation({
		mutationFn: (id: number) => deleteProduct(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['products'] });
			queryClient.invalidateQueries({ queryKey: ['categories'] });
			addToast({
				message: 'Product deleted successfully',
				variant: 'success',
				duration: 5000,
				position: 'top-center',
			});
		},
		onError: (error: Error) => {
			addToast({
				message: error.message || 'Failed to delete product',
				variant: 'error',
				duration: 5000,
				position: 'top-center',
			});
		},
	});

	return {
		// Queries
		getAllProductsQuery,
		useGetProduct,
		useGetProductBySku,
		
		// Mutations
		insertProductMutation,
		updateProductMutation,
		deleteProductMutation,
	};
}
