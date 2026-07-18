// tests/__setup__/expo-sqlite-mock.ts
// A better-sqlite3-backed mock of the expo-sqlite API surface the app uses
// (execAsync, runAsync, getFirstAsync, getAllAsync, withTransactionAsync).
//
// The test DB lives in `:memory:` and is created once per Jest worker.
// `jest.mock` in `jest.setup.ts` wires this into `@/configs/sqlite` so every
// `database/*` test gets a real, transactional SQLite under the hood.
//
// We do NOT mock the whole of `expo-sqlite` here — the real module is mocked
// in `jest.setup.ts` with `jest.mock('expo-sqlite', () => ({ openDatabaseSync: ... }))`
// so anything that opens a second connection accidentally would fail fast.
// `@types/better-sqlite3` is intentionally not a devDep to keep the install
// lean; the import below has its own minimal ambient .d.ts to avoid an
// `any` type at every call site.
// eslint-disable-next-line @typescript-eslint/no-var-requires
import Database = require('better-sqlite3');
// `new Database(...)` works against the `.d.ts` ambient declaration.

const betterDb = new Database(':memory:');

// Reuse the FK pragma to match the production migrations (which set
// `PRAGMA foreign_keys = ON` after init). The test environment never disables it.
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
	getFirstAsync: async <T = any>(sql: string, params: any[] = []): Promise<T | null> => {
		const stmt = betterDb.prepare(sql);
		return (stmt.get(params) as T) || null;
	},
	getAllAsync: async <T = any>(sql: string, params: any[] = []): Promise<T[]> => {
		const stmt = betterDb.prepare(sql);
		return stmt.all(params) as T[];
	},
	// expo-sqlite's withTransactionAsync is async; better-sqlite3 transactions
	// are synchronous. We simulate the async shape with a SAVEPOINT, so the
	// callback's awaiters all settle before RELEASE — this matches how a real
	// async driver would behave. If the callback throws, ROLLBACK TO
	// SAVEPOINT undoes the work.
	withTransactionAsync: async <T = void>(callback: () => Promise<T>): Promise<T> => {
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

// Reset helper — used by tests that want a clean slate between cases.
export const resetMockDb = () => {
	const tables = [
		'sqlite_sequence',
		'inventory_transactions',
		'payment_allocations',
		'payments',
		'credit_transactions',
		'sale_items',
		'sales',
		'products',
		'customers',
		'product_catalog',
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
