// Pure-TS tests for the bundled offline barcode catalog.
// Mirrors the project's test style (no renderHook, no React, no DB):
// import the function, assert on its return values.

import { describe, expect, test } from '@jest/globals';
import {
  BARCODE_CATALOG_VERSION,
  OFFLINE_BARCODE_COUNT,
  lookupOfflineBarcode,
} from '../../constants/barcodes';
import beverages from '../../constants/barcodes/beverages.json';
import cannedGoods from '../../constants/barcodes/canned-goods.json';
import noodles from '../../constants/barcodes/noodles.json';
import snacks from '../../constants/barcodes/snacks.json';

describe('offline barcode catalog', () => {
  test('version string is pinned', () => {
    expect(BARCODE_CATALOG_VERSION).toBe('2026-06-27');
  });

  test('OFFLINE_BARCODE_COUNT matches the union of all four category files', () => {
    const total =
      beverages.length + snacks.length + noodles.length + cannedGoods.length;
    expect(OFFLINE_BARCODE_COUNT).toBe(total);
  });

  test('catalog is non-empty — extended Filipino catalog target is 150-250 entries', () => {
    // User-picked "extended" size; lower bound guards against accidental
    // catastrophic loss (e.g. one file forgotten in the index). Upper
    // bound is a sanity check — never bloat past 250 entries.
    expect(OFFLINE_BARCODE_COUNT).toBeGreaterThanOrEqual(150);
    expect(OFFLINE_BARCODE_COUNT).toBeLessThanOrEqual(250);
  });

  test('returns the right item for a known barcode', () => {
    // Coke Original 330ml is a fixture in beverages.json[0]
    const match = lookupOfflineBarcode('4800016551829');
    expect(match).not.toBeNull();
    expect(match?.name).toBe('Coke Original Can 330ml');
    expect(match?.category).toBe('Beverages');
  });

  test('returns null for an unknown barcode', () => {
    expect(lookupOfflineBarcode('0000000000000')).toBeNull();
    expect(lookupOfflineBarcode('')).toBeNull();
  });

  test('all four categories are reachable', () => {
    const beverageHit = beverages[0];
    const snackHit = snacks[0];
    const noodleHit = noodles[0];
    const cannedHit = cannedGoods[0];

    expect(lookupOfflineBarcode(beverageHit.barcode)?.category).toBe(
      beverageHit.category,
    );
    expect(lookupOfflineBarcode(snackHit.barcode)?.category).toBe(
      snackHit.category,
    );
    expect(lookupOfflineBarcode(noodleHit.barcode)?.category).toBe(
      noodleHit.category,
    );
    expect(lookupOfflineBarcode(cannedHit.barcode)?.category).toBe(
      cannedHit.category,
    );
  });

  test('no duplicate barcodes across category files', () => {
    // Critical guard: the Map builder does "last write wins" so
    // duplicates silently overwrite each other. Test catches it.
    const all = [
      ...beverages,
      ...snacks,
      ...noodles,
      ...cannedGoods,
    ];
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const item of all) {
      if (seen.has(item.barcode)) duplicates.push(item.barcode);
      seen.add(item.barcode);
    }
    expect(duplicates).toEqual([]);
  });

  test('every entry has a non-empty name and category', () => {
    const all = [
      ...beverages,
      ...snacks,
      ...noodles,
      ...cannedGoods,
    ];
    for (const item of all) {
      expect(item.barcode).toMatch(/^\d{8,14}$/);
      expect(item.name.length).toBeGreaterThan(0);
      expect(item.category.length).toBeGreaterThan(0);
    }
  });
});
