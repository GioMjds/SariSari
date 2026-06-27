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
 * Rule order matters because the existing auto-generate-SKU
 * `useEffect` in `useAddProductForm.ts` re-runs on every productName
 * change. If we wrote `productName` first while auto-gen was still
 * on, the effect would generate a new SKU and overwrite our scanned
 * barcode. The patch below flags `setAutoGenerateSku: true` so the
 * hook applies it before the rest of the writes.
 */
import type { OfflineBarcodeLookup } from '@/constants/barcodes';

export interface AddProductScanInput {
  barcode: string;
  currentProductName: string;
  autoGenerateSku: boolean;
  lookup: (barcode: string) => OfflineBarcodeLookup | null;
}

export interface AddProductScanPatch {
  /** Always the scanned barcode. */
  sku: string;
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

/**
 * Build a patch describing what to write to the Add Product form
 * when a barcode is scanned. Pure: depends only on its inputs.
 */
export function applyBarcodeToAddProductForm(
  input: AddProductScanInput,
): AddProductScanPatch {
  const { barcode, autoGenerateSku, lookup } = input;

  const match = lookup(barcode);

  if (match) {
    const patch: AddProductScanPatch = {
      sku: barcode,
      productName: match.name,
      category: match.category,
      closeModal: true,
    };
    // Turn off auto-gen first so the productName write doesn't get
    // clobbered by the auto-gen effect re-running with the new name.
    if (autoGenerateSku) {
      patch.setAutoGenerateSku = true;
    }
    return patch;
  }

  return {
    sku: barcode,
    toast: {
      variant: 'warning',
      message:
        'Barcode scanned. Product details not in catalog; please type details manually.',
    },
    closeModal: true,
  };
}
