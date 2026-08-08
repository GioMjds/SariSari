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

export const backupKeys = {
  all: ['backup'] as const,
  snapshots: () => [...backupKeys.all, 'snapshots'] as const,
  cloud: () => [...backupKeys.all, 'cloud'] as const,
  linkStatus: () => [...backupKeys.all, 'linkStatus'] as const,
  cloudNewer: () => [...backupKeys.all, 'cloudNewer'] as const,
} as const;

export const useSchedulerInputs = () => {
  const { profile } = useProfile();
  const [salesCount, setSalesCount] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await getAllSales();
        if (!cancelled) setSalesCount(rows.length);
      } catch {}
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

export const useLocalSnapshots = () =>
  useQuery({
    queryKey: backupKeys.snapshots(),
    queryFn: () => listAutoSnapshots(),
    staleTime: 30_000,
  });

export const useBackupNow = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation({
    mutationFn: async () => {
      const result = await createLocalSnapshot();
      if (!result.ok) return result;
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

export const useDriveLinkStatus = () =>
  useQuery({
    queryKey: backupKeys.linkStatus(),
    queryFn: () => isDriveLinked(),
    staleTime: 60_000,
  });

export const useGoogleAuthRequest = (): [
  AuthRequest | null,
  AuthSession.AuthSessionResult | null,
  (
    opts?: AuthSession.AuthRequestPromptOptions,
  ) => Promise<AuthSession.AuthSessionResult>,
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
  const [request, result, promptAsync] = AuthSession.useAuthRequest(
    config,
    discovery,
  );

  if (!clientId) {
    const noop = async () =>
      ({ type: 'cancel' }) as AuthSession.AuthSessionResult;
    return [null, null, noop];
  }
  return [request, result, promptAsync];
};

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

export const useCloudNewerStatus = () => {
  const { data: linked } = useDriveLinkStatus();
  return useQuery<{ cloud: Metadata; localAt: number } | null>({
    queryKey: backupKeys.cloudNewer(),
    enabled: !!linked,
    queryFn: async () => {
      return await getCloudNewerStatus();
    },
    staleTime: 60_000,
  });
};
