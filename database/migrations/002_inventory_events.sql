-- Migration: Widen CHECK constraint on inventory_transactions.type
-- Add note and adjustment_sign columns

PRAGMA foreign_keys=OFF;

CREATE TABLE inventory_transactions_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('restock', 'sale', 'damaged', 'adjustment')),
  quantity INTEGER NOT NULL,
  note TEXT,
  adjustment_sign TEXT CHECK(adjustment_sign IN ('positive', 'negative') OR adjustment_sign IS NULL),
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

INSERT INTO inventory_transactions_new (id, product_id, type, quantity, timestamp)
SELECT id, product_id, type, quantity, timestamp FROM inventory_transactions;

DROP TABLE inventory_transactions;

ALTER TABLE inventory_transactions_new RENAME TO inventory_transactions;

PRAGMA foreign_keys=ON;
