export type Pesos = number & { readonly __brand: 'Pesos' };

export function parsePesosInput(input: string): Pesos {
  if (typeof input !== 'string') {
    throw new Error('Invalid peso amount');
  }
  const cleaned = input.replace(/[^\d.-]/g, '');
  if (
    cleaned === '' ||
    cleaned === '-' ||
    cleaned === '.' ||
    cleaned === '-.'
  ) {
    throw new Error('Invalid peso amount');
  }
  const n = parseFloat(cleaned);
  if (!Number.isFinite(n)) throw new Error('Invalid peso amount');
  if (n < 0) throw new Error('Amount cannot be negative');
  return (Math.round(n * 100) / 100) as Pesos;
}

export function tryParsePesosInput(input: string): Pesos {
  try {
    return parsePesosInput(input);
  } catch {
    return 0 as Pesos;
  }
}

export function formatPesos(value: number | Pesos): string {
  return `₱${(value as number).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPesosCompact(value: number | Pesos): string {
  const v = value as number;
  if (Math.abs(v) >= 1_000_000) return `₱${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `₱${(v / 1_000).toFixed(1)}k`;
  return `₱${v.toFixed(0)}`;
}

export const MONEY_UNIT_DOC = 'integer pesos';

export interface BulkSavingsResult {
  retailEquivalent: number;
  wholesalePrice: number;
  savings: number;
  hasWholesale: boolean;
}

export function calculateBulkSavings(product: {
  price: number;
  wholesale_price?: number | null;
  conversion_factor?: number | null;
}): BulkSavingsResult {
  const hasWholesale =
    product.wholesale_price != null &&
    product.wholesale_price > 0 &&
    product.conversion_factor != null &&
    product.conversion_factor >= 2;

  if (!hasWholesale) {
    return {
      retailEquivalent: 0,
      wholesalePrice: 0,
      savings: 0,
      hasWholesale: false,
    };
  }

  const wholesalePrice = product.wholesale_price!;
  const conversionFactor = product.conversion_factor!;
  const retailEquivalent = product.price * conversionFactor;
  const savings = Math.max(0, retailEquivalent - wholesalePrice);

  return {
    retailEquivalent,
    wholesalePrice,
    savings,
    hasWholesale: true,
  };
}

