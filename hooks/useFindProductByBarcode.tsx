import { getProductByBarcode } from '@/database/products';
import { Product } from '@/types/products.types';
import { useQuery } from '@tanstack/react-query';

/**
 * Look up a product by its printed `barcode` column (the v5 column).
 *
 * Cache strategy: short stale time + the `useProducts` cache as a
 * pre-check. A typical scan happens at the POS counter where the
 * `getAllProductsQuery` cache is already warm, so the cheap sync
 * check is enough for the common case. The SQL fallback only fires
 * once per barcode per session (because the result is cached in the
 * `['product-barcode', barcode]` slot for `staleTime` ms).
 *
 * Returns `null` for invalid/empty input AND for catalog misses —
 * callers can use `data === undefined` to distinguish "still loading"
 * from "not found".
 */
export function useFindProductByBarcode(barcode: string | null | undefined) {
  return useQuery<Product | null>({
    queryKey: ['product-barcode', barcode],
    queryFn: () =>
      barcode && barcode.length > 0
        ? getProductByBarcode(barcode)
        : Promise.resolve(null),
    enabled: !!barcode && barcode.length > 0,
    staleTime: 60_000,
  });
}