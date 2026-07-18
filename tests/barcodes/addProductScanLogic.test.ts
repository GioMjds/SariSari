import { describe, expect, test } from '@jest/globals';
import { applyBarcodeToAddProductForm } from '../../lib/barcodes/applyToAddProductForm';

describe('applyBarcodeToAddProductForm', () => {
  test('catalog match fills only identity defaults and retail unit', () => {
    const patch = applyBarcodeToAddProductForm({
      resolution: {
        kind: 'catalog_match',
        barcode: '4807770270017',
        catalogProduct: {
          barcode: '4807770270017',
          name: 'Lucky Me Instant Mami Beef',
          brand: 'Lucky Me',
          category: 'Noodles',
          unit: 'Pack',
          imageUrl: 'https://not-used.example/image.png',
          createdAt: 1,
        },
      },
      autoGenerateSku: true,
    });

    expect(patch).toMatchObject({
      barcode: '4807770270017',
      productName: 'Lucky Me Instant Mami Beef',
      category: 'Noodles',
      retailUnitName: 'Pack',
      setAutoGenerateSku: true,
    });
    expect(patch).not.toHaveProperty('price');
    expect(patch).not.toHaveProperty('costPrice');
    expect(patch).not.toHaveProperty('supplierId');
    expect(patch).not.toHaveProperty('imageUri');
  });

  test('missing resolution sets barcode and warning toast', () => {
    const patch = applyBarcodeToAddProductForm({
      resolution: {
        kind: 'missing',
        barcode: '123456789012',
      },
      autoGenerateSku: false,
    });

    expect(patch).toEqual({
      barcode: '123456789012',
      toast: {
        variant: 'warning',
        message: 'Barcode scanned. Product details not in catalog; please type details manually.',
      },
      closeModal: true,
    });
  });

  test('catalog match with null category leaves category undefined', () => {
    const patch = applyBarcodeToAddProductForm({
      resolution: {
        kind: 'catalog_match',
        barcode: '4807770270017',
        catalogProduct: {
          barcode: '4807770270017',
          name: 'Lucky Me Instant Mami Beef',
          brand: 'Lucky Me',
          category: null,
          unit: 'Pack',
          imageUrl: null,
          createdAt: 1,
        },
      },
      autoGenerateSku: true,
    });

    expect(patch).toMatchObject({
      barcode: '4807770270017',
      productName: 'Lucky Me Instant Mami Beef',
      retailUnitName: 'Pack',
      setAutoGenerateSku: true,
    });
    expect(patch.category).toBeUndefined();
  });
});
