import { validateBarcode } from './format';
import { applyBarcodeToPosCart } from './applyToPosCart';
import type { Product } from '@/types/products.types';
import type { CatalogProduct } from '@/types/catalog.types';
import type { ScanResolution } from './types';

export interface BarcodeResolverConfig {
  getProducts: () => ReadonlyArray<Product>;
  isStoreProductsReady: () => boolean;
  lookupCatalogProduct: (barcode: string) => Promise<CatalogProduct | null>;
  throttleMs?: number;
}

export function createBarcodeResolver(config: BarcodeResolverConfig) {
  let sequence = 0;
  let lastAcceptedScan: { barcode: string; at: number } | null = null;

  return {
    resolve: async (barcode: string, nowMs?: number): Promise<ScanResolution> => {
      const validation = validateBarcode(barcode);
      if (!validation.ok) {
        return { kind: 'invalid', reason: validation.reason };
      }

      if (!config.isStoreProductsReady()) {
        sequence += 1;
        return { kind: 'store_products_unavailable' };
      }

      const storeResult = applyBarcodeToPosCart({
        barcode: validation.barcode,
        products: config.getProducts(),
        lastScan: lastAcceptedScan,
        now: nowMs ?? Date.now(),
        throttleMs: config.throttleMs,
      });

      if (storeResult.kind === 'duplicate') {
        return { kind: 'duplicate' };
      }

      if (storeResult.kind === 'invalid') {
        return { kind: 'invalid', reason: storeResult.reason };
      }

      lastAcceptedScan = storeResult.lastScan;
      sequence += 1;

      if (storeResult.kind === 'add') {
        return {
          kind: 'resolved',
          product: storeResult.product,
          source: storeResult.source,
          matchedUnit: storeResult.matchedUnit,
        };
      }

      const currentSequence = sequence;
      const barcodeToLookup = validation.barcode;

      let catalog: CatalogProduct | null = null;
      try {
        catalog = await config.lookupCatalogProduct(barcodeToLookup);
      } catch (err) {
        console.warn('Catalog lookup rejected:', err);
        if (sequence !== currentSequence || !config.isStoreProductsReady()) {
          return { kind: 'superseded' };
        }
        return { kind: 'missing', barcode: barcodeToLookup };
      }

      if (sequence !== currentSequence || !config.isStoreProductsReady()) {
        return { kind: 'superseded' };
      }

      if (catalog === null) {
        return { kind: 'missing', barcode: barcodeToLookup };
      }

      return {
        kind: 'catalog_match',
        catalogProduct: catalog,
      };
    },
  };
}
