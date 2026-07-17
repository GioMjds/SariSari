import { db } from '../../configs/sqlite';
import { initProductsTable, insertProduct } from '../../database/products';
import { initInventoryTable } from '../../database/inventory';
import { initSalesTables, insertSale, deleteSale } from '../../database/sales';
import {
  initCreditsTable,
  insertCustomer,
  insertPayment,
  deletePayment,
} from '../../database/credits';
import { runMigrations } from '../../database/migrations';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';
import { initCashTables, openSession, closeSession } from '../../database/cash';
import * as Crypto from 'expo-crypto';
import { Pesos } from '../../lib/money';

describe('Closed Session Deletion Protection and Payment Method Validation', () => {
  let prodId: number;
  let sukiId: number;

  beforeAll(async () => {
    resetMockDb();
    await initProductsTable();
    await initInventoryTable();
    await initSalesTables();
    await initCreditsTable();
    await initCashTables();
    await runMigrations();

    let counter = 0;
    (Crypto.randomUUID as any).mockImplementation(() => `uuid-${counter++}`);

    prodId = await insertProduct('Coke', 'CK-1', 1500, 100); // 1500 = ₱15.00
    sukiId = await insertCustomer({ name: 'Suki Cash Test' });
  });

  beforeEach(async () => {
    await db.runAsync('DELETE FROM cash_entries');
    await db.runAsync('DELETE FROM cash_sessions');
    await db.runAsync('DELETE FROM sale_items');
    await db.runAsync('DELETE FROM sales');
    await db.runAsync('DELETE FROM payment_allocations');
    await db.runAsync('DELETE FROM payments');
    await db.runAsync('DELETE FROM credit_transactions');
  });

  test('cannot delete cash sale belonging to a closed cash session', async () => {
    const session = await openSession(1000 as Pesos);
    const saleId = await insertSale(
      [{ product_id: prodId, quantity: 2, price: 1500 }],
      'cash',
    );
    await closeSession(session.id, 1030 as Pesos);

    await expect(deleteSale(saleId)).rejects.toThrow(
      'Cannot delete a sale belonging to a closed cash session',
    );
  });

  test('cannot delete payment belonging to a closed cash session', async () => {
    const session = await openSession(1000 as Pesos);
    const paymentId = await insertPayment({
      customer_id: sukiId,
      amount: 500,
      payment_method: 'cash',
    });
    await closeSession(session.id, 1500 as Pesos);

    await expect(deletePayment(paymentId)).rejects.toThrow(
      'Cannot delete a payment belonging to a closed cash session',
    );
  });

  test('creating a payment requires a valid payment method', async () => {
    // Missing payment method
    await expect(
      insertPayment({
        customer_id: sukiId,
        amount: 500,
      } as any)
    ).rejects.toThrow('Payment method is required for new payments');

    // Invalid payment method
    await expect(
      insertPayment({
        customer_id: sukiId,
        amount: 500,
        payment_method: 'invalid_method' as any,
      })
    ).rejects.toThrow('Invalid payment method: invalid_method');

    // Valid payment methods
    const pm1 = await insertPayment({
      customer_id: sukiId,
      amount: 100,
      payment_method: 'cash',
    });
    expect(pm1).toBeGreaterThan(0);

    const pm2 = await insertPayment({
      customer_id: sukiId,
      amount: 100,
      payment_method: 'bank_transfer',
    });
    expect(pm2).toBeGreaterThan(0);

    const pm3 = await insertPayment({
      customer_id: sukiId,
      amount: 100,
      payment_method: 'other',
    });
    expect(pm3).toBeGreaterThan(0);
  });
});
