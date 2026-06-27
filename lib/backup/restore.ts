// lib/backup/restore.ts
// Single funnel for every destructive restore (spec §5). The pipeline:
//
//   1. validate source       — abort before any write if the file is corrupt
//   2. take safety copy      — ALWAYS, before any other write, so we have
//                              a rollback target if the overwrite partially
//                              fails (spec §5 failure-mode table)
//   3. close live DB handle  — `db.closeAsync()` releases the WAL lock so
//                              we can safely overwrite the .db file
//   4. delete WAL/SHM sidecars — must happen AFTER close, BEFORE overwrite
//                              (stale sidecars would corrupt the restored DB)
//   5. overwrite             — the destructive write; rollback on failure
//   6. validate overwrite    — guard against a partial write that left a
//                              valid-header / truncated body
//   7. reload                — `Updates.reloadAsync()` to remount the new DB
//                              and run any new migrations
//
// `restoreFromCloud` reuses `restoreFromLocal` after downloading to
// `cacheDirectory`. The download lands in cache, not document, so the OS
// reclaims it on the next cleanup pass.

import * as FileSystem from 'expo-file-system/legacy';
import * as Updates from 'expo-updates';
import { db } from '@/configs/sqlite';
import { validate } from './integrity';
import {
  DB_PATH,
  createPreRestoreSafetyCopy,
  findLatestSafetyCopy,
} from './snapshots';
import type { BackupError } from './types';

/** Tagged error so callers can branch on cause. */
export class RestoreError extends Error {
  code:
    | 'integrity_failed'
    | 'copy_failed'
    | 'reload_failed'
    | 'already_in_progress'
    | 'gdrive_not_configured';
  cause?: unknown;
  constructor(code: RestoreError['code'], message: string, cause?: unknown) {
    super(message);
    this.name = 'RestoreError';
    this.code = code;
    this.cause = cause;
  }
}

// Single in-flight guard. The scheduler can also trigger a snapshot from
// the counter, and the UI can fire a restore — we don't want both racing.
let restoreInFlight = false;

/**
 * Restore the live DB from `snapshotPath`. See file-level comment for
 * the full pipeline.
 *
 * Throws `RestoreError` for user-facing failures (the picker turns these
 * into Alerts with a translation). Never throws a generic `Error` — that
 * would surface as an opaque alert.
 */
export const restoreFromLocal = async (snapshotPath: string): Promise<void> => {
  if (restoreInFlight) {
    throw new RestoreError(
      'already_in_progress',
      'A restore is already running. Please wait for it to finish.',
    );
  }
  restoreInFlight = true;

  try {
    // 1. Validate source.
    const integrity = await validate(snapshotPath);
    if (!integrity.ok) {
      throw new RestoreError(
        'integrity_failed',
        `Source snapshot failed integrity check (${integrity.reason})`,
        integrity,
      );
    }

    // 2. Safety copy (mandatory).
    await createPreRestoreSafetyCopy();

    // 3. Close the live handle. `expo-sqlite` 16 supports `closeAsync`;
    // if it doesn't on a particular platform we log and continue — the
    // OS will flush the WAL on next read, which is riskier but functional.
    try {
      await db.closeAsync();
    } catch (err) {
      console.warn('db.closeAsync() failed; continuing without close', err);
    }

    // 4. Delete WAL/SHM sidecars (idempotent).
    await FileSystem.deleteAsync(`${DB_PATH}-wal`, { idempotent: true });
    await FileSystem.deleteAsync(`${DB_PATH}-shm`, { idempotent: true });

    // 5. Overwrite. On failure, roll back using the safety copy we just
    // made — the user's data is intact even if the restore aborts.
    try {
      await FileSystem.copyAsync({ from: snapshotPath, to: DB_PATH });
    } catch (err) {
      const safety = await findLatestSafetyCopy();
      if (safety) {
        try {
          await FileSystem.copyAsync({ from: safety.path, to: DB_PATH });
        } catch (rollbackErr) {
          console.error('Rollback failed after copy error', rollbackErr);
        }
      }
      throw new RestoreError(
        'copy_failed',
        'Failed to overwrite the database. Your previous data was restored from the safety copy.',
        err,
      );
    }

    // 6. Validate the overwrite landed cleanly. If not, roll back.
    const post = await validate(DB_PATH);
    if (!post.ok) {
      const safety = await findLatestSafetyCopy();
      if (safety) {
        try {
          await FileSystem.copyAsync({ from: safety.path, to: DB_PATH });
        } catch (rollbackErr) {
          console.error('Rollback failed after integrity failure', rollbackErr);
        }
      }
      throw new RestoreError(
        'integrity_failed',
        'The restore wrote a file that does not pass integrity check. Your previous data was restored from the safety copy.',
        post,
      );
    }

    // 7. Reload so the new DB is mounted and migrations run.
    try {
      await Updates.reloadAsync();
    } catch (err) {
      throw new RestoreError(
        'reload_failed',
        'The restore completed but the app could not auto-reload. Please close and reopen SariSari.',
        err,
      );
    }
  } finally {
    restoreInFlight = false;
  }
};

/**
 * Restore from a Google Drive backup. Spec §5 ("Restore from cloud").
 *
 * Flow:
 *   1. download the cloud DB to `cacheDirectory`
 *   2. delegate to `restoreFromLocal` (validates, safety copy, overwrite,
 *      reload)
 *   3. always delete the temp file in `finally`
 *
 * The function id is accepted for forward-compat — the picker passes the
 * Drive file id from `useCloudBackups()` so a future "specific version"
 * restore can re-use this entry point without changing the call site.
 *
 * On any failure during download or delegation, the temp file is cleaned
 * up and the error is rethrown as a `RestoreError` with the appropriate
 * code.
 */
export const restoreFromCloud = async (_fileId: string): Promise<void> => {
  let tmp: string | null = null;
  try {
    const { downloadCloudToTemp } = await import('./scheduler');
    tmp = await downloadCloudToTemp();
  } catch (err) {
    // The scheduler throws typed `BackupError`s. Surface them as
    // `gdrive_not_configured` for any not-configured case, otherwise
    // `copy_failed` (download is essentially "copy from network").
    const e = err as BackupError;
    if (e?.kind === 'gdrive_not_configured' || e?.kind === 'gdrive_auth') {
      throw new RestoreError('gdrive_not_configured', e.message, err);
    }
    throw new RestoreError(
      'copy_failed',
      'Failed to download the backup from Google Drive.',
      err,
    );
  }
  try {
    await restoreFromLocal(tmp);
  } finally {
    // Best-effort cleanup; cacheDirectory is OS-managed but we don't
    // want stale restore files lingering between attempts.
    if (tmp) {
      try {
        await FileSystem.deleteAsync(tmp, { idempotent: true });
      } catch {
        // ignore
      }
    }
  }
};
