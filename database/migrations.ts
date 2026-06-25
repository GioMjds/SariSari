import { db } from '../configs/sqlite';

export async function runMigrations() {
  const [{ user_version: currentVersion }] = await db.getAllAsync<{ user_version: number }>('PRAGMA user_version');
  console.log(`Current database version: ${currentVersion}`);

  if (currentVersion < 2) {
    console.log('Running migration to version 2 (Inventory Events)...');
    await db.withTransactionAsync(async () => {
      // Check if note column already exists to prevent error
      const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(inventory_transactions)');
      const hasNote = columns.some(c => c.name === 'note');

      if (!hasNote && columns.length > 0) {
        // Run migration statements
        await db.execAsync('PRAGMA foreign_keys=OFF;');

        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS inventory_transactions_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('restock', 'sale', 'damaged', 'adjustment')),
            quantity INTEGER NOT NULL,
            note TEXT,
            adjustment_sign TEXT,
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id),
            CHECK(
              (type = 'adjustment' AND adjustment_sign IN ('positive', 'negative')) OR
              (type != 'adjustment' AND adjustment_sign IS NULL)
            )
          );
        `);

        await db.execAsync(`
          INSERT INTO inventory_transactions_new (id, product_id, type, quantity, timestamp)
          SELECT id, product_id, type, quantity, timestamp FROM inventory_transactions;
        `);

        await db.execAsync('DROP TABLE inventory_transactions;');
        await db.execAsync('ALTER TABLE inventory_transactions_new RENAME TO inventory_transactions;');
        await db.execAsync('PRAGMA foreign_keys=ON;');
      }

      await db.execAsync('PRAGMA user_version = 2;');
    });
    console.log('Database migrated to version 2.');
  }

  if (currentVersion < 3) {
    console.log('Running migration to version 3 (Utang audit-safety)...');
    await db.withTransactionAsync(async () => {
      // 1. Add credit_transaction_id to sales (nullable, FK to credit_transactions)
      //    and fix the broken FK target on customer_credit_id (was customer_credits(id)).
      const salesCols = await db.getAllAsync<{ name: string }>(
        'PRAGMA table_info(sales)',
      );
      const hasCreditTxnCol = salesCols.some(
        (c) => c.name === 'credit_transaction_id',
      );

      if (!hasCreditTxnCol) {
        await db.execAsync('PRAGMA foreign_keys=OFF;');
        await db.execAsync(`
          CREATE TABLE sales_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            total INTEGER NOT NULL,
            payment_type TEXT NOT NULL DEFAULT 'cash' CHECK(payment_type IN ('cash', 'credit')),
            customer_name TEXT,
            customer_credit_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
            credit_transaction_id INTEGER REFERENCES credit_transactions(id) ON DELETE SET NULL,
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP
          );
        `);
        await db.execAsync(`
          INSERT INTO sales_new (id, total, payment_type, customer_name, customer_credit_id, timestamp)
          SELECT id, total, payment_type, customer_name, customer_credit_id, timestamp FROM sales;
        `);
        await db.execAsync('DROP TABLE sales;');
        await db.execAsync('ALTER TABLE sales_new RENAME TO sales;');
        await db.execAsync(
          'CREATE INDEX IF NOT EXISTS idx_sales_credit_txn ON sales(credit_transaction_id);',
        );
        await db.execAsync('PRAGMA foreign_keys=ON;');
      }

      // 2. Create payment_allocations for reversible FIFO payment allocation.
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS payment_allocations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          payment_id INTEGER NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
          credit_transaction_id INTEGER NOT NULL REFERENCES credit_transactions(id),
          amount INTEGER NOT NULL
        );
      `);
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_payment_allocations_payment_id ON payment_allocations(payment_id);',
      );

      await db.execAsync('PRAGMA user_version = 3;');
    });
    console.log('Database migrated to version 3.');
  }
}
