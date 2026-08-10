import { StyledText } from '@/components/elements';
import { useTranslation } from 'react-i18next';
import { Href, router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { SupportedLanguage } from '@/lib/i18n';
import { MoreGroupSection } from './MoreGroupSection';
import { MoreLinkRow } from './MoreLinkRow';

const routes = {
  reports: '/(tabs)/home',
  cashEntries: '/(tabs)/more/cash-entries',
  settings: '/(tabs)/more/settings',
  // This route is not yet implemented.
  expenses: '/(tabs)/more/expenses',
} satisfies Record<string, Href>;

export function MoreHomeScreen() {
  const { t, i18n } = useTranslation();
  const activeLang = i18n.language as SupportedLanguage;
  const languageValue =
    activeLang === 'tl'
      ? t('common:languageTagalog')
      : t('common:languageEnglish');

  return (
    <View className="flex-1 bg-paper-200">
      <View className="bg-cinnamon-500 px-5 pt-3 pb-6">
        <StyledText
          variant="extrabold"
          className="text-h1 text-paper-50 text-3xl"
          style={{ letterSpacing: -0.28 }}
        >
          {t('common:moreHomeTitle')}
        </StyledText>
        <StyledText
          variant="regular"
          className="text-sm text-paper-200 opacity-90 mt-1"
        >
          {t('common:moreHomeSubtitle')}
        </StyledText>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 96 }}>
        <MoreGroupSection title={t('common:moreHomeBusinessReviewSection')}>
          <MoreLinkRow
            label={t('common:moreHomeReportsLabel')}
            subtitle={t('common:moreHomeReportsSub')}
            icon="bar-chart"
            onPress={() => router.push(routes.reports)}
          />
          <MoreLinkRow
            label={t('common:moreHomeExpensesLabel')}
            subtitle={t('common:moreHomeExpensesSub')}
            icon="money"
            onPress={() => router.push(routes.expenses)}
          />
          <MoreLinkRow
            label={t('common:moreHomeCashEntriesLabel')}
            subtitle={t('common:moreHomeCashEntriesSub')}
            icon="money"
            onPress={() => router.push(routes.cashEntries)}
          />
        </MoreGroupSection>

        <MoreGroupSection title={t('common:moreHomeStoreSetupSection')}>
          <MoreLinkRow
            label={t('common:moreHomeStoreProfileLabel')}
            subtitle={t('common:moreHomeStoreProfileSub')}
            icon="home"
            onPress={() => router.push(routes.settings)}
          />
          <MoreLinkRow
            label={t('common:moreHomeLanguageLabel')}
            subtitle={languageValue}
            icon="globe"
            onPress={() => router.push(routes.settings)}
          />
        </MoreGroupSection>

        <MoreGroupSection title={t('common:moreHomeDataSafetySection')}>
          <MoreLinkRow
            label={t('common:moreHomeBackupLabel')}
            subtitle={t('common:moreHomeBackupSub')}
            icon="cloud"
            onPress={() => router.push(routes.settings)}
          />
        </MoreGroupSection>

        <MoreGroupSection title={t('common:moreHomeAppSection')}>
          <MoreLinkRow
            label={t('common:moreHomeHelpLabel')}
            subtitle={t('common:moreHomeHelpSub')}
            icon="question-circle"
            onPress={() => router.push(routes.settings)}
          />
          <MoreLinkRow
            label={t('common:moreHomeAboutLabel')}
            subtitle={t('common:moreHomeAboutSub')}
            icon="info-circle"
            onPress={() => router.push(routes.settings)}
          />
        </MoreGroupSection>
      </ScrollView>
    </View>
  );
}
