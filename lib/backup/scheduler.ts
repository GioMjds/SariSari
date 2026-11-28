import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths } from 'expo-file-system';
import * as Network from 'expo-network';
import { db } from '@/configs/sqlite';
import { getSalesCount } from '@/database/sales';
import {
  AS_KEY_CLOUD_ALLOW_CELLULAR,
  AS_KEY_CLOUD_LINKED,
  AS_KEY_LAST_BACKUP_AT,
  createLocalSnapshot,
  DB_PATH,
  ensureBackupDirs,
} from './snapshots';
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

const LOCAL_BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

export const SALE_MILESTONE = 20;

export type SchedulerInputs = {
  storeName: string | null;
  ownerName: string | null;
};

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

export const isDriveLinked = async (): Promise<boolean> => {
  const token = await readAccessToken();
  return !!token;
};

export const markLinked = async (linked: boolean): Promise<void> => {
  if (linked) {
    await AsyncStorage.setItem(AS_KEY_CLOUD_LINKED, 'true');
  } else {
    await AsyncStorage.removeItem(AS_KEY_CLOUD_LINKED);
  }
};

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

export const onSalesMilestone = async (
  inputs: SchedulerInputs,
): Promise<Result<unknown, BackupError> | undefined> => {
  const result = await createLocalSnapshot();
  if (!result.ok) return result;
  await markPending();
  void inputs; // captured for the next consumeQueue call
  return result;
};

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
    const dbFile = new File(DB_PATH);
    const dbBytes = await dbFile.base64();
    const metadata = buildMetadata({
      ...inputs,
      salesCount: await getSalesCount(),
    });
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

export const unlinkDrive = async (): Promise<void> => {
  try {
    await deleteBoth();
  } catch (err) {
    console.warn('unlinkDrive: deleteBoth failed (continuing):', err);
  }
  await markLinked(false);
  await markIdle();
  try {
    await AsyncStorage.removeItem(AS_KEY_CLOUD_LAST_SYNC_AT);
  } catch {
    // ignore
  }
};

export const subscribeCounter = (inputs: SchedulerInputs): (() => void) =>
  useBackupCounter.subscribe((state) => {
    if (state.count >= SALE_MILESTONE) {
      void onSalesMilestone(inputs).then(() => {
        useBackupCounter.getState().reset();
      });
    }
  });

export const downloadCloudToTemp = async (): Promise<string> => {
  const fileId = await findFile(DRIVE_DB_FILENAME);
  if (!fileId) {
    throw {
      kind: 'gdrive_not_configured',
      message: 'No cloud backup found in Drive.',
    } satisfies BackupError;
  }
  const tmpFile = new File(Paths.cache, `restore_${Date.now()}.db`);
  await downloadFile(fileId, tmpFile.uri);
  return tmpFile.uri;
};
