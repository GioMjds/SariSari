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
