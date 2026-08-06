import { db } from '../configs/sqlite';
import { BUNDLED_CATALOG_RECORDS } from '../constants/barcodes';
import { insertCatalogProductsBatch } from './catalog';
import {
  MOCK_CATEGORIES,
  MOCK_SUPPLIERS,
  MOCK_PRODUCTS,
  MOCK_CUSTOMERS,
  MOCK_CREDIT_TRANSACTIONS,
  MOCK_PAYMENTS,
  MOCK_SALES,
  MOCK_SALE_ITEMS,
  MOCK_INVENTORY_TRANSACTIONS,
  MOCK_FINANCIAL_ENTRIES,
} from '@/scripts/sample-mock-datas';

export async function seedProductCatalog(): Promise<void> {
  const startedAt = Date.now();
  if (__DEV__) {
    console.log(
      '[Barcode][Seed] seeding up to',
      BUNDLED_CATALOG_RECORDS.length,
      'bundled records...',
    );
  }
  try {
    const productsToInsert = BUNDLED_CATALOG_RECORDS.map((record) => ({
      barcode: record.barcode,
      name: record.name,
      brand: null,
      category: record.category,
      unit: 'Pc',
      imageUrl: null,
    }));
    await insertCatalogProductsBatch(db, productsToInsert);
    if (__DEV__) {
      console.log(
        `[Barcode][Seed] catalog seed complete in ${Date.now() - startedAt}ms.`,
      );
    }
  } catch (error) {
    console.error(
      'Failed to seed bundled product catalog; continuing without catalog metadata.',
      error,
    );
  }
}

export const seedDatabase = async () => {
  console.log('🌱 Checking whether to seed the database...');

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

      // 2. Seed Suppliers
      for (const sup of MOCK_SUPPLIERS) {
        await db.runAsync(
          'INSERT INTO suppliers (id, name, contact, notes, created_at) VALUES (?, ?, ?, ?, ?)',
          [
            sup.id,
            sup.name,
            sup.contact ?? null,
            sup.notes ?? null,
            sup.created_at,
          ],
        );
      }

      // 3. Seed Products
      for (const prod of MOCK_PRODUCTS) {
        await db.runAsync(
          `INSERT INTO products (
            id, name, sku, price, cost_price, quantity, category, created_at, updated_at,
            barcode, supplier_id, retail_unit_name, wholesale_unit_name,
            wholesale_price, wholesale_cost_price, conversion_factor, is_favorite
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            prod.id,
            prod.name,
            prod.sku ?? null,
            prod.price,
            prod.cost_price ?? null,
            prod.quantity,
            prod.category ?? null,
            prod.created_at,
            prod.updated_at,
            prod.barcode ?? null,
            prod.supplier_id ?? null,
            prod.retail_unit_name ?? 'Pc',
            prod.wholesale_unit_name ?? null,
            prod.wholesale_price ?? null,
            prod.wholesale_cost_price ?? null,
            prod.conversion_factor ?? null,
            prod.is_favorite ?? 0,
          ],
        );
      }

      // 4. Seed Customers
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

      // 5. Seed Credit Transactions
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

      // 6. Seed Payments
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

      // 7. Seed Sales
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

      // 8. Seed Sale Items
      for (const item of MOCK_SALE_ITEMS) {
        await db.runAsync(
          'INSERT INTO sale_items (id, sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?, ?)',
          [item.id, item.sale_id, item.product_id, item.quantity, item.price],
        );
      }

      // 9. Seed Inventory Transactions
      for (const tx of MOCK_INVENTORY_TRANSACTIONS) {
        await db.runAsync(
          'INSERT INTO inventory_transactions (id, product_id, type, quantity, note, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
          [
            tx.id,
            tx.product_id,
            tx.type,
            tx.quantity,
            tx.note ?? null,
            tx.timestamp,
          ],
        );
      }

      // 10. Seed Financial Entries (Gastos / Kaha)
      for (const fe of MOCK_FINANCIAL_ENTRIES) {
        await db.runAsync(
          'INSERT INTO financial_entries (id, entry_type, amount, business_date, expense_category, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            fe.id,
            fe.entry_type,
            fe.amount,
            fe.business_date,
            fe.expense_category ?? null,
            fe.note ?? null,
            fe.created_at,
            fe.updated_at,
          ],
        );
      }
    });

    console.log(
      `✅ Seeded ${MOCK_CATEGORIES.length} categories, ${MOCK_SUPPLIERS.length} suppliers, ${MOCK_PRODUCTS.length} products, ${MOCK_CUSTOMERS.length} customers, ${MOCK_CREDIT_TRANSACTIONS.length} credit transactions, ${MOCK_PAYMENTS.length} payments, ${MOCK_SALES.length} sales, ${MOCK_SALE_ITEMS.length} sale items, ${MOCK_INVENTORY_TRANSACTIONS.length} inventory transactions, ${MOCK_FINANCIAL_ENTRIES.length} financial entries.`,
    );
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
};
