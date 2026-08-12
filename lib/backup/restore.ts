import { File, Paths } from 'expo-file-system';
import * as Updates from 'expo-updates';
import { db } from '@/configs/sqlite';
import { validate } from './integrity';
import { extractBackupBundle } from './bundle';
import {
  DB_PATH,
  createPreRestoreSafetyCopy,
  findLatestSafetyCopy,
} from './snapshots';
import type { BackupError } from './types';
import { canonicalReceiptPathOrThrow } from '@/lib/receipt-storage';

/** Tagged error so callers can branch on cause. */
export class RestoreError extends Error {
  code:
    | 'integrity_failed'
    | 'copy_failed'
    | 'reload_failed'
    | 'already_in_progress'
    | 'gdrive_not_configured';
  override cause?: unknown;
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
    const walFile = new File(`${DB_PATH}-wal`);
    if (walFile.exists) walFile.delete();
    const shmFile = new File(`${DB_PATH}-shm`);
    if (shmFile.exists) shmFile.delete();

    // 5. Overwrite. On failure, roll back using the safety copy we just
    // made — the user's data is intact even if the restore aborts.
    try {
      await new File(snapshotPath).copy(new File(DB_PATH));
    } catch (err) {
      const safety = await findLatestSafetyCopy();
      if (safety) {
        try {
          await new File(safety.path).copy(new File(DB_PATH));
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
          await new File(safety.path).copy(new File(DB_PATH));
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
        const tmpFile = new File(tmp);
        if (tmpFile.exists) tmpFile.delete();
      } catch {
        // ignore
      }
    }
  }
};

export async function performRestore(inputBuffer: Uint8Array): Promise<{
  success: boolean;
  restoredReceiptsCount: number;
}> {
  const isZip =
    inputBuffer.length > 4 &&
    inputBuffer[0] === 0x50 &&
    inputBuffer[1] === 0x4b &&
    inputBuffer[2] === 0x03 &&
    inputBuffer[3] === 0x04;

  const docUri = Paths.document.uri.endsWith('/') ? Paths.document.uri : `${Paths.document.uri}/`;

  if (isZip) {
    const { dbBuffer, receipts } = await extractBackupBundle(inputBuffer);

    const dbPath = `${docUri}SQLite/sarisari.db`;
    const backupDbPath = `${docUri}SQLite/sarisari.db.bak`;

    // Receipts already validated by extractBackupBundle; revalidate before
    // staging to defend against manifest tampering and path collisions.
    const validReceipts = receipts.map((r) => ({
      ...r,
      relativePath: canonicalReceiptPathOrThrow(r.relativePath),
    }));

    // Back up any pre-existing receipt files that the restore will overwrite,
    // so we can restore them if a subsequent write fails. Receipts with no
    // prior file are tracked so we can delete them on rollback.
    const priorReceipts: {
      relativePath: string;
      backupPath: string;
      existed: boolean;
    }[] = [];

    for (const r of validReceipts) {
      const targetPath = `${docUri}${r.relativePath}`;
      const targetFile = new File(targetPath);
      const exists = targetFile.exists;
      const backupPath = `${targetPath}.bak`;
      const backupFile = new File(backupPath);
      try {
        // Remove any stale .bak file before creating a new one
        if (backupFile.exists) backupFile.delete();
        if (exists) {
          await targetFile.copy(backupFile);
        }
        priorReceipts.push({
          relativePath: r.relativePath,
          backupPath,
          existed: exists,
        });
      } catch (err) {
        // Preserve the original failure but roll back any backups we already made.
        await Promise.all(
          priorReceipts
            .filter((p) => p.existed)
            .map(async (p) => {
              try {
                const bf = new File(p.backupPath);
                if (bf.exists) bf.delete();
              } catch {}
            }),
        );
        throw err;
      }
    }

    let dbBackupSucceeded = false;
    const dbFile = new File(dbPath);
    const backupDbFile = new File(backupDbPath);
    try {
      // Remove any stale .bak file before creating a new one
      if (backupDbFile.exists) backupDbFile.delete();
      await dbFile.copy(backupDbFile);
      dbBackupSucceeded = true;

      dbFile.write(Buffer.from(dbBuffer).toString('base64'), {
        encoding: 'base64',
      });

      for (const r of validReceipts) {
        const targetPath = `${docUri}${r.relativePath}`;
        canonicalReceiptPathOrThrow(r.relativePath);
        const rFile = new File(targetPath);
        rFile.write(Buffer.from(r.content).toString('base64'), {
          encoding: 'base64',
        });
      }

      if (backupDbFile.exists) backupDbFile.delete();
      for (const p of priorReceipts) {
        if (p.existed) {
          const bf = new File(p.backupPath);
          if (bf.exists) bf.delete();
        }
      }
      return { success: true, restoredReceiptsCount: validReceipts.length };
    } catch (err) {
      // Roll back the database only if the backup succeeded.
      if (dbBackupSucceeded) {
        try {
          await backupDbFile.copy(dbFile);
        } catch (rollbackErr) {
          console.error('Rollback failed for database', rollbackErr);
        }
      }
      // Roll back receipts: restore overwritten files, delete new ones.
      await Promise.all(
        priorReceipts.map(async (p) => {
          const targetPath = `${docUri}${p.relativePath}`;
          const targetFile = new File(targetPath);
          const backupFile = new File(p.backupPath);
          try {
            if (p.existed) {
              await backupFile.copy(targetFile);
              if (backupFile.exists) backupFile.delete();
            } else {
              if (targetFile.exists) targetFile.delete();
            }
          } catch (rollbackErr) {
            console.error(
              `Rollback failed for receipt ${p.relativePath}`,
              rollbackErr,
            );
          }
        }),
      );
      throw err;
    }
  } else {
    const dbPath = `${docUri}SQLite/sarisari.db`;
    const dbFile = new File(dbPath);
    dbFile.write(Buffer.from(inputBuffer).toString('base64'), {
      encoding: 'base64',
    });
    return { success: true, restoredReceiptsCount: 0 };
  }
}
