import { findBarcodeConflict, generateSku } from '../types';
import { applyBarcodeToAddProductForm } from '@/lib/barcodes/applyToAddProductForm';
import type { Product } from '@/types/products.types';

const product = (over: Partial<Product>): Product => ({
  id: 1,
  name: 'Coke',
  sku: 'CO-0001',
  barcode: null,
  price: 20,
  quantity: 0,
  created_at: '',
  updated_at: '',
  is_favorite: false,
  ...over,
});

describe('generateSku', () => {
  it('uses initials of the first two words plus four digits', () => {
    expect(generateSku('lucky me pancit')).toMatch(/^LM-\d{4}$/);
  });

  it('keeps the current SKU while the prefix still matches', () => {
    expect(generateSku('Lucky Me Canton', 'LM-1234')).toBe('LM-1234');
  });

  it('returns blank for a blank name', () => {
    expect(generateSku('   ')).toBe('');
  });
});

describe('findBarcodeConflict', () => {
  const items = [
    product({ id: 1, barcode: '4800016123456' }),
    product({ id: 2, sku: '4800016999999' }),
  ];

  it('matches barcode and legacy SKU-as-barcode rows', () => {
    expect(findBarcodeConflict(items, '4800016123456')?.id).toBe(1);
    expect(findBarcodeConflict(items, '4800016999999')?.id).toBe(2);
  });

  it('ignores the product being edited and blank input', () => {
    expect(findBarcodeConflict(items, '4800016123456', 1)).toBeNull();
    expect(findBarcodeConflict(items, '  ')).toBeNull();
  });
});

describe('applyBarcodeToAddProductForm', () => {
  it('writes the scan to the barcode only, never the SKU', () => {
    const patch = applyBarcodeToAddProductForm({
      resolution: { kind: 'missing', barcode: '4800016123456' },
    });
    expect(patch.barcode).toBe('4800016123456');
    expect(patch).not.toHaveProperty('sku');
  });
});
