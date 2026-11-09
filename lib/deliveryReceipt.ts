import type { EnteredUnit } from '@/types/deliveries.types';

export class InvalidDeliveryLineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidDeliveryLineError';
  }
}

export interface ConvertLineInput {
  enteredUnit: EnteredUnit;
  enteredExpectedQty: number;
  enteredReceivedQty: number;
  enteredUnitCost: number;
  conversionFactor: number | null;
}

export interface ConvertedLine {
  expectedQty: number;
  receivedQty: number;
  actualUnitCost: number;
  shortageQty: number;
  conversionFactorUsed: number;
}

const assertWhole = (label: string, value: number): void => {
  if (!Number.isInteger(value) || value < 0) {
    throw new InvalidDeliveryLineError(
      `${label} must be a whole number of 0 or more`,
    );
  }
};

/**
 * Converts what the owner typed (retail pieces or wholesale boxes) into
 * retail pieces and a per-piece cost in integer pesos. Per-piece cost is
 * rounded half up once per line. Shortage is never negative.
 */
export function convertDeliveryLine(input: ConvertLineInput): ConvertedLine {
  assertWhole('Expected quantity', input.enteredExpectedQty);
  assertWhole('Received quantity', input.enteredReceivedQty);
  assertWhole('Unit cost', input.enteredUnitCost);

  let factor = 1;
  if (input.enteredUnit === 'wholesale') {
    const f = input.conversionFactor;
    if (f == null || !Number.isInteger(f) || f < 2) {
      throw new InvalidDeliveryLineError(
        'This product has no wholesale unit to receive in',
      );
    }
    factor = f;
  }

  const expectedQty = input.enteredExpectedQty * factor;
  const receivedQty = input.enteredReceivedQty * factor;
  return {
    expectedQty,
    receivedQty,
    actualUnitCost: Math.round(input.enteredUnitCost / factor),
    shortageQty: Math.max(0, expectedQty - receivedQty),
    conversionFactorUsed: factor,
  };
}

/** Signed per-piece cost difference versus the last known cost, or null. */
export function costChange(actual: number, last: number | null): number | null {
  if (last == null) return null;
  return actual - last;
}
