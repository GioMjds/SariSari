import type { Product } from '@/types/products.types';

/** Field shape shared by the Add and Edit product screens. */
export interface ProductFormData {
  productName: string;
  sku: string;
  barcode: string;
  category: string;
  supplierId: string;
  imageUri: string;
  bundleCost: string;
  piecesPerBundle: string;
  costPerPiece: string;
  price: string;
  initialStock: string;
  enableWholesale: boolean;
  retailUnitName: string;
  wholesaleUnitName: string;
  conversionFactor: string;
  wholesalePrice: string;
  wholesaleCostPrice: string;
  wholesaleBarcode: string;
}

export const PRODUCT_FORM_DEFAULTS: ProductFormData = {
  productName: '',
  sku: '',
  barcode: '',
  category: '',
  supplierId: '',
  imageUri: '',
  bundleCost: '',
  piecesPerBundle: '',
  costPerPiece: '',
  price: '',
  initialStock: '',
  enableWholesale: false,
  retailUnitName: 'Pc',
  wholesaleUnitName: 'Case',
  conversionFactor: '12',
  wholesalePrice: '',
  wholesaleCostPrice: '',
  wholesaleBarcode: '',
};

export const MARKUP_PRESETS = [0.1, 0.2, 0.3, 0.5] as const;
export type MarkupPreset = (typeof MARKUP_PRESETS)[number];

export const STOCK_PRESETS = [5, 10, 20] as const;

export const safeTrim = (s?: string | null) => (s ?? '').trim();

/** Finds another product already owning this code, including legacy rows where SKU doubled as barcode. */
export function findBarcodeConflict(
  products: Product[],
  barcode: string,
  excludeId?: number,
): Product | null {
  const code = safeTrim(barcode);
  if (!code) return null;
  return (
    products.find(
      (p) =>
        p.id !== excludeId &&
        (p.barcode === code || p.wholesale_barcode === code || p.sku === code),
    ) ?? null
  );
}

/** Builds a short SKU from the first two words of a name, e.g. "Lucky Me" -> "LM-4821". */
export function generateSku(name: string, currentSku = ''): string {
  const prefix = safeTrim(name)
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');
  if (!prefix) return '';
  // Keep the existing suffix while the prefix still matches so the SKU does not churn per keystroke.
  const match = /^(.*)-(\d{4})$/.exec(currentSku);
  if (match && match[1] === prefix) return currentSku;
  return `${prefix}-${Date.now().toString().slice(-4)}`;
}
