import { withProf } from '@/utils/perf';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
import { useKeyboardState } from 'react-native-keyboard-controller';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { startOfDay } from 'date-fns';
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
import { ICON } from '@/components/receiving/iconColors';
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

// Keeps rows readable on tablets instead of stretching edge to edge.
const COLUMN: ViewStyle = { width: '100%', maxWidth: 640, alignSelf: 'center' };

const tap = () => {
  Haptics.selectionAsync().catch(() => {});
};

function DeliveryReceiptsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation('receiving');
  const keyboardVisible = useKeyboardState((s) => s.isVisible);
  const [pickedStatus, setPickedStatus] =
    useState<DeliveryReceiptStatus | null>(null);
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // shortcut: loads every receipt to count tabs, fine for a store's volume; page it past a few thousand.
  const { data, isLoading, isError, refetch } = useDeliveryReceipts();

  // Recomputes Today, Yesterday and this month once the calendar day changes.
  const dayStart = startOfDay(new Date()).getTime();
  const groups = useMemo(() => partitionByStatus(data ?? []), [data]);
  const month = useMemo(
    () => summarizeMonth(groups.committed, new Date(dayStart)),
    [groups, dayStart],
  );
  // Tab counts follow the search so matches in other tabs stay visible.
  const counts = useMemo(
    () =>
      Object.fromEntries(
        TABS.map((tab) => [
          tab.status,
          filterReceipts(groups[tab.status], query).length,
        ]),
      ) as Record<DeliveryReceiptStatus, number>,
    [groups, query],
  );

  // Open on unfinished drafts when any exist, otherwise on received history.
  const activeStatus =
    pickedStatus ?? (groups.draft.length > 0 ? 'draft' : 'committed');
  const activeTab = TABS.find((tab) => tab.status === activeStatus);
  const activeLabel = t(activeTab?.labelKey ?? 'tabDrafts');
  const tabReceipts = groups[activeStatus];
  const items = useMemo(
    () => buildSections(filterReceipts(tabReceipts, query), new Date(dayStart)),
    [tabReceipts, query, dayStart],
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
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const renderItem = useCallback(
    ({ item }: { item: ReceiptListItem }) =>
      item.type === 'header' ? (
        <View
          accessibilityRole="header"
          className="flex-row items-center justify-between pt-2 pb-2"
        >
          <StyledText
            variant="extrabold"
            className="text-sm text-ink-800 flex-1 mr-2"
          >
            {item.bucket === 'today'
              ? t('today')
              : item.bucket === 'yesterday'
                ? t('yesterday')
                : item.date.toLocaleDateString(i18n.language, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
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
    [openReceipt, t, i18n.language],
  );

  const listHeader = (
    <View>
      {isError ? (
        <View
          accessibilityRole="alert"
          style={{ minHeight: 48 }}
          className="flex-row items-center gap-2 bg-semantic-danger-50 border border-semantic-danger-100 rounded-xl pl-3 pr-1 mb-3"
        >
          <FontAwesome name="exclamation-circle" size={13} color={ICON.danger} />
          <StyledText
            variant="medium"
            className="flex-1 text-xs text-semantic-danger"
          >
            {t('refreshFailed')}
          </StyledText>
          <Pressable
            onPress={() => {
              void refetch();
            }}
            accessibilityRole="button"
            style={{ minHeight: 44 }}
            className="px-3 items-center justify-center rounded-lg active:bg-semantic-danger-100"
          >
            <StyledText
              variant="semibold"
              className="text-xs text-semantic-danger"
            >
              {t('retry')}
            </StyledText>
          </Pressable>
        </View>
      ) : null}

      <DeliveryMonthCard summary={month} onOpenShortages={openShortages} />

      <View
        accessibilityRole="tablist"
        className="flex-row bg-paper-100 rounded-xl p-1 mb-3 border border-ink-100"
      >
        {TABS.map((tab) => {
          const isActive = tab.status === activeStatus;
          const count = counts[tab.status];
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
              accessibilityLabel={`${t(tab.labelKey)}, ${t('deliveryCount', { count })}`}
              style={{ minHeight: 48 }}
              className={`flex-1 flex-row items-center justify-center gap-1.5 px-1 rounded-lg ${
                isActive ? 'bg-ink-900' : 'active:bg-paper-200'
              }`}
            >
              <StyledText
                variant={isActive ? 'extrabold' : 'semibold'}
                maxFontSizeMultiplier={1.3}
                numberOfLines={1}
                className={`text-sm flex-shrink ${
                  isActive ? 'text-paper-50' : 'text-ink-700'
                }`}
              >
                {t(tab.labelKey)}
              </StyledText>
              <View
                className={`min-w-[20px] px-1.5 py-px rounded-full items-center ${
                  isActive
                    ? 'bg-paper-50'
                    : nudge
                      ? 'bg-persimmon-600'
                      : 'bg-paper-300'
                }`}
              >
                <StyledText
                  variant="extrabold"
                  maxFontSizeMultiplier={1.3}
                  className={`text-[11px] ${
                    isActive
                      ? 'text-ink-900'
                      : nudge
                        ? 'text-paper-50'
                        : 'text-ink-700'
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
            returnKeyType="search"
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
        {t('searchEmpty', { tab: activeLabel, query: query.trim() })}
      </StyledText>
      <Pressable
        onPress={() => setQuery('')}
        accessibilityRole="button"
        style={{ minHeight: 48 }}
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
        {t(activeTab?.emptyKey ?? 'emptyDrafts')}
      </StyledText>
    </View>
  );

  const renderBody = () => {
    if (isLoading) {
      return (
        <View
          className="px-4 pt-1"
          style={COLUMN}
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
    // A failed refetch keeps the last list; only a first load with no data gets this screen.
    if (isError && !data) {
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
            style={{ minHeight: 48 }}
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
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          COLUMN,
          { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24 },
        ]}
      />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="px-4 pt-3 pb-2 bg-background z-10" style={COLUMN}>
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
            <FontAwesome name="arrow-left" size={16} color={ICON.ink900} />
          </Pressable>

          <View className="flex-1 px-3 items-center">
            <StyledText
              variant="extrabold"
              accessibilityRole="header"
              numberOfLines={1}
              className="text-ink-900 text-h2 font-stack-sans-bold"
            >
              {t('listTitle')}
            </StyledText>
          </View>

          <View className="w-10 h-10" />
        </View>
      </View>

      <View className="flex-1">{renderBody()}</View>

      {/* Bottom action bar, hidden while typing so results keep the room */}
      {keyboardVisible ? null : (
        <View
          className="px-4 pt-4 bg-paper-50 border-t border-ink-100 shadow-paper"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <Pressable
            onPress={() => openReceipt('new')}
            accessibilityRole="button"
            accessibilityLabel={t('newDelivery')}
            style={[COLUMN, { minHeight: 52 }]}
            className="py-4 rounded-xl flex-row items-center justify-center gap-2 bg-persimmon-500 shadow-paper active:bg-persimmon-600"
          >
            <FontAwesome name="plus" size={14} color={ICON.paper50} />
            <StyledText
              variant="extrabold"
              className="text-base font-stack-sans-bold text-paper-50"
            >
              {t('newDelivery')}
            </StyledText>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

export default withProf(DeliveryReceiptsScreen, 'delivery-receipts/index');
