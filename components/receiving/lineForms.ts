import { newLineKey, type DraftLineForm } from '@/lib/deliveryForm';
import type {
  DeliveryReceiptLine,
  EnteredUnit,
  QuickAddProductInput,
} from '@/types/deliveries.types';
import type { Product } from '@/types/products.types';

// Matches the products.retail_unit_name column default.
const DEFAULT_RETAIL_UNIT = 'Pc';

const hasWholesaleUnit = (p: Product): boolean =>
  !!p.wholesale_unit_name && (p.conversion_factor ?? 0) >= 2;

/**
 * A blank line for a catalog product. Defaults to the wholesale unit when the
 * product has one. The cost is prefilled from the matching unit's last cost;
 * a wholesale line with no wholesale cost stays blank rather than guessing.
 */
export function lineFormFromProduct(
  p: Product,
  preferredUnit?: EnteredUnit,
): DraftLineForm {
  const enteredUnit: EnteredUnit =
    hasWholesaleUnit(p) && preferredUnit !== 'retail' ? 'wholesale' : 'retail';
  const cost =
    enteredUnit === 'wholesale' ? p.wholesale_cost_price : p.cost_price;
  return {
    key: newLineKey(),
    productId: p.id,
    productName: p.name,
    newProduct: null,
    enteredUnit,
    retailUnitName: p.retail_unit_name || DEFAULT_RETAIL_UNIT,
    wholesaleUnitName: p.wholesale_unit_name ?? null,
    conversionFactor: p.conversion_factor ?? null,
    lastCostPrice: p.cost_price ?? null,
    expectedQty: '',
    receivedQty: '',
    unitCost: cost != null ? String(cost) : '',
  };
}

/** A quick-add line. New products are always received in retail pieces. */
export function lineFormFromQuickAdd(p: QuickAddProductInput): DraftLineForm {
  return {
    key: newLineKey(),
    productId: null,
    productName: p.name,
    newProduct: p,
    enteredUnit: 'retail',
    retailUnitName: DEFAULT_RETAIL_UNIT,
    wholesaleUnitName: null,
    conversionFactor: null,
    lastCostPrice: null,
    expectedQty: '',
    receivedQty: '',
    unitCost: '',
  };
}

/** Rebuilds an editable line from a saved draft line plus its product row. */
export function lineFormFromReceiptLine(
  line: DeliveryReceiptLine,
  product: Product | null,
): DraftLineForm {
  return {
    key: newLineKey(),
    productId: line.productId,
    productName: line.productName,
    newProduct: line.newProduct,
    enteredUnit: line.enteredUnit,
    retailUnitName: product?.retail_unit_name || DEFAULT_RETAIL_UNIT,
    wholesaleUnitName: product?.wholesale_unit_name ?? null,
    conversionFactor: product?.conversion_factor ?? null,
    lastCostPrice: product?.cost_price ?? null,
    expectedQty: String(line.enteredExpectedQty),
    receivedQty: String(line.enteredReceivedQty),
    unitCost: String(line.enteredUnitCost),
  };
}

const isBlankLine = (f: DraftLineForm): boolean =>
  f.expectedQty.trim() === '' &&
  f.receivedQty.trim() === '' &&
  f.unitCost.trim() === '';

/**
 * Merges reorder-plan lines into the current lines. A blank line for a planned
 * product is replaced by the seeded line; a line the owner already typed into
 * is never overwritten; planned products not yet listed are appended.
 */
export function mergeSeededLines(
  current: DraftLineForm[],
  seeded: DraftLineForm[],
): DraftLineForm[] {
  const seededById = new Map<number, DraftLineForm>();
  for (const s of seeded) {
    if (s.productId !== null) seededById.set(s.productId, s);
  }
  const used = new Set<number>();
  // Only the first blank line per product takes the seed. Reusing the seed
  // for a second blank line would give two lines one key, so they would
  // edit and remove together and book the received qty twice.
  const replaced = new Set<number>();
  const merged = current.map((line) => {
    if (line.productId === null) return line;
    const seed = seededById.get(line.productId);
    if (!seed) return line;
    used.add(line.productId);
    if (replaced.has(line.productId) || !isBlankLine(line)) return line;
    replaced.add(line.productId);
    return seed;
  });
  for (const s of seeded) {
    if (s.productId === null || !used.has(s.productId)) merged.push(s);
  }
  return merged;
}
