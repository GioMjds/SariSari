import {
  deleteCategory,
  getAllCategories,
  getCategoriesWithCount,
  getCategory,
  getCategoryByName,
  insertCategory,
  updateCategory,
} from '@/db/categories';
import { useToastStore } from '@/stores/ToastStore';
import {
  InsertCategoryParams,
  UpdateCategoryParams,
} from '@/types/categories.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useCategories() {
  const queryClient = useQueryClient();
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

  // Query: Get category by ID
  const useGetCategory = (id: number) => {
    return useQuery({
      queryKey: ['category', id],
      queryFn: () => getCategory(id),
      enabled: !!id,
    });
  };

  // Query: Get category by name
  const useGetCategoryByName = (name: string) => {
    return useQuery({
      queryKey: ['category-name', name],
      queryFn: () => getCategoryByName(name),
      enabled: !!name,
    });
  };

  // Mutation: Insert a new category
  const insertCategoryMutation = useMutation({
    mutationFn: ({ name }: InsertCategoryParams) => insertCategory(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories-with-count'] });
      addToast({
        message: 'Category added successfully',
        variant: 'success',
        duration: 5000,
      });
    },
    onError: () => {
      addToast({
        message: 'Your category doesn\'t add. Please try again.',
        variant: 'error',
        duration: 5000,
      });
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
        message: 'Category updated successfully',
        variant: 'success',
        duration: 5000,
      });
    },
    onError: () => {
      addToast({
        message: 'Your category doesn\'t update. Please try again.',
        variant: 'error',
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
        message: 'Category deleted successfully',
        variant: 'success',
        duration: 5000,
      });
    },
    onError: () => {
      addToast({
        message: 'Something went wrong. Please try again.',
        variant: 'error',
        duration: 5000,
      });
    },
  });

  return {
    // Queries
    getAllCategoriesQuery,
    getCategoriesWithCountQuery,
    useGetCategory,
    useGetCategoryByName,

    // Mutations
    insertCategoryMutation,
    updateCategoryMutation,
    deleteCategoryMutation,
  };
}
