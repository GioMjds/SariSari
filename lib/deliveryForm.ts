import type {
  DeliveryLineInput,
  EnteredUnit,
  QuickAddProductInput,
} from '@/types/deliveries.types';
import type { PalengkeRestockItem } from '@/types/stock-intelligence.types';
import { InvalidDeliveryLineError } from '@/lib/deliveryReceipt';
import { parsePesosInput } from '@/lib/money';

export interface DraftLineForm {
  key: string;
  productId: number | null;
  productName: string;
  newProduct: QuickAddProductInput | null;
  enteredUnit: EnteredUnit;
  retailUnitName: string;
  wholesaleUnitName: string | null;
  conversionFactor: number | null;
  lastCostPrice: number | null;
  expectedQty: string;
  receivedQty: string;
  unitCost: string;
}

let keyCounter = 0;
export const newLineKey = (): string => `line-${Date.now()}-${keyCounter++}`;

/** A typed quantity as a whole number of 0 or more, or null if blank or invalid. */
export const parseQtyInput = (raw: string): number | null => {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const n = Number(trimmed);
  return Number.isSafeInteger(n) ? n : null;
};

/**
 * A typed unit cost parsed through parsePesosInput, or null if blank,
 * invalid, negative, or not whole pesos (receiving stores integer pesos).
 */
export const parseCostInput = (raw: string): number | null => {
  if (raw.trim() === '') return null;
  try {
    const n = Number(parsePesosInput(raw));
    return Number.isSafeInteger(n) ? n : null;
  } catch {
    return null;
  }
};

const parseWhole = (label: string, raw: string): number => {
  if (raw.trim() === '') {
    throw new InvalidDeliveryLineError(`${label} is required`);
  }
  const n = parseQtyInput(raw);
  if (n === null) {
    throw new InvalidDeliveryLineError(
      `${label} must be a whole number of 0 or more`,
    );
  }
  return n;
};

const parseCost = (label: string, raw: string): number => {
  if (raw.trim() === '') {
    throw new InvalidDeliveryLineError(`${label} is required`);
  }
  const n = parseCostInput(raw);
  if (n === null) {
    throw new InvalidDeliveryLineError(
      `${label} must be whole pesos of 0 or more`,
    );
  }
  return n;
};

/** Received and cost are filled, and every filled field parses. */
export const isLineComplete = (form: DraftLineForm): boolean =>
  parseQtyInput(form.receivedQty) !== null &&
  parseCostInput(form.unitCost) !== null &&
  (form.expectedQty.trim() === '' || parseQtyInput(form.expectedQty) !== null);

export function toLineInput(form: DraftLineForm): DeliveryLineInput {
  const expected =
    form.expectedQty.trim() === ''
      ? 0
      : parseWhole('Expected', form.expectedQty);
  return {
    productId: form.productId,
    newProduct: form.newProduct,
    enteredUnit: form.enteredUnit,
    enteredExpectedQty: expected,
    enteredReceivedQty: parseWhole('Received', form.receivedQty),
    enteredUnitCost: parseCost('Unit cost', form.unitCost),
  };
}

export function seedLinesFromPlan(
  items: PalengkeRestockItem[],
): DraftLineForm[] {
  return items.map((item) => ({
    key: newLineKey(),
    productId: item.productId,
    productName: item.productName,
    newProduct: null,
    enteredUnit: 'retail' as const,
    retailUnitName: item.retailUnitName,
    wholesaleUnitName: null,
    conversionFactor: null,
    lastCostPrice: item.costPrice,
    expectedQty: String(item.suggestedQuantity),
    receivedQty: '',
    unitCost: item.costPrice != null ? String(item.costPrice) : '',
  }));
}
