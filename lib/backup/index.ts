import { createLocalSnapshot } from './snapshots';

export { listAutoSnapshots, listSafetyCopies, ensureBackupDirs } from './snapshots';
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
