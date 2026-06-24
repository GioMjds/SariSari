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
}
