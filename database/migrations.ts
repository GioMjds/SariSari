import { db } from '../configs/sqlite';

export async function runMigrations() {
  const versionRows = await db.getAllAsync<{ user_version: number }>(
    'PRAGMA user_version',
  );
  const currentVersion = versionRows[0]?.user_version ?? 0;
  console.log(`Current database version: ${currentVersion}`);

  if (currentVersion < 2) {
    console.log('Running migration to version 2 (Inventory Events)...');
    await db.withTransactionAsync(async () => {
      // Check if note column already exists to prevent error
      const columns = await db.getAllAsync<{ name: string }>(
        'PRAGMA table_info(inventory_transactions)',
      );
      const hasNote = columns.some((c) => c.name === 'note');

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
        await db.execAsync(
          'ALTER TABLE inventory_transactions_new RENAME TO inventory_transactions;',
        );
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
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_sales_timestamp ON sales(timestamp);',
      );
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);',
      );
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);',
      );
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_credit_transactions_customer_id ON credit_transactions(customer_id);',
      );
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_credit_transactions_date ON credit_transactions(date);',
      );
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_credit_transactions_status ON credit_transactions(status);',
      );
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);',
      );
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);',
      );
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_products_quantity ON products(quantity);',
      );
      await db.execAsync('PRAGMA user_version = 4;');
    });
    console.log('Database migrated to version 4.');
  }

  if (currentVersion < 5) {
    console.log('Running migration to version 5 (Product barcode column)...');
    await db.withTransactionAsync(async () => {
      const productColumns = await db.getAllAsync<{ name: string }>(
        'PRAGMA table_info(products)',
      );
      const hasBarcodeColumn = productColumns.some((c) => c.name === 'barcode');

      if (!hasBarcodeColumn) {
        await db.execAsync('ALTER TABLE products ADD COLUMN barcode TEXT;');
      }

      await db.execAsync(
        'CREATE UNIQUE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;',
      );

      await db.execAsync('PRAGMA user_version = 5;');
    });
    console.log('Database migrated to version 5.');
  }

  if (currentVersion < 6) {
    console.log(
      'Running migration to version 6 (Aging-bucket composite index)...',
    );
    await db.withTransactionAsync(async () => {
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_credit_transactions_status_date ON credit_transactions(status, date);',
      );

      await db.execAsync('PRAGMA user_version = 6;');
    });
    console.log('Database migrated to version 6.');
  }

  if (currentVersion < 7) {
    console.log(
      'Running migration to version 7 (Supplier Directory & Purchase Costing)...',
    );
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
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);',
      );

      // 2. Add supplier_id column to products
      const productColumns = await db.getAllAsync<{ name: string }>(
        'PRAGMA table_info(products)',
      );
      const hasSupplierId = productColumns.some(
        (c) => c.name === 'supplier_id',
      );
      if (!hasSupplierId) {
        await db.execAsync(
          'ALTER TABLE products ADD COLUMN supplier_id TEXT REFERENCES suppliers(id) ON DELETE SET NULL;',
        );
      }
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);',
      );

      // 3. Add unit_cost and supplier_id columns to inventory_transactions
      const invCols = await db.getAllAsync<{ name: string }>(
        'PRAGMA table_info(inventory_transactions)',
      );
      const hasUnitCost = invCols.some((c) => c.name === 'unit_cost');
      if (!hasUnitCost) {
        await db.execAsync(
          'ALTER TABLE inventory_transactions ADD COLUMN unit_cost REAL;',
        );
      }
      const hasTxSupplierId = invCols.some((c) => c.name === 'supplier_id');
      if (!hasTxSupplierId) {
        await db.execAsync(
          'ALTER TABLE inventory_transactions ADD COLUMN supplier_id TEXT REFERENCES suppliers(id) ON DELETE SET NULL;',
        );
      }
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_inventory_transactions_supplier_id ON inventory_transactions(supplier_id);',
      );

      await db.execAsync('PRAGMA user_version = 7;');
    });
    console.log('Database migrated to version 7.');
  }

  if (currentVersion < 8) {
    console.log('Running migration to version 8 (Product image URI)...');
    await db.withTransactionAsync(async () => {
      const productColumns = await db.getAllAsync<{ name: string }>(
        'PRAGMA table_info(products)',
      );
      const hasImageUri = productColumns.some((c) => c.name === 'image_uri');
      if (!hasImageUri) {
        await db.execAsync('ALTER TABLE products ADD COLUMN image_uri TEXT;');
      }
      await db.execAsync('PRAGMA user_version = 8;');
    });
    console.log('Database migrated to version 8.');
  }

  if (currentVersion < 9) {
    console.log(
      'Running migration to version 9 (Tingi vs. Pakyaw packaging units)...',
    );
    await db.withTransactionAsync(async () => {
      const productColumns = await db.getAllAsync<{ name: string }>(
        'PRAGMA table_info(products)',
      );
      const hasRetailUnit = productColumns.some(
        (c) => c.name === 'retail_unit_name',
      );
      if (!hasRetailUnit) {
        await db.execAsync(
          "ALTER TABLE products ADD COLUMN retail_unit_name TEXT NOT NULL DEFAULT 'Pc';",
        );
        await db.execAsync(
          'ALTER TABLE products ADD COLUMN wholesale_unit_name TEXT;',
        );
        await db.execAsync(
          'ALTER TABLE products ADD COLUMN wholesale_price INTEGER;',
        );
        await db.execAsync(
          'ALTER TABLE products ADD COLUMN wholesale_cost_price INTEGER;',
        );
        await db.execAsync(
          'ALTER TABLE products ADD COLUMN conversion_factor INTEGER;',
        );
        await db.execAsync(
          'ALTER TABLE products ADD COLUMN wholesale_barcode TEXT;',
        );
        await db.execAsync(
          'CREATE UNIQUE INDEX IF NOT EXISTS idx_products_wholesale_barcode ON products(wholesale_barcode) WHERE wholesale_barcode IS NOT NULL;',
        );
      }

      const saleItemColumns = await db.getAllAsync<{ name: string }>(
        'PRAGMA table_info(sale_items)',
      );
      const hasSoldUnitName = saleItemColumns.some(
        (c) => c.name === 'sold_unit_name',
      );
      if (!hasSoldUnitName) {
        await db.execAsync(
          'ALTER TABLE sale_items ADD COLUMN sold_unit_name TEXT;',
        );
        await db.execAsync(
          'ALTER TABLE sale_items ADD COLUMN sold_unit_qty INTEGER;',
        );
        await db.execAsync(
          'ALTER TABLE sale_items ADD COLUMN conversion_factor INTEGER;',
        );
        await db.execAsync(
          'ALTER TABLE sale_items ADD COLUMN cost_price INTEGER;',
        );
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

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS parked_carts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          label TEXT NOT NULL,
          customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
          customer_name TEXT,
          payment_type TEXT NOT NULL DEFAULT 'cash',
          payload_json TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          expires_at TEXT NOT NULL
        );
      `);
      await db.execAsync('PRAGMA user_version = 10;');
    });
    console.log('Database migrated to version 10.');
  }

  if (currentVersion < 11) {
    console.log(
      'Running migration to version 11 (Universal Product Catalog)...',
    );
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

  if (currentVersion < 13) {
    console.log(
      'Running migration to version 13 (Financial Entry Receipts)...',
    );
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS financial_entry_receipts (
          id TEXT PRIMARY KEY,
          financial_entry_id TEXT NOT NULL REFERENCES financial_entries(id) ON DELETE CASCADE,
          relative_path TEXT NOT NULL,
          slot INTEGER NOT NULL CHECK(slot BETWEEN 0 AND 4),
          created_at INTEGER NOT NULL,
          UNIQUE(financial_entry_id, slot)
        );
        CREATE INDEX IF NOT EXISTS idx_receipts_entry ON financial_entry_receipts(financial_entry_id);
      `);
      await db.execAsync('PRAGMA user_version = 13;');
    });
    console.log('Database migrated to version 13.');
  }

  if (currentVersion < 14) {
    console.log('Running migration to version 14 (POS Fast Lane)...');
    await db.withTransactionAsync(async () => {
      const productCols = await db.getAllAsync<{ name: string }>(
        'PRAGMA table_info(products)',
      );
      const hasFavorite = productCols.some((c) => c.name === 'is_favorite');
      const hasLastSold = productCols.some((c) => c.name === 'last_sold_at');

      if (!hasFavorite) {
        await db.execAsync(
          'ALTER TABLE products ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0;',
        );
      }
      if (!hasLastSold) {
        await db.execAsync(
          'ALTER TABLE products ADD COLUMN last_sold_at TEXT;',
        );
      }

      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_products_favorite ON products(is_favorite);',
      );
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_products_last_sold ON products(last_sold_at);',
      );

      await db.execAsync('PRAGMA user_version = 14;');
    });
    console.log('Database migrated to version 14.');
  }

  if (currentVersion < 15) {
    console.log(
      'Running migration to version 15 (Physical Stocktake Sessions & Counts)...',
    );
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS stocktake_sessions (
          id TEXT PRIMARY KEY,
          started_at TEXT NOT NULL,
          ended_at TEXT,
          status TEXT NOT NULL CHECK(status IN ('in_progress', 'completed', 'abandoned')),
          note TEXT,
          total_products_counted INTEGER NOT NULL DEFAULT 0,
          total_variance_pesos INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `);

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS stocktake_counts (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL REFERENCES stocktake_sessions(id) ON DELETE CASCADE,
          product_id INTEGER NOT NULL REFERENCES products(id),
          expected_qty INTEGER NOT NULL,
          counted_qty INTEGER NOT NULL,
          cost_price_at_count INTEGER,
          reason_code TEXT,
          note TEXT,
          committed_at TEXT,
          UNIQUE(session_id, product_id)
        );
      `);

      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_stocktake_counts_session ON stocktake_counts(session_id);',
      );
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_stocktake_counts_committed ON stocktake_counts(committed_at);',
      );

      await db.execAsync('PRAGMA user_version = 15;');
    });
    console.log('Database migrated to version 15.');
  }

  if (currentVersion < 16) {
    console.log('Running migration to version 16 (Utang Guardrails)...');
    await db.withTransactionAsync(async () => {
      const customerCols = await db.getAllAsync<{ name: string }>(
        'PRAGMA table_info(customers)',
      );
      const hasBlockOnExceed = customerCols.some(
        (c) => c.name === 'block_on_exceed',
      );
      const hasOverdueDays = customerCols.some(
        (c) => c.name === 'overdue_threshold_days',
      );
      if (!hasBlockOnExceed) {
        await db.execAsync(
          'ALTER TABLE customers ADD COLUMN block_on_exceed INTEGER NOT NULL DEFAULT 0;',
        );
      }
      if (!hasOverdueDays) {
        await db.execAsync(
          'ALTER TABLE customers ADD COLUMN overdue_threshold_days INTEGER NOT NULL DEFAULT 30;',
        );
      }

      const salesCols = await db.getAllAsync<{ name: string }>(
        'PRAGMA table_info(sales)',
      );
      const hasSalesCode = salesCols.some(
        (c) => c.name === 'override_reason_code',
      );
      if (!hasSalesCode) {
        await db.execAsync(
          'ALTER TABLE sales ADD COLUMN override_reason_code TEXT;',
        );
        await db.execAsync(
          'ALTER TABLE sales ADD COLUMN override_reason_note TEXT;',
        );
      }

      const ctCols = await db.getAllAsync<{ name: string }>(
        'PRAGMA table_info(credit_transactions)',
      );
      const hasCtCode = ctCols.some((c) => c.name === 'override_reason_code');
      if (!hasCtCode) {
        await db.execAsync(
          'ALTER TABLE credit_transactions ADD COLUMN override_reason_code TEXT;',
        );
        await db.execAsync(
          'ALTER TABLE credit_transactions ADD COLUMN override_reason_note TEXT;',
        );
      }

      await db.execAsync('PRAGMA user_version = 16;');
    });
    console.log('Database migrated to version 16.');
  }

  if (currentVersion < 17) {
    console.log('Running migration to version 17 (Collection Queue)...');
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS collection_followups (
          id              INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id     INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
          follow_up_by    TEXT,
          contacts_today  INTEGER NOT NULL DEFAULT 0,
          last_contact_at TEXT,
          status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
          created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_collection_followups_customer_id ON collection_followups(customer_id);',
      );
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_collection_followups_status_follow_up_by ON collection_followups(status, follow_up_by);',
      );
      await db.execAsync('PRAGMA user_version = 17;');
    });
    console.log('Database migrated to version 17.');
  }

  if (currentVersion < 18) {
    console.log(
      'Running migration to version 18 (Unique follow-up per customer)...',
    );
    await db.withTransactionAsync(async () => {
      // Remove duplicate rows, keeping the most recently updated one per customer.
      await db.execAsync(`
        DELETE FROM collection_followups
        WHERE id NOT IN (
          SELECT id FROM (
            SELECT id,
                   ROW_NUMBER() OVER (
                     PARTITION BY customer_id
                     ORDER BY updated_at DESC, id DESC
                   ) AS rn
            FROM collection_followups
          ) ranked
          WHERE rn = 1
        );
      `);
      await db.execAsync(
        'DROP INDEX IF EXISTS idx_collection_followups_customer_id;',
      );
      await db.execAsync(
        'CREATE UNIQUE INDEX IF NOT EXISTS idx_collection_followups_customer_id ON collection_followups(customer_id);',
      );
      await db.execAsync('PRAGMA user_version = 18;');
    });
    console.log('Database migrated to version 18.');
  }

  if (currentVersion < 19) {
    console.log(
      'Running migration to v19 (Safe Voids, Refunds & Corrections)...',
    );
    await db.withTransactionAsync(async () => {
      // 1. Widen cash_entries.type CHECK to include 'cash_refund'.
      await db.execAsync('PRAGMA foreign_keys=OFF;');
      await db.execAsync(`
      CREATE TABLE cash_entries_new (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,
        type TEXT NOT NULL CHECK(type IN ('expense','owner_drawing','owner_addition','cash_refund')),
        amount INTEGER NOT NULL,
        notes TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);
      await db.execAsync(
        'INSERT INTO cash_entries_new SELECT * FROM cash_entries;',
      );
      await db.execAsync('DROP TABLE cash_entries;');
      await db.execAsync(
        'ALTER TABLE cash_entries_new RENAME TO cash_entries;',
      );
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_cash_entries_session ON cash_entries(session_id);',
      );
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_cash_entries_timestamp ON cash_entries(timestamp);',
      );

      // 2. app_settings key/value table + seed.
      await db.execAsync(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
      await db.runAsync(
        "INSERT OR IGNORE INTO app_settings (key, value, updated_at) VALUES ('void_window_hours', '24', CAST(strftime('%s','now') AS INTEGER) * 1000)",
      );

      // 3. sales cancellation columns.
      const salesCols = await db.getAllAsync<{ name: string }>(
        'PRAGMA table_info(sales)',
      );
      if (!salesCols.some((c) => c.name === 'cancelled_at')) {
        await db.execAsync('ALTER TABLE sales ADD COLUMN cancelled_at TEXT;');
      }
      if (!salesCols.some((c) => c.name === 'cancelled_by_kind')) {
        await db.execAsync(
          "ALTER TABLE sales ADD COLUMN cancelled_by_kind TEXT CHECK(cancelled_by_kind IN ('void','refund','price_correction') OR cancelled_by_kind IS NULL);",
        );
      }
      if (!salesCols.some((c) => c.name === 'cancelled_by_correction_id')) {
        await db.execAsync(
          'ALTER TABLE sales ADD COLUMN cancelled_by_correction_id INTEGER REFERENCES sale_corrections(id);',
        );
      }

      // 4. credit_transactions cancellation columns.
      const ctCols = await db.getAllAsync<{ name: string }>(
        'PRAGMA table_info(credit_transactions)',
      );
      if (!ctCols.some((c) => c.name === 'cancelled_at')) {
        await db.execAsync(
          'ALTER TABLE credit_transactions ADD COLUMN cancelled_at TEXT;',
        );
      }
      if (!ctCols.some((c) => c.name === 'cancelled_by_correction_id')) {
        await db.execAsync(
          'ALTER TABLE credit_transactions ADD COLUMN cancelled_by_correction_id INTEGER REFERENCES sale_corrections(id);',
        );
      }

      // 5. sale_corrections table (append-only audit log).
      await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sale_corrections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL REFERENCES sales(id),
        kind TEXT NOT NULL CHECK(kind IN ('void','refund','price_correction')),
        actor_reason_code TEXT NOT NULL,
        actor_note TEXT,
        actor_user TEXT NOT NULL,
        witness_user TEXT,
        refund_payment_type TEXT CHECK(refund_payment_type IN ('cash') OR refund_payment_type IS NULL),
        sale_total INTEGER,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CHECK (kind <> 'refund' OR refund_payment_type IS NOT NULL)
      );
    `);
      const scCols = await db.getAllAsync<{ name: string }>(
        'PRAGMA table_info(sale_corrections)',
      );
      if (scCols.length > 0 && !scCols.some((c) => c.name === 'sale_total')) {
        await db.execAsync(
          'ALTER TABLE sale_corrections ADD COLUMN sale_total INTEGER;',
        );
      }
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_sale_corrections_sale_id ON sale_corrections(sale_id);',
      );
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_sale_corrections_created_at ON sale_corrections(created_at DESC, id DESC);',
      );

      // 6. sale_correction_lines (per-line price deltas).
      await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sale_correction_lines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        correction_id INTEGER NOT NULL REFERENCES sale_corrections(id) ON DELETE CASCADE,
        sale_item_id INTEGER NOT NULL REFERENCES sale_items(id),
        old_price INTEGER NOT NULL,
        new_price INTEGER NOT NULL,
        price_delta INTEGER NOT NULL,
        CHECK (price_delta <> 0)
      );
    `);
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_sale_correction_lines_correction_id ON sale_correction_lines(correction_id);',
      );

      await db.execAsync('PRAGMA foreign_keys=ON;');
      await db.execAsync('PRAGMA user_version = 19;');
    });
    console.log('Database migrated to v19.');
  }

  if (currentVersion < 20) {
    console.log(
      'Running migration to v20 (Owner PIN for Sensitive Actions)...',
    );
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS app_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `);

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS auth_settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          pin_hash TEXT NOT NULL,
          pin_salt TEXT NOT NULL,
          recovery_code_hash TEXT NOT NULL,
          recovery_code_salt TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `);

      await db.runAsync(
        "INSERT OR IGNORE INTO app_settings (key, value, updated_at) VALUES ('owner_pin_discount_threshold_pesos', '50', CAST(strftime('%s','now') AS INTEGER) * 1000)",
      );
      await db.runAsync(
        "INSERT OR IGNORE INTO app_settings (key, value, updated_at) VALUES ('owner_pin_discount_threshold_percent', '10', CAST(strftime('%s','now') AS INTEGER) * 1000)",
      );

      await db.execAsync('PRAGMA user_version = 20;');
    });
    console.log('Database migrated to v20.');
  }

  if (currentVersion < 21) {
    console.log(
      'Running migration to v21 (Schema alignment and repair for cancellations)...',
    );
    await db.withTransactionAsync(async () => {
      // 1. Repair customer columns that predate the profile fields.
      const customerCols = await db.getAllAsync<{ name: string }>(
        'PRAGMA table_info(customers)',
      );
      if (!customerCols.some((column) => column.name === 'birthday')) {
        await db.execAsync('ALTER TABLE customers ADD COLUMN birthday TEXT;');
      }
      if (!customerCols.some((column) => column.name === 'photo_uri')) {
        await db.execAsync('ALTER TABLE customers ADD COLUMN photo_uri TEXT;');
      }

      // 2. Ensure sales cancellation and reference columns exist
      const salesCols = await db.getAllAsync<{ name: string }>(
        'PRAGMA table_info(sales)',
      );
      if (!salesCols.some((c) => c.name === 'cancelled_at')) {
        await db.execAsync('ALTER TABLE sales ADD COLUMN cancelled_at TEXT;');
      }
      if (!salesCols.some((c) => c.name === 'cancelled_by_kind')) {
        await db.execAsync(
          "ALTER TABLE sales ADD COLUMN cancelled_by_kind TEXT CHECK(cancelled_by_kind IN ('void','refund','price_correction') OR cancelled_by_kind IS NULL);",
        );
      }
      if (!salesCols.some((c) => c.name === 'cancelled_by_correction_id')) {
        await db.execAsync(
          'ALTER TABLE sales ADD COLUMN cancelled_by_correction_id INTEGER REFERENCES sale_corrections(id);',
        );
      }
      if (!salesCols.some((c) => c.name === 'credit_transaction_id')) {
        await db.execAsync(
          'ALTER TABLE sales ADD COLUMN credit_transaction_id INTEGER REFERENCES credit_transactions(id) ON DELETE SET NULL;',
        );
      }
      if (!salesCols.some((c) => c.name === 'override_reason_code')) {
        await db.execAsync(
          'ALTER TABLE sales ADD COLUMN override_reason_code TEXT;',
        );
      }
      if (!salesCols.some((c) => c.name === 'override_reason_note')) {
        await db.execAsync(
          'ALTER TABLE sales ADD COLUMN override_reason_note TEXT;',
        );
      }
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_sales_credit_txn ON sales(credit_transaction_id);',
      );

      // 3. Ensure credit_transactions cancellation columns exist
      const ctCols = await db.getAllAsync<{ name: string }>(
        'PRAGMA table_info(credit_transactions)',
      );
      if (!ctCols.some((c) => c.name === 'cancelled_at')) {
        await db.execAsync(
          'ALTER TABLE credit_transactions ADD COLUMN cancelled_at TEXT;',
        );
      }
      if (!ctCols.some((c) => c.name === 'cancelled_by_correction_id')) {
        await db.execAsync(
          'ALTER TABLE credit_transactions ADD COLUMN cancelled_by_correction_id INTEGER REFERENCES sale_corrections(id);',
        );
      }
      if (!ctCols.some((c) => c.name === 'override_reason_code')) {
        await db.execAsync(
          'ALTER TABLE credit_transactions ADD COLUMN override_reason_code TEXT;',
        );
      }
      if (!ctCols.some((c) => c.name === 'override_reason_note')) {
        await db.execAsync(
          'ALTER TABLE credit_transactions ADD COLUMN override_reason_note TEXT;',
        );
      }

      // 4. Ensure cash_entries supports 'cash_refund'
      const cashEntriesTableInfo = await db.getFirstAsync<{ sql: string }>(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name='cash_entries'",
      );
      if (
        cashEntriesTableInfo &&
        !cashEntriesTableInfo.sql.includes('cash_refund')
      ) {
        await db.execAsync('PRAGMA foreign_keys=OFF;');
        await db.execAsync(`
          CREATE TABLE cash_entries_new (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,
            type TEXT NOT NULL CHECK(type IN ('expense','owner_drawing','owner_addition','cash_refund')),
            amount INTEGER NOT NULL,
            notes TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            created_at INTEGER NOT NULL
          );
        `);
        await db.execAsync(
          'INSERT INTO cash_entries_new SELECT * FROM cash_entries;',
        );
        await db.execAsync('DROP TABLE cash_entries;');
        await db.execAsync(
          'ALTER TABLE cash_entries_new RENAME TO cash_entries;',
        );
        await db.execAsync(
          'CREATE INDEX IF NOT EXISTS idx_cash_entries_session ON cash_entries(session_id);',
        );
        await db.execAsync(
          'CREATE INDEX IF NOT EXISTS idx_cash_entries_timestamp ON cash_entries(timestamp);',
        );
        await db.execAsync('PRAGMA foreign_keys=ON;');
      }

      // 5. Ensure sale_corrections and sale_correction_lines tables exist
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS sale_corrections (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sale_id INTEGER NOT NULL REFERENCES sales(id),
          kind TEXT NOT NULL CHECK(kind IN ('void','refund','price_correction')),
          actor_reason_code TEXT NOT NULL,
          actor_note TEXT,
          actor_user TEXT NOT NULL,
          witness_user TEXT,
          refund_payment_type TEXT CHECK(refund_payment_type IN ('cash') OR refund_payment_type IS NULL),
          sale_total INTEGER,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CHECK (kind <> 'refund' OR refund_payment_type IS NOT NULL)
        );
      `);
      const scCols = await db.getAllAsync<{ name: string }>(
        'PRAGMA table_info(sale_corrections)',
      );
      if (scCols.length > 0 && !scCols.some((c) => c.name === 'sale_total')) {
        await db.execAsync(
          'ALTER TABLE sale_corrections ADD COLUMN sale_total INTEGER;',
        );
      }
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_sale_corrections_sale_id ON sale_corrections(sale_id);',
      );
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_sale_corrections_created_at ON sale_corrections(created_at DESC, id DESC);',
      );

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS sale_correction_lines (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          correction_id INTEGER NOT NULL REFERENCES sale_corrections(id) ON DELETE CASCADE,
          sale_item_id INTEGER NOT NULL REFERENCES sale_items(id),
          old_price INTEGER NOT NULL,
          new_price INTEGER NOT NULL,
          price_delta INTEGER NOT NULL,
          CHECK (price_delta <> 0)
        );
      `);
      await db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_sale_correction_lines_correction_id ON sale_correction_lines(correction_id);',
      );

      // 6. Ensure app_settings defaults
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS app_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `);
      await db.runAsync(
        "INSERT OR IGNORE INTO app_settings (key, value, updated_at) VALUES ('void_window_hours', '24', CAST(strftime('%s','now') AS INTEGER) * 1000)",
      );
      await db.runAsync(
        "INSERT OR IGNORE INTO app_settings (key, value, updated_at) VALUES ('owner_pin_discount_threshold_pesos', '50', CAST(strftime('%s','now') AS INTEGER) * 1000)",
      );
      await db.runAsync(
        "INSERT OR IGNORE INTO app_settings (key, value, updated_at) VALUES ('owner_pin_discount_threshold_percent', '10', CAST(strftime('%s','now') AS INTEGER) * 1000)",
      );

      await db.execAsync('PRAGMA user_version = 21;');
    });
    console.log('Database migrated to v21.');
  }

  if (currentVersion < 22) {
    console.log('Running migration to v22 (Biometric owner auth settings)...');
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS app_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `);
      await db.runAsync(
        "INSERT OR IGNORE INTO app_settings (key, value, updated_at) VALUES ('biometric_unlock_enabled', '0', CAST(strftime('%s','now') AS INTEGER) * 1000)",
      );
      await db.runAsync(
        "INSERT OR IGNORE INTO app_settings (key, value, updated_at) VALUES ('app_launch_lock_enabled', '0', CAST(strftime('%s','now') AS INTEGER) * 1000)",
      );

      await db.execAsync('PRAGMA user_version = 22;');
    });
    console.log('Database migrated to v22.');
  }
}
