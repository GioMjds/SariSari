import { initProductsTable, insertProduct, getProduct } from '../../database/products';
import { initSuppliersTable, createSupplier, getSupplier, updateSupplier, deleteSupplier, listSuppliers } from '../../database/suppliers';
import { initInventoryTable } from '../../database/inventory';
import { initSalesTables } from '../../database/sales';
import { initCreditsTable } from '../../database/credits';
import { runMigrations } from '../../database/migrations';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';
import * as Crypto from 'expo-crypto';

describe('Suppliers Database Operations', () => {
  beforeAll(async () => {
    resetMockDb();
    await initProductsTable();
    await initSuppliersTable();
    await initInventoryTable();
    await initSalesTables();
    await initCreditsTable();
    await runMigrations();

    let counter = 0;
    (Crypto.randomUUID as any).mockImplementation(() => `uuid-${counter++}`);
  });

  test('createSupplier inserts row and returns Supplier object', async () => {
    const supplier = await createSupplier({
      name: 'Coca-Cola Sales',
      contact: '09123456789',
      notes: 'Weekly deliveries',
    });

    expect(supplier).toBeDefined();
    expect(supplier.id).toBeDefined();
    expect(supplier.name).toBe('Coca-Cola Sales');
    expect(supplier.contact).toBe('09123456789');
    expect(supplier.notes).toBe('Weekly deliveries');
    expect(supplier.createdAt).toBeLessThanOrEqual(Date.now());
  });

  test('listSuppliers returns all suppliers ordered by name', async () => {
    await createSupplier({ name: 'Z-Supplier', contact: null, notes: null });
    await createSupplier({ name: 'A-Supplier', contact: null, notes: null });

    const list = await listSuppliers();
    const names = list.map((s) => s.name);
    
    // They should be sorted alphabetically by name
    const sortedNames = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sortedNames);
  });

  test('updateSupplier modifies fields', async () => {
    const s = await createSupplier({ name: 'Old Supplier', contact: '123', notes: 'Old Notes' });
    await updateSupplier(s.id, { name: 'New Supplier', contact: '456' });

    const updated = await getSupplier(s.id);
    expect(updated?.name).toBe('New Supplier');
    expect(updated?.contact).toBe('456');
    expect(updated?.notes).toBe('Old Notes'); // Unchanged because not patched
  });

  test('deleteSupplier removes supplier and cascades ON DELETE SET NULL to products', async () => {
    const s = await createSupplier({ name: 'Temporary Supplier', contact: null, notes: null });
    const productId = await insertProduct(
      'Supplier-linked Coke',
      'SLC-001',
      15, // price
      0, // stock
      10, // cost
      'Beverages',
      null, // barcode
      s.id // supplier_id
    );

    const productBefore = await getProduct(productId);
    expect(productBefore?.supplier_id).toBe(s.id);

    await deleteSupplier(s.id);

    // Supplier is deleted
    const deletedSupplier = await getSupplier(s.id);
    expect(deletedSupplier).toBeNull();

    // Product's supplier_id is set to null
    const productAfter = await getProduct(productId);
    expect(productAfter?.supplier_id).toBeNull();
  });
});
