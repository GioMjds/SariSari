/**
 * Barcode format validation — pure logic, no React, no native modules.
 *
 * A barcode in this codebase is the printed machine-readable identifier
 * on a product's packaging, distinct from the store's internal `sku`.
 *
 * We accept the standard consumer UPC/EAN family plus the two 1D codes
 * printed on warehouse labels (CODE 39, CODE 128). The regex restricts
 * to digits because every retail barcode format SariSari cares about
 * (GTIN-8, UPC-A / GTIN-12, EAN-13 / GTIN-13, GTIN-14) is digit-only —
 * accepting letters would let plain Unicode lookalikes slip through
 * (e.g. `O` for `0`), so we reject those at the boundary and let the
 * user re-type by hand.
 *
 * PLU (4-digit) codes are intentionally excluded: the bundled offline
 * catalog and the typical sari-sari counter use 8-14 digit barcodes.
 * If PLU support is ever needed, drop the lower bound to 4.
 */
export const BARCODE_REGEX = /^\d{8,14}$/;

/** Default per-barcode throttle for continuous-mode POS scanning. */
export const DEFAULT_BARCODE_THROTTLE_MS = 1500;

export type BarcodeValidation =
  | { ok: true; barcode: string }
  | { ok: false; reason: 'empty' | 'format' };

/**
 * Validate a candidate barcode string.
 *
 * Trims whitespace before testing. Returns `{ ok: false, reason: 'empty' }`
 * for an empty input and `{ ok: false, reason: 'format' }` for any
 * non-empty value that doesn't match `BARCODE_REGEX`. Returns the
 * trimmed value on success so callers don't have to re-trim.
 */
export function validateBarcode(input: string): BarcodeValidation {
  const trimmed = (input ?? '').trim();
  if (!trimmed) return { ok: false, reason: 'empty' };
  if (!BARCODE_REGEX.test(trimmed)) return { ok: false, reason: 'format' };
  return { ok: true, barcode: trimmed };
}