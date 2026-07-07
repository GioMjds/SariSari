import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useCredits, useProfile } from '@/hooks';
import { useModalStore } from '@/stores';
import { matchesSearch } from '@/lib/creditDetails';
import { CreditTransaction } from '@/types/credits.types';
import {
  CreditDetailsHeader,
  CreditDetailsSkeleton,
  CustomerHeroCard,
  CustomerNotFound,
  CreditsTabContent,
  HistoryTabContent,
  PaymentsTabContent,
  TabNavigation,
  type CreditDetailTab,
} from '@/components/utang/credit-details';

/**
 * Credit-details screen — the suki profile view.
 *
 * Layout (top → bottom):
 *   1. `CreditDetailsHeader` — slim top bar (back + delete).
 *   2. `CustomerHeroCard` — receipt-style hero with the customer's
 *      outstanding balance, contact shortcuts, trust tags, and
 *      debt-to-limit warning.
 *   3. `TabNavigation` — animated 3-segment control with sliding
 *      underbar.
 *   4. Active tab content — Credits / Payments / History, with a
 *      local search filter at the top of Credits and Payments.
 *
 * The screen is the orchestrator: it owns data fetching via hooks,
 * the page-level refresh control, the modals (delete, mark all paid),
 * and routes to add-credit / add-payment. All visual rendering of
 * list rows, headers, skeleton, and per-tab states is delegated to
 * the presentation sub-components under `components/utang/credit-details/`.
 */
export default function CustomerDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { openModal } = useModalStore();

  const {
    useCustomerDetails,
    useCreditHistory,
    useMarkAllCreditsAsPaid,
    useDeleteCustomer,
  } = useCredits();

  const {
    data: customer,
    isLoading,
    isRefetching,
    refetch,
  } = useCustomerDetails(id);

  const { data: history = [] } = useCreditHistory(id);
  const { profile } = useProfile();

  const markAllPaidMutation = useMarkAllCreditsAsPaid();
  const deleteCustomerMutation = useDeleteCustomer();

  const [activeTab, setActiveTab] = useState<CreditDetailTab>('credits');

  // Local search state per-tab. Switching tabs preserves the queries.
  const [searchByTab, setSearchByTab] = useState<
    Record<CreditDetailTab, string>
  >({
    credits: '',
    payments: '',
    history: '',
  });

  const handleRefresh = useCallback(() => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['credit-history', id] });
  }, [refetch, queryClient, id]);

  const handleBack = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    router.back();
  }, []);

  // ─── Modal handlers ─────────────────────────────────────────────

  const handleMarkAllPaid = useCallback(() => {
    if (!customer) return;
    openModal({
      title: 'Mark All as Paid',
      description: `Mark all credits for ${customer.name} as paid?`,
      variant: 'warning',
      icon: 'check-circle',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'default',
          onPress: () => markAllPaidMutation.mutate(customer.id),
        },
      ],
    });
  }, [customer, openModal, markAllPaidMutation]);

  const handleDeleteCustomer = useCallback(() => {
    if (!customer) return;
    openModal({
      title: 'Delete Customer',
      description: `Are you sure you want to delete ${customer.name}? This will delete all credits and payments.`,
      variant: 'danger',
      icon: 'trash',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteCustomerMutation.mutate(customer.id);
          },
        },
      ],
    });
  }, [customer, openModal, deleteCustomerMutation]);

  // ─── Navigation handlers ────────────────────────────────────────

  const handleAddCredit = useCallback(() => {
    if (!customer) return;
    Haptics.selectionAsync().catch(() => {});
    router.push(`/(edit-forms)/add-credit/${customer.id}` as any);
  }, [customer]);

  const handleAddPayment = useCallback(() => {
    if (!customer) return;
    Haptics.selectionAsync().catch(() => {});
    router.push(`/(edit-forms)/add-payment/${customer.id}` as any);
  }, [customer]);

  const handleQuickSettle = useCallback(
    (credit: CreditTransaction) => {
      if (!customer) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      router.push(
        `/(edit-forms)/add-payment/${customer.id}?creditId=${credit.id}` as any,
      );
    },
    [customer],
  );

  const handleTabChange = useCallback((next: CreditDetailTab) => {
    setActiveTab(next);
  }, []);

  // ─── Derived lists (search-filtered) ────────────────────────────

  const filteredCredits = useMemo(() => {
    if (!customer) return [];
    const term = searchByTab.credits;
    return customer.credits.filter((c) =>
      matchesSearch(term, [c.product_name, c.notes]),
    );
  }, [customer, searchByTab.credits]);

  const filteredPayments = useMemo(() => {
    if (!customer) return [];
    const term = searchByTab.payments;
    return customer.payments.filter((p) => matchesSearch(term, [p.notes]));
  }, [customer, searchByTab.payments]);

  const filteredHistory = useMemo(() => {
    const term = searchByTab.history;
    return history.filter((h) => matchesSearch(term, [h.description]));
  }, [history, searchByTab.history]);

  if (isLoading) return <CreditDetailsSkeleton />;

  if (!customer) return <CustomerNotFound onBack={handleBack} />;

  const activeCreditCount = customer.credits.filter(
    (c) => c.status !== 'paid',
  ).length;
  const storeName = profile?.storeName?.trim() || 'your sari-sari store';

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <CreditDetailsHeader
        onBack={handleBack}
        onDelete={handleDeleteCustomer}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor="#623418"
            colors={['#E85A1F']}
          />
        }
      >
        {/* ─── Hero card ───────────────────────────────────────── */}
        <View className="px-4">
          <CustomerHeroCard
            customer={customer}
            credits={customer.credits}
            payments={customer.payments}
            storeName={storeName}
            activeCreditCount={activeCreditCount}
            onAddPayment={handleAddPayment}
            onAddCredit={handleAddCredit}
            onMarkAllPaid={handleMarkAllPaid}
          />
        </View>

        {/* ─── Tab navigation ──────────────────────────────────── */}
        <View className="px-4 mt-4">
          <TabNavigation
            activeTab={activeTab}
            onChange={handleTabChange}
            counts={{
              credits: customer.credits.length,
              payments: customer.payments.length,
              history: history.length,
            }}
          />
        </View>

        {/* ─── Active tab content ──────────────────────────────── */}
        <View className="px-4 mt-4">
          {activeTab === 'credits' && (
            <CreditsTabContent
              credits={filteredCredits}
              totalCount={customer.credits.length}
              searchValue={searchByTab.credits}
              onSearchChange={(v) =>
                setSearchByTab((s) => ({ ...s, credits: v }))
              }
              onQuickSettle={handleQuickSettle}
            />
          )}
          {activeTab === 'payments' && (
            <PaymentsTabContent
              payments={filteredPayments}
              totalCount={customer.payments.length}
              searchValue={searchByTab.payments}
              onSearchChange={(v) =>
                setSearchByTab((s) => ({ ...s, payments: v }))
              }
            />
          )}
          {activeTab === 'history' && (
            <HistoryTabContent
              history={filteredHistory}
              totalCount={history.length}
              searchValue={searchByTab.history}
              onSearchChange={(v) =>
                setSearchByTab((s) => ({ ...s, history: v }))
              }
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
