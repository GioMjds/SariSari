import { initProductsTable, insertProduct, getProduct } from '../../database/products';
import { initSuppliersTable, createSupplier } from '../../database/suppliers';
import { initInventoryTable, insertInventoryTransaction, getInventoryTransactions } from '../../database/inventory';
import { initSalesTables } from '../../database/sales';
import { initCreditsTable } from '../../database/credits';
import { runMigrations } from '../../database/migrations';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';

describe('Restock Inventory Transactions with Cost & Supplier', () => {
  let productId: number;
  let supplierId: string;

  beforeAll(async () => {
    resetMockDb();
    await initProductsTable();
    await initSuppliersTable();
    await initInventoryTable();
    await initSalesTables();
    await initCreditsTable();
    await runMigrations();

    // Create a supplier
    const supplier = await createSupplier({
      name: 'Nestle Dist',
      contact: '09000000000',
      notes: null,
    });
    supplierId = supplier.id;

    // Create a product
    productId = await insertProduct(
      'Milo 22g',
      'MILO-22G',
      10, // price
      5, // initial stock
      7, // cost price
      'Beverages',
      null, // barcode
      supplierId
    );
  });

  test('restock with unit_cost updates product cost_price and logs to transaction', async () => {
    // Current cost_price is 7
    const productBefore = await getProduct(productId);
    expect(productBefore?.cost_price).toBe(7);

    // Record a restock with new cost_price = 8.5 (float pesos)
    await insertInventoryTransaction({
      product_id: productId,
      type: 'restock',
      quantity: 10,
      note: 'New Nestle batch',
      unit_cost: 8.5,
      supplier_id: supplierId,
    });

    // Check quantity updated: 5 + 10 = 15
    // Check cost_price updated: 8.5
    const productAfter = await getProduct(productId);
    expect(productAfter?.quantity).toBe(15);
    expect(productAfter?.cost_price).toBe(8.5);

    // Check transaction row has unit_cost and supplier_id
    const txs = await getInventoryTransactions(productId);
    const restockTx = txs.find((t) => t.note === 'New Nestle batch');
    expect(restockTx).toBeDefined();
    expect(restockTx?.unit_cost).toBe(8.5);
    expect(restockTx?.supplier_id).toBe(supplierId);
  });
});
