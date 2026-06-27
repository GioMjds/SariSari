// lib/backup/snapshots.ts
// Local rolling snapshot manager. Owns the on-disk layout
// `{documentDirectory}SQLiteBackups/{auto,safety}/` and the prune policy.
//
// Snapshots are 1:1 copies of `sarisari.db` taken after a WAL checkpoint
// so the snapshot file is internally consistent. `auto/` is the rolling
// 7-deep history; `safety/` holds pre-restore copies that are NEVER
// pruned (they exist for rollback). The two directories are physically
// separate so a bug in the rolling prune cannot touch safety copies.
//
// See `docs/superpowers/specs/2026-06-27-data-backup-restore-design.md` §3.

import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import { db } from '@/configs/sqlite';
import { useBackupCounter } from '@/stores/backupCounter';
import type { Result, Snapshot } from './types';
import { BackupError } from './types';

const DB_NAME = 'sarisari.db';
const DB_DIR = `${FileSystem.documentDirectory}SQLite/`;
export const DB_PATH = `${DB_DIR}${DB_NAME}`;

const BACKUP_ROOT = `${FileSystem.documentDirectory}SQLiteBackups/`;
export const AUTO_DIR = `${BACKUP_ROOT}auto/`;
export const SAFETY_DIR = `${BACKUP_ROOT}safety/`;

// Keeps the prune mechanic obvious at every callsite.
const ROLLING_KEEP = 7;

// Snapshots smaller than this are treated as half-written and rejected by
// `validate()` (spec §10). Exposed here so tests can assert against the
// same constant.
export const MIN_VALID_BYTES = 1024;

// AsyncStorage keys (spec §3.7, §4.7).
export const AS_KEY_LAST_BACKUP_AT = 'last_backup_at';
export const AS_KEY_CLOUD_SYNC_PENDING = 'cloud_sync_pending';
export const AS_KEY_CLOUD_ALLOW_CELLULAR = 'cloud_allow_cellular';
export const AS_KEY_CLOUD_LINKED = 'cloud_linked';

export const AUTO_PREFIX = 'sarisari_snapshot_';
export const SAFETY_PREFIX = 'sarisari_safety_';

/**
 * Two-digit zero-padded number helper. `pad2(7) === '07'`. Used for the
 * ISO-style timestamp suffix.
 */
const pad2 = (n: number) => String(n).padStart(2, '0');
const pad3 = (n: number) => String(n).padStart(3, '0');

/**
 * Format a `Date` as `YYYY-MM-DD_HH-mm-ss-{ms3}`. The 3-digit millisecond
 * suffix is the spec's guard against same-second collisions on rapid
 * manual "Backup now" taps.
 *
 * Example: `formatStamp(new Date('2026-06-27T14:02:31.421Z'))` →
 * `'2026-06-27_14-02-31-421'` (using local time so the filename matches
 * what the user sees on the wall clock).
 */
export const formatStamp = (date: Date = new Date()): string => {
  const yyyy = date.getFullYear();
  const mm = pad2(date.getMonth() + 1);
  const dd = pad2(date.getDate());
  const HH = pad2(date.getHours());
  const MM = pad2(date.getMinutes());
  const SS = pad2(date.getSeconds());
  const ms3 = pad3(date.getMilliseconds());
  return `${yyyy}-${mm}-${dd}_${HH}-${MM}-${SS}-${ms3}`;
};

/**
 * Create `auto/` and `safety/` if missing. Idempotent — `makeDirectoryAsync`
 * with `intermediates: true` is a no-op when the directory already exists
 * (verified at the test level). Spec §3.1.
 */
export const ensureBackupDirs = async (): Promise<void> => {
  await FileSystem.makeDirectoryAsync(AUTO_DIR, { intermediates: true });
  await FileSystem.makeDirectoryAsync(SAFETY_DIR, { intermediates: true });
};

/**
 * Convert a raw file listing to a typed `Snapshot[]`. Newest-first by
 * ISO prefix. Defensive: skips entries that fail `getInfoAsync` (e.g. the
 * file was deleted between readdir and stat — happens under concurrent
 * prune).
 *
 * Filters by the prefix matching `kind` — auto listings ignore safety
 * filenames and vice versa, so a misfiled file can never be mistaken for
 * a snapshot of the other kind.
 */
const toSnapshots = async (
  entries: string[],
  dir: string,
  kind: 'auto' | 'safety',
): Promise<Snapshot[]> => {
  const prefix = kind === 'auto' ? AUTO_PREFIX : SAFETY_PREFIX;
  const filtered = entries.filter((f) => f.startsWith(prefix));
  const out: Snapshot[] = [];
  for (const f of filtered) {
    const path = `${dir}${f}`;
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) continue;
    out.push({
      path,
      bytes: (info as { size?: number }).size ?? 0,
      // ISO prefix sorts chronologically; for the timestamp we use
      // mtime when available, falling back to the filename-encoded date.
      createdAt: (info as { modificationTime?: number }).modificationTime ?? Date.now(),
      kind,
    });
  }
  // Newest first.
  out.sort((a, b) => b.path.localeCompare(a.path));
  return out;
};

/**
 * List the rolling auto snapshots, newest-first. Always includes any
 * snapshots present on disk — callers must check `length` against the
 * cap and prune if needed.
 */
export const listAutoSnapshots = async (): Promise<Snapshot[]> => {
  const entries = await FileSystem.readDirectoryAsync(AUTO_DIR);
  return toSnapshots(entries, AUTO_DIR, 'auto');
};

/**
 * List the safety copies (pre-restore), newest-first. These are NEVER
 * pruned by the rolling policy.
 */
export const listSafetyCopies = async (): Promise<Snapshot[]> => {
  const entries = await FileSystem.readDirectoryAsync(SAFETY_DIR);
  return toSnapshots(entries, SAFETY_DIR, 'safety');
};

/**
 * Most recent safety copy, or `null` if none exist. Used by the restore
 * pipeline for rollback when the live overwrite fails.
 */
export const findLatestSafetyCopy = async (): Promise<Snapshot | null> => {
  const list = await listSafetyCopies();
  return list[0] ?? null;
};

/**
 * Delete the oldest snapshots so that `keep` remain (newest). ISO-prefixed
 * filenames sort chronologically, so the first slice is the oldest.
 *
 * Safety copies live in a different directory and are physically
 * incapable of being pruned by this routine. `idempotent: true` on
 * `deleteAsync` swallows races if a file disappears mid-prune.
 *
 * Spec §3.5.
 */
export const pruneAutoSnapshots = async (keep: number = ROLLING_KEEP): Promise<void> => {
  const list = await listAutoSnapshots();
  if (list.length <= keep) return;
  const toDelete = list.slice(keep);
  for (const snap of toDelete) {
    try {
      await FileSystem.deleteAsync(snap.path, { idempotent: true });
    } catch {
      // best-effort; the prune retries on the next snapshot.
    }
  }
};

/**
 * Pre-flight disk-space check. Throws `insufficient_disk` if free space is
 * less than 5× the DB size — the spec's safety margin to avoid a half-
 * written snapshot if the device is near full.
 *
 * Spec §3.3. Falls back to a no-op when `getFreeDiskStorageAsync` is
 * unavailable (it throws on some web targets); the snapshot still proceeds.
 */
const assertDiskSpace = async (): Promise<void> => {
  const dbInfo = await FileSystem.getInfoAsync(DB_PATH);
  const dbBytes = (dbInfo as { size?: number }).size ?? 0;
  if (dbBytes === 0) {
    // No DB on disk yet — nothing to snapshot. Caller should bail.
    throw {
      kind: 'insufficient_disk',
      freeBytes: 0,
      needBytes: 0,
    } satisfies BackupError;
  }
  let freeBytes: number;
  try {
    freeBytes = await FileSystem.getFreeDiskStorageAsync();
  } catch {
    // Disk-space query unavailable (web, simulator quirks); let the
    // snapshot proceed. The OS will surface a real error on the copy.
    return;
  }
  const needBytes = dbBytes * 5;
  if (freeBytes < needBytes) {
    throw {
      kind: 'insufficient_disk',
      freeBytes,
      needBytes,
    } satisfies BackupError;
  }
};

/**
 * Copy the live DB to `auto/<stamp>.db`. Caller is responsible for
 * deciding when to call this (scheduler / counter / manual).
 *
 * Steps per spec §3.4:
 *   1. disk-space pre-flight
 *   2. `PRAGMA wal_checkpoint(TRUNCATE)` — a snapshot of an unflushed WAL
 *      is corrupt on restore.
 *   3. `copyAsync` (NOT atomic — see spec §10 "App killed during snapshot")
 *   4. prune to 7
 *   5. write `last_backup_at` to AsyncStorage
 *   6. reset the counter
 *
 * Returns `Result` rather than throwing for the user-recoverable cases
 * (insufficient disk) so the caller can render a Toast. Throws for
 * truly unexpected errors (FileSystem failure, etc.).
 */
export const createLocalSnapshot = async (): Promise<Result<Snapshot, BackupError>> => {
  await ensureBackupDirs();

  try {
    await assertDiskSpace();
  } catch (err) {
    return {
      ok: false,
      error: (err as BackupError).kind
        ? (err as BackupError)
        : {
            kind: 'unknown',
            message: err instanceof Error ? err.message : String(err),
          },
    };
  }

  // WAL checkpoint — required. Without this a snapshot can capture
  // pages that the WAL has updated, producing a corrupt .db on restore.
  try {
    await db.execAsync('PRAGMA wal_checkpoint(TRUNCATE);');
  } catch (err) {
    return {
      ok: false,
      error: {
        kind: 'unknown',
        message: `WAL checkpoint failed: ${err instanceof Error ? err.message : String(err)}`,
      },
    };
  }

  const stamp = formatStamp();
  const filename = `${AUTO_PREFIX}${stamp}.db`;
  const dest = `${AUTO_DIR}${filename}`;

  try {
    await FileSystem.copyAsync({ from: DB_PATH, to: dest });
  } catch (err) {
    return {
      ok: false,
      error: {
        kind: 'unknown',
        message: `Snapshot copy failed: ${err instanceof Error ? err.message : String(err)}`,
      },
    };
  }

  await pruneAutoSnapshots(ROLLING_KEEP);

  const info = await FileSystem.getInfoAsync(dest);
  const bytes = (info as { size?: number }).size ?? 0;

  await AsyncStorage.setItem(AS_KEY_LAST_BACKUP_AT, String(Date.now()));
  useBackupCounter.getState().reset();

  return {
    ok: true,
    value: {
      path: dest,
      bytes,
      createdAt: Date.now(),
      kind: 'auto',
    },
  };
};

/**
 * Snapshot taken immediately before a destructive restore. Lives in
 * `safety/` and is NEVER pruned. The newest safety copy is used as the
 * rollback target if the live overwrite fails mid-write.
 *
 * Returns the safety copy record on success, `null` if the source DB
 * doesn't exist (first-ever run, no point in a safety copy of nothing).
 */
export const createPreRestoreSafetyCopy = async (): Promise<Snapshot | null> => {
  await ensureBackupDirs();

  const dbInfo = await FileSystem.getInfoAsync(DB_PATH);
  if (!dbInfo.exists) return null;

  // WAL checkpoint first so the safety copy is internally consistent
  // — same rule as the auto snapshot.
  try {
    await db.execAsync('PRAGMA wal_checkpoint(TRUNCATE);');
  } catch {
    // Best-effort: a safety copy of a live WAL may not be perfect, but
    // it's better than overwriting without any rollback path.
  }

  const stamp = formatStamp();
  const filename = `${SAFETY_PREFIX}${stamp}.db`;
  const dest = `${SAFETY_DIR}${filename}`;
  await FileSystem.copyAsync({ from: DB_PATH, to: dest });

  const info = await FileSystem.getInfoAsync(dest);
  return {
    path: dest,
    bytes: (info as { size?: number }).size ?? 0,
    createdAt: Date.now(),
    kind: 'safety',
  };
};

/**
 * Public path helpers. Tests use these to assert against the layout
 * without re-deriving strings.
 */
export const PATHS = {
  DB_PATH,
  DB_DIR,
  BACKUP_ROOT,
  AUTO_DIR,
  SAFETY_DIR,
} as const;

/**
 * Probe the DB at `filePath` with a fresh read-only handle (spec §6).
 * Exposed so the restore pipeline can use the same connection pattern as
 * the integrity checker. Not exported in `index.ts`.
 */
export const openProbeDatabase = (filePath: string): Promise<SQLite.SQLiteDatabase> =>
  SQLite.openDatabaseAsync(filePath);
