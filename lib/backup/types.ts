// lib/backup/types.ts
// Shared types for the backup & restore system. All other `lib/backup/*`
// modules import from here so the public surface (`lib/backup/index.ts`)
// stays thin and typed end-to-end.
//
// See `docs/superpowers/specs/2026-06-27-data-backup-restore-design.md`
// §3 (Local Snapshots), §4 (Google Drive), §7 (Error Handling).

/**
 * On-disk metadata that travels with the cloud copy. The local copies
 * don't store metadata separately — the filename's ISO prefix IS the
 * timestamp — so this type is only used for the cloud sidecar.
 */
export interface Metadata {
  /** Epoch ms when the snapshot was created. */
  updatedAt: number;
  /** Store name from the onboarding profile. */
  storeName: string;
  /** Owner name from the onboarding profile. */
  ownerName: string;
  /** Total number of sales at snapshot time. */
  salesCount: number;
  /** App version (`expo-constants.expoConfig.version`). */
  appVersion: string;
}

/**
 * Snapshot record returned by the snapshot manager. `kind` distinguishes
 * rolling `auto/` snapshots from `safety/` copies taken before a restore.
 */
export interface Snapshot {
  /** Absolute filesystem path to the .db file. */
  path: string;
  /** File size in bytes. */
  bytes: number;
  /** Epoch ms when the file was created. */
  createdAt: number;
  kind: 'auto' | 'safety';
}

/**
 * Cloud-flavored snapshot metadata (includes the Drive file id so we can
 * download or delete). The `Metadata` fields are embedded directly so the
 * picker can render without a separate round-trip.
 */
export interface CloudBackup {
  fileId: string;
  metadata: Metadata;
  /** Bytes from the Drive API; may be undefined until fetched. */
  bytes?: number;
}

/**
 * Typed error union. Every code path that throws during backup or restore
 * returns one of these so the UI layer can pick the right recovery action
 * (Toast vs Alert vs Modal). See spec §7 for the recovery table.
 */
export type BackupError =
  | {
      kind: 'insufficient_disk';
      freeBytes: number;
      needBytes: number;
    }
  | {
      kind: 'integrity_failed';
      reason: 'bad_header' | 'integrity_check_failed' | 'unreasonable_size';
      detail?: string;
    }
  | {
      kind: 'gdrive_auth';
      status: 401 | 403;
      message: string;
    }
  | {
      kind: 'gdrive_quota';
      status: 429;
      retryAfterSec: number;
    }
  | {
      kind: 'gdrive_server';
      status: number;
      message: string;
    }
  | {
      kind: 'gdrive_network';
      message: string;
    }
  | {
      kind: 'gdrive_not_configured';
      message: string;
    }
  | {
      kind: 'restore_in_progress';
      message: string;
    }
  | {
      kind: 'unknown';
      message: string;
    };

/**
 * A lightweight `Result<T, E>` wrapper so callers don't have to try/catch
 * every backup call. The snapshot manager uses this; restore throws because
 * it has a single funnel and the UI expects a thrown error to drive Alerts.
 */
export type Result<T, E = BackupError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/** Reasons the integrity check can reject a file (spec §6). */
export type IntegrityReason =
  | 'bad_header'
  | 'integrity_check_failed'
  | 'unreasonable_size';

/** Result shape from `lib/backup/integrity.ts#validate`. */
export type IntegrityResult =
  | { ok: true }
  | { ok: false; reason: IntegrityReason; detail?: string };

/** Reasons a restore can fail (used by the picker UI to render a message). */
export type RestoreErrorCode =
  | 'integrity_failed'
  | 'copy_failed'
  | 'reload_failed'
  | 'already_in_progress'
  | 'gdrive_not_configured';