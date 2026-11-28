import { FollowUpSheet } from '@/components/customers/FollowUpSheet';
import { StyledText } from '@/components/elements';
import { RestockSheet } from '@/components/inventory/modals';
import { MoreDetailHeader } from '@/components/more';
import {
  AlertCard,
  NotificationsHero,
  summarizeAlerts,
  type AlertActionKind,
} from '@/components/notifications';
import {
  useMarkCollectionContacted,
  useSetCollectionFollowUp,
} from '@/hooks/useCredits';
import { useHomeAlerts } from '@/hooks/useHomeAlerts';
import type {
  DynamicHomeAlert,
  HomeAlertType,
} from '@/hooks/useSystemNotifications';
import { withProf } from '@/utils/perf';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Href, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Filter = 'all' | 'stock' | 'utang';

type FilterDef = {
  key: Filter;
  labelKey: string;
  types: HomeAlertType[];
};

const FILTERS: FilterDef[] = [
  { key: 'all', labelKey: 'filterAll', types: [] },
  { key: 'stock', labelKey: 'filterStock', types: ['low_stock'] },
  {
    key: 'utang',
    labelKey: 'filterUtang',
    types: ['overdue_debts', 'near_limit'],
  },
];

const FILTER_BY_KEY: Record<Filter, FilterDef> = Object.fromEntries(
  FILTERS.map((f) => [f.key, f]),
) as Record<Filter, FilterDef>;

type Row =
  | { kind: 'header'; key: string; urgent: boolean; count: number }
  | { kind: 'alert'; key: string; alert: DynamicHomeAlert };

const PALENGKE_MIN_ITEMS = 3;
const CONTENT_MAX_WIDTH = 560;

type Translator = ReturnType<typeof useTranslation>['t'];

function matchesFilter(filter: Filter, alert: DynamicHomeAlert): boolean {
  const { types } = FILTER_BY_KEY[filter];
  return types.length === 0 || types.includes(alert.type);
}

function buildRows(alerts: DynamicHomeAlert[], filter: Filter): Row[] {
  const visible = alerts.filter((a) => matchesFilter(filter, a));
  const rows: Row[] = [];
  for (const urgent of [true, false] as const) {
    const group = visible.filter((a) => a.urgent === urgent);
    if (group.length === 0) continue;
    rows.push({
      kind: 'header',
      key: `h:${urgent}`,
      urgent,
      count: group.length,
    });
    for (const alert of group) {
      rows.push({ kind: 'alert', key: alert.id, alert });
    }
  }
  return rows;
}

function buildFilterCounts(alerts: DynamicHomeAlert[]): Record<Filter, number> {
  const counts: Record<Filter, number> = { all: 0, stock: 0, utang: 0 };
  for (const alert of alerts) {
    for (const { key } of FILTERS) {
      if (matchesFilter(key, alert)) counts[key] += 1;
    }
  }
  return counts;
}

function getSubtitle(
  t: Translator,
  state: { isError: boolean; isLoading: boolean; alertCount: number },
): string | undefined {
  if (state.isError) return undefined;
  if (state.isLoading) return t('heroLoading');
  if (state.alertCount === 0) return t('subtitleClear');
  return t('subtitle', { count: state.alertCount });
}

function shouldShowPalengke(state: {
  isError: boolean;
  stockCount: number;
  filter: Filter;
}): boolean {
  if (state.isError) return false;
  if (state.stockCount < PALENGKE_MIN_ITEMS) return false;
  return state.filter === 'all' || state.filter === 'stock';
}

function SectionHeader({
  urgent,
  count,
  t,
}: {
  urgent: boolean;
  count: number;
  t: Translator;
}) {
  const labelKey = urgent ? 'sectionUrgent' : 'sectionWatch';
  return (
    <View
      accessible
      accessibilityRole="header"
      accessibilityLabel={`${t(labelKey)}, ${count}`}
      className="px-4 pt-4 pb-1.5 flex-row items-center"
    >
      <StyledText variant="extrabold" className="text-ink-800 text-base">
        {t(labelKey)}
      </StyledText>
      <View
        className={`ml-2 min-w-6 px-2 py-0.5 rounded-full items-center ${
          urgent ? 'bg-semantic-danger' : 'bg-paper-400'
        }`}
      >
        <StyledText
          variant="extrabold"
          className={`text-xs ${urgent ? 'text-white' : 'text-ink-700'}`}
        >
          {count}
        </StyledText>
      </View>
    </View>
  );
}

function FilterChip({
  label,
  count,
  active,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={accessibilityLabel}
      className={`min-h-11 px-4 rounded-full border flex-row items-center ${
        active
          ? 'bg-ink-900 border-ink-900'
          : 'bg-paper-50 border-paper-300 active:bg-paper-100'
      }`}
    >
      <StyledText
        variant="semibold"
        className={`text-sm ${active ? 'text-paper-50' : 'text-ink-700'}`}
      >
        {label}
      </StyledText>
      <StyledText
        variant="extrabold"
        className={`text-sm ml-1.5 ${active ? 'text-paper-200' : 'text-ink-400'}`}
      >
        {count}
      </StyledText>
    </Pressable>
  );
}

function PalengkeFooter({
  stockCount,
  onPress,
  t,
}: {
  stockCount: number;
  onPress: () => void;
  t: Translator;
}) {
  return (
    <View className="mx-4 mt-4 p-4 rounded-2xl border border-dashed border-ink-300 bg-paper-100">
      <View className="flex-row items-center">
        <FontAwesome
          name="shopping-basket"
          size={18}
          className="text-cinnamon-500"
        />
        <StyledText variant="extrabold" className="ml-2 text-base text-ink-900">
          {t('palengkeTitle')}
        </StyledText>
      </View>
      <StyledText variant="regular" className="text-sm text-ink-500 mt-1">
        {t('palengkeBody', { count: stockCount })}
      </StyledText>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        className="mt-3 min-h-12 rounded-xl border border-cinnamon-500 bg-paper-50 active:bg-cinnamon-50 items-center justify-center"
      >
        <StyledText variant="extrabold" className="text-sm text-cinnamon-500">
          {t('palengkeAction')}
        </StyledText>
      </Pressable>
    </View>
  );
}

function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('notifications');
  const { alerts, isLoading, isError, refetch } = useHomeAlerts();
  const [filter, setFilter] = useState<Filter>('all');
  const [restockTarget, setRestockTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [restockMounted, setRestockMounted] = useState(false);
  const [followUpFor, setFollowUpFor] = useState<DynamicHomeAlert | null>(null);

  const { mutate: setFollowUp } = useSetCollectionFollowUp();
  const {
    mutate: markContacted,
    isPending: isMarking,
    variables: markingId,
  } = useMarkCollectionContacted();

  const summary = useMemo(() => summarizeAlerts(alerts), [alerts]);
  const stockCount = summary.out + summary.low;
  const rows = useMemo(() => buildRows(alerts, filter), [alerts, filter]);
  const filterCounts = useMemo(() => buildFilterCounts(alerts), [alerts]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/home' as Href);
  }, [router]);

  const openRestock = useCallback((alert: DynamicHomeAlert) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setRestockMounted(true);
    setRestockTarget({ id: alert.entityId, name: alert.title });
  }, []);

  const handleStockAlert = useCallback(
    (alert: DynamicHomeAlert, kind: AlertActionKind) => {
      if (kind === 'primary') openRestock(alert);
      else
        router.push(`/(edit-forms)/product-details/${alert.entityId}` as Href);
    },
    [openRestock, router],
  );

  const handleCreditAlert = useCallback(
    (alert: DynamicHomeAlert, kind: AlertActionKind) => {
      const id = alert.entityId;
      if (kind === 'primary') {
        router.push(`/(edit-forms)/add-payment/${id}` as Href);
        return;
      }
      if (kind === 'secondary' && alert.type === 'overdue_debts') {
        markContacted(id, {
          onSuccess: () =>
            void Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            ).catch(() => {}),
        });
        return;
      }
      router.push(`/(edit-forms)/credit-details/${id}` as Href);
    },
    [router, markContacted],
  );

  const handleAction = useCallback(
    (alert: DynamicHomeAlert, kind: AlertActionKind) => {
      if (kind === 'followUp') {
        setFollowUpFor(alert);
        return;
      }
      if (alert.type === 'low_stock') handleStockAlert(alert, kind);
      else handleCreditAlert(alert, kind);
    },
    [handleStockAlert, handleCreditAlert],
  );

  const handleSelectFollowUp = useCallback(
    (followUpBy: string | null) => {
      if (followUpFor) {
        setFollowUp({ customerId: followUpFor.entityId, followUpBy });
      }
      setFollowUpFor(null);
    },
    [followUpFor, setFollowUp],
  );

  const handleRestocked = useCallback(() => {
    if (restockTarget) {
      AccessibilityInfo.announceForAccessibility(
        t('announceRestocked', { name: restockTarget.name }),
      );
    }
  }, [restockTarget, t]);

  const handleFilterChange = useCallback((next: Filter) => {
    Haptics.selectionAsync().catch(() => {});
    setFilter(next);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Row }) =>
      item.kind === 'header' ? (
        <SectionHeader urgent={item.urgent} count={item.count} t={t} />
      ) : (
        <Animated.View entering={FadeIn.duration(200)}>
          <AlertCard
            alert={item.alert}
            isBusy={isMarking && markingId === item.alert.entityId}
            onAction={handleAction}
          />
        </Animated.View>
      ),
    [t, isMarking, markingId, handleAction],
  );

  const showPalengke = shouldShowPalengke({ isError, stockCount, filter });
  const subtitle = getSubtitle(t, {
    isError,
    isLoading,
    alertCount: alerts.length,
  });
  const showFilterStrip = !isError && alerts.length > 0;

  const listHeader = (
    <>
      <NotificationsHero
        total={alerts.length}
        summary={summary}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
      />
      {showFilterStrip ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          className="mt-2"
          accessibilityRole="tablist"
        >
          {FILTERS.map(({ key, labelKey }) => {
            const label = t(labelKey);
            const count = filterCounts[key];
            return (
              <FilterChip
                key={key}
                label={label}
                count={count}
                active={filter === key}
                onPress={() => handleFilterChange(key)}
                accessibilityLabel={t('filterA11y', { label, count })}
              />
            );
          })}
        </ScrollView>
      ) : null}
    </>
  );

  const listFooter = showPalengke ? (
    <PalengkeFooter
      stockCount={stockCount}
      onPress={() => router.push('/settings/palengke-sheet' as Href)}
      t={t}
    />
  ) : null;

  return (
    <View className="flex-1 bg-paper-200">
      <StatusBar style="dark" backgroundColor="#F7F6F2" />
      <MoreDetailHeader
        title={t('title')}
        {...(subtitle ? { subtitle } : {})}
        onBack={handleBack}
        backAccessibilityLabel={t('back')}
      />
      <Animated.FlatList
        data={isError ? [] : rows}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        itemLayoutAnimation={LinearTransition.duration(220)}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        ListEmptyComponent={
          !isError && alerts.length > 0 ? (
            <StyledText
              variant="medium"
              className="text-ink-500 text-sm text-center py-10"
            >
              {t('filterEmpty')}
            </StyledText>
          ) : null
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          width: '100%',
          maxWidth: CONTENT_MAX_WIDTH,
          alignSelf: 'center',
          paddingLeft: insets.left,
          paddingRight: insets.right,
          paddingBottom: insets.bottom + 24,
        }}
      />

      {restockMounted ? (
        <RestockSheet
          visible={restockTarget !== null}
          initialProductId={restockTarget}
          onSubmitted={handleRestocked}
          onClose={() => setRestockTarget(null)}
        />
      ) : null}
      <FollowUpSheet
        visible={followUpFor !== null}
        name={followUpFor?.title ?? ''}
        hasFollowUp={followUpFor?.followUpBy != null}
        onSelect={handleSelectFollowUp}
        onClose={() => setFollowUpFor(null)}
      />
    </View>
  );
}

export default withProf(NotificationsScreen, 'notifications');
