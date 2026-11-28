import { withProf } from '@/utils/perf';
import { FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { Href, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { SariMascot } from '@/components/mascot';
import { PayablesHeader, dueMeta } from '@/components/payables/PayablesHeader';
import { useSupplierBalances } from '@/hooks/useSupplierPayables';
import { formatPesos } from '@/lib/money';
import { getTodayDateString } from '@/utils/timezone';

const RESTOCK_ROUTE = '/(tabs)/inventory/restock' as Href;
const detailRoute = (supplierId: string) =>
  `/(edit-forms)/supplier-payables/${supplierId}` as Href;
const shortDate = (d: string) => format(parseISO(d), 'MMM d');

function SupplierPayablesScreen() {
  const router = useRouter();
  const { t } = useTranslation('receiving');
  const { data, isLoading, isError, refetch } = useSupplierBalances();
  const balances = data ?? [];
  const today = getTodayDateString();
  const totalOwed = balances.reduce((sum, b) => sum + b.owed, 0);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <PayablesHeader title={t('payablesTitle')} fallback={RESTOCK_ROUTE} />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <SariMascot state="loading" size={96} accessibilityLabel="Loading" />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-6 gap-3">
          <StyledText variant="semibold" className="text-ink-700 text-sm text-center">
            {t('errorLoadPayables')}
          </StyledText>
          <Pressable
            onPress={() => void refetch()}
            accessibilityRole="button"
            className="px-4 py-2 rounded-xl bg-paper-200 border border-ink-200"
          >
            <StyledText variant="semibold" className="text-ink-700 text-sm">
              {t('retry')}
            </StyledText>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={balances}
          keyExtractor={(b) => b.supplierId}
          contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 12 }}
          ListHeaderComponent={
            <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4">
              <StyledText variant="black" className="label-caps text-cinnamon-500">
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
              <SariMascot state="empty" size={88} accessibilityLabel="" />
              <StyledText variant="extrabold" className="text-ink-900 text-base text-center">
                {t('payablesEmpty')}
              </StyledText>
              <StyledText variant="regular" className="text-ink-500 text-xs text-center">
                {t('payablesEmptyHint')}
              </StyledText>
            </View>
          }
          renderItem={({ item }) => {
            const due = dueMeta(item.nextDueDate, today, t, shortDate);
            return (
              <Pressable
                onPress={() => router.push(detailRoute(item.supplierId))}
                accessibilityRole="button"
                accessibilityLabel={`${item.supplierName}, ${formatPesos(item.owed)}, ${due.label}`}
                className="bg-paper-50 rounded-2xl border border-ink-100 p-4 shadow-paper flex-row items-center active:opacity-80"
              >
                <View className="flex-1 mr-3">
                  <StyledText variant="extrabold" className="text-ink-900 text-base" numberOfLines={1}>
                    {item.supplierName}
                  </StyledText>
                  <StyledText
                    variant="semibold"
                    className={`text-xs mt-0.5 ${due.overdue ? 'text-semantic-danger' : 'text-ink-500'}`}
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
                <FontAwesome name="chevron-right" size={12} color="#A89F90" style={{ marginLeft: 10 }} />
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

export default withProf(SupplierPayablesScreen, 'supplier-payables');
