/**
 * Offline product barcode catalog.
 *
 * A bundled, read-only `Map<string, { name, category }>` covering
 * ~150-250 popular Filipino consumer products across beverages,
 * snacks, noodles, and canned goods. Used by the camera scanner to
 * pre-fill Product Name + Category when a known barcode is scanned
 * during Add Product registration.
 *
 * Why this lives in `constants/` (not `database/` or `lib/`):
 *   • It's static bundled data — no SQLite, no migration, no domain
 *     row mapping. Like `constants/categories.ts` (which holds UI
 *     color/icon arrays) it co-locates data with its lookup function.
 *   • AGENTS.md's "domain types live with their db/ file" rule
 *     applies to *persisted* domains. The barcode catalog is read-
 *     only constants; no DB layer backs it.
 *
 * Adding more categories: drop a new JSON file (same shape) into
 * `constants/barcodes/`, import it below, and append to the union
 * array. The map is built once at module load.
 */

import beverages from './beverages.json';
import cannedGoods from './canned-goods.json';
import noodles from './noodles.json';
import snacks from './snacks.json';

/** Raw row shape in each category JSON file. */
export interface OfflineBarcodeItem {
  barcode: string;
  name: string;
  category: string;
}

/** What `lookupOfflineBarcode` returns — only the lookup fields. */
export interface OfflineBarcodeLookup {
  name: string;
  category: string;
}

const combined: OfflineBarcodeItem[] = [
  ...beverages,
  ...snacks,
  ...noodles,
  ...cannedGoods,
];

const barcodeCatalogMap = new Map<string, OfflineBarcodeLookup>();

for (const item of combined) {
  // Last write wins — if two files accidentally share a barcode,
  // the later category wins. Tests assert there are no duplicates.
  barcodeCatalogMap.set(item.barcode, {
    name: item.name,
    category: item.category,
  });
}

/**
 * Look up an offline product by its barcode. Returns `null` when the
 * barcode is not in the bundled catalog — the caller should fall back
 * to "SKU-only" registration (user fills in name + category by hand).
 *
 * Lookup is O(1) — the map is built once at module load, not per call.
 */
export function lookupOfflineBarcode(
  barcode: string,
): OfflineBarcodeLookup | null {
  return barcodeCatalogMap.get(barcode) ?? null;
}

/** Total entries in the bundled catalog. Useful for tests + status UI. */
export const OFFLINE_BARCODE_COUNT = barcodeCatalogMap.size;

/** Catalog version string. Bump when entries change materially. */
export const BARCODE_CATALOG_VERSION = '2026-06-27';
