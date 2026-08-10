import { createBarcodeResolver } from '@/lib/barcodes/resolveBarcode';
import type { Product } from '@/types/products.types';

describe('createBarcodeResolver', () => {
  const dummyProduct: Product = {
    id: 1,
    name: 'Coke 1.5L',
    price: 65,
    cost_price: 50,
    quantity: 10,
    sku: '123456789012',
    barcode: '123456789012',
    wholesale_barcode: null,
    is_favorite: false,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  };

  it('resolves product from store when barcode matches', async () => {
    const resolver = createBarcodeResolver({
      getProducts: () => [dummyProduct],
      isStoreProductsReady: () => true,
      lookupCatalogProduct: jest.fn().mockResolvedValue(null),
      throttleMs: 1500,
    });

    const result = await resolver.resolve('123456789012');
    expect(result.kind).toBe('resolved');
    if (result.kind === 'resolved') {
      expect(result.product.id).toBe(1);
    }
  });

  it('handles optional throttleMs safely', async () => {
    const resolver = createBarcodeResolver({
      getProducts: () => [dummyProduct],
      isStoreProductsReady: () => true,
      lookupCatalogProduct: jest.fn().mockResolvedValue(null),
    });

    const result = await resolver.resolve('123456789012');
    expect(result.kind).toBe('resolved');
  });
});
