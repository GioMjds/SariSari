/**
 * Pure decision logic for applying a scanned barcode to the
 * Add Product form. No React, no native modules, no DB — safe to
 * unit-test without rendering.
 *
 * The Add Product hook calls this and translates the returned patch
 * into react-hook-form `setValue` calls, `useToastStore` calls, and
 * `setAutoGenerateSku` updates. Keeping the decision pure means the
 * rule order (turn auto-generate off BEFORE writing the product name)
 * is testable in isolation.
 *
 * Three possible outcomes:
 *   - `apply`: catalog hit (or no catalog at all — a clean barcode).
 *     The patch tells the hook what to write to `form.barcode` and
 *     (optionally) name + category from the offline catalog.
 *   - `invalid`: the barcode failed `validateBarcode`. The hook
 *     surfaces a toast and does nothing else.
 *   - `duplicate`: another product already owns this barcode (or the
 *     legacy SKU equivalent). The patch carries the existing
 *     product so the hook can render an inline FormError.
 *
 * Rule order matters because the existing auto-generate-SKU
 * `useEffect` in `useAddProductForm.ts` re-runs on every productName
 * change. If we wrote `productName` first while auto-gen was still
 * on, the effect would generate a new SKU and overwrite our scanned
 * barcode. The patch below flags `setAutoGenerateSku: true` so the
 * hook applies it before the rest of the writes.
 */
import type { Product } from '@/types/products.types';
import type { OfflineBarcodeLookup } from '@/constants/barcodes';
import { validateBarcode } from './format';

export interface AddProductScanInput {
  barcode: string;
  currentProductName: string;
  autoGenerateSku: boolean;
  lookup: (barcode: string) => OfflineBarcodeLookup | null;
  /**
   * Existing products to check for a duplicate before submit. Optional —
   * if the caller can't pass the catalog (e.g. during a unit test), the
   * duplicate check is skipped and a clean barcode always passes.
   */
  existingProducts?: ReadonlyArray<Product>;
}

export interface AddProductScanPatch {
  /** Always the scanned barcode when `kind === 'apply'`. */
  barcode: string;
  /** Filled only when the offline catalog returns a match. */
  productName?: string;
  /** Filled only when the offline catalog returns a match. */
  category?: string;
  /** When true, the hook should flip auto-generate-SKU OFF first. */
  setAutoGenerateSku?: boolean;
  /** Toast payload to surface when the catalog has no match. */
  toast?: {
    variant: 'warning';
    message: string;
  };
  /** Always true — every successful scan closes the scanner modal. */
  closeModal: true;
}

export type AddProductScanResult =
  | { kind: 'apply'; patch: AddProductScanPatch }
  | { kind: 'invalid'; reason: 'empty' | 'format' }
  | { kind: 'duplicate'; existing: Product };

/**
 * Build a patch describing what to write to the Add Product form
 * when a barcode is scanned. Pure: depends only on its inputs.
 */
export function applyBarcodeToAddProductForm(
  input: AddProductScanInput,
): AddProductScanResult {
  const {
    barcode,
    autoGenerateSku,
    lookup,
    existingProducts,
  } = input;

  // Format validation first — invalid input never reaches the catalog
  // or duplicate check.
  const validation = validateBarcode(barcode);
  if (!validation.ok) {
    return { kind: 'invalid', reason: validation.reason };
  }
  const validatedBarcode = validation.barcode;

  // Duplicate check: another product may already own this barcode (or,
  // for legacy rows, the SKU equivalent). This is a pre-submit guard
  // mirroring the partial unique index on `products.barcode`; the index
  // is the post-submit safety net. Surfacing the conflict here lets us
  // block submit with a useful inline error and an "Edit that product"
  // link, instead of a generic SQLITE_CONSTRAINT toast after the user
  // fills the whole form.
  if (existingProducts && existingProducts.length > 0) {
    const conflict = existingProducts.find(
      (p) =>
        (p.barcode != null && p.barcode === validatedBarcode) ||
        p.sku === validatedBarcode,
    );
    if (conflict) {
      return { kind: 'duplicate', existing: conflict };
    }
  }

  const match = lookup(validatedBarcode);

  if (match) {
    const patch: AddProductScanPatch = {
      barcode: validatedBarcode,
      productName: match.name,
      category: match.category,
      closeModal: true,
    };
    // Turn off auto-gen first so the productName write doesn't get
    // clobbered by the auto-gen effect re-running with the new name.
    if (autoGenerateSku) {
      patch.setAutoGenerateSku = true;
    }
    return { kind: 'apply', patch };
  }

  return {
    kind: 'apply',
    patch: {
      barcode: validatedBarcode,
      toast: {
        variant: 'warning',
        message:
          'Barcode scanned. Product details not in catalog; please type details manually.',
      },
      closeModal: true,
    },
  };
}