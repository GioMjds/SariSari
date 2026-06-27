// components/settings/backup/LocalSnapshotsSection.tsx
// Renders the rolling-7 local snapshot list, a "Backup now" button, and a
// "Restore from backup" button that opens the picker modal. Lives in the
// Settings → Database section per spec §8.
//
// The list is rendered inline (no separate screen) because the 7-snapshot
// cap means a FlatList is overkill — a `View` of 7 rows is always
// cheaper.

import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { StyledText } from '@/components/elements';
import {
  useBackupNow,
  useLocalSnapshots,
  useRestoreFromSnapshot,
} from '@/hooks/useBackup';
import { RestorePickerModal } from './RestorePickerModal';
import type { Snapshot } from '@/lib/backup';

/**
 * Format a file size in bytes as a short human string (`1.2 MB`,
 * `980 KB`, etc.). Locale-neutral.
 */
const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * "X minutes ago" / "X hours ago" / "Yesterday" / "Jun 25" string for the
 * snapshot list. Uses the file's ISO-prefixed filename as the source of
 * truth so the age matches what the user sees in the filename.
 *
 * Falls back to `createdAt` (mtime) if the filename doesn't parse.
 */
const formatRelative = (
  isoStamp: string,
  t: (key: string, options?: Record<string, unknown>) => string,
): string => {
  // "2026-06-27_14-02-31-421" → parseable.
  const m = isoStamp.match(
    /^(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})-(\d{3})$/,
  );
  if (!m) return '';
  const [, y, mo, d, hh, mm, ss, ms] = m;
  const dt = new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(hh),
    Number(mm),
    Number(ss),
    Number(ms),
  );
  const diffMs = Date.now() - dt.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return t('common:settingsBackupJustNow');
  if (diffMin < 60) return t('common:settingsBackupMinutesAgo', { count: diffMin });
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return t('common:settingsBackupHoursAgo', { count: diffHr });
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return t('common:settingsBackupYesterday');
  if (diffDay < 7)
    return t('common:settingsBackupDaysAgo', { count: diffDay });
  // Older — show the date.
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${monthNames[dt.getMonth()]} ${dt.getDate()}`;
};

export function LocalSnapshotsSection() {
  const { t } = useTranslation();
  const snapshotsQuery = useLocalSnapshots();
  const backupNow = useBackupNow();
  const restore = useRestoreFromSnapshot();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSelection, setPickerSelection] = useState<Snapshot | null>(
    null,
  );

  const snapshots = snapshotsQuery.data ?? [];
  const isLoading = snapshotsQuery.isLoading;
  const lastSnapshot = snapshots[0] ?? null;

  const openPicker = () => {
    setPickerSelection(null);
    setPickerOpen(true);
  };

  const handlePickRestore = (snap: Snapshot) => {
    setPickerSelection(snap);
  };

  const handleConfirmRestore = async () => {
    if (pickerSelection) {
      await restore.mutateAsync(pickerSelection);
    }
    setPickerOpen(false);
    setPickerSelection(null);
  };

  return (
    <View>
      {/* Top row: count + Backup now */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-warm-100">
        <View className="flex-1 mr-3">
          <StyledText variant="semibold" className="text-sm text-ink-700">
            {t('common:localSnapshotsSection')}
          </StyledText>
          <StyledText variant="regular" className="text-xs text-ink-500 mt-0.5">
            {snapshots.length === 0
              ? t('common:localSnapshotsEmpty')
              : t('common:localSnapshotsCount', { count: snapshots.length })}
          </StyledText>
        </View>
        <Pressable
          onPress={() => backupNow.mutate()}
          disabled={backupNow.isPending}
          accessibilityRole="button"
          accessibilityLabel={t('common:cloudBackupBackupNow')}
          className="bg-persimmon-500 rounded-xl px-4 py-2 active:opacity-70"
          style={{ minWidth: 88, alignItems: 'center' }}
        >
          {backupNow.isPending ? (
            <ActivityIndicator color="#FBF7EE" size="small" />
          ) : (
            <StyledText
              variant="extrabold"
              className="text-paper-50 text-xs uppercase"
              style={{ letterSpacing: 0.8 }}
            >
              {t('common:cloudBackupBackupNow')}
            </StyledText>
          )}
        </Pressable>
      </View>

      {/* List of snapshots (newest first) */}
      {isLoading ? (
        <View className="px-4 py-6 items-center">
          <ActivityIndicator color="#623418" />
        </View>
      ) : snapshots.length === 0 ? (
        <View className="px-4 py-6">
          <StyledText
            variant="regular"
            className="text-xs text-ink-400 text-center"
          >
            {t('common:localSnapshotsEmpty')}
          </StyledText>
        </View>
      ) : (
        snapshots.slice(0, 7).map((snap) => {
          const filename = snap.path.split('/').pop() ?? '';
          const isoStamp = filename
            .replace(/^sarisari_snapshot_/, '')
            .replace(/\.db$/, '');
          return (
            <View
              key={snap.path}
              className="px-4 py-3 border-b border-warm-100 last:border-b-0 flex-row items-center"
            >
              <View className="w-9 h-9 rounded-full bg-warm-100 items-center justify-center mr-3">
                <FontAwesome name="database" size={14} color="#623418" />
              </View>
              <View className="flex-1">
                <StyledText variant="semibold" className="text-sm text-ink-700">
                  {formatRelative(isoStamp, t) || isoStamp}
                </StyledText>
                <StyledText
                  variant="regular"
                  className="text-xs text-ink-400 mt-0.5"
                >
                  {t('common:localSnapshotsAutoLabel')} ·{' '}
                  {formatBytes(snap.bytes)}
                </StyledText>
              </View>
            </View>
          );
        })
      )}

      {/* Restore button — only when we have snapshots */}
      {snapshots.length > 0 ? (
        <Pressable
          onPress={openPicker}
          accessibilityRole="button"
          accessibilityLabel={t('common:restorePickerTitle')}
          className="px-4 py-3 flex-row items-center active:opacity-80"
        >
          <View className="w-9 h-9 rounded-full bg-warm-100 items-center justify-center mr-3">
            <FontAwesome name="history" size={15} color="#623418" />
          </View>
          <View className="flex-1">
            <StyledText variant="semibold" className="text-sm text-ink-700">
              {t('common:restorePickerTitle')}
            </StyledText>
            {lastSnapshot ? (
              <StyledText
                variant="regular"
                className="text-xs text-ink-400 mt-0.5"
              >
                {t('common:localSnapshotsLatestHint', {
                  bytes: formatBytes(lastSnapshot.bytes),
                })}
              </StyledText>
            ) : null}
          </View>
          <FontAwesome name="chevron-right" size={14} color="#9C8E7E" />
        </Pressable>
      ) : null}

      <RestorePickerModal
        visible={pickerOpen}
        snapshots={snapshots}
        selected={pickerSelection}
        onSelect={handlePickRestore}
        onClose={() => {
          setPickerOpen(false);
          setPickerSelection(null);
        }}
        onConfirm={handleConfirmRestore}
        confirming={restore.isPending}
      />
    </View>
  );
}
