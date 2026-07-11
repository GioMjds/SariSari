import { formatPesos } from './money';

/**
 * Helper to pluralize a unit name nicely for UI strings.
 */
function pluralizeUnit(qty: number, unitName: string): string {
  const trimmed = (unitName || 'Pc').trim();
  if (qty === 1) return trimmed;
  if (trimmed.toLowerCase() === 'pc') return 'Pcs';
  if (trimmed.toLowerCase() === 'box') return 'Boxes';
  if (trimmed.endsWith('s')) return trimmed;
  return `${trimmed}s`;
}

/**
 * Format stock quantity as dual units (e.g. "2 Cases, 5 Bottles") or single retail unit.
 */
export function formatDualStock(
  quantity: number,
  retailUnitName: string = 'Pc',
  wholesaleUnitName?: string | null,
  conversionFactor?: number | null,
): string {
  const qty = Math.max(0, Math.floor(quantity));
  const retail = retailUnitName.trim() || 'Pc';

  if (
    conversionFactor != null &&
    conversionFactor >= 2 &&
    wholesaleUnitName != null &&
    wholesaleUnitName.trim() !== ''
  ) {
    const cases = Math.floor(qty / conversionFactor);
    const pieces = qty % conversionFactor;
    const wholesale = wholesaleUnitName.trim();

    if (cases > 0 && pieces > 0) {
      return `${cases} ${pluralizeUnit(cases, wholesale)}, ${pieces} ${pluralizeUnit(pieces, retail)}`;
    }
    if (cases > 0 && pieces === 0) {
      return `${cases} ${pluralizeUnit(cases, wholesale)}`;
    }
  }

  return `${qty} ${pluralizeUnit(qty, retail)}`;
}

/**
 * Format subtitle showing retail and optional wholesale price.
 */
export function formatDualPrice(
  price: number,
  wholesalePrice?: number | null,
  retailUnitName: string = 'Pc',
  wholesaleUnitName?: string | null,
): string {
  const retailStr = wholesalePrice != null ? `${formatPesos(price)}/${retailUnitName}` : formatPesos(price);
  if (
    wholesalePrice != null &&
    wholesalePrice > 0 &&
    wholesaleUnitName != null &&
    wholesaleUnitName.trim() !== ''
  ) {
    return `${retailStr} • ${formatPesos(wholesalePrice)}/${wholesaleUnitName.trim()}`;
  }
  return retailStr;
}

/**
 * Calculate base pieces required from unit quantity and unit selection.
 */
export function calculateTotalPieces(
  unitQty: number,
  selectedUnit: 'retail' | 'wholesale',
  conversionFactor?: number | null,
): number {
  const qty = Math.max(0, Math.floor(unitQty));
  if (selectedUnit === 'wholesale' && conversionFactor != null && conversionFactor >= 2) {
    return qty * conversionFactor;
  }
  return qty;
}

/**
 * Calculate per-piece savings and percentage when buying wholesale.
 */
export function calculateWholesaleSavings(
  retailPrice: number,
  wholesalePrice: number,
  conversionFactor: number,
): { savingsPerPiece: number; savingsPercent: number; equivalentRetailPrice: number } | null {
  if (conversionFactor < 2 || wholesalePrice <= 0 || retailPrice <= 0) {
    return null;
  }
  const equivalentRetailPrice = Math.round(wholesalePrice / conversionFactor);
  const savingsPerPiece = retailPrice - equivalentRetailPrice;
  const savingsPercent = Math.round((savingsPerPiece / retailPrice) * 100);

  return {
    equivalentRetailPrice,
    savingsPerPiece,
    savingsPercent,
  };
}
