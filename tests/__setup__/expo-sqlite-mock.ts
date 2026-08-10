// @ts-ignore
import Database = require('better-sqlite3');

const betterDb = new Database(':memory:');

betterDb.pragma('foreign_keys = ON');

export const mockDb = {
  execAsync: async (sql: string) => {
    betterDb.exec(sql);
  },
  runAsync: async (sql: string, params: any[] = []) => {
    const stmt = betterDb.prepare(sql);
    const info = stmt.run(params);
    return {
      lastInsertRowId: info.changes > 0 ? Number(info.lastInsertRowid) : 0,
      changes: info.changes,
    };
  },
  getFirstAsync: async <T = any>(
    sql: string,
    params: any[] = [],
  ): Promise<T | null> => {
    const stmt = betterDb.prepare(sql);
    return (stmt.get(params) as T) || null;
  },
  getAllAsync: async <T = any>(
    sql: string,
    params: any[] = [],
  ): Promise<T[]> => {
    const stmt = betterDb.prepare(sql);
    return stmt.all(params) as T[];
  },
  withTransactionAsync: async <T = void>(
    callback: () => Promise<T>,
  ): Promise<T> => {
    betterDb.exec('SAVEPOINT test_savepoint');
    try {
      const result = await callback();
      betterDb.exec('RELEASE SAVEPOINT test_savepoint');
      return result;
    } catch (err) {
      betterDb.exec('ROLLBACK TO SAVEPOINT test_savepoint');
      throw err;
    }
  },
};

export const resetMockDb = () => {
  const tables = [
    'sqlite_sequence',
    'financial_entries',
    'inventory_transactions',
    'payment_allocations',
    'payments',
    'credit_transactions',
    'sale_items',
    'sales',
    'products',
    'customers',
    'product_catalog',
    'parked_carts',
    'stocktake_counts',
    'stocktake_sessions',
  ];
  for (const table of tables) {
    try {
      betterDb.exec(`DELETE FROM ${table};`);
    } catch (err: any) {
      if (err.message.includes('no such table')) {
        // safe to ignore if table hasn't been initialized yet
      } else {
        throw err;
      }
    }
  }
};

export default mockDb;
