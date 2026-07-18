/**
 * Pure decision logic for applying a resolved barcode catalog match or missing result
 * to the Add Product form.
 */
import type { ScanResolution } from './types';

export interface AddProductScanInput {
  resolution: Extract<ScanResolution, { kind: 'catalog_match' | 'missing' }>;
  autoGenerateSku: boolean;
}

export interface AddProductScanPatch {
  /** The barcode to populate in the form. */
  barcode: string;
  /** Filled only when the offline catalog returns a match. */
  productName?: string;
  /** Filled only when the offline catalog returns a match. */
  category?: string;
  /** Filled only when the offline catalog returns a match. */
  retailUnitName?: string;
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
 * when a catalog_match or missing ScanResolution is resolved.
 */
export function applyBarcodeToAddProductForm(
  input: AddProductScanInput,
): AddProductScanPatch {
  const { resolution, autoGenerateSku } = input;

  if (resolution.kind === 'catalog_match') {
    const { catalogProduct } = resolution;
    const patch: AddProductScanPatch = {
      barcode: catalogProduct.barcode,
      productName: catalogProduct.name,
      retailUnitName: catalogProduct.unit,
      closeModal: true,
    };

    if (catalogProduct.category !== null && catalogProduct.category !== undefined) {
      patch.category = catalogProduct.category;
    }

    if (autoGenerateSku) {
      patch.setAutoGenerateSku = true;
    }

    return patch;
  }

  // resolution.kind === 'missing'
  return {
    barcode: resolution.barcode,
    toast: {
      variant: 'warning',
      message:
        'Barcode scanned. Product details not in catalog; please type details manually.',
    },
    closeModal: true,
  };
}