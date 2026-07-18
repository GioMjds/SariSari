import { validateBarcode } from './format';
import { applyBarcodeToPosCart } from './applyToPosCart';
import type { Product } from '@/types/products.types';
import type { CatalogProduct } from '@/types/catalog.types';
import type { ScanResolution } from './types';

export interface BarcodeResolverConfig {
  getProducts: () => readonly Product[];
  isStoreProductsReady: () => boolean;
  lookupCatalogProduct: (barcode: string) => Promise<CatalogProduct | null>;
  throttleMs?: number;
}

export function createBarcodeResolver(config: BarcodeResolverConfig) {
  let sequence = 0;
  let lastAcceptedScan: { barcode: string; at: number } | null = null;

  return {
    resolve: async (
      barcode: string,
      nowMs?: number,
    ): Promise<ScanResolution> => {
      if (__DEV__) {
        console.log('[Barcode] resolve() called with', barcode);
      }

      const validation = validateBarcode(barcode);
      if (!validation.ok) {
        if (__DEV__) {
          console.log('[Barcode] invalid:', validation.reason);
        }
        return { kind: 'invalid', reason: validation.reason };
      }

      if (!config.isStoreProductsReady()) {
        if (__DEV__) {
          console.log(
            '[Barcode] store products NOT ready, bailing (store_products_unavailable)',
          );
        }
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
      if (__DEV__) {
        console.log('[Barcode] store lookup result:', storeResult.kind);
      }

      if (storeResult.kind === 'duplicate') {
        return { kind: 'duplicate' };
      }

      if (storeResult.kind === 'invalid') {
        return { kind: 'invalid', reason: storeResult.reason };
      }

      lastAcceptedScan = storeResult.lastScan;
      sequence += 1;

      if (storeResult.kind === 'add') {
        if (__DEV__) {
          console.log(
            '[Barcode] resolved against existing store product:',
            storeResult.product.name,
          );
        }
        return {
          kind: 'resolved',
          product: storeResult.product,
          source: storeResult.source,
          matchedUnit: storeResult.matchedUnit,
        };
      }

      const currentSequence = sequence;
      const barcodeToLookup = validation.barcode;

      if (__DEV__) {
        console.log(
          '[Barcode] no store match, querying catalog for',
          barcodeToLookup,
        );
      }
      let catalog: CatalogProduct | null = null;
      try {
        catalog = await config.lookupCatalogProduct(barcodeToLookup);
        if (__DEV__) {
          console.log('[Barcode] catalog query returned:', catalog);
        }
      } catch (err) {
        if (__DEV__) {
          console.warn('[Barcode] catalog lookup THREW:', err);
        }
        if (sequence !== currentSequence || !config.isStoreProductsReady()) {
          if (__DEV__) {
            console.log('[Barcode] superseded after catalog error');
          }
          return { kind: 'superseded' };
        }
        return { kind: 'missing', barcode: barcodeToLookup };
      }

      if (sequence !== currentSequence || !config.isStoreProductsReady()) {
        if (__DEV__) {
          console.log(
            '[Barcode] superseded (a newer scan arrived while this one was in flight)',
          );
        }
        return { kind: 'superseded' };
      }

      if (catalog === null) {
        if (__DEV__) {
          console.log('[Barcode] catalog MISS for', barcodeToLookup);
        }
        return { kind: 'missing', barcode: barcodeToLookup };
      }

      if (__DEV__) {
        console.log('[Barcode] catalog HIT:', catalog.name);
      }
      return {
        kind: 'catalog_match',
        barcode: barcodeToLookup,
        catalogProduct: catalog,
      };
    },
  };
}
