// components/settings/backup/CloudBackupSection.tsx
// Cloud (Google Drive) backup section. Phase 1 ships a "not configured"
// state — the OAuth client ID is left empty in `app.json` until the user
// supplies one. Phase 2 fills in the Link / Unlink / Last-synced UI.
//
// The gate lives here, not in `lib/backup/googleDrive.ts`, so users with
// an empty `extra.googleClientId` still see *something* useful in the
// settings (rather than a feature that silently no-ops).

import Constants from 'expo-constants';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { StyledText } from '@/components/elements';

/**
 * Read `extra.googleClientId` from `app.json` via `expo-constants`. Empty
 * string OR undefined OR non-string → "not configured". Phase 2 will
 * also check whether `expo-auth-session` returned a usable client at
 * runtime; for now, presence of a non-empty string is the only gate.
 */
const getGoogleClientId = (): string | null => {
  const id = Constants.expoConfig?.extra?.googleClientId;
  if (typeof id === 'string' && id.trim().length > 0) return id;
  return null;
};

export function CloudBackupSection() {
  const { t } = useTranslation();
  const clientId = getGoogleClientId();

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

  // Phase 2 will render the Link / Unlink / Last-synced UI here.
  // Returning the same "not configured" shell so the layout doesn't
  // jump when Phase 2 lands.
  return (
    <View className="px-4 py-4 border-b border-warm-100">
      <View className="flex-row items-start">
        <View className="w-9 h-9 rounded-full bg-warm-100 items-center justify-center mr-3">
          <FontAwesome name="cloud" size={15} color="#623418" />
        </View>
        <View className="flex-1">
          <StyledText variant="semibold" className="text-sm text-ink-700">
            {t('common:cloudBackupUnlinked')}
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
