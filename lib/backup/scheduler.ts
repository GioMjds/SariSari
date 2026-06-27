// lib/backup/scheduler.ts
// Orchestrator for the backup pipeline. Spec §4.4 (cloud upload flow),
// §4.6 (network gating), §3.6 (triggers).
//
// The scheduler is the *only* place in `lib/backup/` that ties
// together: the local snapshot manager, the cloud client, the network
// gate, and the pending flag. The UI layer (RootLayout) drives the
// scheduler on three event sources:
//
//   1. App start        → `runStartupChecks()`
//   2. Counter >= 20    → `onSalesMilestone()` (idempotent; reset
//                         after snapshot, so 21 → 1 → 21 → 1 ...)
//   3. AppState active  → `consumeQueue()` (retry pending uploads)
//
// All three eventually call `performCloudUpload()` which is the single
// function that does the actual Drive round-trip.
//
// See `docs/superpowers/specs/2026-06-27-data-backup-restore-design.md`
// §4.4–§4.7 for the full state machine.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Network from 'expo-network';
import { db } from '@/configs/sqlite';
import {
  AS_KEY_CLOUD_ALLOW_CELLULAR,
  AS_KEY_CLOUD_LINKED,
  AS_KEY_LAST_BACKUP_AT,
  createLocalSnapshot,
  DB_PATH,
  ensureBackupDirs,
} from './snapshots';

/** AsyncStorage key the CloudBackupSection reads for "Last synced X ago". */
import { buildMetadata, isNewer } from './metadata';
import {
  deleteBoth,
  downloadFile,
  DRIVE_DB_FILENAME,
  findFile,
  getClientId,
  getMetadataSidecar,
  readAccessToken,
  uploadBackup,
} from './googleDrive';
import { isPending, markIdle, markPending } from './syncQueue';
import { useBackupCounter } from '@/stores/backupCounter';
import type { BackupError, Metadata, Result } from './types';

export const AS_KEY_CLOUD_LAST_SYNC_AT = 'cloud_last_sync_at';
/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

/** Spec §3.6: app-start trigger fires when last local backup is older. */
const LOCAL_BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

/** Spec §3.6: sale-milestone trigger fires when counter reaches this. */
export const SALE_MILESTONE = 20;

/* -------------------------------------------------------------------------- */
/*  Inputs the caller injects                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Read-side inputs that `lib/backup/` doesn't own. The hook layer
 * passes these in (it owns TanStack Query access to `useProfile()` and
 * `useSales()`), keeping `lib/backup/` free of React and hooks.
 */
export type SchedulerInputs = {
  storeName: string | null;
  ownerName: string | null;
  salesCount: number;
};

/* -------------------------------------------------------------------------- */
/*  Network gating                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Per spec §4.6, only upload on Wi-Fi unless the user has explicitly
 * opted in to cellular. Returns `false` for offline, `true` for Wi-Fi,
 * and (cellular) the value of the `cloud_allow_cellular` toggle.
 */
export const shouldAttemptCloudUpload = async (): Promise<boolean> => {
  let state;
  try {
    state = await Network.getNetworkStateAsync();
  } catch {
    // Network module unavailable — assume offline. Better to skip the
    // upload than to start it and have it stall on a flaky link.
    return false;
  }
  if (!state.isConnected || !state.isInternetReachable) return false;
  if (state.type === Network.NetworkStateType.WIFI) return true;
  if (state.type === Network.NetworkStateType.ETHERNET) return true;
  const allow = await AsyncStorage.getItem(AS_KEY_CLOUD_ALLOW_CELLULAR);
  return allow === 'true';
};

/* -------------------------------------------------------------------------- */
/*  Link state                                                                */
/* -------------------------------------------------------------------------- */

/** `true` when an access token is persisted in SecureStore. */
export const isDriveLinked = async (): Promise<boolean> => {
  const token = await readAccessToken();
  return !!token;
};

/**
 * Persist the "linked" flag so the UI can render quickly without
 * waiting on a SecureStore read. Called by `useLinkGoogleDrive` on
 * success and by `unlinkDrive` on unlink.
 */
export const markLinked = async (linked: boolean): Promise<void> => {
  if (linked) {
    await AsyncStorage.setItem(AS_KEY_CLOUD_LINKED, 'true');
  } else {
    await AsyncStorage.removeItem(AS_KEY_CLOUD_LINKED);
  }
};

/* -------------------------------------------------------------------------- */
/*  Triggers                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Run at app start. Two responsibilities:
 *
 *   1. If `last_backup_at` is older than 24h, take a local snapshot.
 *   2. If `cloud_sync_pending` is true AND Drive is linked AND the
 *      network gate allows, try to upload.
 *
 * Both calls are best-effort. Failures are logged but never thrown —
 * the app start path must not block on backup. Spec §3.6.
 */
export const runStartupChecks = async (
  inputs: SchedulerInputs,
): Promise<void> => {
  try {
    await ensureBackupDirs();
    const now = Date.now();
    const lastRaw = await AsyncStorage.getItem(AS_KEY_LAST_BACKUP_AT);
    const last = lastRaw ? Number(lastRaw) : 0;
    if (!last || now - last > LOCAL_BACKUP_INTERVAL_MS) {
      await createLocalSnapshot();
    }
  } catch (err) {
    console.warn('runStartupChecks: local snapshot skipped:', err);
  }

  try {
    const pending = await isPending();
    if (!pending) return;
    const linked = await isDriveLinked();
    if (!linked) return;
    const gate = await shouldAttemptCloudUpload();
    if (!gate) return;
    await performCloudUpload(inputs);
  } catch (err) {
    console.warn('runStartupChecks: cloud sync skipped:', err);
  }
};

/**
 * Counter-milestone handler. Takes the local snapshot, resets the
 * counter, and marks the queue pending so the next `consumeQueue()`
 * (AppState-active, or Wi-Fi-reconnect) attempts the upload.
 */
export const onSalesMilestone = async (
  inputs: SchedulerInputs,
): Promise<Result<unknown, BackupError> | undefined> => {
  const result = await createLocalSnapshot();
  if (!result.ok) return result;
  await markPending();
  void inputs; // captured for the next consumeQueue call
  return result;
};

/**
 * Drain the pending queue if the network gate allows. Called from the
 * RootLayout's AppState listener when the app comes back to the
 * foreground, and after `onSalesMilestone` succeeds.
 */
export const consumeQueue = async (inputs: SchedulerInputs): Promise<void> => {
  try {
    const pending = await isPending();
    if (!pending) return;
    const linked = await isDriveLinked();
    if (!linked) {
      // Pending is moot if Drive is unlinked. Clear so we don't keep
      // checking on every foreground.
      await markIdle();
      return;
    }
    const gate = await shouldAttemptCloudUpload();
    if (!gate) return;
    await performCloudUpload(inputs);
  } catch (err) {
    console.warn('consumeQueue: skipped:', err);
  }
};

/* -------------------------------------------------------------------------- */
/*  Cloud upload                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Spec §4.4. The single Drive round-trip path. Caller responsibilities:
 *
 *   - already gated on `linked + wifi-or-cellular` (use
 *     `consumeQueue()` for the typical flow)
 *   - `inputs` must reflect the current store profile + sales count
 *
 * Returns `Result` rather than throwing because most failure modes
 * (`gdrive_server`, `gdrive_network`, `gdrive_quota`) are recoverable
 * and the scheduler just leaves the queue PENDING for the next try.
 * The `gdrive_auth` case is also surfaced — the UI shows the re-link
 * banner.
 */
export const performCloudUpload = async (
  inputs: SchedulerInputs,
): Promise<Result<Metadata, BackupError>> => {
  if (!getClientId()) {
    return {
      ok: false,
      error: {
        kind: 'gdrive_not_configured',
        message: 'Drive is not configured for this build.',
      },
    };
  }
  const linked = await isDriveLinked();
  if (!linked) {
    return {
      ok: false,
      error: {
        kind: 'gdrive_auth',
        status: 401,
        message: 'Drive is not linked.',
      },
    };
  }

  try {
    // WAL checkpoint + read DB bytes. The checkpoint guarantees the
    // uploaded bytes are internally consistent; otherwise the cloud
    // copy could differ from what the live app sees.
    await db.execAsync('PRAGMA wal_checkpoint(TRUNCATE);');
    const dbBytes = await FileSystem.readAsStringAsync(DB_PATH, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const metadata = buildMetadata(inputs);
    await uploadBackup(dbBytes, metadata);
    await markIdle();
    // Record the last successful sync so the settings UI can render
    // "Last synced X ago" without re-fetching the metadata sidecar.
    await AsyncStorage.setItem(AS_KEY_CLOUD_LAST_SYNC_AT, String(Date.now()));
    return { ok: true, value: metadata };
  } catch (err) {
    const e = err as BackupError;
    if (e && e.kind) return { ok: false, error: e };
    return {
      ok: false,
      error: {
        kind: 'unknown',
        message: err instanceof Error ? err.message : String(err),
      },
    };
  }
};

/* -------------------------------------------------------------------------- */
/*  Cloud-newer comparison                                                    */
/* -------------------------------------------------------------------------- */

/**
 * On app start, compare the cloud metadata's `updatedAt` against the
 * local `last_backup_at`. If the cloud is newer, the UI shows the
 * "Cloud is newer — restore from cloud?" banner.
 *
 * Returns `null` when there's no cloud backup yet (first link) or the
 * comparison is inconclusive (no local backup recorded).
 */
export const getCloudNewerStatus = async (): Promise<{
  cloud: Metadata;
  localAt: number;
} | null> => {
  const cloud = await getMetadataSidecar();
  if (!cloud) return null;
  const lastRaw = await AsyncStorage.getItem(AS_KEY_LAST_BACKUP_AT);
  const localAt = lastRaw ? Number(lastRaw) : 0;
  if (
    !isNewer(cloud, localAt > 0 ? ({ updatedAt: localAt } as Metadata) : null)
  ) {
    return null;
  }
  return { cloud, localAt };
};

/* -------------------------------------------------------------------------- */
/*  Unlink                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Spec §4.8. Deletes both Drive files (best-effort), wipes tokens,
 * clears the linked flag and the pending flag. Local snapshots are
 * never touched.
 */
export const unlinkDrive = async (): Promise<void> => {
  try {
    await deleteBoth();
  } catch (err) {
    console.warn('unlinkDrive: deleteBoth failed (continuing):', err);
  }
  await markLinked(false);
  await markIdle();
  // Forget the last-sync timestamp so the UI doesn't show a stale
  // "Last synced 3 days ago" after a fresh unlink.
  try {
    await AsyncStorage.removeItem(AS_KEY_CLOUD_LAST_SYNC_AT);
  } catch {
    // ignore
  }
};

/* -------------------------------------------------------------------------- */
/*  Counter wiring                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Subscribes to `useBackupCounter` and fires `onSalesMilestone` when
 * the count reaches `SALE_MILESTONE`. Returns the unsubscribe fn.
 *
 * The hook layer wraps this in a `useEffect` from RootLayout.
 */
export const subscribeCounter = (inputs: SchedulerInputs): (() => void) =>
  useBackupCounter.subscribe((state) => {
    if (state.count >= SALE_MILESTONE) {
      void onSalesMilestone(inputs).then(() => {
        useBackupCounter.getState().reset();
      });
    }
  });

/* -------------------------------------------------------------------------- */
/*  Cloud restore helper                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Download the cloud DB to a temp file under `cacheDirectory`. Caller
 * (`restoreFromCloud` in `restore.ts`) hands the temp path to
 * `restoreFromLocal` then deletes the temp.
 *
 * Returns the temp path on success so the caller can pass it through.
 */
export const downloadCloudToTemp = async (): Promise<string> => {
  const fileId = await findFile(DRIVE_DB_FILENAME);
  if (!fileId) {
    throw {
      kind: 'gdrive_not_configured',
      message: 'No cloud backup found in Drive.',
    } satisfies BackupError;
  }
  const tmp = `${FileSystem.cacheDirectory}restore_${Date.now()}.db`;
  await downloadFile(fileId, tmp);
  return tmp;
};
