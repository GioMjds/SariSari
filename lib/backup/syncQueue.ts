// lib/backup/syncQueue.ts
// AsyncStorage-backed pending flag for the Google Drive sync queue.
//
// Per spec §4.7, the queue has three observable states: IDLE (no flag),
// QUEUED (`cloud_sync_pending=true` set, no upload in flight), and
// UPLOADING (the scheduler has dispatched and is awaiting Drive's
// response). The UPLOADING state is *transient* and never persisted —
// if the app is killed mid-upload, the next start sees QUEUED and
// retries. This avoids split-brain recovery where the in-memory
// "uploading" marker is gone but Drive is now in a half-updated state.
//
// See `docs/superpowers/specs/2026-06-27-data-backup-restore-design.md`
// §4.7 (Sync queue state machine).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AS_KEY_CLOUD_SYNC_PENDING } from './snapshots';

/**
 * Read whether a cloud upload is queued. Returns `true` only when the
 * key exists *and* its string value is `'true'` — anything else
 * (missing key, 'false', '0') is treated as IDLE.
 */
export const isPending = async (): Promise<boolean> => {
  const v = await AsyncStorage.getItem(AS_KEY_CLOUD_SYNC_PENDING);
  return v === 'true';
};

/**
 * Mark the queue as PENDING. Called from `performLocalSnapshot()` on
 * success (so the next Wi-Fi window will pick up the new file) and
 * from `performCloudUpload()` when the network gate refused (so we
 * retry on the next Wi-Fi / app-active event).
 */
export const markPending = async (): Promise<void> => {
  await AsyncStorage.setItem(AS_KEY_CLOUD_SYNC_PENDING, 'true');
};

/**
 * Clear the pending flag. Called by `performCloudUpload()` after a
 * successful upload, and by `unlinkDrive()` (so we don't keep
 * retrying an upload that the user no longer wants).
 */
export const markIdle = async (): Promise<void> => {
  await AsyncStorage.removeItem(AS_KEY_CLOUD_SYNC_PENDING);
};
