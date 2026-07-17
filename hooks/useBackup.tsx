// hooks/useBackup.tsx
// TanStack Query surface for the backup & restore system. The UI
// components (`components/settings/backup/*`) read through these
// hooks — they never touch `lib/backup/` directly. This keeps the
// layering rule clean (Screen → Hook → lib/backup).
//
// Phase 1 ships local-only. Phase 2 adds Drive-aware hooks:
//   - useCloudBackups()
//   - useDriveLinkStatus()
//   - useGoogleAuthRequest()    — builds the AuthRequest triplet
//   - useLinkGoogleDrive()      — completes the OAuth code exchange
//   - useUnlinkGoogleDrive()
//   - useRestoreFromCloud()
//   - useCloudNewerStatus()     — drives the CloudNewerBanner
//   - useSchedulerInputs()      — composes the inputs the scheduler
//                                 needs at startup / counter-threshold
//
// See `docs/superpowers/specs/2026-06-27-data-backup-restore-design.md`
// §8 (UI surfaces) for what each hook drives.

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as AuthSession from 'expo-auth-session';
import { getAllSales } from '@/database/sales';
import {
  createLocalSnapshot,
  exchangeCodeForTokens,
  getClientId,
  getCloudNewerStatus,
  getDiscovery,
  getMetadataSidecar,
  GDRIVE_SCOPE,
  isDriveLinked,
  listAutoSnapshots,
  makeRedirectUri,
  markPending,
  restoreFromCloud,
  restoreFromLocal,
  RestoreError,
  unlinkDrive,
  type CloudBackup,
  type Metadata,
  type Snapshot,
} from '@/lib/backup';
import { useProfile } from './useProfile';
import { useToastStore } from '@/stores';

type AuthRequest = AuthSession.AuthRequest;

/** Query keys for cache invalidation in one place. */
export const backupKeys = {
  all: ['backup'] as const,
  snapshots: () => [...backupKeys.all, 'snapshots'] as const,
  cloud: () => [...backupKeys.all, 'cloud'] as const,
  linkStatus: () => [...backupKeys.all, 'linkStatus'] as const,
  cloudNewer: () => [...backupKeys.all, 'cloudNewer'] as const,
} as const;

/* -------------------------------------------------------------------------- */
/*  Scheduler input builder                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Compose a `SchedulerInputs` from the live TanStack Query caches.
 * The scheduler reads these via `runStartupChecks` and `consumeQueue`,
 * both of which are called from RootLayout effects.
 */
export const useSchedulerInputs = () => {
  const { profile } = useProfile();
  const [salesCount, setSalesCount] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await getAllSales();
        if (!cancelled) setSalesCount(rows.length);
      } catch {
        // Sales module not yet ready (first launch race); report 0 —
        // the next runStartupChecks after the app finishes init will
        // use the real count.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    storeName: profile?.storeName ?? null,
    ownerName: profile?.ownerName ?? null,
    salesCount,
  };
};

/* -------------------------------------------------------------------------- */
/*  Local snapshots                                                           */
/* -------------------------------------------------------------------------- */

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
 * Manual "Backup now" mutation. Takes a local snapshot, marks the
 * cloud queue pending (the scheduler will drain it on the next
 * foreground / Wi-Fi window), invalidates the snapshots list, and
 * surfaces a Toast keyed on the error kind.
 */
export const useBackupNow = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: async () => {
      const result = await createLocalSnapshot();
      if (!result.ok) return result;
      // Mark the queue pending; `consumeQueue` will attempt the
      // upload on the next foreground/Wi-Fi. This avoids blocking the
      // mutation on a network round-trip.
      await markPending();
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: backupKeys.snapshots() });
      if (result.ok) {
        addToast({ message: 'Backup complete', variant: 'success' });
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

/* -------------------------------------------------------------------------- */
/*  Drive link state                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Cheap boolean for whether Drive is linked. Refreshed on focus so the
 * CloudBackupSection re-renders after a successful OAuth round-trip.
 */
export const useDriveLinkStatus = () =>
  useQuery({
    queryKey: backupKeys.linkStatus(),
    queryFn: () => isDriveLinked(),
    staleTime: 60_000,
  });

/* -------------------------------------------------------------------------- */
/*  Link / Unlink                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Build an `AuthRequest` for the Google OAuth dance. Returns the
 * triplet `(request, response, promptAsync)` from `useAuthRequest`.
 *
 * Spec §4.1: PKCE, scope `drive.appdata`. The hook owns the React
 * lifecycle (Prompt stays open across renders), but the actual code-
 * for-tokens exchange lives in `lib/backup/googleDrive.ts` so the lib
 * stays free of React.
 *
 * When the OAuth client id is missing (empty `extra.googleClientId`),
 * the hook returns `(null, null, noop)` so consumers can render a
 * "Drive not configured" state without crashing.
 */
export const useGoogleAuthRequest = (): [
  AuthRequest | null,
  AuthSession.AuthSessionResult | null,
  (opts?: AuthSession.AuthRequestPromptOptions) => Promise<AuthSession.AuthSessionResult>,
] => {
  const clientId = getClientId();
  const discovery = getDiscovery();
  const redirectUri = makeRedirectUri();
  const config: AuthSession.AuthRequestConfig = {
    clientId: clientId || 'disabled-placeholder-client-id',
    scopes: [GDRIVE_SCOPE],
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
    codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
  };
  const [request, result, promptAsync] = AuthSession.useAuthRequest(config, discovery);

  if (!clientId) {
    const noop = async () =>
      ({ type: 'cancel' } as AuthSession.AuthSessionResult);
    return [null, null, noop];
  }
  return [request, result, promptAsync];
};

/**
 * Complete the OAuth flow after the user returns from the browser.
 * Stores tokens via `lib/backup/googleDrive.exchangeCodeForTokens`,
 * then invalidates the link-status query so the UI updates.
 */
export const useLinkGoogleDrive = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: async ({
      authResult,
      request,
    }: {
      authResult: AuthSession.AuthSessionResult;
      request: AuthRequest;
    }) => {
      const token = await exchangeCodeForTokens({ authResult, request });
      return token;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backupKeys.linkStatus() });
      queryClient.invalidateQueries({ queryKey: backupKeys.cloud() });
      queryClient.invalidateQueries({ queryKey: backupKeys.cloudNewer() });
      addToast({
        message: 'Google Drive linked',
        variant: 'success',
      });
    },
    onError: (err) => {
      addToast({
        message: err instanceof Error ? err.message : 'Link failed.',
        variant: 'danger',
      });
    },
  });
};

/**
 * Unlink mutation. Deletes both Drive files (best-effort), wipes
 * tokens, clears the linked flag. Local snapshots are untouched.
 */
export const useUnlinkGoogleDrive = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: () => unlinkDrive(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: backupKeys.linkStatus() });
      queryClient.invalidateQueries({ queryKey: backupKeys.cloud() });
      queryClient.invalidateQueries({ queryKey: backupKeys.cloudNewer() });
      addToast({ message: 'Google Drive unlinked', variant: 'success' });
    },
    onError: (err) => {
      addToast({
        message: err instanceof Error ? err.message : 'Unlink failed.',
        variant: 'danger',
      });
    },
  });
};

/* -------------------------------------------------------------------------- */
/*  Cloud backups (for the restore picker)                                    */
/* -------------------------------------------------------------------------- */

/**
 * Cloud backup list — only one row in v1.0 (single Drive file with
 * the latest snapshot). The picker still uses the same shape so a
 * future "versioned cloud history" feature is a drop-in.
 */
export const useCloudBackups = () => {
  const { data: linked } = useDriveLinkStatus();
  return useQuery<CloudBackup[]>({
    queryKey: backupKeys.cloud(),
    enabled: !!linked,
    queryFn: async (): Promise<CloudBackup[]> => {
      const meta = await getMetadataSidecar();
      if (!meta) return [];
      return [
        {
          fileId: 'sarisari_backup.db',
          metadata: meta,
        },
      ];
    },
    staleTime: 60_000,
  });
};

/* -------------------------------------------------------------------------- */
/*  Restore from cloud                                                        */
/* -------------------------------------------------------------------------- */

export const useRestoreFromCloud = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);
  return useMutation({
    mutationFn: (fileId: string) => restoreFromCloud(fileId),
    onSuccess: () => {
      queryClient.clear();
      addToast({
        message: 'Cloud restore complete',
        variant: 'success',
        duration: 8000,
      });
    },
    onError: (err) => {
      if (err instanceof RestoreError) {
        addToast({
          message: err.message,
          variant: 'danger',
          duration: 8000,
        });
        return;
      }
      addToast({
        message: 'Cloud restore failed.',
        variant: 'danger',
      });
    },
  });
};

/* -------------------------------------------------------------------------- */
/*  Cloud-newer banner                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Returns the cloud metadata when it's newer than the last local
 * backup, or `null` otherwise. Drives the `CloudNewerBanner` on app
 * start.
 *
 * Re-checks when `useDriveLinkStatus` flips on — so linking Drive
 * after first launch still surfaces "you have a cloud backup".
 */
export const useCloudNewerStatus = () => {
  const { data: linked } = useDriveLinkStatus();
  return useQuery<{ cloud: Metadata; localAt: number } | null>({
    queryKey: backupKeys.cloudNewer(),
    enabled: !!linked,
    queryFn: async () => {
      return getCloudNewerStatus();
    },
    staleTime: 60_000,
  });
};