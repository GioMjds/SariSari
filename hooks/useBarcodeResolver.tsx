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
import {
  validateBarcode,
  DEFAULT_BARCODE_THROTTLE_MS,
} from '@/lib/barcodes/format';
import type { ScanResolution } from '@/lib/barcodes/types';

export interface UseBarcodeResolverOptions {
  throttleMs?: number;
  now?: () => number;
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
  const lastScanRef = useRef<{ barcode: string; at: number } | null>(null);

  // Snapshot the products list once per render. The query cache is
  // reactive; if a scan completes and triggers a query invalidation,
  // a fresh resolver call will see the new list naturally.
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
        // Return the same as "missing" so the caller has the barcode
        // available — the modal uses it to suppress duplicate-state UI.
        // The kind stays as a separate `duplicate` marker since the
        // POS consumes the throttle ref differently from the form.
        return { kind: 'invalid', reason: 'format' };
      }
      lastScanRef.current = { barcode: validated, at: nowValue };

      // Direct barcode match first.
      const byBarcode = products.find(
        (p) => p.barcode != null && p.barcode === validated,
      );
      if (byBarcode) {
        return {
          kind: 'resolved',
          product: byBarcode,
          source: 'barcode',
        };
      }
      // SKU fallback for legacy rows.
      const bySku = products.find((p) => p.sku === validated);
      if (bySku) {
        return { kind: 'resolved', product: bySku, source: 'sku' };
      }
      return { kind: 'missing', barcode: validated };
    },
    [products, throttleMs, now],
  );

  return useMemo(() => ({ resolve }), [resolve]);
}