// components/settings/backup/CloudNewerBanner.tsx
// Spec §8: dismissable banner that surfaces when Drive has a newer
// backup than the most recent local snapshot. Mounted globally from
// `app/_layout.tsx` so it appears above every screen right after a
// successful link or after `getCloudNewerStatus` flips true.
//
// Tapping "Restore from cloud" opens the `RestorePickerModal` on its
// Cloud tab (the modal is rendered separately by the screen that owns
// the data — this banner only triggers the open state via a callback).

import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { StyledText } from '@/components/elements';
import { useCloudNewerStatus } from '@/hooks/useBackup';

type CloudNewerBannerProps = {
  onRestorePress: () => void;
  onDismiss: () => void;
};

/**
 * Format an epoch ms as a short relative string (e.g. "2h ago"). Uses
 * the same shape as `LocalSnapshotsSection` so the UI feels uniform.
 */
const formatRelative = (
  epochMs: number | null | undefined,
  t: (key: string, options?: Record<string, unknown>) => string,
): string => {
  if (!epochMs) return '';
  const diffMs = Date.now() - epochMs;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return t('common:settingsBackupMinutesAgo', { count: diffMin });
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return t('common:settingsBackupHoursAgo', { count: diffHr });
  const diffDay = Math.floor(diffHr / 24);
  return t('common:settingsBackupDaysAgo', { count: diffDay });
};

export function CloudNewerBanner({
  onRestorePress,
  onDismiss,
}: CloudNewerBannerProps) {
  const { t } = useTranslation();
  const { data } = useCloudNewerStatus();
  if (!data) return null;

  return (
    <View
      accessibilityRole="alert"
      className="bg-persimmon-50 border-b border-persimmon-200 px-4 py-3 flex-row items-start"
    >
      <View className="w-8 h-8 rounded-full bg-persimmon-100 items-center justify-center mr-3 mt-0.5">
        <FontAwesome name="cloud" size={13} color="#C2480E" />
      </View>
      <View className="flex-1">
        <StyledText variant="semibold" className="text-sm text-persimmon-700">
          {t('common:cloudNewerBannerTitle')}
        </StyledText>
        <StyledText
          variant="regular"
          className="text-xs text-persimmon-700 mt-1"
        >
          {t('common:cloudNewerBannerSubtitle', {
            cloud: formatRelative(data.cloud.updatedAt, t),
            local: formatRelative(data.localAt || null, t),
          })}
        </StyledText>
        <View className="flex-row mt-3">
          <Pressable
            onPress={onRestorePress}
            accessibilityRole="button"
            accessibilityLabel={t('common:cloudNewerBannerRestoreCta')}
            className="bg-persimmon-500 rounded-lg px-4 py-2 mr-2 active:opacity-80"
          >
            <StyledText
              variant="extrabold"
              className="text-paper-50 text-xs uppercase"
              style={{ letterSpacing: 0.8 }}
            >
              {t('common:cloudNewerBannerRestoreCta')}
            </StyledText>
          </Pressable>
          <Pressable
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel={t('common:cloudNewerBannerDismiss')}
            className="rounded-lg px-4 py-2 bg-paper-50 border border-warm-100 active:opacity-80"
          >
            <StyledText
              variant="semibold"
              className="text-ink-700 text-xs"
            >
              {t('common:cloudNewerBannerDismiss')}
            </StyledText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}