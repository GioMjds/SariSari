import { validateBarcode, DEFAULT_BARCODE_THROTTLE_MS } from './format';
import type { Product } from '@/types/products.types';

export type PosScanProductLike = Product;

export interface PosScanInput {
  barcode: string;
  products: readonly PosScanProductLike[];
  /** The most recent accepted scan, or null. */
  lastScan: { barcode: string; at: number } | null;
  /** Caller-supplied wall-clock time in ms. Injected so tests are deterministic. */
  now: number;
  /** Default 1500 ms — scans of the same barcode within this window are dropped. */
  throttleMs?: number;
}

export type PosScanResult =
  /** Same barcode arrived within throttleMs — drop it silently. */
  | { kind: 'duplicate' }
  /** Catalog hit — caller should add this product to the cart. */
  | {
      kind: 'add';
      product: PosScanProductLike;
      /** Tells the caller whether the hit came from `barcode`, `sku`, or `wholesale_barcode`. */
      source: 'barcode' | 'sku' | 'wholesale_barcode';
      matchedUnit: 'retail' | 'wholesale';
      lastScan: { barcode: string; at: number };
    }
  /** No inventory matches this value — caller should show the missing CTA. */
  | {
      kind: 'missing';
      barcode: string;
      lastScan: { barcode: string; at: number };
    }
  /** Format validation failed — caller should toast an invalid-barcode message. */
  | {
      kind: 'invalid';
      reason: 'empty' | 'format';
    };

export const DEFAULT_POS_SCAN_THROTTLE_MS = DEFAULT_BARCODE_THROTTLE_MS;

export function applyBarcodeToPosCart(input: PosScanInput): PosScanResult {
  const { barcode, products, lastScan, now } = input;
  const throttleMs = input.throttleMs ?? DEFAULT_POS_SCAN_THROTTLE_MS;

  // Format validation runs before the throttle so an invalid scan
  // can't queue up a phantom `lastScan` entry that would suppress
  // the user's next legitimate attempt at the same barcode.
  const validation = validateBarcode(barcode);
  if (!validation.ok) {
    return { kind: 'invalid', reason: validation.reason };
  }
  const validatedBarcode = validation.barcode;

  // Throttle: same barcode inside the throttle window is dropped.
  // (Different barcodes don't throttle each other — a Suki scanning
  // Coke and then Sprite within 0.3s should see both register.)
  if (
    lastScan &&
    lastScan.barcode === validatedBarcode &&
    now - lastScan.at < throttleMs
  ) {
    return { kind: 'duplicate' };
  }

  // First try the dedicated barcode column. Modern (post-v5) rows
  // can have distinct `sku` and `barcode`, so this is the preferred
  // path. If the column is `null` (legacy or unrecorded), we
  // fall through to the SKU lookup so a pre-migration database
  // keeps working without a data migration.
  const byBarcode = products.find(
    (p) => p.barcode != null && p.barcode === validatedBarcode,
  );
  if (byBarcode) {
    return {
      kind: 'add',
      product: byBarcode,
      source: 'barcode',
      matchedUnit: 'retail',
      lastScan: { barcode: validatedBarcode, at: now },
    };
  }

  const byWholesaleBarcode = products.find(
    (p) =>
      p.wholesale_barcode != null && p.wholesale_barcode === validatedBarcode,
  );
  if (byWholesaleBarcode) {
    return {
      kind: 'add',
      product: byWholesaleBarcode,
      source: 'wholesale_barcode',
      matchedUnit: 'wholesale',
      lastScan: { barcode: validatedBarcode, at: now },
    };
  }

  // SKU fallback. Pre-v5 rows store the printed identifier in the
  // `sku` column because there was no separate barcode column.
  // Resolving via SKU here preserves the legacy contract.
  const bySku = products.find((p) => p.sku === validatedBarcode);
  if (bySku) {
    return {
      kind: 'add',
      product: bySku,
      source: 'sku',
      matchedUnit: 'retail',
      lastScan: { barcode: validatedBarcode, at: now },
    };
  }

  return {
    kind: 'missing',
    barcode: validatedBarcode,
    lastScan: { barcode: validatedBarcode, at: now },
  };
}
