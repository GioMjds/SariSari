/**
 * Discriminated union returned by the barcode resolver.
 *
 * - `resolved` — the barcode mapped to a Product in the catalog. `source`
 *   tells the caller whether the hit came from the `barcode` column
 *   (modern rows) or from the `sku` column (legacy pre-v5 rows where
 *   the SKU and the barcode are the same value). UI is identical; we
 *   log `source` for telemetry so we can quantify how many legacy rows
 *   are still resolving via SKU after the migration.
 * - `missing` — the barcode is well-formed but no product owns it.
 *   POS uses this to render the "Add as new product" CTA.
 * - `invalid` — the barcode failed format validation. The reason string
 *   is for log/UI debug; the UI copy comes from i18n.
 */
import type { Product } from '@/types/products.types';

export type ScanResolution =
  | {
      kind: 'resolved';
      product: Product;
      source: 'barcode' | 'sku' | 'wholesale_barcode';
      matchedUnit: 'retail' | 'wholesale';
    }
  | {
      kind: 'missing';
      barcode: string;
    }
  | {
      kind: 'invalid';
      reason: 'empty' | 'format';
    };