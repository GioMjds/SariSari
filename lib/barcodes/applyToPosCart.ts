/**
 * Pure decision logic for applying a scanned barcode to the POS cart.
 * No React, no native modules, no DB. Safe to unit-test.
 *
 * The POS scanner runs in `continuous` mode: the camera stays open
 * across multiple scans. To prevent the same physical scan from
 * firing the cart-add many times (Android CameraView occasionally
 * reports the same barcode 2-3 times in quick succession), we
 * throttle by barcode: scans of the same barcode within `throttleMs`
 * (default 1500) collapse to a single `{ kind: 'duplicate' }` result.
 *
 * The throttle is per-barcode, not global — a different barcode in
 * the same window is still accepted. This matches the behavior at
 * a real checkout counter: scanning the same item 3 times in 0.5s
 * means "add 1 unit", but scanning Coke then Sprite in 0.5s means
 * "add both".
 */
export interface PosScanProductLike {
  id: number;
  sku: string;
  name: string;
  price: number;
  quantity: number;
}

export interface PosScanInput {
  barcode: string;
  products: ReadonlyArray<PosScanProductLike>;
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
      lastScan: { barcode: string; at: number };
    }
  /** No inventory matches this SKU — caller should toast an error. */
  | {
      kind: 'missing';
      barcode: string;
      lastScan: { barcode: string; at: number };
    };

export const DEFAULT_POS_SCAN_THROTTLE_MS = 1500;

export function applyBarcodeToPosCart(input: PosScanInput): PosScanResult {
  const { barcode, products, lastScan, now } = input;
  const throttleMs = input.throttleMs ?? DEFAULT_POS_SCAN_THROTTLE_MS;

  // Throttle: same barcode inside the throttle window is dropped.
  // (Different barcodes don't throttle each other — a Suki scanning
  // Coke and then Sprite within 0.3s should see both register.)
  if (
    lastScan &&
    lastScan.barcode === barcode &&
    now - lastScan.at < throttleMs
  ) {
    return { kind: 'duplicate' };
  }

  const product = products.find((p) => p.sku === barcode);

  if (product) {
    return {
      kind: 'add',
      product,
      lastScan: { barcode, at: now },
    };
  }

  return {
    kind: 'missing',
    barcode,
    lastScan: { barcode, at: now },
  };
}
