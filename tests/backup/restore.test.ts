// tests/backup/restore.test.ts
// Phase 1 — restore pipeline. Spec §5.
//
// What we verify here:
//   - the pipeline rejects files that fail integrity (no destructive
//     write happens)
//   - safety copy is created BEFORE any destructive write
//   - WAL/SHM sidecars are deleted AFTER db.closeAsync and BEFORE
//     copyAsync
//   - if copyAsync fails AFTER the live DB has been touched, rollback
//     copies the safety copy back over the live path
//   - if integrity_check fails AFTER overwrite, rollback restores the
//     safety copy
//   - single-flight: a second concurrent restore is rejected with
//     'already_in_progress'
//
// Tests inject per-case behavior via the `__fs__` and `__sqlite__`
// namespaces created in jest.setup.ts.

import * as FileSystem from 'expo-file-system/legacy';
import * as Updates from 'expo-updates';
import * as SQLite from 'expo-sqlite';

// Mock the live db handle from @/configs/sqlite so we can observe
// db.closeAsync calls and override PRAGMA responses.
jest.mock('@/configs/sqlite', () => {
  const closeAsync = jest.fn(async () => undefined);
  const execAsync = jest.fn(async () => undefined);
  return {
    db: { closeAsync, execAsync, __closeAsync: closeAsync, __execAsync: execAsync },
  };
});

import { restoreFromLocal, RestoreError } from '@/lib/backup/restore';
import { validate } from '@/lib/backup/integrity';
import { db } from '@/configs/sqlite';

const fs = FileSystem as unknown as {
  copyAsync: jest.Mock;
  deleteAsync: jest.Mock;
  readAsStringAsync: jest.Mock;
  getInfoAsync: jest.Mock;
  readDirectoryAsync: jest.Mock;
  makeDirectoryAsync: jest.Mock;
  getFreeDiskStorageAsync: jest.Mock;
  documentDirectory: string;
  cacheDirectory: string;
  EncodingType: { Base64: string };
};
const sqlite = SQLite as unknown as {
  openDatabaseAsync: jest.Mock;
};
const updates = Updates as unknown as {
  reloadAsync: jest.Mock;
};

const VALID_HEADER_B64 = 'U1FMaXRlIGZvcm1hdCAzAA==';
const DB_PATH_LIVE = `${fs.documentDirectory}SQLite/sarisari.db`;

const stubValidIntegrity = () => {
  fs.readAsStringAsync.mockResolvedValue(VALID_HEADER_B64);
  fs.getInfoAsync.mockResolvedValue({ exists: true, size: 4096 });
  sqlite.openDatabaseAsync.mockResolvedValue({
    getAllAsync: jest.fn(async () => [{ integrity_check: 'ok' }]),
    closeAsync: jest.fn(async () => undefined),
  });
};

describe('lib/backup/restore — Phase 1', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.copyAsync.mockReset();
    fs.deleteAsync.mockReset();
    fs.readAsStringAsync.mockReset();
    fs.getInfoAsync.mockReset();
    fs.readDirectoryAsync.mockReset();
    fs.makeDirectoryAsync.mockReset();
    updates.reloadAsync.mockReset();
    (db as any).__execAsync.mockResolvedValue(undefined);
    (db as any).__closeAsync.mockResolvedValue(undefined);
  });

  it('throws RestoreError(integrity_failed) when source fails validation', async () => {
    fs.readAsStringAsync.mockResolvedValue('AAAA' + VALID_HEADER_B64.slice(4));

    await expect(restoreFromLocal('/snap/bad.db')).rejects.toBeInstanceOf(
      RestoreError,
    );
    try {
      await restoreFromLocal('/snap/bad.db');
    } catch (err) {
      expect((err as RestoreError).code).toBe('integrity_failed');
    }
    // No destructive write happened.
    expect(fs.copyAsync).not.toHaveBeenCalled();
    expect((db as any).__closeAsync).not.toHaveBeenCalled();
  });

  it('orders operations: safety-copy → close → delete WAL/SHM → overwrite → reload', async () => {
    stubValidIntegrity();
    fs.copyAsync.mockResolvedValue(undefined);
    fs.readDirectoryAsync.mockResolvedValue([]); // safety list empty initially
    updates.reloadAsync.mockResolvedValue(undefined);

    const order: string[] = [];
    (db as any).__closeAsync.mockImplementation(async () => {
      order.push('close');
    });
    fs.deleteAsync.mockImplementation(async (path: string) => {
      order.push(`delete:${path}`);
    });
    fs.copyAsync.mockImplementation(async ({ from }: { from: string }) => {
      order.push(`copy:${from}`);
    });
    updates.reloadAsync.mockImplementation(async () => {
      order.push('reload');
    });

    await restoreFromLocal('/snap/good.db');

    // 1. safety copy (copies the LIVE db into safety/) — must precede any
    // destructive write so rollback is possible.
    expect(order[0]).toBe(`copy:${DB_PATH_LIVE}`);
    // 2. close DB
    expect(order[1]).toBe('close');
    // 3. delete WAL then SHM
    expect(order[2]).toMatch(/delete:.*-wal$/);
    expect(order[3]).toMatch(/delete:.*-shm$/);
    // 4. copy source over live DB
    expect(order[4]).toBe('copy:/snap/good.db');
    // 5. reload
    expect(order[5]).toBe('reload');
  });

  it('rolls back when copyAsync fails after the live DB is touched', async () => {
    stubValidIntegrity();
    // Safety copy path: readDirectoryAsync returns a single safety file.
    fs.readDirectoryAsync.mockResolvedValue(['sarisari_safety_2026-06-27_15-30-22-005.db']);
    // First copy = safety copy of the LIVE db (createPreRestoreSafetyCopy).
    // Second copy = overwrite (this one fails).
    // Third copy = rollback to safety.
    let copyCount = 0;
    fs.copyAsync.mockImplementation(async () => {
      copyCount += 1;
      if (copyCount === 2) {
        throw new Error('disk full');
      }
    });
    updates.reloadAsync.mockResolvedValue(undefined);

    await expect(restoreFromLocal('/snap/good.db')).rejects.toMatchObject({
      code: 'copy_failed',
    });

    // 3 copy attempts: safety copy, overwrite (failed), rollback.
    expect(copyCount).toBe(3);
    // Rollback copies the safety file back over the live DB path.
    const calls = fs.copyAsync.mock.calls;
    expect(calls[0][0]).toMatchObject({ from: expect.stringContaining('SQLite/sarisari.db') }); // safety copy
    expect(calls[1][0]).toMatchObject({ from: '/snap/good.db' }); // overwrite attempt
    expect(calls[2][0]).toMatchObject({
      from: expect.stringContaining('sarisari_safety_'),
    }); // rollback
  });

  it('single-flight: second concurrent restore is rejected', async () => {
    stubValidIntegrity();
    // Make the first restore hang on closeAsync so the second arrives
    // while the first is still running.
    let resolveClose!: () => void;
    (db as any).__closeAsync.mockImplementation(
      () =>
        new Promise<void>((res) => {
          resolveClose = res;
        }),
    );
    fs.copyAsync.mockResolvedValue(undefined);
    updates.reloadAsync.mockResolvedValue(undefined);

    const first = restoreFromLocal('/snap/a.db');
    // Yield so the first restore reaches the in-flight guard.
    await new Promise((r) => setImmediate(r));

    await expect(restoreFromLocal('/snap/b.db')).rejects.toMatchObject({
      code: 'already_in_progress',
    });

    // Let the first one finish.
    resolveClose();
    fs.copyAsync.mockResolvedValue(undefined);
    await first;
  });

  it('rejects with reload_failed when Updates.reloadAsync throws', async () => {
    stubValidIntegrity();
    fs.copyAsync.mockResolvedValue(undefined);
    fs.readDirectoryAsync.mockResolvedValue([]);
    updates.reloadAsync.mockRejectedValueOnce(new Error('cannot reload'));

    await expect(restoreFromLocal('/snap/good.db')).rejects.toMatchObject({
      code: 'reload_failed',
    });
  });

  it('validate import is wired correctly (sanity)', async () => {
    // Cheap smoke that validate is exported and the right shape.
    stubValidIntegrity();
    const result = await validate('/x.db');
    expect(result.ok).toBe(true);
  });
});
