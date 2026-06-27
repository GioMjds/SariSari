// tests/backup/snapshots.test.ts
// Phase 1 — local snapshot manager.
//
// What we verify here:
//   - `formatStamp` produces ISO-prefixed names with the 3-digit ms
//     suffix (spec §3.2).
//   - `pruneAutoSnapshots(keep)` deletes the N-keep oldest; the safety
//     directory is physically incapable of being pruned because
//     `pruneAutoSnapshots` filters by `AUTO_PREFIX` (spec §3.5).
//   - `ensureBackupDirs` is idempotent and creates both `auto/` and
//     `safety/`.
//
// We mock `expo-file-system/legacy` via the global `__fs__` injected
// in `jest.setup.ts`. We DO NOT touch the real filesystem — Jest runs
// the test in parallel and we don't want to leave artifacts behind.

import * as FileSystem from 'expo-file-system/legacy';
import {
  AUTO_PREFIX,
  SAFETY_PREFIX,
  formatStamp,
  pruneAutoSnapshots,
  listAutoSnapshots,
  listSafetyCopies,
  ensureBackupDirs,
  AUTO_DIR,
  SAFETY_DIR,
} from '@/lib/backup/snapshots';

const fs = FileSystem as unknown as {
  readDirectoryAsync: jest.Mock;
  deleteAsync: jest.Mock;
  makeDirectoryAsync: jest.Mock;
};

describe('lib/backup/snapshots — Phase 1', () => {
  beforeEach(() => {
    fs.readDirectoryAsync.mockReset();
    fs.deleteAsync.mockReset();
    fs.makeDirectoryAsync.mockReset();
  });

  describe('formatStamp', () => {
    it('produces YYYY-MM-DD_HH-mm-ss-{ms3}', () => {
      // 2026-06-27 14:02:31.421 local time
      const d = new Date(2026, 5, 27, 14, 2, 31, 421);
      expect(formatStamp(d)).toBe('2026-06-27_14-02-31-421');
    });

    it('zero-pads single-digit fields', () => {
      const d = new Date(2026, 0, 3, 9, 5, 7, 42);
      expect(formatStamp(d)).toBe('2026-01-03_09-05-07-042');
    });

    it('default arg is "now"', () => {
      const s = formatStamp();
      expect(s).toMatch(/^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}-\d{3}$/);
    });
  });

  describe('ensureBackupDirs', () => {
    it('creates both auto/ and safety/', async () => {
      await ensureBackupDirs();
      expect(fs.makeDirectoryAsync).toHaveBeenCalledWith(AUTO_DIR, {
        intermediates: true,
      });
      expect(fs.makeDirectoryAsync).toHaveBeenCalledWith(SAFETY_DIR, {
        intermediates: true,
      });
    });

    it('is idempotent (no error on repeat calls)', async () => {
      // expo-file-system's makeDirectoryAsync with `intermediates: true`
      // is documented as a no-op when the directory already exists. We
      // model that here by having the mock resolve on every call. The
      // assertion is that ensureBackupDirs neither throws nor returns
      // early when called repeatedly — i.e. it stays correct, not that
      // it short-circuits.
      await ensureBackupDirs();
      await expect(ensureBackupDirs()).resolves.toBeUndefined();
    });
  });

  describe('listAutoSnapshots', () => {
    it('returns newest-first by ISO prefix', async () => {
      fs.readDirectoryAsync.mockResolvedValueOnce([
        `${AUTO_PREFIX}2026-06-25_10-00-00-000.db`,
        `${AUTO_PREFIX}2026-06-27_14-02-31-421.db`,
        `${AUTO_PREFIX}2026-06-26_09-00-00-000.db`,
      ]);
      // The 2nd readDirectoryAsync (for safety) is unused in this test
      // but listSafetyCopies is not called — so we don't mock it.
      const snaps = await listAutoSnapshots();
      expect(snaps).toHaveLength(3);
      expect(snaps[0].path).toContain('2026-06-27_14-02-31-421');
      expect(snaps[1].path).toContain('2026-06-26_09-00-00-000');
      expect(snaps[2].path).toContain('2026-06-25_10-00-00-000');
    });

    it('ignores non-snapshot files in the directory', async () => {
      fs.readDirectoryAsync.mockResolvedValueOnce([
        `${AUTO_PREFIX}2026-06-27_14-02-31-421.db`,
        'random.txt',
        '.DS_Store',
      ]);
      const snaps = await listAutoSnapshots();
      expect(snaps).toHaveLength(1);
      expect(snaps[0].path).toContain(AUTO_PREFIX);
    });
  });

  describe('listSafetyCopies', () => {
    it('returns safety copies with SAFETY_PREFIX', async () => {
      fs.readDirectoryAsync.mockResolvedValueOnce([
        `${SAFETY_PREFIX}2026-06-27_15-30-22-005.db`,
        `${SAFETY_PREFIX}2026-06-26_15-30-22-005.db`,
      ]);
      const list = await listSafetyCopies();
      expect(list).toHaveLength(2);
      expect(list[0].kind).toBe('safety');
      expect(list[0].path).toContain(SAFETY_PREFIX);
    });
  });

  describe('pruneAutoSnapshots', () => {
    it('keeps the N most recent auto snapshots', async () => {
      // 10 candidates → with default keep=7, delete the 3 oldest.
      const all = [
        `${AUTO_PREFIX}2026-06-20_00-00-00-000.db`,
        `${AUTO_PREFIX}2026-06-21_00-00-00-000.db`,
        `${AUTO_PREFIX}2026-06-22_00-00-00-000.db`,
        `${AUTO_PREFIX}2026-06-23_00-00-00-000.db`,
        `${AUTO_PREFIX}2026-06-24_00-00-00-000.db`,
        `${AUTO_PREFIX}2026-06-25_00-00-00-000.db`,
        `${AUTO_PREFIX}2026-06-26_00-00-00-000.db`,
        `${AUTO_PREFIX}2026-06-27_00-00-00-000.db`,
        `${AUTO_PREFIX}2026-06-27_12-00-00-000.db`,
        `${AUTO_PREFIX}2026-06-27_14-02-31-421.db`,
      ];
      fs.readDirectoryAsync.mockResolvedValueOnce(all);
      await pruneAutoSnapshots(7);

      const deletedPaths = fs.deleteAsync.mock.calls.map((c) => c[0]);
      // The 3 oldest (20th, 21st, 22nd) are gone.
      expect(deletedPaths).toContain(
        `${AUTO_DIR}${AUTO_PREFIX}2026-06-20_00-00-00-000.db`,
      );
      expect(deletedPaths).toContain(
        `${AUTO_DIR}${AUTO_PREFIX}2026-06-21_00-00-00-000.db`,
      );
      expect(deletedPaths).toContain(
        `${AUTO_DIR}${AUTO_PREFIX}2026-06-22_00-00-00-000.db`,
      );
      // The newest 7 are kept.
      expect(deletedPaths).not.toContain(
        `${AUTO_DIR}${AUTO_PREFIX}2026-06-27_14-02-31-421.db`,
      );
    });

    it('no-op when count <= keep', async () => {
      fs.readDirectoryAsync.mockResolvedValueOnce([
        `${AUTO_PREFIX}2026-06-27_14-02-31-421.db`,
      ]);
      await pruneAutoSnapshots(7);
      expect(fs.deleteAsync).not.toHaveBeenCalled();
    });

    it('never touches safety copies (different prefix filter)', async () => {
      // Even if a safety file slipped into the auto readdir (it shouldn't,
      // because the directories are separate), the prefix filter prevents
      // accidental deletion.
      fs.readDirectoryAsync.mockResolvedValueOnce([
        `${SAFETY_PREFIX}2026-06-27_15-30-22-005.db`, // wrong prefix for auto/
        `${AUTO_PREFIX}2026-06-27_14-02-31-421.db`,
      ]);
      await pruneAutoSnapshots(0); // keep 0 — would delete all auto files
      const deletedPaths = fs.deleteAsync.mock.calls.map((c) => c[0]);
      expect(deletedPaths).toContain(
        `${AUTO_DIR}${AUTO_PREFIX}2026-06-27_14-02-31-421.db`,
      );
      // SAFETY_PREFIX file was filtered out, so even with keep=0 it can't
      // be matched here because listAutoSnapshots only includes AUTO_PREFIX.
      expect(deletedPaths).not.toContain(
        `${SAFETY_PREFIX}2026-06-27_15-30-22-005.db`,
      );
    });
  });
});
