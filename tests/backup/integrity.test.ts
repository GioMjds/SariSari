// tests/backup/integrity.test.ts
// Phase 1 — integrity checker.
//
// What we verify here:
//   - magic header match/mismatch
//   - file-size sanity (1KB..100MB)
//   - PRAGMA integrity_check on a separate handle (via __sqlite__ stub)
//   - separate read-only handle is closed even if the check throws
//
// `expo-file-system/legacy` and `expo-sqlite` are mocked in jest.setup.ts
// via the global `__fs__` and `__sqlite__` namespaces. Tests configure
// each per-case.

import * as FileSystem from 'expo-file-system/legacy';
import * as SQLite from 'expo-sqlite';
import { validate } from '@/lib/backup/integrity';

const fs = FileSystem as unknown as {
  readAsStringAsync: jest.Mock;
  getInfoAsync: jest.Mock;
};
const sqlite = SQLite as unknown as {
  openDatabaseAsync: jest.Mock;
};

// 16 bytes "SQLite format 3\0" base64-encoded.
const VALID_HEADER_B64 = 'U1FMaXRlIGZvcm1hdCAzAA==';
const BAD_HEADER_B64 = 'AAAA' + VALID_HEADER_B64.slice(4);

describe('lib/backup/integrity — Phase 1', () => {
  beforeEach(() => {
    fs.readAsStringAsync.mockReset();
    fs.getInfoAsync.mockReset();
    sqlite.openDatabaseAsync.mockReset();
  });

  it('accepts a valid header + sane size + ok integrity_check', async () => {
    fs.readAsStringAsync.mockResolvedValueOnce(VALID_HEADER_B64);
    fs.getInfoAsync.mockResolvedValueOnce({ exists: true, size: 4096 });
    const closeAsync = jest.fn(async () => undefined);
    sqlite.openDatabaseAsync.mockResolvedValueOnce({
      getAllAsync: jest.fn(async () => [{ integrity_check: 'ok' }]),
      closeAsync,
    });

    const result = await validate('/fake/path.db');
    expect(result).toEqual({ ok: true });
    expect(closeAsync).toHaveBeenCalledTimes(1);
  });

  it('rejects when magic header does not match', async () => {
    fs.readAsStringAsync.mockResolvedValueOnce(BAD_HEADER_B64);
    // size sanity happens AFTER header in our impl; if header fails we
    // skip size + integrity_check entirely.
    const result = await validate('/fake/path.db');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('bad_header');
    expect(sqlite.openDatabaseAsync).not.toHaveBeenCalled();
  });

  it('rejects when file is smaller than 1KB', async () => {
    fs.readAsStringAsync.mockResolvedValueOnce(VALID_HEADER_B64);
    fs.getInfoAsync.mockResolvedValueOnce({ exists: true, size: 512 });
    const result = await validate('/fake/path.db');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('unreasonable_size');
  });

  it('rejects when file is larger than 100MB', async () => {
    fs.readAsStringAsync.mockResolvedValueOnce(VALID_HEADER_B64);
    fs.getInfoAsync.mockResolvedValueOnce({
      exists: true,
      size: 200 * 1024 * 1024,
    });
    const result = await validate('/fake/path.db');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('unreasonable_size');
  });

  it('rejects when file is missing', async () => {
    fs.readAsStringAsync.mockResolvedValueOnce(VALID_HEADER_B64);
    fs.getInfoAsync.mockResolvedValueOnce({ exists: false, size: 0 });
    const result = await validate('/fake/path.db');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('unreasonable_size');
  });

  it('rejects when PRAGMA integrity_check returns non-ok', async () => {
    fs.readAsStringAsync.mockResolvedValueOnce(VALID_HEADER_B64);
    fs.getInfoAsync.mockResolvedValueOnce({ exists: true, size: 4096 });
    sqlite.openDatabaseAsync.mockResolvedValueOnce({
      getAllAsync: jest.fn(async () => [
        { integrity_check: 'database disk image is malformed' },
      ]),
      closeAsync: jest.fn(async () => undefined),
    });
    const result = await validate('/fake/path.db');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('integrity_check_failed');
      expect(result.detail).toContain('malformed');
    }
  });

  it('closes the probe handle even when integrity_check throws', async () => {
    fs.readAsStringAsync.mockResolvedValueOnce(VALID_HEADER_B64);
    fs.getInfoAsync.mockResolvedValueOnce({ exists: true, size: 4096 });
    const closeAsync = jest.fn(async () => undefined);
    sqlite.openDatabaseAsync.mockResolvedValueOnce({
      getAllAsync: jest.fn(async () => {
        throw new Error('disk I/O error');
      }),
      closeAsync,
    });
    const result = await validate('/fake/path.db');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('integrity_check_failed');
    // The finally block must close the probe even though the check threw.
    expect(closeAsync).toHaveBeenCalledTimes(1);
  });
});
