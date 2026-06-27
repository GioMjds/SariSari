import { createLocalSnapshot } from './snapshots';

export {
  listAutoSnapshots,
  listSafetyCopies,
  ensureBackupDirs,
} from './snapshots';
export { DB_PATH, PATHS } from './snapshots';
export {
  AS_KEY_LAST_BACKUP_AT,
  AS_KEY_CLOUD_SYNC_PENDING,
  AS_KEY_CLOUD_ALLOW_CELLULAR,
  AS_KEY_CLOUD_LINKED,
} from './snapshots';
export { formatStamp } from './snapshots';

export { validate } from './integrity';

export { restoreFromLocal, restoreFromCloud } from './restore';
export { RestoreError } from './restore';

export { buildMetadata, parseMetadata, isNewer } from './metadata';

export {
  consumeQueue,
  downloadCloudToTemp,
  getCloudNewerStatus,
  isDriveLinked,
  markLinked,
  onSalesMilestone,
  performCloudUpload,
  runStartupChecks,
  SALE_MILESTONE,
  shouldAttemptCloudUpload,
  subscribeCounter,
  unlinkDrive,
  AS_KEY_CLOUD_LAST_SYNC_AT,
} from './scheduler';
export type { SchedulerInputs } from './scheduler';

export {
  authedFetch,
  clearTokens,
  createFile,
  deleteBoth,
  downloadFile,
  DRIVE_DB_FILENAME,
  DRIVE_META_FILENAME,
  ensureFreshToken,
  exchangeCodeForTokens,
  findFile,
  getClientId,
  getDiscovery,
  getMetadataSidecar,
  GDRIVE_SCOPE,
  makeRedirectUri,
  readAccessToken,
  SS_KEY_ACCESS,
  SS_KEY_REFRESH,
  updateFile,
  uploadBackup,
} from './googleDrive';
export type { AccessToken, AuthFlowOptions, DriveFileMeta } from './googleDrive';

export { isPending, markIdle, markPending } from './syncQueue';

export type {
  BackupError,
  CloudBackup,
  IntegrityReason,
  IntegrityResult,
  Metadata,
  RestoreErrorCode,
  Result,
  Snapshot,
} from './types';

export const performLocalSnapshot = createLocalSnapshot;
export { createLocalSnapshot };
