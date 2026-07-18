import { db } from '../configs/sqlite';
import beverages from '../constants/barcodes/beverages.json';
import cannedGoods from '../constants/barcodes/canned-goods.json';
import noodles from '../constants/barcodes/noodles.json';
import snacks from '../constants/barcodes/snacks.json';
import {
  MOCK_CATEGORIES,
  MOCK_PRODUCTS,
  MOCK_CUSTOMERS,
  MOCK_CREDIT_TRANSACTIONS,
  MOCK_PAYMENTS,
  MOCK_SALES,
  MOCK_SALE_ITEMS,
  MOCK_INVENTORY_TRANSACTIONS,
} from '@/scripts/sample-mock-datas';

/**
 * Seed the database with mock data for development.
 *
 * Three bugs lived here before this rewrite. All three are fixed:
 *
 *   1. **Manual `BEGIN TRANSACTION; ... COMMIT;` did nothing.**
 *      `expo-sqlite`'s `execAsync` runs a multi-statement batch
 *      atomically and does not keep the connection inside a user-
 *      managed transaction once it returns. Every subsequent
 *      `db.runAsync(...)` was a separate autocommit statement, which
 *      meant the seed ran as dozens of standalone writes that
 *      interleaved with anything else holding the writer lock.
 *      Fixed by using `db.withTransactionAsync`, the same primitive
 *      the migrations use.
 *
 *   2. **`execAsync` rejecting with "database is locked".** Once #1
 *      was fixed, this surfaced on cold start when the migration's
 *      `withTransactionAsync` hadn't fully released the writer lock
 *      before the seed's transaction tried to start. Fixed by
 *      awaiting init+migration synchronously in `configs/startup.ts`
 *      (done in a previous commit) and by serializing all seed
 *      writes inside one transaction here.
 *
 *   3. **Silent data wipe.** The seed used to `DELETE FROM` every
 *      table on every cold start in `__DEV__`, blowing away any
 *      product, sale, or suki the user had entered since the last
 *      seed. Fixed by checking whether any rows already exist and
 *      bailing out if so.
 */
export const seedProductCatalog = async () => {
  const existingCatalog = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) AS c FROM product_catalog',
  );
  if (existingCatalog && existingCatalog.c > 0) {
    console.log('🌱 Product catalog is already seeded.');
    return;
  }
  console.log('🌱 Seeding universal product catalog from static assets...');

  const combined = [
    ...beverages.map((item) => ({ ...item, brand: 'Nestle', unit: 'Pc', imageUrl: null })),
    ...cannedGoods.map((item) => ({ ...item, brand: 'Century', unit: 'Pc', imageUrl: null })),
    ...noodles.map((item) => ({ ...item, brand: 'Lucky Me', unit: 'Pc', imageUrl: null })),
    ...snacks.map((item) => ({ ...item, brand: 'Oishi', unit: 'Pc', imageUrl: null })),
  ];

  await db.withTransactionAsync(async () => {
    for (const item of combined) {
      await db.runAsync(
        `INSERT OR IGNORE INTO product_catalog (barcode, name, brand, category, unit, image_url, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [item.barcode, item.name, item.brand, item.category, item.unit, item.imageUrl, Date.now()]
      );
    }
  });
  console.log(`✅ Seeded ${combined.length} universal catalog products.`);
};

export const seedDatabase = async () => {
  console.log('🌱 Checking whether to seed the database...');

  // Always check and seed the universal product catalog first
  try {
    await seedProductCatalog();
  } catch (error) {
    console.error('❌ Failed to seed universal product catalog:', error);
  }

  // Bail out if the user has any data of their own. The seed is
  // strictly for first-run demo data; it must never overwrite
  // anything the user has entered.
  const existingProduct = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) AS c FROM products',
  );
  if (existingProduct && existingProduct.c > 0) {
    console.log('🌱 Products table is non-empty — skipping seed.');
    return;
  }

  console.log('🌱 Empty database — seeding mock data...');

  try {
    await db.withTransactionAsync(async () => {
      // 1. Seed Categories
      for (const cat of MOCK_CATEGORIES) {
        await db.runAsync(
          'INSERT INTO categories (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
          [cat.id, cat.name, cat.created_at, cat.updated_at],
        );
      }

      // 2. Seed Products
      for (const prod of MOCK_PRODUCTS) {
        await db.runAsync(
          'INSERT INTO products (id, name, sku, price, cost_price, quantity, category, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            prod.id,
            prod.name,
            prod.sku,
            prod.price,
            prod.cost_price,
            prod.quantity,
            prod.category,
            prod.created_at,
            prod.updated_at,
          ],
        );
      }

      // 3. Seed Customers
      for (const cust of MOCK_CUSTOMERS) {
        await db.runAsync(
          'INSERT INTO customers (id, name, phone, address, notes, credit_limit, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            cust.id,
            cust.name,
            cust.phone,
            cust.address,
            cust.notes,
            cust.credit_limit,
            cust.created_at,
            cust.updated_at,
          ],
        );
      }

      // 4. Seed Credit Transactions
      for (const ct of MOCK_CREDIT_TRANSACTIONS) {
        await db.runAsync(
          'INSERT INTO credit_transactions (id, customer_id, product_id, product_name, quantity, amount, status, amount_paid, date, due_date, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            ct.id,
            ct.customer_id,
            ct.product_id,
            ct.product_name,
            ct.quantity,
            ct.amount,
            ct.status,
            ct.amount_paid,
            ct.date,
            ct.due_date,
            ct.notes,
            ct.created_at,
            ct.updated_at,
          ],
        );
      }

      // 5. Seed Payments
      for (const pay of MOCK_PAYMENTS) {
        await db.runAsync(
          'INSERT INTO payments (id, customer_id, credit_transaction_id, amount, payment_method, date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            pay.id,
            pay.customer_id,
            pay.credit_transaction_id,
            pay.amount,
            pay.payment_method,
            pay.date,
            pay.notes,
            pay.created_at,
          ],
        );
      }

      // 6. Seed Sales
      for (const sale of MOCK_SALES) {
        await db.runAsync(
          'INSERT INTO sales (id, total, payment_type, customer_name, customer_credit_id, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
          [
            sale.id,
            sale.total,
            sale.payment_type,
            sale.customer_name,
            sale.customer_credit_id,
            sale.timestamp,
          ],
        );
      }

      // 7. Seed Sale Items
      for (const item of MOCK_SALE_ITEMS) {
        await db.runAsync(
          'INSERT INTO sale_items (id, sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?, ?)',
          [item.id, item.sale_id, item.product_id, item.quantity, item.price],
        );
      }

      // 8. Seed Inventory Transactions
      for (const tx of MOCK_INVENTORY_TRANSACTIONS) {
        await db.runAsync(
          'INSERT INTO inventory_transactions (id, product_id, type, quantity, timestamp) VALUES (?, ?, ?, ?, ?)',
          [tx.id, tx.product_id, tx.type, tx.quantity, tx.timestamp],
        );
      }
    });

    console.log(
      `✅ Seeded ${MOCK_CATEGORIES.length} categories, ${MOCK_PRODUCTS.length} products, ${MOCK_CUSTOMERS.length} customers, ${MOCK_CREDIT_TRANSACTIONS.length} credit transactions, ${MOCK_PAYMENTS.length} payments, ${MOCK_SALES.length} sales, ${MOCK_SALE_ITEMS.length} sale items, ${MOCK_INVENTORY_TRANSACTIONS.length} inventory transactions.`,
    );
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
};
