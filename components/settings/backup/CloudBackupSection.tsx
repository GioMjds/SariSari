// components/settings/backup/CloudBackupSection.tsx
// Cloud (Google Drive) backup section. Spec §8.
//
// Three observable states plus one "not configured" state:
//
//   1. NOT_CONFIGURED  — `extra.googleClientId` is empty. Renders a
//                        static "Drive is not configured" row.
//   2. UNLINKED        — OAuth client is set but the user hasn't
//                        linked. Shows the Link button → triggers the
//                        `useGoogleAuthRequest` PKCE flow.
//   3. LINKED          — tokens in SecureStore. Shows the last-synced
//                        timestamp and the Unlink button.
//   4. REAUTH          — surfaced via `useCloudNewerStatus` (when a
//                        prior upload produced a 401). Banner-style.
//
// Spec also describes a "Pending sync" indicator when the queue is
// pending and the network gate is closed. We read the pending flag
// from `lib/backup/syncQueue.isPending` on a polling loop.

import Constants from 'expo-constants';
import { FontAwesome } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  Switch,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyledText } from '@/components/elements';
import { useToastStore } from '@/stores';
import {
  AS_KEY_CLOUD_ALLOW_CELLULAR,
  AS_KEY_CLOUD_LAST_SYNC_AT,
  isPending as readCloudPending,
} from '@/lib/backup';
import {
  useDriveLinkStatus,
  useGoogleAuthRequest,
  useLinkGoogleDrive,
  useSchedulerInputs,
  useUnlinkGoogleDrive,
} from '@/hooks/useBackup';

const getGoogleClientId = (): string | null => {
  const id = Constants.expoConfig?.extra?.googleClientId;
  if (typeof id === 'string' && id.trim().length > 0) return id;
  return null;
};

const formatRelativeTime = (
  epochMs: number | null | undefined,
  t: (key: string, options?: Record<string, unknown>) => string,
): string => {
  if (!epochMs) return '';
  const diffMs = Date.now() - epochMs;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return t('common:settingsBackupJustNow');
  if (diffMin < 60) return t('common:settingsBackupMinutesAgo', { count: diffMin });
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return t('common:settingsBackupHoursAgo', { count: diffHr });
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return t('common:settingsBackupYesterday');
  return t('common:settingsBackupDaysAgo', { count: diffDay });
};

export function CloudBackupSection() {
  const { t } = useTranslation();
  const clientId = getGoogleClientId();
  const linkStatus = useDriveLinkStatus();
  const isLinked = !!linkStatus.data;

  if (!clientId) {
    return (
      <View className="px-4 py-4 border-b border-warm-100">
        <View className="flex-row items-start">
          <View className="w-9 h-9 rounded-full bg-warm-100 items-center justify-center mr-3">
            <FontAwesome name="cloud" size={15} color="#623418" />
          </View>
          <View className="flex-1">
            <StyledText variant="semibold" className="text-sm text-ink-700">
              {t('common:cloudBackupSectionTitle')}
            </StyledText>
            <StyledText
              variant="regular"
              className="text-xs text-ink-400 mt-1"
            >
              {t('common:cloudBackupNotConfigured')}
            </StyledText>
          </View>
        </View>
      </View>
    );
  }

  if (linkStatus.isLoading) {
    return (
      <View className="px-4 py-6 items-center border-b border-warm-100">
        <ActivityIndicator color="#623418" />
      </View>
    );
  }

  return isLinked ? (
    <LinkedCloudRow />
  ) : (
    <UnlinkedCloudRow />
  );
}

/* -------------------------------------------------------------------------- */
/*  Unlinked                                                                  */
/* -------------------------------------------------------------------------- */

function UnlinkedCloudRow() {
  const { t } = useTranslation();
  const [request, , promptAsync] = useGoogleAuthRequest();
  const link = useLinkGoogleDrive();
  const addToast = useToastStore((s) => s.addToast);
  const [pending, setPending] = useState(false);

  const handleLink = async () => {
    if (!request) return;
    setPending(true);
    try {
      const result = await promptAsync();
      if (result.type === 'success') {
        await link.mutateAsync({ authResult: result, request });
      } else if (result.type === 'error') {
        addToast({
          message:
            result.error?.message ?? t('common:cloudBackupConsentError'),
          variant: 'danger',
        });
      }
      // 'cancel' / 'dismiss' → silent.
    } finally {
      setPending(false);
    }
  };

  return (
    <View>
      <View className="px-4 py-4 border-b border-warm-100 flex-row items-center">
        <View className="w-9 h-9 rounded-full bg-warm-100 items-center justify-center mr-3">
          <FontAwesome name="cloud" size={15} color="#623418" />
        </View>
        <View className="flex-1">
          <StyledText variant="semibold" className="text-sm text-ink-700">
            {t('common:cloudBackupSectionTitle')}
          </StyledText>
          <StyledText variant="regular" className="text-xs text-ink-400 mt-0.5">
            {t('common:cloudBackupUnlinked')}
          </StyledText>
        </View>
      </View>
      <Pressable
        onPress={handleLink}
        disabled={pending || !request}
        accessibilityRole="button"
        accessibilityLabel={t('common:cloudBackupLink')}
        className="px-4 py-3 flex-row items-center active:opacity-80"
      >
        <View className="flex-1 flex-row items-center">
          {pending ? (
            <ActivityIndicator color="#623418" size="small" />
          ) : (
            <FontAwesome name="link" size={14} color="#623418" />
          )}
          <StyledText
            variant="semibold"
            className={`ml-3 text-sm ${
              pending ? 'text-ink-400' : 'text-persimmon-600'
            }`}
          >
            {t('common:cloudBackupLink')}
          </StyledText>
        </View>
      </Pressable>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  Linked                                                                    */
/* -------------------------------------------------------------------------- */

function LinkedCloudRow() {
  const { t } = useTranslation();
  const inputs = useSchedulerInputs();
  const unlink = useUnlinkGoogleDrive();
  const addToast = useToastStore((s) => s.addToast);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [pending, setPending] = useState<boolean>(false);
  const [cellularAllowed, setCellularAllowed] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);

  // Read the last-sync timestamp from AsyncStorage on mount and
  // re-read whenever the link-status flips. The scheduler writes
  // `cloud_last_sync_at` after every successful upload.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const v = await AsyncStorage.getItem(AS_KEY_CLOUD_LAST_SYNC_AT);
        if (!cancelled) setLastSyncAt(v ? Number(v) : null);
        const cell = await AsyncStorage.getItem(AS_KEY_CLOUD_ALLOW_CELLULAR);
        if (!cancelled) setCellularAllowed(cell === 'true');
      } catch {
        // ignore — first run
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Poll the pending flag every 30s so the UI updates when the
  // scheduler drains the queue on a Wi-Fi reconnect.
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const p = await readCloudPending();
        if (!cancelled) setPending(p);
      } catch {
        // ignore
      }
    };
    void tick();
    const handle = setInterval(tick, 30_000);
    return () => {
      cancelled = true;
      clearInterval(handle);
    };
  }, []);

  const handleUnlink = async () => {
    try {
      await unlink.mutateAsync();
    } catch {
      // Toast surfaced by useUnlinkGoogleDrive.
    }
  };

  const handleBackupNow = async () => {
    setBusy(true);
    try {
      const { createLocalSnapshot, markPending } = await import(
        '@/lib/backup'
      );
      const result = await createLocalSnapshot();
      if (!result.ok) {
        addToast({
          message:
            result.error.kind === 'insufficient_disk'
              ? t('common:backupInsufficientDisk', {
                  mb: Math.ceil(result.error.needBytes / (1024 * 1024)),
                })
              : t('common:backupFailedGeneric'),
          variant: 'danger',
        });
        return;
      }
      await markPending();
      // Drain immediately if possible (best-effort).
      const { consumeQueue } = await import('@/lib/backup');
      await consumeQueue(inputs);
      setLastSyncAt(Date.now());
      addToast({ message: 'Backup complete', variant: 'success' });
    } finally {
      setBusy(false);
    }
  };

  const handleCellularToggle = async (next: boolean) => {
    setCellularAllowed(next);
    try {
      if (next) {
        await AsyncStorage.setItem(AS_KEY_CLOUD_ALLOW_CELLULAR, 'true');
      } else {
        await AsyncStorage.removeItem(AS_KEY_CLOUD_ALLOW_CELLULAR);
      }
    } catch {
      // revert on failure
      setCellularAllowed(!next);
    }
  };

  return (
    <View>
      {/* Header */}
      <View className="px-4 py-4 border-b border-warm-100 flex-row items-center">
        <View className="w-9 h-9 rounded-full bg-warm-100 items-center justify-center mr-3">
          <FontAwesome name="cloud" size={15} color="#623418" />
        </View>
        <View className="flex-1">
          <StyledText variant="semibold" className="text-sm text-ink-700">
            {t('common:cloudBackupSectionTitle')}
          </StyledText>
          <StyledText variant="regular" className="text-xs text-ink-500 mt-0.5">
            {t('common:cloudBackupLinked')}
          </StyledText>
          {lastSyncAt ? (
            <StyledText
              variant="regular"
              className="text-xs text-ink-400 mt-1"
            >
              {t('common:cloudBackupLastSync', {
                when: formatRelativeTime(lastSyncAt, t),
              })}
            </StyledText>
          ) : null}
          {pending ? (
            <StyledText
              variant="semibold"
              className="text-xs text-persimmon-600 mt-1"
            >
              {t('common:cloudBackupPending', { count: 1 })}
            </StyledText>
          ) : null}
        </View>
      </View>

      {/* Backup now */}
      <Pressable
        onPress={handleBackupNow}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={t('common:cloudBackupBackupNow')}
        className="px-4 py-3 flex-row items-center active:opacity-80 border-b border-warm-100"
      >
        <View className="flex-1 flex-row items-center">
          {busy ? (
            <ActivityIndicator color="#623418" size="small" />
          ) : (
            <FontAwesome name="cloud-upload" size={14} color="#623418" />
          )}
          <StyledText
            variant="semibold"
            className={`ml-3 text-sm ${busy ? 'text-ink-400' : 'text-persimmon-600'}`}
          >
            {t('common:cloudBackupBackupNow')}
          </StyledText>
        </View>
      </Pressable>

      {/* Cellular toggle */}
      <View className="px-4 py-3 flex-row items-center border-b border-warm-100">
        <View className="flex-1">
          <StyledText variant="semibold" className="text-sm text-ink-700">
            {t('common:useCellularForCloud')}
          </StyledText>
          <StyledText
            variant="regular"
            className="text-xs text-ink-400 mt-0.5"
          >
            {t('common:cloudSyncPendingHint')}
          </StyledText>
        </View>
        <Switch
          value={cellularAllowed}
          onValueChange={handleCellularToggle}
          accessibilityLabel={t('common:useCellularForCloud')}
        />
      </View>

      {/* Unlink */}
      <Pressable
        onPress={handleUnlink}
        disabled={unlink.isPending}
        accessibilityRole="button"
        accessibilityLabel={t('common:cloudBackupUnlink')}
        className="px-4 py-3 flex-row items-center active:opacity-80"
      >
        <View className="flex-1 flex-row items-center">
          {unlink.isPending ? (
            <ActivityIndicator color="#623418" size="small" />
          ) : (
            <FontAwesome name="unlink" size={14} color="#623418" />
          )}
          <StyledText
            variant="semibold"
            className={`ml-3 text-sm ${
              unlink.isPending ? 'text-ink-400' : 'text-ink-700'
            }`}
          >
            {t('common:cloudBackupUnlink')}
          </StyledText>
        </View>
      </Pressable>
    </View>
  );
}