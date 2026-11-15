import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('sarisari.db', {
  useNewConnection: true,
});

try {
  db.execSync('PRAGMA journal_mode = WAL;');
  db.execSync('PRAGMA busy_timeout = 5000;');
  db.execSync('PRAGMA foreign_keys = ON;');
} catch (error) {
  console.warn('Failed to configure SQLite pragmas:', error);
}

/** Dev-only marker so a burst of queries can be tied to the action that caused it. */
export const perfMark = (label: string) => {
  if (__DEV__) console.log(`[perf] ---- ${label} @${Date.now() % 100000}`);
};

// Dev-only: log wall time (queue wait included) and row count for every async query.
if (__DEV__) {
  const rawGetAll = (db.getAllAsync as (...args: unknown[]) => Promise<unknown>).bind(db);
  const planned = new Set<string>();

  // Log the plan once per distinct read statement, since an explained write left open blocks COMMIT.
  const explain = async (args: unknown[]) => {
    const full = String(args[0]);
    if (planned.has(full) || !/^\s*(SELECT|WITH)/i.test(full)) return;
    planned.add(full);
    try {
      const rows = (await rawGetAll(`EXPLAIN QUERY PLAN ${full}`, ...args.slice(1))) as { detail: string }[];
      const hits = rows.map((row) => row.detail).filter((detail) => /SCAN|TEMP B-TREE/.test(detail));
      if (hits.length > 0) {
        const sql = full.replace(/\s+/g, ' ').trim().slice(0, 110);
        console.log(`[perf] PLAN ${hits.join(' ; ')} | ${sql}`);
      }
    } catch (error) {
      console.log('[perf] PLAN failed:', error);
    }
  };

  const wrap = (name: 'getAllAsync' | 'getFirstAsync' | 'runAsync' | 'execAsync') => {
    const original = (db[name] as (...args: unknown[]) => Promise<unknown>).bind(db);
    (db as unknown as Record<string, unknown>)[name] = async (...args: unknown[]) => {
      const sql = String(args[0]).replace(/\s+/g, ' ').trim().slice(0, 70);
      const start = Date.now();
      let pending = 1;
      try {
        const result = await original(...args);
        pending = Array.isArray(result) ? result.length : result ? 1 : 0;
        return result;
      } finally {
        const ms = Date.now() - start;
        console.log(`[perf] ${ms}ms ${name} rows=${pending} | ${sql}${ms >= 50 ? '  <-- SLOW' : ''}`);
        if (name !== 'execAsync') void explain(args);
      }
    };
  };
  wrap('getAllAsync');
  wrap('getFirstAsync');
  wrap('runAsync');
  wrap('execAsync');

  // Event-loop drift probe: a late 100ms tick means the JS thread was busy.
  let expected = Date.now() + 100;
  setInterval(() => {
    const drift = Date.now() - expected;
    if (drift > 50) console.log(`[perf] JS-DRIFT ${drift}ms (JS thread blocked)`);
    expected = Date.now() + 100;
  }, 100);
}
