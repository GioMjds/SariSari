// hooks/useBackup.tsx
// TanStack Query surface for the backup & restore system. The UI components
// (`components/settings/backup/*`) read through these hooks — they never
// touch `lib/backup/` directly. This keeps the layering rule clean
// (Screen → Hook → lib/backup).
//
// Phase 1 ships local-only. Phase 2 adds Drive-aware hooks:
//   - useCloudBackups()
//   - useLinkGoogleDrive()
//   - useUnlinkGoogleDrive()
//   - useRestoreFromCloud()
//
// See `docs/superpowers/specs/2026-06-27-data-backup-restore-design.md` §8.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listAutoSnapshots,
  performLocalSnapshot,
  restoreFromLocal,
  RestoreError,
  type Snapshot,
} from '@/lib/backup';
import { useToastStore } from '@/stores';

/** Query keys for cache invalidation in one place. */
export const backupKeys = {
  all: ['backup'] as const,
  snapshots: () => [...backupKeys.all, 'snapshots'] as const,
  cloud: () => [...backupKeys.all, 'cloud'] as const,
} as const;

/**
 * Newest-first list of rolling auto snapshots. The 7-snapshot cap is
 * enforced by `pruneAutoSnapshots`, so this list is bounded by design.
 */
export const useLocalSnapshots = () =>
  useQuery({
    queryKey: backupKeys.snapshots(),
    queryFn: () => listAutoSnapshots(),
    staleTime: 30_000,
  });

/**
 * Manual "Backup now" mutation. On success, invalidates the snapshots
 * list so the LocalSnapshotsSection re-renders. On failure, surfaces a
 * Toast with a translated message keyed on the error kind.
 */
export const useBackupNow = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: () => performLocalSnapshot(),
    onSuccess: (result) => {
      if (result.ok) {
        addToast({
          message: 'Backup complete',
          variant: 'success',
        });
      } else if (result.error.kind === 'insufficient_disk') {
        const needMb = Math.ceil(result.error.needBytes / (1024 * 1024));
        addToast({
          message: `Need ${needMb} MB free to back up. Please free some space.`,
          variant: 'warning',
        });
      } else {
        addToast({
          message: 'Backup failed. Please try again.',
          variant: 'danger',
        });
      }
      queryClient.invalidateQueries({ queryKey: backupKeys.snapshots() });
    },
    onError: () => {
      addToast({
        message: 'Backup failed. Please try again.',
        variant: 'danger',
      });
    },
  });
};

/**
 * Restore mutation. On success, clears the entire query cache (the new
 * DB may have different IDs / shapes than the snapshot) and lets
 * `Updates.reloadAsync()` do its thing. On `RestoreError`, surfaces a
 * destructive Alert via Toast.
 */
export const useRestoreFromSnapshot = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: (snapshot: Snapshot) => restoreFromLocal(snapshot.path),
    onSuccess: () => {
      // The reload handles a full remount; the cache clear is belt-and-
      // suspenders in case reloadAsync fails and we fall back to manual
      // reopen.
      queryClient.clear();
      addToast({
        message: 'Restore complete',
        variant: 'success',
        duration: 8000,
      });
    },
    onError: (err) => {
      if (err instanceof RestoreError) {
        if (err.code === 'already_in_progress') {
          addToast({
            message: 'A restore is already running. Please wait.',
            variant: 'warning',
          });
          return;
        }
        if (err.code === 'reload_failed') {
          addToast({
            message: err.message,
            variant: 'warning',
            duration: 10_000,
            action: { label: 'OK', onPress: () => undefined },
          });
          return;
        }
        addToast({
          message: err.message,
          variant: 'danger',
          duration: 8000,
        });
        return;
      }
      addToast({
        message: 'Restore failed. Please try again.',
        variant: 'danger',
      });
    },
  });
};

// Phase 2 placeholders. Returning empty arrays keeps Phase 1 callers
// (e.g. RestorePickerModal cloud tab) from breaking when they check
// `useCloudBackups()?.data?.length`.

export const useCloudBackups = () =>
  useQuery({
    queryKey: backupKeys.cloud(),
    queryFn: async () => [] as Array<never>,
    enabled: false,
  });

export const useRestoreFromCloud = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_fileId: string) => {
      throw new RestoreError(
        'gdrive_not_configured',
        'Google Drive restore is not yet wired up.',
      );
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
};
