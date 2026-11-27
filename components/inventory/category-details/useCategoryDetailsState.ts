import { useCallback, useMemo, useState } from 'react';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  useCategories,
  useRecentProductSales,
  useGetCategory,
  useProducts,
} from '@/hooks';
import type { CategoryWithCount } from '@/types';
import {
  buildCategoryRows,
  CategoryFilter,
  CategorySort,
  selectCategoryRows,
  summarizeCategory,
  topSellers,
} from './categoryInsights';

export type CategorySheet = 'actions' | 'rename' | null;

// Slightly longer than the Sheet exit so two native modals never present at once.
const SHEET_SWAP_MS = 200;

const tap = () => Haptics.selectionAsync().catch(() => {});

/**
 * useCategoryDetailsState — owns queries, derived insights, list controls, and
 * navigation for the Category details screen (`app/(edit-forms)/category/[id].tsx`).
 */
export function useCategoryDetailsState() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const categoryId = Number(id);

  const categoryQuery = useGetCategory(categoryId);
  const { getAllProductsQuery } = useProducts();
  const {
    getCategoriesWithCountQuery,
    updateCategoryMutation,
    deleteCategoryMutation,
  } = useCategories();
  const category = categoryQuery.data ?? null;
  const salesQuery = useRecentProductSales();

  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [sort, setSort] = useState<CategorySort>('priority');
  const [sheet, setSheet] = useState<CategorySheet>(null);

  const rows = useMemo(() => {
    if (!category) return [];
    const products = (getAllProductsQuery.data ?? []).filter(
      (p) => p.category === category.name,
    );
    return buildCategoryRows(products, salesQuery.data);
  }, [category, getAllProductsQuery.data, salesQuery.data]);

  const summary = useMemo(() => summarizeCategory(rows), [rows]);
  const visibleRows = useMemo(
    () => selectCategoryRows(rows, filter, sort),
    [rows, filter, sort],
  );
  const bestSellers = useMemo(() => topSellers(rows), [rows]);

  const catalogCount = getAllProductsQuery.data?.length ?? 0;
  const catalogShare =
    catalogCount > 0 ? Math.round((rows.length / catalogCount) * 100) : 0;
  const takenNames = useMemo(
    () =>
      (getCategoriesWithCountQuery.data ?? [])
        .filter((c) => c.id !== categoryId)
        .map((c) => c.name.trim().toLowerCase()),
    [getCategoriesWithCountQuery.data, categoryId],
  );
  // The shared action sheet expects the list shape, so give it this screen's live count.
  const sheetCategory: CategoryWithCount | null = category
    ? { ...category, product_count: rows.length }
    : null;

  const handleBack = useCallback(() => {
    tap();
    router.back();
  }, [router]);

  const handleAddProduct = useCallback(() => {
    tap();
    router.push({
      pathname: '/(edit-forms)/add-product',
      params: category ? { prefillCategory: category.name } : {},
    } as Href);
  }, [router, category]);

  const handleOpenProduct = useCallback(
    (productId: number) => {
      tap();
      router.push(`/(edit-forms)/product-details/${productId}` as Href);
    },
    [router],
  );

  const handleOpenInProducts = useCallback(() => {
    if (!category) return;
    tap();
    setSheet(null);
    router.push({
      pathname: '/(tabs)/inventory/products',
      params: { category: category.name },
    } as Href);
  }, [router, category]);

  const handleFilter = useCallback((next: CategoryFilter) => {
    tap();
    setFilter(next);
  }, []);

  const handleSort = useCallback((next: CategorySort) => {
    tap();
    setSort(next);
  }, []);

  const openActions = useCallback(() => {
    tap();
    setSheet('actions');
  }, []);
  const closeSheet = useCallback(() => setSheet(null), []);
  const openRename = useCallback(() => {
    setSheet(null);
    setTimeout(() => setSheet('rename'), SHEET_SWAP_MS);
  }, []);

  const handleRename = useCallback(
    (name: string) =>
      updateCategoryMutation.mutate(
        { id: categoryId, name },
        { onSuccess: closeSheet },
      ),
    [updateCategoryMutation, categoryId, closeSheet],
  );

  const handleDelete = useCallback(
    () =>
      deleteCategoryMutation.mutate(categoryId, {
        onSuccess: () => {
          setSheet(null);
          router.back();
        },
      }),
    [deleteCategoryMutation, categoryId, router],
  );

  const refreshing =
    categoryQuery.isRefetching ||
    getAllProductsQuery.isRefetching ||
    salesQuery.isRefetching;
  const handleRefresh = useCallback(() => {
    categoryQuery.refetch();
    getAllProductsQuery.refetch();
    salesQuery.refetch();
  }, [categoryQuery, getAllProductsQuery, salesQuery]);

  return {
    category,
    sheetCategory,
    loading: categoryQuery.isLoading || getAllProductsQuery.isLoading,
    // A failed read must not pass for "not found" or an empty category.
    loadError:
      (categoryQuery.isError && !categoryQuery.data) ||
      (getAllProductsQuery.isError && !getAllProductsQuery.data),
    salesLoading: salesQuery.isLoading,
    salesReady: salesQuery.data !== undefined,
    rows,
    visibleRows,
    bestSellers,
    summary,
    catalogShare,
    catalogCount,
    takenNames,
    filter,
    sort,
    sheet,
    refreshing,
    renaming: updateCategoryMutation.isPending,
    deleting: deleteCategoryMutation.isPending,
    handleBack,
    handleAddProduct,
    handleOpenProduct,
    handleOpenInProducts,
    handleFilter,
    handleSort,
    handleRefresh,
    openActions,
    openRename,
    closeSheet,
    handleRename,
    handleDelete,
  };
}
