// Pure-TS parity tests for the Add Product barcode-scan handler.
//
// Mirrors the live `useAddProductForm.handleScannedBarcode` flow:
//  1. Lookup offline catalog with the scanned barcode.
//  2. If a match: set SKU + name + category, optionally turn off
//     auto-generate-SKU (the hook applies the toggle BEFORE writing
//     name, so the auto-gen useEffect doesn't overwrite the SKU).
//  3. If no match: set SKU only, queue a warning toast.
//
// We don't render the hook — instead we drive the same pure helper
// the hook calls (`applyBarcodeToAddProductForm`) and assert on the
// returned patch.

import { describe, expect, test } from '@jest/globals';
import { applyBarcodeToAddProductForm } from '../../lib/barcodes/applyToAddProductForm';
import type { OfflineBarcodeLookup } from '../../constants/barcodes';

const fakeCatalog: Record<string, OfflineBarcodeLookup> = {
  '4800016551829': { name: 'Coke Original Can 330ml', category: 'Beverages' },
  '4800249011013': {
    name: 'Rebisco Skyflakes Crackers Original 25g',
    category: 'Snacks',
  },
};

const lookup = (barcode: string) => fakeCatalog[barcode] ?? null;

describe('applyBarcodeToAddProductForm', () => {
  test('match + auto-generate ON → forces auto-gen OFF, fills name + category', () => {
    const patch = applyBarcodeToAddProductForm({
      barcode: '4800016551829',
      currentProductName: '',
      autoGenerateSku: true,
      lookup,
    });

    expect(patch.sku).toBe('4800016551829');
    expect(patch.productName).toBe('Coke Original Can 330ml');
    expect(patch.category).toBe('Beverages');
    // Critical: must be true so the hook applies it BEFORE writing name.
    expect(patch.setAutoGenerateSku).toBe(true);
    expect(patch.toast).toBeUndefined();
    expect(patch.closeModal).toBe(true);
  });

  test('match + auto-generate already OFF → no setAutoGenerateSku flag', () => {
    const patch = applyBarcodeToAddProductForm({
      barcode: '4800016551829',
      currentProductName: 'Coke',
      autoGenerateSku: false,
      lookup,
    });

    expect(patch.sku).toBe('4800016551829');
    expect(patch.productName).toBe('Coke Original Can 330ml');
    expect(patch.category).toBe('Beverages');
    expect(patch.setAutoGenerateSku).toBeUndefined();
  });

  test('match in a different category (Snacks) preserves the category', () => {
    const patch = applyBarcodeToAddProductForm({
      barcode: '4800249011013',
      currentProductName: '',
      autoGenerateSku: true,
      lookup,
    });

    expect(patch.productName).toBe(
      'Rebisco Skyflakes Crackers Original 25g',
    );
    expect(patch.category).toBe('Snacks');
  });

  test('no match → SKU only + warning toast, no name/category writes', () => {
    const patch = applyBarcodeToAddProductForm({
      barcode: '0000000000000',
      currentProductName: '',
      autoGenerateSku: false,
      lookup,
    });

    expect(patch.sku).toBe('0000000000000');
    expect(patch.productName).toBeUndefined();
    expect(patch.category).toBeUndefined();
    expect(patch.toast).toBeDefined();
    expect(patch.toast?.variant).toBe('warning');
    expect(patch.toast?.message).toMatch(/not in catalog/i);
    expect(patch.closeModal).toBe(true);
  });

  test('no match + auto-generate ON → does NOT auto-disable (no catalog hit, no behavior change)', () => {
    const patch = applyBarcodeToAddProductForm({
      barcode: '0000000000000',
      currentProductName: '',
      autoGenerateSku: true,
      lookup,
    });

    expect(patch.setAutoGenerateSku).toBeUndefined();
    expect(patch.toast).toBeDefined();
  });

  test('always sets closeModal: true (every scan closes the scanner)', () => {
    const on = applyBarcodeToAddProductForm({
      barcode: '4800016551829',
      currentProductName: '',
      autoGenerateSku: true,
      lookup,
    });
    const off = applyBarcodeToAddProductForm({
      barcode: '0000000000000',
      currentProductName: '',
      autoGenerateSku: false,
      lookup,
    });

    expect(on.closeModal).toBe(true);
    expect(off.closeModal).toBe(true);
  });
});
