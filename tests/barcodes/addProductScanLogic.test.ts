// Pure-TS parity tests for the Add Product barcode-scan handler.
//
// Mirrors the live `useAddProductForm.handleScannedBarcode` flow:
//  1. Format-validate via `validateBarcode`.
//  2. Duplicate-check against `existingProducts` (block submit with
//     the conflict row carrying the existing product).
//  3. If valid + no duplicate: lookup offline catalog; on hit, the
//     patch tells the hook to also write name + category and to flip
//     auto-generate-SKU off first (rule-order matters — see lib
//     comment).
//  4. If valid + no duplicate + no catalog hit: write `barcode` only;
//     queue a warning toast.
//
// We don't render the hook — instead we drive the same pure helper
// the hook calls (`applyBarcodeToAddProductForm`) and assert on the
// returned result.

import { describe, expect, test } from '@jest/globals';
import { applyBarcodeToAddProductForm } from '../../lib/barcodes/applyToAddProductForm';
import type { OfflineBarcodeLookup } from '../../constants/barcodes';
import type { Product } from '../../types/products.types';

const fakeCatalog: Record<string, OfflineBarcodeLookup> = {
  '4800016551829': { name: 'Coke Original Can 330ml', category: 'Beverages' },
  '4800249011011': {
    name: 'Rebisco Skyflakes Crackers Original 25g',
    category: 'Snacks',
  },
};

const lookup = (barcode: string) => fakeCatalog[barcode] ?? null;

const emptyExisting: Product[] = [];

describe('applyBarcodeToAddProductForm', () => {
  test('invalid format → kind: invalid reason: format', () => {
    const result = applyBarcodeToAddProductForm({
      barcode: 'abc123',
      currentProductName: '',
      autoGenerateSku: false,
      lookup,
      existingProducts: emptyExisting,
    });

    expect(result.kind).toBe('invalid');
    if (result.kind === 'invalid') {
      expect(result.reason).toBe('format');
    }
  });

  test('empty input → kind: invalid reason: empty', () => {
    const result = applyBarcodeToAddProductForm({
      barcode: '',
      currentProductName: '',
      autoGenerateSku: false,
      lookup,
      existingProducts: emptyExisting,
    });

    expect(result.kind).toBe('invalid');
    if (result.kind === 'invalid') {
      expect(result.reason).toBe('empty');
    }
  });

  test('match + auto-generate ON → forces auto-gen OFF, fills name + category', () => {
    const result = applyBarcodeToAddProductForm({
      barcode: '4800016551829',
      currentProductName: '',
      autoGenerateSku: true,
      lookup,
      existingProducts: emptyExisting,
    });

    expect(result.kind).toBe('apply');
    if (result.kind === 'apply') {
      expect(result.patch.barcode).toBe('4800016551829');
      expect(result.patch.productName).toBe('Coke Original Can 330ml');
      expect(result.patch.category).toBe('Beverages');
      // Critical: must be true so the hook applies it BEFORE writing name.
      expect(result.patch.setAutoGenerateSku).toBe(true);
      expect(result.patch.toast).toBeUndefined();
      expect(result.patch.closeModal).toBe(true);
    }
  });

  test('match + auto-generate already OFF → no setAutoGenerateSku flag', () => {
    const result = applyBarcodeToAddProductForm({
      barcode: '4800016551829',
      currentProductName: 'Coke',
      autoGenerateSku: false,
      lookup,
      existingProducts: emptyExisting,
    });

    expect(result.kind).toBe('apply');
    if (result.kind === 'apply') {
      expect(result.patch.barcode).toBe('4800016551829');
      expect(result.patch.productName).toBe('Coke Original Can 330ml');
      expect(result.patch.category).toBe('Beverages');
      expect(result.patch.setAutoGenerateSku).toBeUndefined();
    }
  });

  test('match in a different category (Snacks) preserves the category', () => {
    const result = applyBarcodeToAddProductForm({
      barcode: '4800249011011',
      currentProductName: '',
      autoGenerateSku: true,
      lookup,
      existingProducts: emptyExisting,
    });

    expect(result.kind).toBe('apply');
    if (result.kind === 'apply') {
      expect(result.patch.productName).toBe(
        'Rebisco Skyflakes Crackers Original 25g',
      );
      expect(result.patch.category).toBe('Snacks');
    }
  });

  test('no catalog match → barcode only + warning toast, no name/category writes', () => {
    const result = applyBarcodeToAddProductForm({
      barcode: '0000000000000',
      currentProductName: '',
      autoGenerateSku: false,
      lookup,
      existingProducts: emptyExisting,
    });

    expect(result.kind).toBe('apply');
    if (result.kind === 'apply') {
      expect(result.patch.barcode).toBe('0000000000000');
      expect(result.patch.productName).toBeUndefined();
      expect(result.patch.category).toBeUndefined();
      expect(result.patch.toast).toBeDefined();
      expect(result.patch.toast?.variant).toBe('warning');
      expect(result.patch.toast?.message).toMatch(/not in catalog/i);
      expect(result.patch.closeModal).toBe(true);
    }
  });

  test('no match + auto-generate ON → does NOT auto-disable (no catalog hit, no behavior change)', () => {
    const result = applyBarcodeToAddProductForm({
      barcode: '0000000000000',
      currentProductName: '',
      autoGenerateSku: true,
      lookup,
      existingProducts: emptyExisting,
    });

    expect(result.kind).toBe('apply');
    if (result.kind === 'apply') {
      expect(result.patch.setAutoGenerateSku).toBeUndefined();
      expect(result.patch.toast).toBeDefined();
    }
  });

  test('duplicate by barcode column → kind: duplicate with the existing product', () => {
    const existing: Product[] = [
      {
        id: 99,
        sku: 'COKE-1.5L',
        barcode: '4800016551829',
        name: 'Coke Original Can 330ml',
        price: 1500,
        cost_price: undefined,
        quantity: 8,
        category: 'Beverages',
        created_at: '2026-06-30 00:00:00',
        updated_at: '2026-06-30 00:00:00',
      },
    ];

    const result = applyBarcodeToAddProductForm({
      barcode: '4800016551829',
      currentProductName: '',
      autoGenerateSku: true,
      lookup,
      existingProducts: existing,
    });

    expect(result.kind).toBe('duplicate');
    if (result.kind === 'duplicate') {
      expect(result.existing.id).toBe(99);
      expect(result.existing.name).toBe('Coke Original Can 330ml');
    }
  });

  test('duplicate by SKU (legacy row with barcode IS NULL) → kind: duplicate', () => {
    const existing: Product[] = [
      {
        id: 42,
        sku: '4800016551829',
        barcode: null,
        name: 'Legacy Coca-Cola Entry',
        price: 1500,
        cost_price: undefined,
        quantity: 8,
        category: 'Beverages',
        created_at: '2026-06-30 00:00:00',
        updated_at: '2026-06-30 00:00:00',
      },
    ];

    const result = applyBarcodeToAddProductForm({
      barcode: '4800016551829',
      currentProductName: '',
      autoGenerateSku: false,
      lookup,
      existingProducts: existing,
    });

    expect(result.kind).toBe('duplicate');
    if (result.kind === 'duplicate') {
      expect(result.existing.id).toBe(42);
    }
  });

  test('always sets closeModal: true on apply (every successful scan closes the scanner)', () => {
    const on = applyBarcodeToAddProductForm({
      barcode: '4800016551829',
      currentProductName: '',
      autoGenerateSku: true,
      lookup,
      existingProducts: emptyExisting,
    });
    const off = applyBarcodeToAddProductForm({
      barcode: '0000000000000',
      currentProductName: '',
      autoGenerateSku: false,
      lookup,
      existingProducts: emptyExisting,
    });

    expect(on.kind).toBe('apply');
    expect(off.kind).toBe('apply');
    if (on.kind === 'apply') expect(on.patch.closeModal).toBe(true);
    if (off.kind === 'apply') expect(off.patch.closeModal).toBe(true);
  });

  test('write target is barcode (not sku)', () => {
    const result = applyBarcodeToAddProductForm({
      barcode: '4800016551829',
      currentProductName: '',
      autoGenerateSku: true,
      lookup,
      existingProducts: emptyExisting,
    });

    expect(result.kind).toBe('apply');
    if (result.kind === 'apply') {
      // The helper should use `barcode`, not `sku`, as the write target.
      expect(result.patch.barcode).toBe('4800016551829');
      // Sanity: ensure no `sku` field is leaking.
      expect((result.patch as unknown as { sku?: unknown }).sku).toBeUndefined();
    }
  });
});
