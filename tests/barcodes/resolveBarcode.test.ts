import { describe, expect, test, jest } from '@jest/globals';
import { createBarcodeResolver } from '../../lib/barcodes/resolveBarcode';
import type { Product } from '../../types/products.types';
import type { CatalogProduct } from '../../types/catalog.types';

const storeCoke: Product = {
  id: 1,
  sku: '4800016551829',
  barcode: '4800016551829',
  name: 'Store Coke',
  price: 2500,
  quantity: 10,
  retail_unit_name: 'Can',
  created_at: '2026-07-18 00:00:00',
  updated_at: '2026-07-18 00:00:00',
};

const storeCokeWholesale: Product = {
  id: 1,
  sku: '4800016551829',
  barcode: '4800016551829',
  name: 'Store Coke',
  price: 2500,
  quantity: 10,
  retail_unit_name: 'Can',
  wholesale_barcode: '8888000011112',
  wholesale_price: 24000,
  conversion_factor: 12,
  created_at: '2026-07-18 00:00:00',
  updated_at: '2026-07-18 00:00:00',
};

const legacyProduct: Product = {
  id: 2,
  sku: '4800249011013',
  barcode: null,
  name: 'Legacy Product',
  price: 1000,
  quantity: 5,
  created_at: '2026-07-18 00:00:00',
  updated_at: '2026-07-18 00:00:00',
};

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: any) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('Barcode Resolver tests', () => {
  test('uses a loaded store product before requesting catalog metadata', async () => {
    const lookupCatalogProduct = jest.fn(async () => ({
      barcode: '4800016551829',
      name: 'Catalog Coke',
      brand: null,
      category: 'Beverages',
      unit: 'Pc',
      imageUrl: null,
      createdAt: 1,
    }));

    const resolver = createBarcodeResolver({
      getProducts: () => [storeCoke],
      isStoreProductsReady: () => true,
      lookupCatalogProduct,
    });

    await expect(resolver.resolve('4800016551829')).resolves.toMatchObject({
      kind: 'resolved',
      product: storeCoke,
      source: 'barcode',
      matchedUnit: 'retail',
    });
    expect(lookupCatalogProduct).not.toHaveBeenCalled();
  });

  test('wholesale and legacy-SKU store precedence matches correctly', async () => {
    const resolver = createBarcodeResolver({
      getProducts: () => [storeCokeWholesale, legacyProduct],
      isStoreProductsReady: () => true,
      lookupCatalogProduct: jest.fn(async () => null),
    });

    // Retail match
    await expect(resolver.resolve('4800016551829')).resolves.toEqual({
      kind: 'resolved',
      product: storeCokeWholesale,
      source: 'barcode',
      matchedUnit: 'retail',
    });

    // Wholesale match
    await expect(resolver.resolve('8888000011112')).resolves.toEqual({
      kind: 'resolved',
      product: storeCokeWholesale,
      source: 'wholesale_barcode',
      matchedUnit: 'wholesale',
    });

    // Legacy SKU fallback
    await expect(resolver.resolve('4800249011013')).resolves.toEqual({
      kind: 'resolved',
      product: legacyProduct,
      source: 'sku',
      matchedUnit: 'retail',
    });
  });

  test('catalog hit with one lookup is returned and only queries once', async () => {
    const catalogCoke: CatalogProduct = {
      barcode: '4807770270017',
      name: 'Catalog Coke',
      brand: null,
      category: 'Beverages',
      unit: 'Pc',
      imageUrl: null,
      createdAt: 1,
    };
    const lookupCatalogProduct = jest.fn(async () => catalogCoke);

    const resolver = createBarcodeResolver({
      getProducts: () => [],
      isStoreProductsReady: () => true,
      lookupCatalogProduct,
    });

    await expect(resolver.resolve('4807770270017')).resolves.toEqual({
      kind: 'catalog_match',
      catalogProduct: catalogCoke,
    });
    expect(lookupCatalogProduct).toHaveBeenCalledTimes(1);
    expect(lookupCatalogProduct).toHaveBeenCalledWith('4807770270017');
  });

  test('catalog miss returns missing', async () => {
    const lookupCatalogProduct = jest.fn(async () => null);

    const resolver = createBarcodeResolver({
      getProducts: () => [],
      isStoreProductsReady: () => true,
      lookupCatalogProduct,
    });

    await expect(resolver.resolve('4807770270017')).resolves.toEqual({
      kind: 'missing',
      barcode: '4807770270017',
    });
  });

  test('invalid and duplicate inputs are handled correctly', async () => {
    const resolver = createBarcodeResolver({
      getProducts: () => [storeCoke],
      isStoreProductsReady: () => true,
      lookupCatalogProduct: jest.fn(async () => null),
      throttleMs: 1500,
    });

    // Invalid format (letters)
    await expect(resolver.resolve('abc12345')).resolves.toEqual({
      kind: 'invalid',
      reason: 'format',
    });

    // Empty string
    await expect(resolver.resolve('')).resolves.toEqual({
      kind: 'invalid',
      reason: 'empty',
    });

    // First valid scan
    await expect(resolver.resolve('4800016551829', 1000)).resolves.toMatchObject({
      kind: 'resolved',
    });

    // Duplicate scan within throttle window
    await expect(resolver.resolve('4800016551829', 2000)).resolves.toEqual({
      kind: 'duplicate',
    });

    // Scan after throttle window
    await expect(resolver.resolve('4800016551829', 3000)).resolves.toMatchObject({
      kind: 'resolved',
    });
  });

  test('store_products_unavailable when products query is loading, fetching, or errored', async () => {
    const lookupCatalogProduct = jest.fn(async () => null);

    let ready = false;
    const resolver = createBarcodeResolver({
      getProducts: () => [],
      isStoreProductsReady: () => ready,
      lookupCatalogProduct,
    });

    // Ready is false (loading/fetching/errored)
    await expect(resolver.resolve('4800016551829')).resolves.toEqual({
      kind: 'store_products_unavailable',
    });

    // Ready is true
    ready = true;
    await expect(resolver.resolve('4800016551829')).resolves.toEqual({
      kind: 'missing',
      barcode: '4800016551829',
    });
  });

  test('a deferred catalog response for scan A followed by valid scan B, where A resolves as superseded', async () => {
    const deferred = createDeferred<CatalogProduct | null>();
    const lookupCatalogProduct = jest.fn((barcode: string) => {
      if (barcode === '4807770270017') {
        return deferred.promise;
      }
      return Promise.resolve(null);
    });

    const resolver = createBarcodeResolver({
      getProducts: () => [storeCoke],
      isStoreProductsReady: () => true,
      lookupCatalogProduct,
    });

    // Start scan A
    const promiseA = resolver.resolve('4807770270017');

    // Immediately start scan B (valid scan B, which maps to store Coke)
    const promiseB = resolver.resolve('4800016551829');
    await expect(promiseB).resolves.toMatchObject({
      kind: 'resolved',
      product: storeCoke,
    });

    // Resolve scan A's lookup
    deferred.resolve({
      barcode: '4807770270017',
      name: 'Lucky Me',
      brand: null,
      category: 'Noodles',
      unit: 'Pc',
      imageUrl: null,
      createdAt: 1,
    });

    // Expect scan A to be superseded
    await expect(promiseA).resolves.toEqual({
      kind: 'superseded',
    });
  });

  test('a rejected catalog lookup is caught and returns missing', async () => {
    const consoleWarnMock = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const lookupCatalogProduct = jest.fn(async () => {
      throw new Error('Database connection failed');
    });

    const resolver = createBarcodeResolver({
      getProducts: () => [],
      isStoreProductsReady: () => true,
      lookupCatalogProduct,
    });

    await expect(resolver.resolve('4807770270017')).resolves.toEqual({
      kind: 'missing',
      barcode: '4807770270017',
    });
    expect(consoleWarnMock).toHaveBeenCalled();
    consoleWarnMock.mockRestore();
  });

  test('a global fetch spy remains untouched through all resolver paths', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    const catalogCoke: CatalogProduct = {
      barcode: '4807770270017',
      name: 'Catalog Coke',
      brand: null,
      category: 'Beverages',
      unit: 'Pc',
      imageUrl: null,
      createdAt: 1,
    };
    const lookupCatalogProduct = jest.fn(async () => catalogCoke);

    const resolver = createBarcodeResolver({
      getProducts: () => [storeCoke],
      isStoreProductsReady: () => true,
      lookupCatalogProduct,
    });

    // Path 1: Store hit
    await resolver.resolve('4800016551829');
    // Path 2: Catalog hit
    await resolver.resolve('4807770270017');
    // Path 3: Invalid
    await resolver.resolve('invalid-barcode');

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
