import {
  computeDigitalEffect,
  suggestServiceFee,
  walletWouldGoNegative,
} from '@/lib/digitalServices';
import type { Pesos } from '@/lib/money';

const p = (n: number) => n as Pesos;

describe('computeDigitalEffect', () => {
  it('cash-in: wallet down, drawer up by principal plus fee', () => {
    expect(
      computeDigitalEffect({
        walletId: 1,
        transactionType: 'cash_in',
        principalAmount: p(500),
        serviceFee: p(10),
      }),
    ).toEqual({
      walletDelta: -500,
      cashDrawerDelta: 510,
      serviceFee: 10,
      principalAmount: 500,
    });
  });

  it('cash-out: wallet up, drawer down by principal minus fee', () => {
    const effect = computeDigitalEffect({
      walletId: 1,
      transactionType: 'cash_out',
      principalAmount: p(1000),
      serviceFee: p(20),
    });
    expect(effect.walletDelta).toBe(1000);
    expect(effect.cashDrawerDelta).toBe(-980);
    expect(effect.serviceFee).toBe(20);
  });

  it('e-load: load float down, drawer up by load plus patong', () => {
    const effect = computeDigitalEffect({
      walletId: 2,
      transactionType: 'eload',
      principalAmount: p(100),
      serviceFee: p(3),
    });
    expect(effect.walletDelta).toBe(-100);
    expect(effect.cashDrawerDelta).toBe(103);
  });

  it('replenish touches the drawer only when funded from it', () => {
    const base = {
      walletId: 1,
      transactionType: 'replenish' as const,
      principalAmount: p(2000),
    };
    expect(computeDigitalEffect({ ...base, fundedFromDrawer: true })).toMatchObject({
      walletDelta: 2000,
      cashDrawerDelta: -2000,
      serviceFee: 0,
    });
    expect(computeDigitalEffect({ ...base, fundedFromDrawer: false })).toMatchObject({
      walletDelta: 2000,
      cashDrawerDelta: 0,
    });
  });

  it('adjustment changes the wallet only and keeps its sign', () => {
    const effect = computeDigitalEffect({
      walletId: 1,
      transactionType: 'adjustment',
      principalAmount: p(50),
      adjustmentDelta: -50,
    });
    expect(effect).toEqual({
      walletDelta: -50,
      cashDrawerDelta: 0,
      serviceFee: 0,
      principalAmount: 50,
    });
  });

  it('rejects zero amounts, negative fees and zero adjustments', () => {
    expect(() =>
      computeDigitalEffect({
        walletId: 1,
        transactionType: 'cash_in',
        principalAmount: p(0),
      }),
    ).toThrow('Amount must be greater than zero');
    expect(() =>
      computeDigitalEffect({
        walletId: 1,
        transactionType: 'cash_in',
        principalAmount: p(100),
        serviceFee: p(-1),
      }),
    ).toThrow('Service fee cannot be negative');
    expect(() =>
      computeDigitalEffect({
        walletId: 1,
        transactionType: 'adjustment',
        principalAmount: p(0),
        adjustmentDelta: 0,
      }),
    ).toThrow('Adjustment cannot be zero');
  });

  it('rounds fractional pesos to whole pesos', () => {
    const effect = computeDigitalEffect({
      walletId: 1,
      transactionType: 'cash_in',
      principalAmount: p(99.6),
      serviceFee: p(9.4),
    });
    expect(effect.principalAmount).toBe(100);
    expect(effect.serviceFee).toBe(9);
  });
});

describe('suggestServiceFee', () => {
  it('charges 10 per 500 or part of it for cash-in and cash-out', () => {
    expect(suggestServiceFee('cash_in', 500)).toBe(10);
    expect(suggestServiceFee('cash_out', 501)).toBe(20);
    expect(suggestServiceFee('cash_in', 1)).toBe(10);
  });

  it('suggests nothing for other types or invalid amounts', () => {
    expect(suggestServiceFee('eload', 100)).toBe(0);
    expect(suggestServiceFee('cash_in', 0)).toBe(0);
    expect(suggestServiceFee('cash_in', Number.NaN)).toBe(0);
  });
});

describe('walletWouldGoNegative', () => {
  it('flags a debit larger than the balance', () => {
    expect(walletWouldGoNegative(100, -101)).toBe(true);
    expect(walletWouldGoNegative(100, -100)).toBe(false);
    expect(walletWouldGoNegative(0, 500)).toBe(false);
  });
});
