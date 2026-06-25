/**
 * The one and only SQLite handle in the app.
 *
 * Do NOT call `openDatabaseSync` or `openDatabaseAsync` from anywhere
 * else in the codebase. All `database/*` files import `db` from here.
 *
 * See AGENTS.md ("One SQLite connection. Shared everywhere.").
 * Enforced by `tests/sqlite/single-handle.test.ts`.
 */
import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('sarisari.db');
