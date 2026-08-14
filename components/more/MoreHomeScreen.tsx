import { useTranslation } from 'react-i18next';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { useTabBarBottomOffset } from '@/components/layout';
import { withFeatureGuard } from '@/components/withFeatureGuard';
import { useFinancialTotals, useLocalSnapshots } from '@/hooks';
import { getTodayDateString } from '@/utils';
import {
  CashSummaryFeatureCard,
  type CashSummaryState,
} from './CashSummaryFeatureCard';
import { formatLocalBackupTimestamp } from './formatLocalBackupTimestamp';
import { MORE_ROUTES } from './moreNavigation';
import { MoreDestinationRow } from './MoreDestinationRow';
import { MoreScreenHeader } from './MoreScreenHeader';
import { MoreSection } from './MoreSection';
import { useMoreDestinationNavigation } from './useMoreDestinationNavigation';

function MoreTab() {
  const { t, i18n } = useTranslation();
  const today = getTodayDateString();
  const financialTotals = useFinancialTotals(today, today);
  const snapshots = useLocalSnapshots();
  const navigate = useMoreDestinationNavigation();
  const bottomOffset = useTabBarBottomOffset();
  const { width } = useWindowDimensions();
  const horizontalPadding = width >= 768 ? 24 : 16;

  const cashState: CashSummaryState = financialTotals.isLoading
    ? { status: 'loading' }
    : financialTotals.isError || !financialTotals.data
      ? { status: 'error' }
      : {
          status: 'ready',
          paidExpenses: financialTotals.data.paidExpenses,
          ownerDrawings: financialTotals.data.ownerDrawings,
        };

  const latestSnapshot = snapshots.data?.[0];
  const backupSupportingText = snapshots.isLoading
    ? t('common:moreHomeBackupLoading')
    : snapshots.isError
      ? t('common:moreHomeBackupError')
      : latestSnapshot
        ? t('common:moreHomeBackupLatest', {
            when: formatLocalBackupTimestamp(
              latestSnapshot.createdAt,
              i18n.language,
            ),
          })
        : t('common:moreHomeBackupEmpty');

  return (
    <View className="flex-1 bg-paper-200">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomOffset + 16 }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 640,
            alignSelf: 'center',
            paddingHorizontal: horizontalPadding,
          }}
        >
          <MoreScreenHeader
            eyebrow={t('common:moreHomeEyebrow')}
            title={t('common:moreHomeTitle')}
            supportingText={t('common:moreHomeSubtitle')}
          />

          <MoreSection>
            <CashSummaryFeatureCard
              state={cashState}
              onPress={() => navigate(MORE_ROUTES.cash)}
            />
            <MoreDestinationRow
              icon="bar-chart"
              title={t('common:moreHomeReportsLabel')}
              supportingText={t('common:moreHomeReportsSub')}
              onPress={() => navigate(MORE_ROUTES.reports)}
              accessibilityLabel={`${t('common:moreHomeReportsLabel')}. ${t(
                'common:moreHomeReportsSub',
              )}`}
              accessibilityHint={t('common:moreHomeReportsHint')}
            />
          </MoreSection>

          <MoreSection label={t('common:moreHomeStoreDataSection')}>
            <MoreDestinationRow
              icon="cloud"
              title={t('common:moreHomeBackupLabel')}
              supportingText={backupSupportingText}
              onPress={() => navigate(MORE_ROUTES.backup)}
              accessibilityLabel={`${t('common:moreHomeBackupLabel')}. ${backupSupportingText}`}
              accessibilityHint={t('common:moreHomeBackupHint')}
            />
            <MoreDestinationRow
              icon="cog"
              title={t('common:moreHomeSettingsLabel')}
              supportingText={t('common:moreHomeSettingsSub')}
              onPress={() => navigate(MORE_ROUTES.settings)}
              accessibilityLabel={`${t('common:moreHomeSettingsLabel')}. ${t(
                'common:moreHomeSettingsSub',
              )}`}
              accessibilityHint={t('common:moreHomeSettingsHint')}
            />
          </MoreSection>
        </View>
      </ScrollView>
    </View>
  );
}

export const MoreHomeScreen = withFeatureGuard(MoreTab, !__DEV__);
