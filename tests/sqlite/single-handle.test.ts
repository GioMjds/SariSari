import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..');
const ALLOW = new Set(['configs/sqlite.ts']);
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'tests',
  'android',
  'ios',
  'build',
  'dist',
  '.expo',
]);

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.(ts|tsx)$/.test(entry)) yield p;
  }
}

describe('single SQLite handle', () => {
  it('only configs/sqlite.ts opens the database', () => {
    const offenders: string[] = [];
    const pattern = /openDatabase(Sync|Async)\s*\(/g;
    for (const file of walk(ROOT)) {
      const rel = file
        .replace(ROOT, '')
        .replace(/^[\\/]/, '')
        .replace(/\\/g, '/');
      if (ALLOW.has(rel)) continue;
      const text = readFileSync(file, 'utf8');
      if (pattern.test(text)) offenders.push(rel);
      pattern.lastIndex = 0;
    }
    expect(offenders).toEqual([]);
  });

  it('SQLiteProvider is not mounted', () => {
    for (const file of walk(ROOT)) {
      const rel = file
        .replace(ROOT, '')
        .replace(/^[\\/]/, '')
        .replace(/\\/g, '/');
      if (rel.startsWith('tests/')) continue;
      const text = readFileSync(file, 'utf8');
      expect(text).not.toMatch(/<SQLiteProvider\b/);
    }
  });
});