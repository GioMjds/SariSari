import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTabBarBottomOffset } from '@/components/layout';
import { goBackToMore, MoreDetailHeader } from '@/components/more';
import { useProfile } from '@/hooks/useProfile';
import { LanguagePickerDialog } from '@/components/settings/LanguagePickerDialog';
import { SupportedLanguage } from '@/lib/i18n';
import { OwnerPinSettingsCard } from '@/components/settings/OwnerPinSettingsCard';
import {
  SettingsRow,
  SettingsSection,
} from '@/components/settings/SettingsPrimitives';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { profile, loading: profileLoading } = useProfile();
  const [languagePickerOpen, setLanguagePickerOpen] = useState<boolean>(false);
  const bottomOffset = useTabBarBottomOffset();

  const activeLang = i18n.language as SupportedLanguage;
  const languageValue =
    activeLang === 'tl'
      ? t('common:languageTagalog')
      : t('common:languageEnglish');

  return (
    <View className="flex-1 bg-paper-200">
      <MoreDetailHeader
        title={t('common:settingsTitle')}
        subtitle={t('common:settingsSubtitle')}
        onBack={goBackToMore}
        backAccessibilityLabel={t('common:moreBackA11y')}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: bottomOffset + 16 }}>
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
          title={t('common:settingsSecuritySection')}
          subtitle={t('common:settingsSecuritySectionSub')}
        >
          <OwnerPinSettingsCard />
        </SettingsSection>
      </ScrollView>

      <LanguagePickerDialog
        visible={languagePickerOpen}
        onClose={() => setLanguagePickerOpen(false)}
      />
    </View>
  );
}
