import { useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useGetCategory, useProducts } from '@/hooks';
import { LOW_STOCK_THRESHOLD } from '@/constants';

/**
 * useCategoryDetailsState — owns queries, computed stats, and navigation handlers
 * for Category details screen (`app/(edit-forms)/category/[id].tsx`).
 */
export function useCategoryDetailsState() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const categoryId = id ? Number(id) : NaN;

  const { getAllProductsQuery } = useProducts();
  const categoryQuery = useGetCategory(categoryId);
  const productsQuery = getAllProductsQuery;

  const loading = categoryQuery.isLoading || productsQuery.isLoading;
  const category = categoryQuery.data;

  const productsInCategory = useMemo(() => {
    if (!category) return [];
    const list = productsQuery.data || [];
    return list.filter((p: any) => p.category === category.name);
  }, [category, productsQuery.data]);

  const totalValue = useMemo(
    () =>
      productsInCategory.reduce(
        (sum, p) => sum + (p.price || 0) * (p.quantity || 0),
        0,
      ),
    [productsInCategory],
  );

  const totalUnits = useMemo(
    () => productsInCategory.reduce((sum, p) => sum + (p.quantity || 0), 0),
    [productsInCategory],
  );

  const lowStockCount = useMemo(
    () =>
      productsInCategory.filter(
        (p) =>
          p.quantity === 0 ||
          (p.quantity > 0 && p.quantity < LOW_STOCK_THRESHOLD),
      ).length,
    [productsInCategory],
  );

  const handleBack = () => {
    Haptics.selectionAsync().catch(() => {});
    router.back();
  };

  const handleAddProduct = () => {
    Haptics.selectionAsync().catch(() => {});
    router.push('/(edit-forms)/add-product' as any);
  };

  const handleOpenProduct = (productId: string | number) => {
    Haptics.selectionAsync().catch(() => {});
    router.push(`/(edit-forms)/edit-product/${productId}` as any);
  };

  const stampTone = lowStockCount === 0 ? 'sage' : 'cinnamon';
  const stampLabel =
    lowStockCount === 0
      ? 'ALL GOOD'
      : lowStockCount === 1
        ? '1 LOW'
        : `${lowStockCount} LOW`;
  const stampRotate = lowStockCount === 0 ? 6 : -8;

  return {
    category,
    loading,
    productsInCategory,
    totalValue,
    totalUnits,
    lowStockCount,
    stampTone,
    stampLabel,
    stampRotate,
    handleBack,
    handleAddProduct,
    handleOpenProduct,
  };
}
