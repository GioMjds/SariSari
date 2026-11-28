import { useTranslation } from 'react-i18next';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { useTabBarBottomOffset } from '@/components/layout';
import {
  useFinancialTotals,
  useLocalSnapshots,
  useRepriceFlags,
} from '@/hooks';
import { getTodayDateString } from '@/utils';
import { formatLocalBackupTimestamp } from './formatLocalBackupTimestamp';
import { MORE_ROUTES } from './moreNavigation';
import { MoreDestinationRow } from './MoreDestinationRow';
import { MoreScreenHeader } from './MoreScreenHeader';
import { MoreSection } from './MoreSection';
import { useMoreDestinationNavigation } from './useMoreDestinationNavigation';
import { formatPesos, Pesos } from '@/lib';

type CashSummaryState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; paidExpenses: Pesos; ownerDrawings: Pesos };

type Translator = ReturnType<typeof useTranslation>['t'];
type FinancialTotalsResult = ReturnType<typeof useFinancialTotals>;
type LocalSnapshotsResult = ReturnType<typeof useLocalSnapshots>;

function getCashSummaryState(
  financialTotals: FinancialTotalsResult,
): CashSummaryState {
  if (financialTotals.isLoading) return { status: 'loading' };
  if (financialTotals.isError || !financialTotals.data)
    return { status: 'error' };
  return {
    status: 'ready',
    paidExpenses: financialTotals.data.paidExpenses,
    ownerDrawings: financialTotals.data.ownerDrawings,
  };
}

function getRepriceSupportingText(t: Translator, count: number): string {
  return count > 0
    ? t('common:moreHomeRepriceSubCount', { count: count })
    : t('common:moreHomeRepriceSub');
}

function getBackupSupportingText(
  snapshots: LocalSnapshotsResult,
  t: Translator,
  language: string,
): string {
  if (snapshots.isLoading) return t('common:moreHomeBackupLoading');
  if (snapshots.isError) return t('common:moreHomeBackupError');

  const latest = snapshots.data?.[0];
  if (!latest) return t('common:moreHomeBackupEmpty');

  return t('common:moreHomeBackupLatest', {
    when: formatLocalBackupTimestamp(latest.createdAt, language),
  });
}

function getCashSupportingText(state: CashSummaryState, t: Translator): string {
  if (state.status === 'loading') return t('common:moreHomeCashLoading');
  if (state.status === 'error') return t('common:moreHomeCashError');

  // "Empty" is only ever relevant in the ready branch — keep it inline.
  if (state.paidExpenses === 0 && state.ownerDrawings === 0) {
    return t('common:moreHomeCashEmpty');
  }

  return t('common:moreHomeCashSummary', {
    expenses: formatPesos(state.paidExpenses),
    drawings: formatPesos(state.ownerDrawings),
  });
}

export function MoreHomeScreen() {
  const { t, i18n } = useTranslation();
  const today = getTodayDateString();
  const financialTotals = useFinancialTotals(today, today);
  const snapshots = useLocalSnapshots();
  const repriceFlags = useRepriceFlags();
  const navigate = useMoreDestinationNavigation();
  const bottomOffset = useTabBarBottomOffset();
  const { width } = useWindowDimensions();
  const horizontalPadding = width >= 768 ? 24 : 16;

  const cashState = getCashSummaryState(financialTotals);
  const repriceCount = repriceFlags.data?.length ?? 0;

  const repriceSupportingText = getRepriceSupportingText(t, repriceCount);
  const backupSupportingText = getBackupSupportingText(
    snapshots,
    t,
    i18n.language,
  );
  const supportingText = getCashSupportingText(cashState, t);

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
            title={t('common:moreHomeTitle')}
            supportingText={t('common:moreHomeSubtitle')}
          />

          <MoreSection label={t('common:moreHomeEyebrow')}>
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
            <MoreDestinationRow
              icon="money"
              title={t('common:moreHomeCashLabel')}
              supportingText={supportingText}
              onPress={() => navigate(MORE_ROUTES.cash)}
              accessibilityLabel={`${t('common:moreHomeCashLabel')}. ${supportingText}`}
              accessibilityHint={t('common:moreHomeCashHint')}
            />
            <MoreDestinationRow
              icon="undo"
              title={t('common:moreHomeCorrectionsLabel')}
              supportingText={t('common:moreHomeCorrectionsSub')}
              onPress={() => navigate(MORE_ROUTES.corrections)}
              accessibilityLabel={`${t('common:moreHomeCorrectionsLabel')}. ${t(
                'common:moreHomeCorrectionsSub',
              )}`}
              accessibilityHint={t('common:moreHomeCorrectionsHint')}
            />
            <MoreDestinationRow
              icon="shopping-basket"
              title={t('common:moreHomePalengkeLabel')}
              supportingText={t('common:moreHomePalengkeSub')}
              onPress={() => navigate(MORE_ROUTES.palengke)}
              accessibilityLabel={`${t('common:moreHomePalengkeLabel')}. ${t(
                'common:moreHomePalengkeSub',
              )}`}
              accessibilityHint={t('common:moreHomePalengkeHint')}
            />
            <MoreDestinationRow
              icon="tag"
              title={t('common:moreHomeRepriceLabel')}
              supportingText={repriceSupportingText}
              badgeCount={repriceCount}
              onPress={() => navigate(MORE_ROUTES.reprice)}
              accessibilityLabel={`${t(
                'common:moreHomeRepriceLabel',
              )}. ${repriceSupportingText}`}
              accessibilityHint={t('common:moreHomeRepriceHint')}
            />
            <MoreDestinationRow
              icon="mobile"
              title={t('common:moreHomeEServicesLabel')}
              supportingText={t('common:moreHomeEServicesSub')}
              onPress={() => navigate(MORE_ROUTES.eServices)}
              accessibilityLabel={`${t('common:moreHomeEServicesLabel')}. ${t(
                'common:moreHomeEServicesSub',
              )}`}
              accessibilityHint={t('common:moreHomeEServicesHint')}
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
