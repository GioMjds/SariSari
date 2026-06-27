// Pure-TS parity tests for the POS barcode-scan handler.
//
// Mirrors the live `useAddSalesForm.handleScannedBarcode` flow:
//  1. Throttle: same barcode within throttleMs → drop (duplicate).
//  2. Lookup the product by SKU in the loaded products list.
//  3. If hit → return kind: 'add' so the hook adds to the cart.
//  4. If miss → return kind: 'missing' so the hook toasts an error.
//
// The throttle is per-barcode, not global: scanning Coke then Sprite
// within 0.3s should register both. Only repeated scans of the same
// barcode within the window are dropped.

import { describe, expect, test } from '@jest/globals';
import {
  DEFAULT_POS_SCAN_THROTTLE_MS,
  applyBarcodeToPosCart,
} from '../../lib/barcodes/applyToPosCart';

const products = [
  {
    id: 1,
    sku: '4800016551829',
    name: 'Coke Original Can 330ml',
    price: 1500,
    quantity: 10,
  },
  {
    id: 2,
    sku: '4800249011013',
    name: 'Rebisco Skyflakes Crackers Original 25g',
    price: 800,
    quantity: 5,
  },
] as const;

describe('applyBarcodeToPosCart', () => {
  test('default throttle is 1500ms', () => {
    expect(DEFAULT_POS_SCAN_THROTTLE_MS).toBe(1500);
  });

  test('first scan of a known SKU → kind: add with the matched product', () => {
    const result = applyBarcodeToPosCart({
      barcode: '4800016551829',
      products,
      lastScan: null,
      now: 1_000_000,
    });

    expect(result.kind).toBe('add');
    if (result.kind === 'add') {
      expect(result.product.id).toBe(1);
      expect(result.product.name).toBe('Coke Original Can 330ml');
      expect(result.lastScan).toEqual({
        barcode: '4800016551829',
        at: 1_000_000,
      });
    }
  });

  test('first scan of an unknown SKU → kind: missing', () => {
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
