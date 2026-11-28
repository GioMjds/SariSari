import { withProf } from '@/utils/perf';
import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { Href, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { SariMascot } from '@/components/mascot';
import {
  PAYABLES_COLUMN,
  PayablesError,
  PayablesHeader,
  PayablesSkeleton,
  dueMeta,
} from '@/components/payables/PayablesHeader';
import { RefreshableFlatList } from '@/components/ui';
import { useSupplierBalances } from '@/hooks/useSupplierPayables';
import { formatPesos } from '@/lib/money';
import { ICON_COLOR } from '@/lib/theme';
import type { SupplierBalance } from '@/types/supplierPayables.types';
import { getTodayDateString } from '@/utils/timezone';

const RESTOCK_ROUTE = '/(tabs)/inventory/restock' as Href;
const detailRoute = (supplierId: string) =>
  `/(edit-forms)/supplier-payables/${supplierId}` as Href;
const shortDate = (d: string) => format(parseISO(d), 'MMM d');

function SupplierPayablesScreen() {
  const router = useRouter();
  const { t } = useTranslation('receiving');
  const { data, isLoading, isError, refetch } = useSupplierBalances();
  const [refreshing, setRefreshing] = useState(false);
  const balances = data ?? [];
  const today = getTodayDateString();
  const totalOwed = balances.reduce((sum, b) => sum + b.owed, 0);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const renderItem = useCallback(
    ({ item }: { item: SupplierBalance }) => {
      const due = dueMeta(item.nextDueDate, today, t, shortDate);
      return (
        <Pressable
          onPress={() => router.push(detailRoute(item.supplierId))}
          accessibilityRole="button"
          accessibilityLabel={`${item.supplierName}, ${formatPesos(item.owed)}, ${due.label}`}
          className="bg-paper-50 rounded-2xl border border-ink-100 p-4 min-h-[64px] flex-row items-center active:bg-paper-100"
        >
          <View className="flex-1 mr-3">
            <StyledText variant="extrabold" className="text-ink-900 text-base" numberOfLines={2}>
              {item.supplierName}
            </StyledText>
            <StyledText
              variant="semibold"
              className={`text-xs mt-0.5 ${due.overdue ? 'text-semantic-danger' : 'text-ink-600'}`}
            >
              {due.label} · {t('payablesOpenCount', { count: item.openCount })}
            </StyledText>
          </View>
          <StyledText
            variant="black"
            className={`text-lg ${due.overdue ? 'text-semantic-danger' : 'text-ink-900'}`}
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {formatPesos(item.owed)}
          </StyledText>
          <FontAwesome name="chevron-right" size={12} color={ICON_COLOR.inkFaint} style={{ marginLeft: 10 }} />
        </Pressable>
      );
    },
    [router, t, today],
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <PayablesHeader title={t('payablesTitle')} fallback={RESTOCK_ROUTE} />

      {isLoading ? (
        <PayablesSkeleton />
      ) : isError ? (
        <PayablesError onRetry={() => void refetch()} />
      ) : (
        <RefreshableFlatList
          data={balances}
          keyExtractor={(b) => b.supplierId}
          isRefreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={[{ padding: 16, paddingBottom: 40, gap: 12 }, PAYABLES_COLUMN]}
          ListHeaderComponent={
            <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4 mb-3">
              <StyledText variant="semibold" className="text-ink-700 text-sm">
                {t('payablesTotalOwed')}
              </StyledText>
              <StyledText
                variant="black"
                className="text-cinnamon-600 text-3xl mt-1"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {formatPesos(totalOwed)}
              </StyledText>
            </View>
          }
          ListEmptyComponent={
            <View className="items-center py-10 px-6 gap-2">
              <SariMascot state="empty" size={230} accessibilityLabel="" animated={false} />
              <StyledText variant="extrabold" className="text-ink-900 text-xl text-center">
                {t('payablesEmpty')}
              </StyledText>
              <StyledText variant="regular" className="text-ink-600 text-base text-center">
                {t('payablesEmptyHint')}
              </StyledText>
            </View>
          }
          renderItem={renderItem}
        />
      )}
    </SafeAreaView>
  );
}

export default withProf(SupplierPayablesScreen, 'supplier-payables');
