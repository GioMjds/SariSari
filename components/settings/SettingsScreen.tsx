import { StyledText } from '@/components/elements';
import { useProfile } from '@/hooks/useProfile';
import { FontAwesome } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getCurrentLanguage } from '@/lib/i18n';
import { LanguagePickerDialog } from './LanguagePickerDialog';
import { exportBackup, importRestore } from '@/lib/backup';
import { useQueryClient } from '@tanstack/react-query';

/**
 * SettingsScreen — what the app actually does today, plus the shape of
 * features coming next.
 *
 * Sections:
 *   1. Store           — store name + owner name (live, from onboarding profile).
 *   2. Coming soon     — Backup / Restore / Export. These are real
 *                        features that need design and a privacy review before
 *                        they ship, so they render as interactive rows that
 *                        explain what they will do and acknowledge the user
 *                        with a friendly alert. No fake success state.
 *   3. Language        — opens the language picker dialog so the owner can
 *                        switch between English and Tagalog live.
 *
 * This component is rendered by both `/settings` (the regular route) and
 * `/(edit-forms)/settings` (the modal route), so the visual layer lives
 * here and the route folders decide presentation (modal vs full screen).
 */
export const SettingsScreen = () => {
  const { profile, loading: profileLoading } = useProfile();
  const { t } = useTranslation();
  const [languagePickerOpen, setLanguagePickerOpen] = useState<boolean>(false);
  const queryClient = useQueryClient();

  const handleBackup = useCallback(async () => {
    await exportBackup(t);
  }, [t]);

  const handleRestore = useCallback(async () => {
    await importRestore(t, () => {
      queryClient.clear();
    });
  }, [t, queryClient]);

  const stub = useCallback(
    (label: string) => {
      Alert.alert(
        t('common:settingsComingSoonAlertTitle', { label }),
        t('common:settingsComingSoonAlertBody'),
      );
    },
    [t],
  );

  const activeLang = getCurrentLanguage();
  const languageValue =
    activeLang === 'tl'
      ? t('common:languageTagalog')
      : t('common:languageEnglish');

  return (
    <SafeAreaView className="flex-1 bg-cinnamon-500" edges={['top']}>
      <View className="flex-1 bg-paper-200">
        {/* Header */}
        <View className="bg-cinnamon-500 px-5 pt-3 pb-6">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              {router.canGoBack() && (
                <Pressable
                  onPress={() => router.back()}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel={t('common:settingsGoBackA11y')}
                  className="w-8 h-8 items-center justify-center rounded-full bg-paper-50/15 active:opacity-70"
                >
                  <FontAwesome name="arrow-left" size={14} color="#FBF7EE" />
                </Pressable>
              )}
            </View>
          </View>
          <View className="flex-row items-start justify-between">
            <View className="flex-1 mr-3">
              <StyledText
                variant="extrabold"
                className="text-h1 text-paper-50 text-3xl"
                style={{ letterSpacing: -0.28 }}
              >
                {t('common:settingsTitle')}
              </StyledText>
              <StyledText
                variant="regular"
                className="text-sm text-paper-200 opacity-90 mt-1"
              >
                {t('common:settingsSubtitle')}
              </StyledText>
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 64 }}>
          {/* Section 1 — Store */}
          <SettingsSection
            title={t('common:settingsStoreSection')}
            subtitle={t('common:settingsStoreSectionSub')}
          >
            <SettingsRow
              label={t('common:settingsStoreName')}
              value={
                profileLoading
                  ? t('common:loading')
                  : (profile?.storeName ?? '—')
              }
              icon="home"
            />
            <SettingsRow
              label={t('common:settingsOwnerName')}
              value={
                profileLoading
                  ? t('common:loading')
                  : (profile?.ownerName ?? '—')
              }
              icon="user"
            />
          </SettingsSection>

          {/* Section 2 — Language */}
          <SettingsSection>
            <SettingsRow
              label={t('common:settingsLanguage')}
              value={languageValue}
              icon="globe"
              interactive
              onPress={() => setLanguagePickerOpen(true)}
            />
          </SettingsSection>

          {/* Section 3 — Database */}
          <SettingsSection
            title={t('common:settingsDatabaseSection')}
            subtitle={t('common:settingsDatabaseSub')}
          >
            <SettingsRow
              label={t('common:settingsBackup')}
              value={t('common:settingsBackupAvailable')}
              icon="cloud-upload"
              interactive
              onPress={handleBackup}
            />
            <SettingsRow
              label={t('common:settingsRestore')}
              value={t('common:settingsRestoreAvailable')}
              icon="cloud-download"
              interactive
              onPress={handleRestore}
            />
          </SettingsSection>

          {/* Section 4 — Coming soon */}
          <SettingsSection
            title={t('common:settingsComingSoonSection')}
            subtitle={t('common:settingsComingSoonSub')}
          >
            <SettingsRow
              label={t('common:settingsExport')}
              value={t('common:settingsNotAvailable')}
              icon="share-square-o"
              interactive
              onPress={() => stub(t('common:settingsExport'))}
            />
          </SettingsSection>

          <View className="px-6 pt-2 pb-6">
            <StyledText
              variant="regular"
              className="text-xs text-ink-400 text-center"
            >
              {t('common:settingsFooter')}
            </StyledText>
          </View>
        </ScrollView>
      </View>

      <LanguagePickerDialog
        visible={languagePickerOpen}
        onClose={() => setLanguagePickerOpen(false)}
      />
    </SafeAreaView>
  );
};

type SettingsSectionProps = {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
};

function SettingsSection({ title, subtitle, children }: SettingsSectionProps) {
  return (
    <View className="px-5 mt-6">
      {title ? (
        <StyledText
          variant="extrabold"
          className="text-xs uppercase text-ink-400 mb-1"
          style={{ letterSpacing: 1.2 }}
        >
          {title}
        </StyledText>
      ) : null}
      {subtitle ? (
        <StyledText variant="regular" className="text-xs text-ink-400 mb-2">
          {subtitle}
        </StyledText>
      ) : null}
      <View className="bg-paper-50 rounded-2xl border border-warm-100 overflow-hidden">
        {children}
      </View>
    </View>
  );
}

type SettingsRowProps = {
  label: string;
  value: string;
  subtitle?: string;
  icon?: string;
  interactive?: boolean;
  onPress?: () => void;
};

function SettingsRow({
  label,
  value,
  subtitle,
  icon,
  interactive,
  onPress,
}: SettingsRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!interactive}
      className="px-4 py-3 border-b border-warm-100 last:border-b-0 flex-row items-center active:opacity-80"
    >
      {icon ? (
        <View className="w-9 h-9 rounded-full bg-warm-100 items-center justify-center mr-3">
          <FontAwesome name={icon as any} size={15} color="#623418" />
        </View>
      ) : null}
      <View className="flex-1">
        <StyledText variant="semibold" className="text-sm text-ink-700">
          {label}
        </StyledText>
        <StyledText variant="regular" className="text-sm text-ink-500 mt-0.5">
          {value}
        </StyledText>
        {subtitle ? (
          <StyledText variant="regular" className="text-xs text-ink-400 mt-1">
            {subtitle}
          </StyledText>
        ) : null}
      </View>
      {interactive ? (
        <FontAwesome name="chevron-right" size={14} color="#9C8E7E" />
      ) : null}
    </Pressable>
  );
}
