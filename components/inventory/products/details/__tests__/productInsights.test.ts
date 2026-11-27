import { computeProductInsights, marginPercent } from '../productInsights';
import { InventoryTransaction } from '@/types/inventory.types';

const tx = (
  type: InventoryTransaction['type'],
  quantity: number,
  timestamp: string,
  extra: Partial<InventoryTransaction> = {},
): InventoryTransaction => ({ product_id: 1, type, quantity, timestamp, ...extra });

const NOW = new Date('2026-11-27T12:00:00Z').getTime();

describe('computeProductInsights', () => {
  it('counts only sales inside the 28-day window and projects days left', () => {
    const result = computeProductInsights(
      [
        tx('sale', 14, '2026-11-20T08:00:00Z'),
        tx('sale', 14, '2026-11-10T08:00:00Z'),
        tx('sale', 99, '2026-09-01T08:00:00Z'),
      ],
      10,
      NOW,
    );
    expect(result.sold28).toBe(28);
    expect(result.daysLeft).toBe(10);
  });

  it('returns null days left without sales and zero when out of stock', () => {
    expect(computeProductInsights([], 5, NOW).daysLeft).toBeNull();
    expect(computeProductInsights([], 0, NOW).daysLeft).toBe(0);
    expect(
      computeProductInsights([tx('sale', 280, '2026-11-26T08:00:00Z')], 2, NOW).daysLeft,
    ).toBe(1);
  });

  it('picks the latest restock and latest recorded unit cost separately', () => {
    const result = computeProductInsights(
      [
        tx('restock', 12, '2026-11-01T08:00:00Z', { unit_cost: 9 }),
        tx('restock', 24, '2026-11-15T08:00:00Z'),
        tx('restock', 6, '2026-10-01T08:00:00Z', { unit_cost: 8 }),
      ],
      30,
      NOW,
    );
    expect(result.lastRestockQty).toBe(24);
    expect(result.lastRestockAt).toBe(new Date('2026-11-15T08:00:00Z').getTime());
    expect(result.lastUnitCost).toBe(9);
  });
});

describe('marginPercent', () => {
  it('uses the selling price as the base', () => {
    expect(marginPercent(20, 15)).toBe(25);
    expect(marginPercent(0, 5)).toBeNull();
  });
});
