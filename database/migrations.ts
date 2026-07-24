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

  if (currentVersion < 4) {
    console.log('Running migration to version 4 (Performance Indexes)...');
    await db.withTransactionAsync(async () => {
      await db.execAsync('CREATE INDEX IF NOT EXISTS idx_sales_timestamp ON sales(timestamp);');
      await db.execAsync('CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);');
      await db.execAsync('CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);');
      await db.execAsync('CREATE INDEX IF NOT EXISTS idx_credit_transactions_customer_id ON credit_transactions(customer_id);');
      await db.execAsync('CREATE INDEX IF NOT EXISTS idx_credit_transactions_date ON credit_transactions(date);');
      await db.execAsync('CREATE INDEX IF NOT EXISTS idx_credit_transactions_status ON credit_transactions(status);');
      await db.execAsync('CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);');
      await db.execAsync('CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);');
      await db.execAsync('CREATE INDEX IF NOT EXISTS idx_products_quantity ON products(quantity);');
      await db.execAsync('PRAGMA user_version = 4;');
    });
    console.log('Database migrated to version 4.');
  }

  if (currentVersion < 5) {
    console.log('Running migration to version 5 (Product barcode column)...');
    // The version gate is the primary safety net against running the
    // ALTER TABLE twice. The PRAGMA probe below is a belt-and-suspenders
    // check that runs even on a fresh DB whose `user_version` jumps
    // straight to 5 (e.g. a developer who resets the version after a
    // bad migration). With both guards in place, `ALTER TABLE ADD
    // COLUMN barcode` is safe to call once.
    await db.withTransactionAsync(async () => {
      const productColumns = await db.getAllAsync<{ name: string }>(
        'PRAGMA table_info(products)',
      );
      const hasBarcodeColumn = productColumns.some(
        (c) => c.name === 'barcode',
      );

      if (!hasBarcodeColumn) {
        await db.execAsync('ALTER TABLE products ADD COLUMN barcode TEXT;');
      }

      // Partial unique index: only enforced when barcode is non-null,
      // so legacy rows with `barcode IS NULL` continue to coexist and
      // multiple "no barcode recorded" products are allowed.
      await db.execAsync(
        'CREATE UNIQUE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;',
      );

      await db.execAsync('PRAGMA user_version = 5;');
    });
    console.log('Database migrated to version 5.');
  }

  if (currentVersion < 6) {
    console.log('Running migration to version 6 (Aging-bucket composite index)...');
    await db.withTransactionAsync(async () => {
      // The getAgingBuckets query filters on status != 'paid' then ranges on
      // date.  A composite (status, date) index lets SQLite satisfy both
      // predicates with a single index range scan instead of a full-table scan.
      // Note: SQLite cannot use the plain idx_credit_transactions_date index
      // when a CAST/julianday expression wraps the column, which is why the
      // query was rewritten to use sargable date BETWEEN … clauses first.
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_credit_transactions_status_date ON credit_transactions(status, date);',
      );

      await db.execAsync('PRAGMA user_version = 6;');
    });
    console.log('Database migrated to version 6.');
  }

  if (currentVersion < 7) {
    console.log('Running migration to version 7 (Supplier Directory & Purchase Costing)...');
    await db.withTransactionAsync(async () => {
      // 1. Create table suppliers
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS suppliers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          contact TEXT,
          notes TEXT,
          created_at INTEGER NOT NULL
        );
      `);
      await db.execAsync('CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);');

      // 2. Add supplier_id column to products
      const productColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(products)');
      const hasSupplierId = productColumns.some(c => c.name === 'supplier_id');
      if (!hasSupplierId) {
        await db.execAsync('ALTER TABLE products ADD COLUMN supplier_id TEXT REFERENCES suppliers(id) ON DELETE SET NULL;');
      }
      await db.execAsync('CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);');

      // 3. Add unit_cost and supplier_id columns to inventory_transactions
      const invCols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(inventory_transactions)');
      const hasUnitCost = invCols.some(c => c.name === 'unit_cost');
      if (!hasUnitCost) {
        await db.execAsync('ALTER TABLE inventory_transactions ADD COLUMN unit_cost REAL;');
      }
      const hasTxSupplierId = invCols.some(c => c.name === 'supplier_id');
      if (!hasTxSupplierId) {
        await db.execAsync('ALTER TABLE inventory_transactions ADD COLUMN supplier_id TEXT REFERENCES suppliers(id) ON DELETE SET NULL;');
      }
      await db.execAsync('CREATE INDEX IF NOT EXISTS idx_inventory_transactions_supplier_id ON inventory_transactions(supplier_id);');

      await db.execAsync('PRAGMA user_version = 7;');
    });
    console.log('Database migrated to version 7.');
  }

  if (currentVersion < 8) {
    console.log('Running migration to version 8 (Product image URI)...');
    await db.withTransactionAsync(async () => {
      const productColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(products)');
      const hasImageUri = productColumns.some(c => c.name === 'image_uri');
      if (!hasImageUri) {
        await db.execAsync('ALTER TABLE products ADD COLUMN image_uri TEXT;');
      }
      await db.execAsync('PRAGMA user_version = 8;');
    });
    console.log('Database migrated to version 8.');
  }

  if (currentVersion < 9) {
    console.log('Running migration to version 9 (Tingi vs. Pakyaw packaging units)...');
    await db.withTransactionAsync(async () => {
      const productColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(products)');
      const hasRetailUnit = productColumns.some((c) => c.name === 'retail_unit_name');
      if (!hasRetailUnit) {
        await db.execAsync("ALTER TABLE products ADD COLUMN retail_unit_name TEXT NOT NULL DEFAULT 'Pc';");
        await db.execAsync('ALTER TABLE products ADD COLUMN wholesale_unit_name TEXT;');
        await db.execAsync('ALTER TABLE products ADD COLUMN wholesale_price INTEGER;');
        await db.execAsync('ALTER TABLE products ADD COLUMN wholesale_cost_price INTEGER;');
        await db.execAsync('ALTER TABLE products ADD COLUMN conversion_factor INTEGER;');
        await db.execAsync('ALTER TABLE products ADD COLUMN wholesale_barcode TEXT;');
        await db.execAsync(
          'CREATE UNIQUE INDEX IF NOT EXISTS idx_products_wholesale_barcode ON products(wholesale_barcode) WHERE wholesale_barcode IS NOT NULL;'
        );
      }

      const saleItemColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(sale_items)');
      const hasSoldUnitName = saleItemColumns.some((c) => c.name === 'sold_unit_name');
      if (!hasSoldUnitName) {
        await db.execAsync('ALTER TABLE sale_items ADD COLUMN sold_unit_name TEXT;');
        await db.execAsync('ALTER TABLE sale_items ADD COLUMN sold_unit_qty INTEGER;');
        await db.execAsync('ALTER TABLE sale_items ADD COLUMN conversion_factor INTEGER;');
        await db.execAsync('ALTER TABLE sale_items ADD COLUMN cost_price INTEGER;');
      }

      await db.execAsync('PRAGMA user_version = 9;');
    });
    console.log('Database migrated to version 9.');
  }

  if (currentVersion < 10) {
    console.log(
      'Running migration to version 10 (Cash Control & Stock Intelligence)...',
    );
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS cash_sessions (
          id TEXT PRIMARY KEY,
          business_date TEXT UNIQUE NOT NULL,
          opening_cash INTEGER NOT NULL,
          actual_cash INTEGER,
          expected_cash INTEGER,
          variance INTEGER,
          status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'closed')),
          opening_timestamp TEXT NOT NULL,
          closing_timestamp TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_cash_sessions_date ON cash_sessions(business_date);
      `);

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS cash_entries (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,
          type TEXT NOT NULL CHECK(type IN ('expense', 'owner_drawing', 'owner_addition')),
          amount INTEGER NOT NULL,
          notes TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_cash_entries_session ON cash_entries(session_id);
        CREATE INDEX IF NOT EXISTS idx_cash_entries_timestamp ON cash_entries(timestamp);
      `);

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS reorder_plans (
          product_id INTEGER PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
          status TEXT NOT NULL CHECK(status IN ('adjusted', 'deferred', 'dismissed')),
          adjusted_quantity INTEGER,
          deferred_until TEXT,
          last_stock INTEGER NOT NULL,
          last_demand INTEGER NOT NULL,
          last_cost INTEGER,
          last_supplier_id TEXT,
          updated_at INTEGER NOT NULL
        );
      `);

      await db.execAsync('PRAGMA user_version = 10;');
    });
    console.log('Database migrated to version 10.');
  }

  if (currentVersion < 11) {
    console.log('Running migration to version 11 (Universal Product Catalog)...');
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS product_catalog (
          barcode TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          brand TEXT,
          category TEXT,
          unit TEXT NOT NULL DEFAULT 'Pc',
          image_url TEXT,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_catalog_name ON product_catalog(name);
      `);
      await db.execAsync('PRAGMA user_version = 11;');
    });
    console.log('Database migrated to version 11.');
  }

  if (currentVersion < 12) {
  console.log(
    'Running migration to version 12 (Gastos & Kaha Financial Entries)...',
  );
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS financial_entries (
          id TEXT PRIMARY KEY,
          entry_type TEXT NOT NULL CHECK(entry_type IN ('expense', 'owner_drawing')),
          amount INTEGER NOT NULL CHECK(amount > 0),
          business_date TEXT NOT NULL,
          expense_category TEXT CHECK(expense_category IN ('transport', 'utilities', 'supplies_packaging', 'rent', 'repairs', 'other')),
          note TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          CHECK (
            (entry_type = 'expense' AND expense_category IS NOT NULL) OR
            (entry_type = 'owner_drawing' AND expense_category IS NULL)
          )
        );
        CREATE INDEX IF NOT EXISTS idx_financial_entries_date ON financial_entries(business_date);
      `);

    const hasCashEntries = await db.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='cash_entries'",
    );

    if (hasCashEntries) {
      await db.execAsync(`
          INSERT OR IGNORE INTO financial_entries (
            id, entry_type, amount, business_date, expense_category, note, created_at, updated_at
          )
          SELECT
            id,
            type AS entry_type,
            amount,
            substr(timestamp, 1, 10) AS business_date,
            CASE WHEN type = 'expense' THEN 'other' ELSE NULL END AS expense_category,
            notes AS note,
            created_at,
            created_at AS updated_at
          FROM cash_entries
          WHERE type IN ('expense', 'owner_drawing');
        `);
    }

    await db.execAsync('PRAGMA user_version = 12;');
  });
  console.log('Database migrated to version 12.');
}
}

