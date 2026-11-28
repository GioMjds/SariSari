import { File, Directory, Paths } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import { db } from '@/configs/sqlite';
import { useBackupCounter } from '@/stores/backupCounter';
import type { Result, Snapshot } from './types';
import { BackupError } from './types';

const DB_NAME = 'sarisari.db';
const docUri = Paths.document.uri.endsWith('/')
  ? Paths.document.uri
  : `${Paths.document.uri}/`;
const DB_DIR = `${docUri}SQLite/`;
export const DB_PATH = `${DB_DIR}${DB_NAME}`;

const BACKUP_ROOT = `${docUri}SQLiteBackups/`;
export const AUTO_DIR = `${BACKUP_ROOT}auto/`;
export const SAFETY_DIR = `${BACKUP_ROOT}safety/`;

const ROLLING_KEEP = 7;

export const MIN_VALID_BYTES = 1024;

export const AS_KEY_LAST_BACKUP_AT = 'last_backup_at';
export const AS_KEY_CLOUD_SYNC_PENDING = 'cloud_sync_pending';
export const AS_KEY_CLOUD_ALLOW_CELLULAR = 'cloud_allow_cellular';
export const AS_KEY_CLOUD_LINKED = 'cloud_linked';

export const AUTO_PREFIX = 'sarisari_snapshot_';
export const SAFETY_PREFIX = 'sarisari_safety_';

const pad2 = (n: number) => String(n).padStart(2, '0');
const pad3 = (n: number) => String(n).padStart(3, '0');

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

export const ensureBackupDirs = async (): Promise<void> => {
  const autoDir = new Directory(AUTO_DIR);
  if (!autoDir.exists) {
    autoDir.create({ intermediates: true, idempotent: true });
  }
  const safetyDir = new Directory(SAFETY_DIR);
  if (!safetyDir.exists) {
    safetyDir.create({ intermediates: true, idempotent: true });
  }
};

const toSnapshots = async (
  dirPath: string,
  kind: 'auto' | 'safety',
): Promise<Snapshot[]> => {
  const dir = new Directory(dirPath);
  if (!dir.exists) return [];
  const prefix = kind === 'auto' ? AUTO_PREFIX : SAFETY_PREFIX;
  const items = dir.list();
  const out: Snapshot[] = [];
  for (const item of items) {
    if (item instanceof File && item.name.startsWith(prefix) && item.exists) {
      out.push({
        path: item.uri,
        bytes: item.size ?? 0,
        createdAt: item.modificationTime ?? Date.now(),
        kind,
      });
    }
  }
  // Newest first.
  out.sort((a, b) => b.path.localeCompare(a.path));
  return out;
};

export const listAutoSnapshots = async (): Promise<Snapshot[]> => {
  return toSnapshots(AUTO_DIR, 'auto');
};

export const listSafetyCopies = async (): Promise<Snapshot[]> => {
  return toSnapshots(SAFETY_DIR, 'safety');
};

export const findLatestSafetyCopy = async (): Promise<Snapshot | null> => {
  const list = await listSafetyCopies();
  return list[0] ?? null;
};

export const pruneAutoSnapshots = async (
  keep: number = ROLLING_KEEP,
): Promise<void> => {
  const list = await listAutoSnapshots();
  if (list.length <= keep) return;
  const toDelete = list.slice(keep);
  for (const snap of toDelete) {
    try {
      const file = new File(snap.path);
      if (file.exists) {
        file.delete();
      }
    } catch {
      // best-effort; the prune retries on the next snapshot.
    }
  }
};

const assertDiskSpace = async (): Promise<void> => {
  const dbFile = new File(DB_PATH);
  if (!dbFile.exists || dbFile.size === 0) {
    throw {
      kind: 'insufficient_disk',
      freeBytes: 0,
      needBytes: 0,
    } satisfies BackupError;
  }
  const dbBytes = dbFile.size;
  let freeBytes: number;
  try {
    freeBytes = Paths.availableDiskSpace;
  } catch {
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

export const createLocalSnapshot = async (): Promise<
  Result<Snapshot, BackupError>
> => {
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

  const dbFile = new File(DB_PATH);
  const destFile = new File(dest);

  try {
    await dbFile.copy(destFile);
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

  const bytes = destFile.size;

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

export const createPreRestoreSafetyCopy =
  async (): Promise<Snapshot | null> => {
    await ensureBackupDirs();

    const dbFile = new File(DB_PATH);
    if (!dbFile.exists) return null;

    try {
      await db.execAsync('PRAGMA wal_checkpoint(TRUNCATE);');
    } catch {
      // Best-effort: a safety copy of a live WAL may not be perfect, but
      // it's better than overwriting without any rollback path.
    }

    const stamp = formatStamp();
    const filename = `${SAFETY_PREFIX}${stamp}.db`;
    const dest = `${SAFETY_DIR}${filename}`;
    const destFile = new File(dest);
    await dbFile.copy(destFile);

    return {
      path: dest,
      bytes: destFile.size,
      createdAt: Date.now(),
      kind: 'safety',
    };
  };

export const PATHS = {
  DB_PATH,
  DB_DIR,
  BACKUP_ROOT,
  AUTO_DIR,
  SAFETY_DIR,
} as const;

export const openProbeDatabase = (
  filePath: string,
): Promise<SQLite.SQLiteDatabase> => SQLite.openDatabaseAsync(filePath);
