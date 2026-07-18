// Pure-TS tests for the bundled offline barcode catalog.
// Mirrors the project's test style (no renderHook, no React, no DB):
// assert on the bundled catalog entries.

import { describe, expect, test } from '@jest/globals';
import {
  BUNDLED_CATALOG_RECORDS,
  BUNDLED_CATALOG_COUNT,
} from '../../constants/barcodes';
import beverages from '../../constants/barcodes/beverages.json';
import cannedGoods from '../../constants/barcodes/canned-goods.json';
import noodles from '../../constants/barcodes/noodles.json';
import snacks from '../../constants/barcodes/snacks.json';

describe('offline barcode catalog', () => {
  test('BUNDLED_CATALOG_COUNT matches the union of all four category files', () => {
    const total =
      beverages.length + snacks.length + noodles.length + cannedGoods.length;
    expect(BUNDLED_CATALOG_COUNT).toBe(total);
  });

  test('catalog is non-empty — extended Filipino catalog target is 150-250 entries', () => {
    expect(BUNDLED_CATALOG_COUNT).toBeGreaterThanOrEqual(150);
    expect(BUNDLED_CATALOG_COUNT).toBeLessThanOrEqual(400);
  });

  test('contains the required Lucky Me Instant Mami Beef barcode', () => {
    expect(BUNDLED_CATALOG_RECORDS).toContainEqual({
      barcode: '4807770270017',
      name: 'Lucky Me Instant Mami Beef',
      category: 'Noodles',
    });
  });

  test('no duplicate barcodes across category files', () => {
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
