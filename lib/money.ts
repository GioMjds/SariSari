/**
 * Money layer — the single source of truth for peso arithmetic.
 *
 * Convention (AGENTS.md §1):
 *   • All money in DB columns: integer pesos (`INTEGER`).
 *   • All money in app state and props: integer pesos.
 *   • User input is parsed with `parsePesosInput` (rounded to 2 decimals).
 *   • User output is formatted with `formatPesos`.
 *
 * Never call `parseFloat` on a money field. Never divide or multiply
 * a money value by 100 outside this module.
 */

export type Pesos = number & { readonly __brand: 'Pesos' };

/**
 * Parse a user-typed peso string into a Pesos value.
 *
 * Accepts:
 *   "12.50"    → 12.5
 *   "1,234"    → 1234
 *   "1,234.56" → 1234.56
 *   "0"        → 0
 *
 * Rejects: empty, "-", ".", non-numeric, negative.
 *
 * The result is rounded to 2 decimal places so user input cannot
 * smuggle floating-point noise into storage.
 */
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
  return Math.round(n * 100) / 100 as Pesos;
}

/**
 * Like `parsePesosInput` but returns 0 on invalid/empty input instead
 * of throwing. Use for *display* math (margin %, profit preview)
 * where an empty form field should render as "—" rather than an
 * error. Never use this for storage — for that, `parsePesosInput`.
 */
export function tryParsePesosInput(input: string): Pesos {
  try {
    return parsePesosInput(input);
  } catch {
    return 0 as Pesos;
  }
}

/**
 * Format an integer-peso value as a Philippine-peso display string.
 *
 * Example: 12.5   → "₱12.50"
 * Example: 1234   → "₱1,234.00"
 * Example: 0      → "₱0.00"
 */
export function formatPesos(value: number | Pesos): string {
  return `₱${(value as number).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Compact peso formatter for charts and headlines.
 * Accepts an integer-peso value and returns "₱1.2k" / "₱3.4M" etc.
 */
export function formatPesosCompact(value: number | Pesos): string {
  const v = value as number;
  if (Math.abs(v) >= 1_000_000) return `₱${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `₱${(v / 1_000).toFixed(1)}k`;
  return `₱${v.toFixed(0)}`;
}

export const MONEY_UNIT_DOC = 'integer pesos — see AGENTS.md §1';
