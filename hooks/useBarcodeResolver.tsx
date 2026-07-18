import { useMemo, useRef } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useLookupCatalogProduct } from '@/hooks/useCatalog';
import { DEFAULT_BARCODE_THROTTLE_MS } from '@/lib/barcodes/format';
import { createBarcodeResolver } from '@/lib/barcodes/resolveBarcode';
import type { ScanResolution } from '@/lib/barcodes/types';
import type { Product } from '@/types';

export interface UseBarcodeResolverOptions {
  throttleMs?: number;
}

export function useBarcodeResolver(options: UseBarcodeResolverOptions = {}): {
  resolve: (barcode: string, nowMs?: number) => Promise<ScanResolution>;
} {
  const { throttleMs = DEFAULT_BARCODE_THROTTLE_MS } = options ?? {};
  const { getAllProductsQuery } = useProducts();
  const lookupCatalogProduct = useLookupCatalogProduct();

  const productsRef = useRef<readonly Product[]>([]);

  if (getAllProductsQuery.data) {
    productsRef.current = getAllProductsQuery.data;
  }

  const readyRef = useRef(false);
  readyRef.current = getAllProductsQuery.isSuccess && !getAllProductsQuery.isFetching;

  const resolver = useMemo(() => {
    return createBarcodeResolver({
      getProducts: () => productsRef.current,
      isStoreProductsReady: () => readyRef.current,
      lookupCatalogProduct,
      throttleMs,
    });
  }, [lookupCatalogProduct, throttleMs]);

  return useMemo(() => ({
    resolve: (barcode: string, nowMs?: number) => resolver.resolve(barcode, nowMs),
  }), [resolver]);
}
