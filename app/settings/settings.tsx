import { useState } from 'react';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useTranslation } from 'react-i18next';
import { useTabBarBottomOffset } from '@/components/layout';
import { SariMascot } from '@/components/mascot';
import { goBackToMore, MoreDetailHeader } from '@/components/more';
import { useProfile } from '@/hooks/useProfile';
import { LanguagePickerDialog } from '@/components/settings/LanguagePickerDialog';
import { SupportedLanguage } from '@/lib/i18n';
import { OwnerPinSettingsCard } from '@/components/settings/OwnerPinSettingsCard';
import { VoidWindowCard } from '@/components/settings/VoidWindowCard';
import {
  SettingsRow,
  SettingsSection,
} from '@/components/settings/SettingsPrimitives';
import { StyledText } from '@/components/elements';

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
        onBack={goBackToMore}
        backAccessibilityLabel={t('common:moreBackA11y')}
      />

      <KeyboardAwareScrollView
        bottomOffset={64}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: bottomOffset + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 py-2">
          <View className="bg-paper-50 border border-ink-100 rounded-2xl px-4 py-2 flex-row items-center shadow-paper">
            {/* Left: message */}
            <View className="flex-1 pr-3">
              <View className="flex-row items-center mb-2">
                <View className="w-1.5 h-1.5 rounded-full bg-persimmon-500 mr-2" />
                <StyledText
                  variant="extrabold"
                  className="text-[10px] text-persimmon-600 uppercase tracking-wider"
                >
                  {t('common:sariSays')}
                </StyledText>
              </View>

              <StyledText
                variant="extrabold"
                className="text-h3 text-ink-900 mb-1"
              >
                {t('common:sariSettingsTitle')}
              </StyledText>

              <StyledText
                className="text-caption text-ink-500 leading-5"
                variant="regular"
              >
                {t('common:sariSettingsBody')}
              </StyledText>
            </View>

            {/* Right: mascot */}
            <SariMascot state="settings" size={96} />
          </View>
        </View>

        <SettingsSection title={t('common:settingsStoreSection')}>
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
          <SettingsRow
            label={t('common:settingsLanguage')}
            value={languageValue}
            icon="globe"
            interactive
            onPress={() => setLanguagePickerOpen(true)}
          />
        </SettingsSection>

        <SettingsSection title={t('common:settingsSecuritySection')}>
          <OwnerPinSettingsCard />
        </SettingsSection>

        <SettingsSection title={t('common:settingsSalesSection')}>
          <VoidWindowCard />
        </SettingsSection>
      </KeyboardAwareScrollView>

      <LanguagePickerDialog
        visible={languagePickerOpen}
        onClose={() => setLanguagePickerOpen(false)}
      />
    </View>
  );
}
