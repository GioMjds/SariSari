import { withProf } from '@/utils/perf';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Href, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { MoreDetailHeader } from '@/components/more';
import { FollowUpSheet } from '@/components/customers/FollowUpSheet';
import { RestockSheet } from '@/components/inventory/modals';
import {
  AlertCard,
  NotificationsHero,
  summarizeAlerts,
  type AlertActionKind,
} from '@/components/notifications';
import { useHomeAlerts } from '@/hooks/useHomeAlerts';
import {
  useMarkCollectionContacted,
  useSetCollectionFollowUp,
} from '@/hooks/useCredits';
import type {
  DynamicHomeAlert,
  HomeAlertType,
} from '@/hooks/useSystemNotifications';

type Filter = 'all' | 'stock' | 'utang';

const FILTERS: { key: Filter; labelKey: string; types: HomeAlertType[] }[] = [
  { key: 'all', labelKey: 'filterAll', types: [] },
  { key: 'stock', labelKey: 'filterStock', types: ['low_stock'] },
  {
    key: 'utang',
    labelKey: 'filterUtang',
    types: ['overdue_debts', 'near_limit'],
  },
];

type Row =
  | { kind: 'header'; key: string; urgent: boolean; count: number }
  | { kind: 'alert'; key: string; alert: DynamicHomeAlert };

const PALENGKE_MIN_ITEMS = 3;

const matches = (f: (typeof FILTERS)[number], a: DynamicHomeAlert) =>
  f.types.length === 0 || f.types.includes(a.type);

function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('notifications');
  const { alerts, isLoading } = useHomeAlerts();
  const [filter, setFilter] = useState<Filter>('all');
  // Held as an object so RestockSheet sees a stable reference and keeps its form state.
  const [restockTarget, setRestockTarget] = useState<{ id: number } | null>(
    null,
  );
  const [followUpFor, setFollowUpFor] = useState<DynamicHomeAlert | null>(
    null,
  );

  const { mutate: setFollowUp } = useSetCollectionFollowUp();
  const {
    mutate: markContacted,
    isPending: isMarking,
    variables: markingId,
  } = useMarkCollectionContacted();

  const summary = useMemo(() => summarizeAlerts(alerts), [alerts]);
  const stockCount = summary.out + summary.low;

  const rows = useMemo<Row[]>(() => {
    const active = FILTERS.find((f) => f.key === filter)!;
    const visible = alerts.filter((a) => matches(active, a));
    const out: Row[] = [];
    for (const urgent of [true, false]) {
      const group = visible.filter((a) => a.urgent === urgent);
      if (group.length === 0) continue;
      out.push({
        kind: 'header',
        key: `h:${urgent}`,
        urgent,
        count: group.length,
      });
      for (const a of group) out.push({ kind: 'alert', key: a.id, alert: a });
    }
    return out;
  }, [alerts, filter]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/home' as Href);
  }, [router]);

  const handleAction = useCallback(
    (alert: DynamicHomeAlert, kind: AlertActionKind) => {
      const id = alert.entityId;
      const productPath = `/(edit-forms)/product-details/${id}` as Href;
      const ledgerPath = `/(edit-forms)/credit-details/${id}` as Href;

      if (kind === 'followUp') {
        setFollowUpFor(alert);
        return;
      }
      if (alert.type === 'low_stock') {
        if (kind === 'primary') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
            () => {},
          );
          setRestockTarget({ id });
        } else router.push(productPath);
        return;
      }
      if (kind === 'primary') {
        router.push(`/(edit-forms)/add-payment/${id}` as Href);
      } else if (kind === 'secondary' && alert.type === 'overdue_debts') {
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        ).catch(() => {});
        markContacted(id);
      } else {
        router.push(ledgerPath);
      }
    },
    [router, markContacted],
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

  const renderItem = useCallback(
    ({ item }: { item: Row }) =>
      item.kind === 'header' ? (
        <View
          accessible
          accessibilityRole="header"
          accessibilityLabel={`${t(item.urgent ? 'sectionUrgent' : 'sectionWatch')}, ${item.count}`}
          className="px-4 pt-4 pb-1.5 flex-row items-center"
        >
          <StyledText variant="extrabold" className="text-ink-800 text-base">
            {t(item.urgent ? 'sectionUrgent' : 'sectionWatch')}
          </StyledText>
          <View
            className={`ml-2 min-w-6 px-2 py-0.5 rounded-full items-center ${
              item.urgent ? 'bg-semantic-danger' : 'bg-paper-400'
            }`}
          >
            <StyledText
              variant="extrabold"
              className={`text-xs ${item.urgent ? 'text-white' : 'text-ink-700'}`}
            >
              {item.count}
            </StyledText>
          </View>
        </View>
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

  const showPalengke =
    stockCount >= PALENGKE_MIN_ITEMS && (filter === 'all' || filter === 'stock');

  const listHeader = (
    <>
      <NotificationsHero
        total={alerts.length}
        summary={summary}
        isLoading={isLoading}
      />
      {alerts.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          className="mt-2"
          accessibilityRole="tablist"
        >
          {FILTERS.map((f) => {
            const count = alerts.filter((a) => matches(f, a)).length;
            const active = filter === f.key;
            const label = t(f.labelKey);
            return (
              <Pressable
                key={f.key}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setFilter(f.key);
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={t('filterA11y', { label, count })}
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
          })}
        </ScrollView>
      ) : null}
    </>
  );

  const listFooter = showPalengke ? (
    <View className="mx-4 mt-4 p-4 rounded-2xl border border-dashed border-ink-300 bg-paper-100">
      <View className="flex-row items-center">
        <FontAwesome name="shopping-basket" size={18} color="#623418" />
        <StyledText variant="extrabold" className="ml-2 text-base text-ink-900">
          {t('palengkeTitle')}
        </StyledText>
      </View>
      <StyledText variant="regular" className="text-sm text-ink-500 mt-1">
        {t('palengkeBody', { count: stockCount })}
      </StyledText>
      <Pressable
        onPress={() => router.push('/settings/palengke-sheet' as Href)}
        accessibilityRole="button"
        className="mt-3 min-h-12 rounded-xl border border-cinnamon-500 bg-paper-50 active:bg-cinnamon-50 items-center justify-center"
      >
        <StyledText variant="extrabold" className="text-sm text-cinnamon-500">
          {t('palengkeAction')}
        </StyledText>
      </Pressable>
    </View>
  ) : null;

  return (
    <View className="flex-1 bg-paper-200">
      <StatusBar style="dark" backgroundColor="#F7F6F2" />
      <MoreDetailHeader
        title={t('title')}
        subtitle={
          alerts.length === 0
            ? t('subtitleClear')
            : t('subtitle', { count: alerts.length })
        }
        onBack={handleBack}
        backAccessibilityLabel={t('back')}
      />
      <Animated.FlatList
        data={rows}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        itemLayoutAnimation={LinearTransition.duration(220)}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        ListEmptyComponent={
          alerts.length > 0 ? (
            <StyledText
              variant="medium"
              className="text-ink-500 text-sm text-center py-10"
            >
              {t('filterEmpty')}
            </StyledText>
          ) : null
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      />

      <RestockSheet
        visible={restockTarget !== null}
        initialProductId={restockTarget}
        onClose={() => setRestockTarget(null)}
      />
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
