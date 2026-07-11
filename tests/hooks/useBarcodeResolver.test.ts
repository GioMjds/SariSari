import { resolveBarcodeAgainstProducts } from '../../hooks/useBarcodeResolver';
import type { Product } from '../../types/products.types';

describe('resolveBarcodeAgainstProducts', () => {
  const mockProducts: Product[] = [
    {
      id: 1,
      sku: '4800016551829',
      barcode: '4800016551829',
      name: 'Coke Original Can 330ml',
      price: 1500,
      quantity: 10,
      retail_unit_name: 'Can',
      wholesale_unit_name: 'Case',
      wholesale_price: 16500,
      wholesale_cost_price: 15000,
      conversion_factor: 12,
      wholesale_barcode: '8888000011112',
      created_at: '2026-06-30 00:00:00',
      updated_at: '2026-06-30 00:00:00',
    },
  ];

  test('resolves retail barcode with matchedUnit: retail', () => {
    const resolution = resolveBarcodeAgainstProducts('4800016551829', mockProducts);

    expect(resolution).toEqual({
      kind: 'resolved',
      product: mockProducts[0],
      source: 'barcode',
      matchedUnit: 'retail',
    });
  });

  test('resolves wholesale_barcode with matchedUnit: wholesale', () => {
    const resolution = resolveBarcodeAgainstProducts('8888000011112', mockProducts);

    expect(resolution).toEqual({
      kind: 'resolved',
      product: mockProducts[0],
      source: 'wholesale_barcode',
      matchedUnit: 'wholesale',
    });
  });
});
