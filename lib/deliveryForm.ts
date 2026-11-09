import type {
  DeliveryLineInput,
  EnteredUnit,
  QuickAddProductInput,
} from '@/types/deliveries.types';
import type { PalengkeRestockItem } from '@/types/stock-intelligence.types';

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

const parseWhole = (label: string, raw: string): number => {
  const trimmed = raw.trim();
  if (trimmed === '') throw new Error(`${label} is required`);
  const n = Number(trimmed);
  if (!Number.isFinite(n)) throw new Error(`${label} is not a number`);
  return n;
};

export const isLineComplete = (form: DraftLineForm): boolean =>
  form.receivedQty.trim() !== '' && form.unitCost.trim() !== '';

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
    enteredUnitCost: parseWhole('Unit cost', form.unitCost),
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
