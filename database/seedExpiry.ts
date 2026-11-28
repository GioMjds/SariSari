import { db } from '../configs/sqlite';
import { addDaysIso } from '@/lib/dueDates';
import { insertProduct } from './products';

interface ExpirySample {
  name: string;
  sku: string;
  price: number;
  cost: number;
  qty: number;
  daysFromToday: number | null;
  warnDays?: number;
}

// Covers every state: expired, today, inside window, override, far, no date, and zero stock.
const SAMPLES: ExpirySample[] = [
  { name: 'Sardines Tomato 155g', sku: 'EXP-001', price: 25, cost: 20, qty: 6, daysFromToday: -3 },
  { name: 'Fresh Milk 1L', sku: 'EXP-002', price: 95, cost: 80, qty: 4, daysFromToday: 0 },
  { name: 'Instant Noodles Beef', sku: 'EXP-003', price: 15, cost: 12, qty: 12, daysFromToday: 3 },
  { name: 'Cola 1.5L', sku: 'EXP-004', price: 70, cost: 58, qty: 8, daysFromToday: 10 },
  { name: 'Yogurt Drink 4-pack', sku: 'EXP-005', price: 60, cost: 48, qty: 5, daysFromToday: 30, warnDays: 45 },
  { name: 'Corned Beef 150g', sku: 'EXP-006', price: 45, cost: 38, qty: 20, daysFromToday: 120 },
  { name: 'Rice 1kg (no date)', sku: 'EXP-007', price: 55, cost: 48, qty: 30, daysFromToday: null },
  { name: 'Pandesal Pack (sold out)', sku: 'EXP-008', price: 35, cost: 28, qty: 0, daysFromToday: -1 },
];

/**
 * Dev only: inserts sample products with relative expiry dates so the near-expiry
 * list can be tried without typing data. Safe to run repeatedly; skips existing SKUs.
 */
export const seedExpirySamples = async (): Promise<void> => {
  for (const s of SAMPLES) {
    const exists = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM products WHERE sku = ?',
      [s.sku],
    );
    if (exists) continue;
    await insertProduct(
      s.name,
      s.sku,
      s.price,
      s.qty,
      s.cost,
      undefined,
      undefined,
      undefined,
      undefined,
      'Pc',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      s.daysFromToday === null ? null : addDaysIso(s.daysFromToday),
      s.warnDays ?? null,
    );
  }
  console.log('Expiry sample products ready.');
};
