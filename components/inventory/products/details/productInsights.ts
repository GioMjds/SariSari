import { parseLedgerDate } from '@/components/inventory/ledger/ledgerMath';
import type { InventoryTransaction } from '@/types/inventory.types';

export const SALES_WINDOW_DAYS = 28;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface ProductInsights {
  sold28: number;
  // Null when there were no sales in the window, so no rate can be estimated.
  daysLeft: number | null;
  lastRestockAt: number | null;
  lastRestockQty: number | null;
  lastUnitCost: number | null;
  lastUnitCostAt: number | null;
}

export function computeProductInsights(
  transactions: InventoryTransaction[],
  quantity: number,
  now: number = Date.now(),
): ProductInsights {
  const since = now - SALES_WINDOW_DAYS * DAY_MS;
  let sold28 = 0;
  let lastRestockAt: number | null = null;
  let lastRestockQty: number | null = null;
  let lastUnitCost: number | null = null;
  let lastUnitCostAt: number | null = null;

  for (const tx of transactions) {
    const time = parseLedgerDate(tx.timestamp)?.getTime();
    if (time === undefined) continue;
    if (tx.type === 'sale' && time >= since && time <= now) sold28 += tx.quantity;
    if (tx.type !== 'restock') continue;
    if (lastRestockAt === null || time > lastRestockAt) {
      lastRestockAt = time;
      lastRestockQty = tx.quantity;
    }
    if (tx.unit_cost != null && (lastUnitCostAt === null || time > lastUnitCostAt)) {
      lastUnitCost = tx.unit_cost;
      lastUnitCostAt = time;
    }
  }

  const daysLeft =
    quantity <= 0
      ? 0
      : sold28 > 0
        ? // Stock on the shelf always counts as at least one day left.
          Math.max(1, Math.floor(quantity / (sold28 / SALES_WINDOW_DAYS)))
        : null;

  return { sold28, daysLeft, lastRestockAt, lastRestockQty, lastUnitCost, lastUnitCostAt };
}

// Margin is profit as a share of the selling price; null when price is zero.
export function marginPercent(price: number, cost: number): number | null {
  return price > 0 ? ((price - cost) / price) * 100 : null;
}
