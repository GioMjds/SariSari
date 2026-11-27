import { withProf } from '@/utils/perf';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { Href, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { SariMascot } from '@/components/mascot';
import { RefreshableFlatList, SearchBar } from '@/components/ui';
import { DeliveryMonthCard } from '@/components/receiving/DeliveryMonthCard';
import {
  DeliveryReceiptRow,
  DeliveryReceiptRowSkeleton,
} from '@/components/receiving/DeliveryReceiptRow';
import {
  buildSections,
  filterReceipts,
  partitionByStatus,
  summarizeMonth,
  type ReceiptListItem,
} from '@/components/receiving/receiptList';
import { useDeliveryReceipts } from '@/hooks/useDeliveryReceipts';
import type { DeliveryReceiptStatus } from '@/types/deliveries.types';

const TABS: {
  status: DeliveryReceiptStatus;
  labelKey: string;
  emptyKey: string;
}[] = [
  { status: 'draft', labelKey: 'tabDrafts', emptyKey: 'emptyDrafts' },
  { status: 'committed', labelKey: 'tabCommitted', emptyKey: 'emptyCommitted' },
  { status: 'voided', labelKey: 'tabVoided', emptyKey: 'emptyVoided' },
];

const tap = () => {
  Haptics.selectionAsync().catch(() => {});
};

function DeliveryReceiptsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('receiving');
  const [pickedStatus, setPickedStatus] =
    useState<DeliveryReceiptStatus | null>(null);
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // shortcut: loads every receipt to count tabs, fine for a store's volume; page it past a few thousand.
  const { data, isLoading, isError, refetch } = useDeliveryReceipts();

  const groups = useMemo(() => partitionByStatus(data ?? []), [data]);
  const month = useMemo(() => summarizeMonth(groups.committed), [groups]);
  // Open on unfinished drafts when any exist, otherwise on received history.
  const activeStatus =
    pickedStatus ?? (groups.draft.length > 0 ? 'draft' : 'committed');
  const emptyKey =
    TABS.find((tab) => tab.status === activeStatus)?.emptyKey ?? 'emptyDrafts';
  const tabReceipts = groups[activeStatus];
  const items = useMemo(
    () => buildSections(filterReceipts(tabReceipts, query)),
    [tabReceipts, query],
  );

  const openReceipt = useCallback(
    (id: number | 'new') => {
      tap();
      router.push(`/(edit-forms)/delivery-receipt/${id}` as Href);
    },
    [router],
  );

  const openShortages = useCallback(() => {
    tap();
    router.push('/reports/supplier-shortages' as Href);
  }, [router]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderItem = useCallback(
    ({ item }: { item: ReceiptListItem }) =>
      item.type === 'header' ? (
        <View
          accessibilityRole="header"
          className="flex-row items-center justify-between pt-2 pb-2"
        >
          <StyledText variant="extrabold" className="text-sm text-ink-800">
            {item.bucket === 'today'
              ? t('today')
              : item.bucket === 'yesterday'
                ? t('yesterday')
                : format(item.date, 'EEE, MMM dd, yyyy')}
          </StyledText>
          <StyledText
            variant="medium"
            className="text-xs text-ink-500"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {t('deliveryCount', { count: item.count })}
          </StyledText>
        </View>
      ) : (
        <DeliveryReceiptRow receipt={item.receipt} onPress={openReceipt} />
      ),
    [openReceipt, t],
  );

  const listHeader = (
    <View>
      <DeliveryMonthCard summary={month} onOpenShortages={openShortages} />

      <View
        accessibilityRole="tablist"
        className="flex-row bg-paper-200 rounded-xl p-1 mb-3 border border-ink-100"
      >
        {TABS.map((tab) => {
          const isActive = tab.status === activeStatus;
          const count = groups[tab.status].length;
          const nudge = tab.status === 'draft' && count > 0 && !isActive;
          return (
            <Pressable
              key={tab.status}
              onPress={() => {
                tap();
                setPickedStatus(tab.status);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${t(tab.labelKey)}, ${count}`}
              style={{ minHeight: 44 }}
              className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-lg ${
                isActive ? 'bg-paper-50 shadow-paper' : 'active:bg-paper-100'
              }`}
            >
              <StyledText
                variant={isActive ? 'extrabold' : 'semibold'}
                className={`text-sm ${isActive ? 'text-ink-900' : 'text-ink-600'}`}
              >
                {t(tab.labelKey)}
              </StyledText>
              <View
                className={`min-w-[20px] px-1.5 py-px rounded-full items-center ${
                  nudge
                    ? 'bg-persimmon-500'
                    : isActive
                      ? 'bg-ink-900'
                      : 'bg-ink-100'
                }`}
              >
                <StyledText
                  variant="extrabold"
                  className={`text-[11px] ${
                    nudge || isActive ? 'text-paper-50' : 'text-ink-600'
                  }`}
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {count}
                </StyledText>
              </View>
            </Pressable>
          );
        })}
      </View>

      {tabReceipts.length > 0 || query ? (
        <View className="mb-3">
          <SearchBar
            compact
            value={query}
            onChange={setQuery}
            placeholder={t('searchPlaceholder')}
            accessibilityLabel={t('searchLabel')}
            clearAccessibilityLabel={t('clearSearch')}
            autoCorrect={false}
          />
        </View>
      ) : null}
    </View>
  );

  const listEmpty = query ? (
    <View className="items-center py-8 px-6">
      <SariMascot state="empty" size={104} />
      <StyledText
        variant="semibold"
        className="text-ink-700 text-sm text-center mt-3"
      >
        {t('searchEmpty', { query: query.trim() })}
      </StyledText>
      <Pressable
        onPress={() => setQuery('')}
        accessibilityRole="button"
        style={{ minHeight: 44 }}
        className="mt-3 px-5 rounded-xl border border-ink-200 bg-paper-50 items-center justify-center active:bg-paper-100"
      >
        <StyledText variant="semibold" className="text-sm text-ink-800">
          {t('clearSearch')}
        </StyledText>
      </Pressable>
    </View>
  ) : (
    <View className="bg-paper-50 p-6 rounded-2xl border border-dashed border-ink-200 items-center">
      <SariMascot
        state={activeStatus === 'voided' ? 'default' : 'empty'}
        size={120}
      />
      <StyledText
        variant="regular"
        className="text-ink-600 text-sm text-center px-2 mt-2 leading-relaxed"
      >
        {t(emptyKey)}
      </StyledText>
    </View>
  );

  const renderBody = () => {
    if (isLoading) {
      return (
        <View
          className="px-4 pt-1"
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={t('loading')}
        >
          <DeliveryReceiptRowSkeleton />
          <DeliveryReceiptRowSkeleton />
          <DeliveryReceiptRowSkeleton />
        </View>
      );
    }
    if (isError) {
      return (
        <View className="flex-1 items-center justify-center px-8">
          <SariMascot state="error" size={120} />
          <StyledText
            variant="semibold"
            className="text-ink-800 text-sm text-center mt-3"
            accessibilityRole="alert"
          >
            {t('errorLoad')}
          </StyledText>
          <Pressable
            onPress={() => {
              void refetch();
            }}
            accessibilityRole="button"
            style={{ minHeight: 44 }}
            className="mt-4 px-6 rounded-xl bg-ink-900 items-center justify-center active:opacity-80"
          >
            <StyledText variant="semibold" className="text-sm text-paper-50">
              {t('retry')}
            </StyledText>
          </Pressable>
        </View>
      );
    }
    return (
      <RefreshableFlatList<ReceiptListItem>
        data={items}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        isRefreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 4,
          paddingBottom: 24,
        }}
      />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="px-4 pt-3 pb-2 bg-background z-10">
        <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 px-4 py-3 flex-row items-center justify-between">
          <Pressable
            onPress={() => {
              tap();
              router.back();
            }}
            hitSlop={{ top: 16, bottom: 16, left: 20, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={t('goBack')}
            className="press-scale w-10 h-10 items-center justify-center rounded-full bg-paper-100 border border-ink-100 active:opacity-70"
          >
            <FontAwesome name="arrow-left" size={16} color="#0E0C0A" />
          </Pressable>

          <View className="flex-1 px-3 items-center">
            <StyledText
              variant="extrabold"
              accessibilityRole="header"
              className="text-ink-900 text-h2 font-stack-sans-bold"
            >
              {t('listTitle')}
            </StyledText>
          </View>

          <View className="w-10 h-10" />
        </View>
      </View>

      <View className="flex-1">{renderBody()}</View>

      {/* Bottom action bar */}
      <View
        className="px-4 pt-4 bg-paper-50 border-t border-ink-100 shadow-paper"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <Pressable
          onPress={() => openReceipt('new')}
          accessibilityRole="button"
          accessibilityLabel={t('newDelivery')}
          style={{ minHeight: 52 }}
          className="w-full py-4 rounded-xl flex-row items-center justify-center gap-2 bg-persimmon-500 shadow-paper active:bg-persimmon-600"
        >
          <FontAwesome name="plus" size={14} color="#FBF7EE" />
          <StyledText
            variant="extrabold"
            className="text-base font-stack-sans-bold text-paper-50"
          >
            {t('newDelivery')}
          </StyledText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default withProf(DeliveryReceiptsScreen, 'delivery-receipts/index');
