import { db } from '../configs/sqlite';
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

export const seedDatabase = async () => {
  console.log('🌱 Starting database seeding...');

  try {
    // Wrap all deletes and inserts in a single transaction for maximum performance
    await db.execAsync('BEGIN TRANSACTION;');

    // 1. Cleanup existing data to avoid duplicates and conflicts
    // Order is important due to foreign key constraints
    await db.execAsync(`
      DELETE FROM sale_items;
      DELETE FROM sales;
      DELETE FROM payments;
      DELETE FROM credit_transactions;
      DELETE FROM customers;
      DELETE FROM products;
      DELETE FROM categories;
      DELETE FROM inventory_transactions;
    `);
    console.log('🧹 Tables cleared.');

    // 2. Seed Categories
    for (const cat of MOCK_CATEGORIES) {
      await db.runAsync(
        'INSERT INTO categories (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
        [cat.id, cat.name, cat.created_at, cat.updated_at],
      );
    }
    console.log(`✅ Seeded ${MOCK_CATEGORIES.length} categories.`);

    // 3. Seed Products
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
    console.log(`✅ Seeded ${MOCK_PRODUCTS.length} products.`);

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
    console.log(`✅ Seeded ${MOCK_CUSTOMERS.length} customers.`);

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
    console.log(
      `✅ Seeded ${MOCK_CREDIT_TRANSACTIONS.length} credit transactions.`
    );

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
    console.log(`✅ Seeded ${MOCK_PAYMENTS.length} payments.`);

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
    console.log(`✅ Seeded ${MOCK_SALES.length} sales.`);

    // 8. Seed Sale Items
    for (const item of MOCK_SALE_ITEMS) {
      await db.runAsync(
        'INSERT INTO sale_items (id, sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?, ?)',
        [item.id, item.sale_id, item.product_id, item.quantity, item.price],
      );
    }
    console.log(`✅ Seeded ${MOCK_SALE_ITEMS.length} sale items.`);

    // 9. Seed Inventory Transactions
    for (const tx of MOCK_INVENTORY_TRANSACTIONS) {
      await db.runAsync(
        'INSERT INTO inventory_transactions (id, product_id, type, quantity, timestamp) VALUES (?, ?, ?, ?, ?)',
        [tx.id, tx.product_id, tx.type, tx.quantity, tx.timestamp],
      );
    }
    console.log(
      `✅ Seeded ${MOCK_INVENTORY_TRANSACTIONS.length} inventory transactions.`
    );

    await db.execAsync('COMMIT;');
    console.log('🚀 Database seeding completed successfully!');
  } catch (error) {
    try {
      await db.execAsync('ROLLBACK;');
      console.log('↩️ Database seeding rolled back due to error.');
    } catch (rollbackError) {
      console.error('❌ Failed to rollback seeding transaction:', rollbackError);
    }
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
};
