import i18n from '@/lib/i18n';
import {
  deleteCategory,
  getAllCategories,
  getCategoriesWithCount,
  getCategory,
  getCategoryByName,
  insertCategoryWithProducts,
  updateCategory,
} from '@/database/categories';
import { useToastStore } from '@/stores/ToastStore';
import {
  InsertCategoryParams,
  UpdateCategoryParams,
} from '@/types/categories.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

export function useGetCategory(id: number) {
  return useQuery({
    queryKey: ['category', id],
    queryFn: () => getCategory(id),
    enabled: !!id,
  });
}

export function useGetCategoryByName(name: string) {
  return useQuery({
    queryKey: ['category-name', name],
    queryFn: () => getCategoryByName(name),
    enabled: !!name,
  });
}

export function useCategories() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);

  // Query: Get all categories
  const getAllCategoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: getAllCategories,
  });

  // Query: Get categories with product count
  const getCategoriesWithCountQuery = useQuery({
    queryKey: ['categories-with-count'],
    queryFn: getCategoriesWithCount,
  });

  // Mutation: Insert a new category
  const insertCategoryMutation = useMutation({
    mutationFn: ({ name, productIds }: InsertCategoryParams) =>
      insertCategoryWithProducts(name, productIds ?? []),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories-with-count'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      router.replace('/(tabs)/inventory/products');
      addToast({
        message: i18n.t('toastCategoryAdded', { ns: 'inventory' }),
        variant: 'success',
        duration: 5000,
      });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error &&
        error.message.includes('UNIQUE constraint failed: categories.name')
          ? i18n.t('toastCategoryAddDuplicate', { ns: 'inventory' })
          : i18n.t('toastCategoryAddFailed', { ns: 'inventory' });
      addToast({ message, variant: 'danger', duration: 5000 });
    },
  });

  // Mutation: Update a category
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, name }: UpdateCategoryParams) =>
      updateCategory(id, name),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories-with-count'] });
      queryClient.invalidateQueries({ queryKey: ['category', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      addToast({
        message: i18n.t('toastCategoryUpdated', { ns: 'inventory' }),
        variant: 'success',
        duration: 5000,
      });
    },
    onError: () => {
      addToast({
        message: i18n.t('toastCategoryUpdateFailed', { ns: 'inventory' }),
        variant: 'danger',
        duration: 5000,
      });
    },
  });

  // Mutation: Delete a category
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories-with-count'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      addToast({
        message: i18n.t('toastCategoryDeleted', { ns: 'inventory' }),
        variant: 'success',
        duration: 5000,
      });
    },
    onError: () => {
      addToast({
        message: i18n.t('toastCategoryDeleteFailed', { ns: 'inventory' }),
        variant: 'danger',
        duration: 5000,
      });
    },
  });

  return {
    // Queries
    getAllCategoriesQuery,
    getCategoriesWithCountQuery,

    // Mutations
    insertCategoryMutation,
    updateCategoryMutation,
    deleteCategoryMutation,
  };
}
