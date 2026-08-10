import { ScrollView, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { MoreGroupSection } from '@/components/more';
import { useProfile } from '@/hooks/useProfile';
import { useBackup } from '@/hooks/useBackup';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { profile, loading: profileLoading } = useProfile();
  const { backups, createBackup, isCreating } = useBackup();
  const currentLang = i18n.language;

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <View className="flex-1 bg-paper-200">
      <View className="bg-cinnamon-500 px-5 pt-3 pb-6">
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
        {/* Store Profile Section */}
        <MoreGroupSection
          title={t('common:settingsStoreSection')}
          subtitle={t('common:settingsStoreSectionSub')}
        >
          <View className="px-4 py-3">
            <StyledText variant="medium" className="text-xs text-ink-400">
              {t('common:settingsStoreName')}
            </StyledText>
            <StyledText variant="semibold" className="text-sm text-ink-900 mt-0.5 mb-3">
              {profileLoading ? '...' : (profile?.storeName || '—')}
            </StyledText>
            <StyledText variant="medium" className="text-xs text-ink-400">
              {t('common:settingsOwnerName')}
            </StyledText>
            <StyledText variant="semibold" className="text-sm text-ink-900 mt-0.5">
              {profileLoading ? '...' : (profile?.ownerName || '—')}
            </StyledText>
          </View>
        </MoreGroupSection>

        {/* Language Section */}
        <MoreGroupSection title={t('common:settingsLanguage')}>
          <View className="px-4 py-3 flex-row gap-3">
            <TouchableOpacity
              onPress={() => handleLanguageChange('en')}
              className={`flex-1 py-2.5 rounded-xl border items-center justify-center ${
                currentLang.startsWith('en')
                  ? 'bg-cinnamon-500 border-cinnamon-500'
                  : 'bg-paper-50 border-warm-200'
              }`}
            >
              <StyledText
                variant="semibold"
                className={currentLang.startsWith('en') ? 'text-paper-50' : 'text-ink-700'}
              >
                English
              </StyledText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleLanguageChange('tl')}
              className={`flex-1 py-2.5 rounded-xl border items-center justify-center ${
                currentLang.startsWith('tl')
                  ? 'bg-cinnamon-500 border-cinnamon-500'
                  : 'bg-paper-50 border-warm-200'
              }`}
            >
              <StyledText
                variant="semibold"
                className={currentLang.startsWith('tl') ? 'text-paper-50' : 'text-ink-700'}
              >
                Tagalog
              </StyledText>
            </TouchableOpacity>
          </View>
        </MoreGroupSection>

        {/* Database Section */}
        <MoreGroupSection
          title={t('common:settingsDatabaseSection')}
          subtitle={t('common:settingsDatabaseSub')}
        >
          <View className="px-4 py-3">
            <StyledText variant="medium" className="text-xs text-ink-600 mb-2">
              Local Snapshots: {backups.length} stored on device
            </StyledText>
            <TouchableOpacity
              onPress={() => createBackup()}
              disabled={isCreating}
              className="bg-warm-100 active:bg-warm-200 py-2.5 px-4 rounded-xl flex-row items-center justify-center gap-2 border border-warm-300"
            >
              {isCreating ? (
                <ActivityIndicator size="small" color="#623418" />
              ) : null}
              <StyledText variant="semibold" className="text-xs text-warm-900">
                Create Backup Snapshot
              </StyledText>
            </TouchableOpacity>
          </View>
        </MoreGroupSection>

        <View className="px-5 mt-6 items-center">
          <StyledText variant="regular" className="text-xs text-ink-400 text-center">
            {t('common:settingsFooter')}
          </StyledText>
        </View>
      </ScrollView>
    </View>
  );
}
