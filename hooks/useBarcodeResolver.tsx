/**
 * useBarcodeResolver — composes `validateBarcode`, the per-barcode
 * throttle, and the catalog lookup into a single function the POS
 * and Add Product screens can call without re-implementing the chain.
 *
 * Why a hook and not just a shared lib function: the resolver reads
 * `products` from the `useProducts` cache so it can answer
 * synchronously in the common case. A pure function would have to
 * accept the products list as an arg every call, which leaks
 * query-cache details into every caller.
 *
 * Defense layers (matches spec §4):
 *   1. `validateBarcode` — rejects invalid format.
 *   2. Per-barcode throttle at `DEFAULT_BARCODE_THROTTLE_MS` (caller-
 *      overridden). The modal has its own throttle too; this is a
 *      belt-and-suspenders layer that survives any caller.
 *   3. Catalog lookup: `barcode` column first, then SKU fallback.
 *
 * The hook does NOT cache the throttle across mounts — each mount
 * owns its own ref. The expectation is that the modal owns one
 * hook instance for its lifetime.
 */
import { useCallback, useMemo, useRef } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useCatalogProducts } from '@/hooks/useCatalog';
import {
  validateBarcode,
  DEFAULT_BARCODE_THROTTLE_MS,
} from '@/lib/barcodes/format';
import type { ScanResolution } from '@/lib/barcodes/types';
import type { Product } from '@/types';
import type { CatalogProduct } from '@/types/catalog.types';


export interface UseBarcodeResolverOptions {
  throttleMs?: number;
  now?: () => number;
}

export function resolveBarcodeAgainstProducts(
  barcode: string,
  products: Product[],
  catalogProducts: CatalogProduct[] = [],
): ScanResolution {
  const validation = validateBarcode(barcode);
  if (!validation.ok) {
    return { kind: 'invalid', reason: validation.reason };
  }
  const validated = validation.barcode;

  // Direct retail barcode match first.
  const byBarcode = products.find(
    (p) => p.barcode != null && p.barcode === validated,
  );
  if (byBarcode) {
    return {
      kind: 'resolved',
      product: byBarcode,
      source: 'barcode',
      matchedUnit: 'retail',
    };
  }

  // Direct wholesale barcode match second.
  const byWholesaleBarcode = products.find(
    (p) => p.wholesale_barcode != null && p.wholesale_barcode === validated,
  );
  if (byWholesaleBarcode) {
    return {
      kind: 'resolved',
      product: byWholesaleBarcode,
      source: 'wholesale_barcode',
      matchedUnit: 'wholesale',
    };
  }

  // SKU fallback for legacy rows.
  const bySku = products.find((p) => p.sku === validated);
  if (bySku) {
    return {
      kind: 'resolved',
      product: bySku,
      source: 'sku',
      matchedUnit: 'retail',
    };
  }

  // Universal product catalog match.
  const byCatalog = catalogProducts.find(
    (c) => c.barcode === validated,
  );
  if (byCatalog) {
    return {
      kind: 'catalog_match',
      catalogProduct: byCatalog,
    };
  }

  return { kind: 'missing', barcode: validated };
}


export function useBarcodeResolver(
  options: UseBarcodeResolverOptions = {},
): {
  resolve: (
    barcode: string,
    nowMs?: number,
  ) => ScanResolution;
} {
  const { throttleMs = DEFAULT_BARCODE_THROTTLE_MS, now = () => Date.now() } =
    options ?? {};
  const { getAllProductsQuery } = useProducts();
  const { data: catalogProducts = [] } = useCatalogProducts();
  const lastScanRef = useRef<{ barcode: string; at: number } | null>(null);

  const products = getAllProductsQuery.data ?? [];

  const resolve = useCallback(
    (barcode: string, nowMs?: number): ScanResolution => {
      const validation = validateBarcode(barcode);
      if (!validation.ok) {
        return { kind: 'invalid', reason: validation.reason };
      }
      const validated = validation.barcode;
      const nowValue = nowMs ?? now();

      const last = lastScanRef.current;
      if (
        last &&
        last.barcode === validated &&
        nowValue - last.at < throttleMs
      ) {
        return { kind: 'invalid', reason: 'format' };
      }
      lastScanRef.current = { barcode: validated, at: nowValue };

      return resolveBarcodeAgainstProducts(validated, products, catalogProducts);
    },
    [products, catalogProducts, throttleMs, now],
  );

  return useMemo(() => ({ resolve }), [resolve]);
}