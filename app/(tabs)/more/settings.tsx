import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FontAwesome } from '@expo/vector-icons';

import { StyledText } from '@/components/elements';
import { useProfile } from '@/hooks/useProfile';
import { LanguagePickerDialog } from '@/components/settings/LanguagePickerDialog';
import {
  CloudBackupSection,
  LocalSnapshotsSection,
} from '@/components/settings/backup';
import { SupportedLanguage } from '@/lib/i18n';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { profile, loading: profileLoading } = useProfile();
  const [languagePickerOpen, setLanguagePickerOpen] = useState<boolean>(false);

  const activeLang = i18n.language as SupportedLanguage;
  const languageValue =
    activeLang === 'tl'
      ? t('common:languageTagalog')
      : t('common:languageEnglish');

  return (
    <View className="flex-1 bg-paper-200">
      <View className="bg-cinnamon-500 px-5 pt-3 pb-6">
        {router.canGoBack() ? (
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Pressable
                onPress={() => router.back()}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={t('common:settingsGoBackA11y')}
                className="w-8 h-8 items-center justify-center rounded-full bg-paper-50/15 active:opacity-70"
              >
                <FontAwesome name="arrow-left" size={14} color="#FBF7EE" />
              </Pressable>
            </View>
          </View>
        ) : null}
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

      <ScrollView contentContainerStyle={{ paddingBottom: 96 }}>
        <SettingsSection
          title={t('common:settingsStoreSection')}
          subtitle={t('common:settingsStoreSectionSub')}
        >
          <SettingsRow
            label={t('common:settingsStoreName')}
            value={
              profileLoading ? t('common:loading') : (profile?.storeName ?? '—')
            }
            icon="home"
          />
          <SettingsRow
            label={t('common:settingsOwnerName')}
            value={
              profileLoading ? t('common:loading') : (profile?.ownerName ?? '—')
            }
            icon="user"
          />
        </SettingsSection>

        <SettingsSection>
          <SettingsRow
            label={t('common:settingsLanguage')}
            value={languageValue}
            icon="globe"
            interactive
            onPress={() => setLanguagePickerOpen(true)}
          />
        </SettingsSection>

        <SettingsSection
          title={t('common:settingsDatabaseSection')}
          subtitle={t('common:settingsDatabaseSub')}
        >
          <CloudBackupSection />
          <LocalSnapshotsSection />
        </SettingsSection>
      </ScrollView>

      <LanguagePickerDialog
        visible={languagePickerOpen}
        onClose={() => setLanguagePickerOpen(false)}
      />
    </View>
  );
}

function SettingsSection({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
}) {
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

function SettingsRow({
  label,
  value,
  subtitle,
  icon,
  interactive,
  onPress,
}: {
  label: string;
  value: string;
  subtitle?: string;
  icon?: string;
  interactive?: boolean;
  onPress?: () => void;
}) {
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
