import type {
  DigitalTransactionType,
  NewDigitalTransaction,
} from '@/types/digitalServices.types';

export interface DigitalEffect {
  walletDelta: number;
  cashDrawerDelta: number;
  serviceFee: number;
  principalAmount: number;
}

const toWholePesos = (value: number | undefined): number =>
  Math.round(Number.isFinite(value) ? (value as number) : 0);

/**
 * Computes the wallet, drawer and income effect of one transaction.
 * Only the physical cash movement reaches the cash ledger (ADR-003).
 */
export function computeDigitalEffect(input: NewDigitalTransaction): DigitalEffect {
  const principal = toWholePesos(input.principalAmount);
  const fee = toWholePesos(input.serviceFee);

  if (input.transactionType === 'adjustment') {
    const delta = toWholePesos(input.adjustmentDelta);
    if (delta === 0) throw new Error('Adjustment cannot be zero');
    return {
      walletDelta: delta,
      cashDrawerDelta: 0,
      serviceFee: 0,
      principalAmount: Math.abs(delta),
    };
  }

  if (principal <= 0) throw new Error('Amount must be greater than zero');
  if (fee < 0) throw new Error('Service fee cannot be negative');

  switch (input.transactionType) {
    case 'cash_in':
      return {
        walletDelta: -principal,
        cashDrawerDelta: principal + fee,
        serviceFee: fee,
        principalAmount: principal,
      };
    case 'cash_out':
      return {
        walletDelta: principal,
        cashDrawerDelta: -principal + fee,
        serviceFee: fee,
        principalAmount: principal,
      };
    case 'eload':
      return {
        walletDelta: -principal,
        cashDrawerDelta: principal + fee,
        serviceFee: fee,
        principalAmount: principal,
      };
    case 'replenish':
      return {
        walletDelta: principal,
        cashDrawerDelta: input.fundedFromDrawer ? -principal : 0,
        serviceFee: 0,
        principalAmount: principal,
      };
  }
}

/** Common GCash-style tier: PHP 10 per PHP 500 (or part of it), minimum 10. */
export function suggestServiceFee(
  type: DigitalTransactionType,
  principal: number,
): number {
  if (type !== 'cash_in' && type !== 'cash_out') return 0;
  if (!Number.isFinite(principal) || principal <= 0) return 0;
  return Math.ceil(Math.round(principal) / 500) * 10;
}

export function walletWouldGoNegative(
  currentBalance: number,
  walletDelta: number,
): boolean {
  return currentBalance + walletDelta < 0;
}
