// Pure-TS parity tests for the POS barcode-scan handler.
//
// Mirrors the live `useAddSalesForm.handleScannedBarcode` flow:
//  1. Format-validate via `validateBarcode`.
//  2. Throttle: same barcode within throttleMs → drop (duplicate).
//  3. Lookup the product by `barcode` column first, then `sku` fallback.
//  4. If `barcode`-column hit → return kind: 'add' source: 'barcode'.
//  5. If `sku`-column hit (legacy row) → return kind: 'add' source: 'sku'.
//  6. If miss → return kind: 'missing' so the hook surfaces the
//     "Add as new product" CTA.
//  7. If format invalid → return kind: 'invalid' so the hook toasts.
//
// The throttle is per-barcode, not global: scanning Coke then Sprite
// within 0.3s should register both. Only repeated scans of the same
// barcode within the window are dropped.

import { describe, expect, test } from '@jest/globals';
import {
  DEFAULT_POS_SCAN_THROTTLE_MS,
  applyBarcodeToPosCart,
} from '../../lib/barcodes/applyToPosCart';
import type { Product } from '../../types/products.types';

const products: Product[] = [
  {
    id: 1,
    sku: '4800016551829',
    barcode: '4800016551829', // modern row — barcode column populated
    name: 'Coke Original Can 330ml',
    price: 1500,
    cost_price: undefined,
    quantity: 10,
    category: 'Beverages',
    retail_unit_name: 'Can',
    wholesale_unit_name: 'Case',
    wholesale_price: 16500,
    wholesale_cost_price: 15000,
    conversion_factor: 12,
    wholesale_barcode: '8888000011112',
    created_at: '2026-06-30 00:00:00',
    updated_at: '2026-06-30 00:00:00',
  },
  {
    id: 2,
    sku: '4800249011013',
    barcode: '4800249011013',
    name: 'Rebisco Skyflakes Crackers Original 25g',
    price: 800,
    cost_price: undefined,
    quantity: 5,
    category: 'Snacks',
    created_at: '2026-06-30 00:00:00',
    updated_at: '2026-06-30 00:00:00',
  },
  {
    // Legacy row where barcode IS NULL — the SKU doubles as the printed id.
    // In backward-compat flow, a real-world scan can only produce digit-only
    // strings, so the legacy SKU that resolves via fallback is also digits.
    id: 3,
    sku: '4800016551828',
    barcode: null,
    name: 'Coke 1.5L Bottle',
    price: 2500,
    cost_price: undefined,
    quantity: 7,
    category: 'Beverages',
    created_at: '2026-06-30 00:00:00',
    updated_at: '2026-06-30 00:00:00',
  },
];

describe('applyBarcodeToPosCart', () => {
  test('default throttle is 1500ms', () => {
    expect(DEFAULT_POS_SCAN_THROTTLE_MS).toBe(1500);
  });

  test('first scan of a barcode-column match → kind: add, source: barcode', () => {
    const result = applyBarcodeToPosCart({
      barcode: '4800016551829',
      products,
      lastScan: null,
      now: 1_000_000,
    });

    expect(result.kind).toBe('add');
    if (result.kind === 'add') {
      expect(result.product.id).toBe(1);
      expect(result.source).toBe('barcode');
      expect(result.lastScan).toEqual({
        barcode: '4800016551829',
        at: 1_000_000,
      });
    }
  });

  test('legacy SKU-as-barcode row → kind: add, source: sku', () => {
    const result = applyBarcodeToPosCart({
      barcode: '4800016551828',
      products,
      lastScan: null,
      now: 1_000_000,
    });

    expect(result.kind).toBe('add');
    if (result.kind === 'add') {
      expect(result.product.id).toBe(3);
      expect(result.source).toBe('sku');
    }
  });

  test('matches wholesale_barcode and returns source: wholesale_barcode and matchedUnit: wholesale', () => {
    const res = applyBarcodeToPosCart({
      barcode: '8888000011112',
      products,
      lastScan: null,
      now: 1000,
    });

    expect(res).toEqual({
      kind: 'add',
      product: products[0],
      source: 'wholesale_barcode',
      matchedUnit: 'wholesale',
      lastScan: { barcode: '8888000011112', at: 1000 },
    });
  });

  test('first scan of an unknown value → kind: missing', () => {
    const result = applyBarcodeToPosCart({
      barcode: '0000000000000',
      products,
      lastScan: null,
      now: 1_000_000,
    });

    expect(result.kind).toBe('missing');
    if (result.kind === 'missing') {
      expect(result.barcode).toBe('0000000000000');
      expect(result.lastScan.at).toBe(1_000_000);
    }
  });

  test('invalid format → kind: invalid before throttle', () => {
    const result = applyBarcodeToPosCart({
      barcode: 'abc123',
      products,
      lastScan: null,
      now: 1_000_000,
    });

    expect(result.kind).toBe('invalid');
    if (result.kind === 'invalid') {
      expect(result.reason).toBe('format');
    }
  });

  test('empty input → kind: invalid reason: empty', () => {
    const result = applyBarcodeToPosCart({
      barcode: '',
      products,
      lastScan: null,
      now: 1_000_000,
    });

    expect(result.kind).toBe('invalid');
    if (result.kind === 'invalid') {
      expect(result.reason).toBe('empty');
    }
  });

  test('same barcode within throttle window → kind: duplicate (dropped)', () => {
    const result = applyBarcodeToPosCart({
      barcode: '4800016551829',
      products,
      lastScan: { barcode: '4800016551829', at: 1_000_000 },
      now: 1_001_000, // 1 second later — inside 1500ms window
    });

    expect(result.kind).toBe('duplicate');
  });

  test('same barcode exactly at throttle edge → kind: add (boundary, strict <)', () => {
    // Implementation uses `now - lastScan.at < throttleMs`. At exactly
    // the throttle window the comparison is false, so the scan is
    // accepted. The next test confirms "inside the window" is rejected.
    const result = applyBarcodeToPosCart({
      barcode: '4800016551829',
      products,
      lastScan: { barcode: '4800016551829', at: 1_000_000 },
      now: 1_001_500, // exactly 1500ms after last scan
    });

    expect(result.kind).toBe('add');
  });

  test('same barcode 1ms before throttle edge → kind: duplicate', () => {
    const result = applyBarcodeToPosCart({
      barcode: '4800016551829',
      products,
      lastScan: { barcode: '4800016551829', at: 1_000_000 },
      now: 1_001_499, // 1499ms — inside the 1500ms window
    });

    expect(result.kind).toBe('duplicate');
  });

  test('same barcode well past throttle window → kind: add (accepted)', () => {
    const result = applyBarcodeToPosCart({
      barcode: '4800016551829',
      products,
      lastScan: { barcode: '4800016551829', at: 1_000_000 },
      now: 1_002_000, // 2000ms — comfortably outside
    });

    expect(result.kind).toBe('add');
  });

  test('different barcode in quick succession → both accepted (per-barcode throttle)', () => {
    const first = applyBarcodeToPosCart({
      barcode: '4800016551829', // Coke
      products,
      lastScan: null,
      now: 1_000_000,
    });
    expect(first.kind).toBe('add');

    const second = applyBarcodeToPosCart({
      barcode: '4800249011013', // Skyflakes, 200ms later
      products,
      lastScan:
        first.kind === 'add' || first.kind === 'missing'
          ? first.lastScan
          : null,
      now: 1_000_200,
    });
    expect(second.kind).toBe('add');
    if (second.kind === 'add') {
      expect(second.product.sku).toBe('4800249011013');
    }
  });

  test('custom throttleMs overrides the default', () => {
    // 100ms throttle: two scans 50ms apart should still be duplicates.
    const first = applyBarcodeToPosCart({
      barcode: '4800016551829',
      products,
      lastScan: null,
      now: 1_000_000,
      throttleMs: 100,
    });
    expect(first.kind).toBe('add');

    const second = applyBarcodeToPosCart({
      barcode: '4800016551829',
      products,
      lastScan:
        first.kind === 'add' || first.kind === 'missing'
          ? first.lastScan
          : null,
      now: 1_000_050,
      throttleMs: 100,
    });
    expect(second.kind).toBe('duplicate');
  });
});
