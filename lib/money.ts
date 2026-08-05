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
