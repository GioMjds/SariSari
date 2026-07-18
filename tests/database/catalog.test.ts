import { describe, expect, test, beforeAll, beforeEach } from '@jest/globals';
import { db } from '../../configs/sqlite';
import { getCatalogProductByBarcode, insertCatalogProductIfMissing } from '../../database/catalog';
import {
  initProductsTable,
  initCreditsTable,
  initInventoryTable,
  initSalesTables,
  initCategoriesTable,
  initSuppliersTable,
  runMigrations,
} from '../../database';
import { seedProductCatalog } from '../../database/seed';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';

describe('Catalog Database Operations', () => {
  beforeAll(async () => {
    resetMockDb();
    await initProductsTable();
    await initCreditsTable();
    await initInventoryTable();
    await initSalesTables();
    await initCategoriesTable();
    await initSuppliersTable();
    await runMigrations();
  });

  beforeEach(() => {
    resetMockDb();
  });

  test('reads one trimmed barcode and maps snake_case fields', async () => {
    await db.runAsync(
      'INSERT INTO product_catalog (barcode, name, brand, category, unit, image_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        '4807770270017',
        'Lucky Me Instant Mami Beef',
        'Lucky Me',
        'Noodles',
        'Pc',
        null,
        1,
      ],
    );

    await expect(
      getCatalogProductByBarcode(db, ' 4807770270017 '),
    ).resolves.toEqual({
      barcode: '4807770270017',
      name: 'Lucky Me Instant Mami Beef',
      brand: 'Lucky Me',
      category: 'Noodles',
      unit: 'Pc',
      imageUrl: null,
      createdAt: 1,
    });
  });

  test('does not replace existing catalog metadata', async () => {
    await db.runAsync(
      'INSERT INTO product_catalog (barcode, name, brand, category, unit, image_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        '4800016551829',
        'Merchant Coke',
        'Merchant Brand',
        'Custom',
        'Bottle',
        'local://coke',
        10,
      ],
    );

    await insertCatalogProductIfMissing(db, {
      barcode: '4800016551829',
      name: 'Bundled Coke',
      brand: null,
      category: 'Beverages',
      unit: 'Pc',
      imageUrl: null,
    });

    await expect(
      getCatalogProductByBarcode(db, '4800016551829'),
    ).resolves.toMatchObject({
      name: 'Merchant Coke',
      brand: 'Merchant Brand',
      category: 'Custom',
      unit: 'Bottle',
      imageUrl: 'local://coke',
      createdAt: 10,
    });
  });

  test('seeds only missing bundled records and preserves a merchant row', async () => {
    await db.runAsync(
      'INSERT INTO product_catalog (barcode, name, brand, category, unit, image_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['4800016551829', 'Merchant Coke', null, 'Custom', 'Bottle', null, 1],
    );

    await seedProductCatalog();

    await expect(
      getCatalogProductByBarcode(db, '4800016551829'),
    ).resolves.toMatchObject({
      name: 'Merchant Coke',
      category: 'Custom',
      unit: 'Bottle',
    });

    await expect(
      getCatalogProductByBarcode(db, '4807770270017'),
    ).resolves.toMatchObject({
      name: 'Lucky Me Instant Mami Beef',
      category: 'Noodles',
      unit: 'Pc',
    });
  });

  test('handles catalog seeding failures gracefully without rejecting', async () => {
    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});

    await db.execAsync(`
      CREATE TRIGGER IF NOT EXISTS fail_catalog_insert
      BEFORE INSERT ON product_catalog
      BEGIN
        SELECT RAISE(FAIL, 'Forced insert failure');
      END;
    `);

    try {
      await expect(seedProductCatalog()).resolves.toBeUndefined();
      expect(consoleErrorMock).toHaveBeenCalled();
    } finally {
      await db.execAsync('DROP TRIGGER IF EXISTS fail_catalog_insert;');
      consoleErrorMock.mockRestore();
    }
  });
});
