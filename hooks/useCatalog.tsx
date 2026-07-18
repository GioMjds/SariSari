import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '@/configs/sqlite';
import { getCatalogProductByBarcode } from '@/database/catalog';
import type { CatalogProduct } from '@/types/catalog.types';

export const catalogKeys = {
  all: ['catalog'] as const,
  product: (barcode: string | null | undefined) => {
    const normalized = barcode ? barcode.trim() : '';
    return [...catalogKeys.all, 'product', normalized] as const;
  },
};

export function useCatalogProduct(barcode: string | null | undefined) {
  const normalized = barcode ? barcode.trim() : '';
  return useQuery<CatalogProduct | null>({
    queryKey: catalogKeys.product(normalized),
    queryFn: () =>
      normalized
        ? getCatalogProductByBarcode(db, normalized)
        : Promise.resolve(null),
    enabled: !!normalized,
    staleTime: Infinity,
  });
}

export function useLookupCatalogProduct() {
  const queryClient = useQueryClient();
  return useCallback(
    (barcode: string) => {
      const normalized = barcode ? barcode.trim() : '';
      return queryClient.fetchQuery<CatalogProduct | null>({
        queryKey: catalogKeys.product(normalized),
        queryFn: () =>
          normalized
            ? getCatalogProductByBarcode(db, normalized)
            : Promise.resolve(null),
        staleTime: Infinity,
      });
    },
    [queryClient],
  );
}
