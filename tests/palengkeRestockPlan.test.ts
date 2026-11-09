jest.mock('expo-print', () => ({}));
jest.mock('expo-sharing', () => ({}));
jest.mock('expo-file-system', () => ({ File: class {}, Paths: {} }));

import { buildPalengkeRestockPlan } from '@/lib/palengkePlan';
import {
  buildPalengkeSheetText,
} from '@/lib/pdfGenerator';
import type { ReorderRecommendation } from '@/types/stock-intelligence.types';

const NOW = new Date('2026-11-09T00:00:00Z').getTime();

function rec(
  overrides: Partial<ReorderRecommendation>,
): ReorderRecommendation {
  return {
    productId: 1,
    productName: 'Coke',
    sku: 'COKE',
    barcode: null,
    currentStock: 0,
    sales28Days: 10,
    suggestedQuantity: 5,
    defaultSuggestedQuantity: 5,
    estimatedSpend: 50,
    preferredSupplierId: null,
    preferredSupplierName: null,
    category: null,
    retailUnitName: 'Pc',
    costPrice: 10,
    isOutOfStock: true,
    isLowStock: false,
    isSlowMover: false,
    isWatchItem: false,
    savedPlan: null,
    ...overrides,
  };
}

describe('buildPalengkeRestockPlan', () => {
  it('splits capital between out-of-stock and low-stock items', () => {
    const plan = buildPalengkeRestockPlan(
      [
        rec({ productId: 1, estimatedSpend: 50 }),
        rec({
          productId: 2,
          isOutOfStock: false,
          isLowStock: true,
          currentStock: 2,
          estimatedSpend: 30,
        }),
      ],
      {},
      NOW,
    );
    expect(plan.totalEstimatedCapital).toBe(80);
    expect(plan.outOfStockCapital).toBe(50);
    expect(plan.lowStockCapital).toBe(30);
    expect(plan.outOfStockCount).toBe(1);
    expect(plan.totalItemsCount).toBe(2);
  });

  it('skips dismissed, active-deferred, zero-qty and non-restock items', () => {
    const plan = buildPalengkeRestockPlan(
      [
        rec({
          productId: 1,
          savedPlan: {
            status: 'dismissed',
            adjustedQuantity: null,
            deferredUntil: null,
          },
        }),
        rec({
          productId: 2,
          savedPlan: {
            status: 'deferred',
            adjustedQuantity: null,
            deferredUntil: '2026-12-01T00:00:00Z',
          },
        }),
        rec({ productId: 3, suggestedQuantity: 0 }),
        rec({ productId: 4, isOutOfStock: false, isSlowMover: true }),
        rec({
          productId: 5,
          savedPlan: {
            status: 'deferred',
            adjustedQuantity: null,
            deferredUntil: '2026-01-01T00:00:00Z',
          },
        }),
      ],
      {},
      NOW,
    );
    expect(plan.items.map((i) => i.productId)).toEqual([5]);
  });

  it('groups by supplier, then category, then unassigned last', () => {
    const plan = buildPalengkeRestockPlan(
      [
        rec({ productId: 1 }),
        rec({
          productId: 2,
          preferredSupplierId: 's1',
          preferredSupplierName: 'Puregold',
        }),
        rec({ productId: 3, category: 'Drinks' }),
      ],
      {},
      NOW,
    );
    expect(plan.groups.map((g) => g.label)).toEqual([
      'Drinks',
      'Puregold',
      'Walang supplier / kategorya',
    ]);
  });

  it('counts items without cost price and filters by supplier', () => {
    const plan = buildPalengkeRestockPlan(
      [
        rec({
          productId: 1,
          preferredSupplierId: 's1',
          costPrice: null,
          estimatedSpend: null,
        }),
        rec({ productId: 2, preferredSupplierId: 's2' }),
      ],
      { supplierId: 's1' },
      NOW,
    );
    expect(plan.items).toHaveLength(1);
    expect(plan.missingCostCount).toBe(1);
    expect(plan.totalEstimatedCapital).toBe(0);
  });

  it('renders a text checklist', () => {
    const plan = buildPalengkeRestockPlan([rec({})], {}, NOW);
    const text = buildPalengkeSheetText(plan, 'Tindahan', new Date(NOW));
    expect(text).toContain('PALENGKE SHEET - Tindahan');
    expect(text).toContain('[ ] Coke x5 Pc');
  });
});
