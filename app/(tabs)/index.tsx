import {
  DashboardAlertCards,
  DashboardAttentionSection,
  DashboardEmptyState,
  DashboardHero,
  DashboardQuickActions,
  DashboardSkeleton,
} from '@/components/dashboard';
import { StyledText } from '@/components/elements';
import { LOW_STOCK_THRESHOLD } from '@/constants/stocks';
import { useCreditKPIs, useCustomers, useProducts, useSales, useRecentSales, useHasSales, useCurrentSession, useCashSessionSummary } from '@/hooks';
import { formatPesos } from '@/lib/money';
import { FontAwesome } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { Href, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCallback, useMemo, useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const sariDashboardImg = require('@/assets/images/sari-emotions/sari-default-state.png');
const sariLowStockImg = require('@/assets/images/sari-emotions/sari-low-stock-state.png');

/**
 * Dashboard — Counter Command Center.
 *
 * The store owner's home base. One screen, four zones:
 *   1. Hero: today's sales total + supporting metrics.
 *   2. Quick actions: New Sale, Add Stock, Record Payment.
 *   3. Compact alerts: stock attention, outstanding utang.
 *   4. Attention queue: top 3 stock, suki, and recent sales.
 *
 * Routing:
 *   - New Sale -> /(edit-forms)/add-sales
 *   - Add Stock -> /inventory (existing restock flow requires a product)
 *   - Record Payment -> /utang (existing payment form needs a suki)
 *   - View All stock -> /inventory
 *   - View All utang -> /utang
 *   - View All sales -> /sell
 *
 * Money handling: integer pesos end-to-end (see AGENTS.md) — we never multiply
 * or divide before formatting. `MoneyText` handles the render edge.
 */
const routes = {
  newSale: '/(edit-forms)/add-sales',
  products: '/inventory',
  credits: '/utang',
  sales: '/sell',
} satisfies Record<string, Href>;

export default function Dashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [refreshing, setRefreshing] = useState<boolean>(false);

  // ─── Data sources ─────────────────────────────────────────────
  const { getTodayStatsQuery } = useSales();
  const recentSalesQuery = useRecentSales(3);
  const hasSalesQuery = useHasSales();
  const { getAllProductsQuery } = useProducts();
  const { data: currentSession, isLoading: sessionLoading } = useCurrentSession();
  const { data: sessionSummary, isLoading: summaryLoading } = useCashSessionSummary(currentSession?.id);

  const { data: stats, isLoading: statsLoading } = getTodayStatsQuery;
  const { data: recentSalesList = [], isLoading: recentSalesLoading } = recentSalesQuery;
  const { data: hasAnySales = false, isLoading: hasSalesLoading } = hasSalesQuery;
  const { data: products, isLoading: productsLoading } = getAllProductsQuery;
  const { data: kpis } = useCreditKPIs();
  const { data: priorityCustomers = [] } = useCustomers(
    'with_balance',
    'balance_desc',
  );

  const isLoading = statsLoading || productsLoading || recentSalesLoading || hasSalesLoading || sessionLoading || (!!currentSession && summaryLoading);

  // ─── Derived data ─────────────────────────────────────────────

  /**
   * Top 3 stock attention rows — out-of-stock first, then lowest
   * quantity. Threshold comes from the existing `LOW_STOCK_THRESHOLD`
   * constant so this stays in lockstep with the Inventory tab.
   */
  const stockAttention = useMemo(() => {
    if (!products) return [];
    const needing = products.filter(
      (p) => p.quantity === 0 || p.quantity < LOW_STOCK_THRESHOLD,
    );
    needing.sort((a, b) => {
      // Out-of-stock first
      if (a.quantity === 0 && b.quantity !== 0) return -1;
      if (b.quantity === 0 && a.quantity !== 0) return 1;
      return a.quantity - b.quantity;
    });
    return needing.slice(0, 3).map((product) => ({
      product,
      isOut: product.quantity === 0,
    }));
  }, [products]);

  /**
   * Top 3 suki — overdue first, then highest balance. Reuses the
   * customer list already returned in `balance_desc` order and
   * surfaces the overdue row if it surfaces in the list.
   */
  const sukiAttention = useMemo(() => {
    const list = priorityCustomers.filter((c) => c.outstanding_balance > 0);
    const overdue = list.filter((c) => c.tag === 'overdue');
    const remaining = list.filter((c) => c.tag !== 'overdue');
    return [...overdue, ...remaining].slice(0, 3).map((customer) => ({
      customer,
    }));
  }, [priorityCustomers]);

  /**
   * Top 3 newest sales. The query already returns the limited set,
   * so we just map it.
   */
  const recentSales = useMemo(() => {
    return recentSalesList.map((sale) => ({ sale }));
  }, [recentSalesList]);

  const stockCounts = useMemo(() => {
    if (!products) return { lowStockCount: 0, outOfStockCount: 0 };
    return {
      lowStockCount: products.filter(
        (p) => p.quantity > 0 && p.quantity < LOW_STOCK_THRESHOLD,
      ).length,
      outOfStockCount: products.filter((p) => p.quantity === 0).length,
    };
  }, [products]);

  const hasAnyProducts = !!products && products.length > 0;
  const isFreshStore = !hasAnyProducts && !hasAnySales;

  const refetchAll = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['sales-stats'] }),
      queryClient.invalidateQueries({ queryKey: ['sales'] }),
      queryClient.invalidateQueries({ queryKey: ['products'] }),
      queryClient.invalidateQueries({ queryKey: ['credit-kpis'] }),
      queryClient.invalidateQueries({ queryKey: ['customers'] }),
      queryClient.invalidateQueries({ queryKey: ['cash'] }),
    ]);
  }, [queryClient]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchAll();
    } finally {
      setRefreshing(false);
    }
  }, [refetchAll]);

  const handleNewSale = useCallback(() => {
    router.push(routes.newSale);
  }, [router]);

  const handleAddStock = useCallback(() => {
    router.push(routes.products);
  }, [router]);

  const handleRecordPayment = useCallback(() => {
    router.push(routes.credits);
  }, [router]);

  const handleOpenSettings = useCallback(() => {
    router.push('/settings');
  }, [router]);

  const handleViewAllSales = useCallback(() => {
    router.push(routes.sales);
  }, [router]);

  const renderCashSessionBanner = () => {
    if (sessionLoading) return null;

    let message = '';
    let actionText = '';
    let bgColor = 'bg-persimmon-50 border-persimmon-100';
    let textColor = 'text-persimmon-800';
    let dotColor = 'bg-persimmon-400';

    if (!currentSession) {
      message = 'Drawer Closed today';
      actionText = 'Open Cash Drawer';
      bgColor = 'bg-persimmon-50 border-persimmon-100';
      textColor = 'text-persimmon-800';
      dotColor = 'bg-persimmon-400';
    } else if (currentSession.status === 'open') {
      const expected = sessionSummary?.expectedCash ?? currentSession.openingCash;
      message = `Drawer Active: Expected ${formatPesos(expected)}`;
      actionText = 'Manage Drawer';
      bgColor = 'bg-sage-50 border-sage-100';
      textColor = 'text-sage-700';
      dotColor = 'bg-sage-500';
    } else {
      const variance = currentSession.variance ?? 0;
      const isNegative = variance < 0;
      message = `Drawer Closed: Variance ${formatPesos(variance)}`;
      actionText = 'Review Close';
      // Negative variance = cash shortfall → urgent red; zero/positive → neutral.
      bgColor = isNegative
        ? 'bg-semantic-danger-50 border-semantic-danger-100'
        : 'bg-ink-100 border-ink-200';
      textColor = isNegative ? 'text-semantic-danger' : 'text-ink-700';
      dotColor = isNegative ? 'bg-semantic-danger' : 'bg-ink-400';
    }

    return (
      <View className="px-4 mb-4">
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(edit-forms)/cash-session' as any)}
          className={`flex-row items-center justify-between p-3.5 rounded-xl border ${bgColor} active:opacity-80`}
        >
          <View className="flex-row items-center flex-1 mr-2">
            <View className={`w-2.5 h-2.5 rounded-full mr-2.5 ${dotColor}`} />
            <StyledText variant="semibold" className={`text-sm ${textColor} flex-1`}>
              {message}
            </StyledText>
          </View>
          <View className="flex-row items-center">
            <StyledText variant="semibold" className="text-xs text-persimmon-600 mr-1">
              {actionText}
            </StyledText>
            <FontAwesome name="angle-right" size={14} color="#E85A1F" />
          </View>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-cinnamon-500" edges={['top']}>
      <View className="flex-1 bg-paper-200">
        <DashboardHeader
          onOpenSettings={handleOpenSettings}
          hasLowStock={stockCounts.lowStockCount > 0 || stockCounts.outOfStockCount > 0}
        />
        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 96 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#E85A1F"
                colors={['#E85A1F']}
              />
            }
          >
            <DashboardHero
              totalpesos={stats?.total ?? 0}
              transactionCount={stats?.transaction_count ?? 0}
              itemsSold={stats?.items_sold ?? 0}
              creditSales={stats?.credit_sales ?? 0}
            />

            {renderCashSessionBanner()}

            <DashboardQuickActions
              onNewSale={handleNewSale}
              onAddStock={handleAddStock}
              onRecordPayment={handleRecordPayment}
            />

            <DashboardAlertCards
              lowStockCount={stockCounts.lowStockCount}
              outOfStockCount={stockCounts.outOfStockCount}
              outstandingPesos={kpis?.totalOutstanding ?? 0}
              customersWithBalance={kpis?.totalCustomersWithBalance ?? 0}
              onTapStock={handleAddStock}
              onTapUtang={handleRecordPayment}
            />

            {isFreshStore ? (
              <DashboardEmptyState
                onAddProduct={handleAddStock}
                onStartFirstSale={handleNewSale}
              />
            ) : (
              <DashboardAttentionSection
                stockAttention={stockAttention}
                sukis={sukiAttention}
                recentSales={recentSales}
                onViewAllStock={handleAddStock}
                onViewAllUtang={handleRecordPayment}
                onViewAllSales={handleViewAllSales}
              />
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

function DashboardHeader({
  onOpenSettings,
  hasLowStock,
}: {
  onOpenSettings: () => void;
  hasLowStock: boolean;
}) {
  const { t } = useTranslation();
  const mascotSource = hasLowStock ? sariLowStockImg : sariDashboardImg;

  return (
    <View className="bg-cinnamon-500 px-5 pt-3 pb-6">
      <View className="flex-row items-center mb-3">
        <View
          className="w-8 h-8 rounded-full bg-persimmon-500 items-center justify-center mr-2"
        >
          <StyledText
            variant="black"
            className="text-paper-50 text-xl font-extrabold"
          >
            ₱
          </StyledText>
        </View>
        <StyledText
          variant="extrabold"
          className="text-label text-paper-200 opacity-80"
          style={{ letterSpacing: 1.4 }}
        >
          {t('common:dashboardEyebrow')}
        </StyledText>
      </View>

      <View className="flex-row items-start justify-between">
        <View className="flex-row items-start flex-1 mr-3">
          <Image
            source={mascotSource}
            style={{ width: 56, height: 56, marginRight: 12, marginTop: 2 }}
            resizeMode="contain"
          />
          <View className="flex-1">
            <StyledText
              variant="extrabold"
              className="text-h1 text-paper-50 text-3xl"
              style={{ letterSpacing: -0.28 }}
            >
              {t('common:dashboardTitle')}
            </StyledText>
            <StyledText
              variant="regular"
              className="text-sm text-paper-200 opacity-90 mt-1"
            >
              {t('common:dashboardSubtitle')}
            </StyledText>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common:settingsTitle')}
          onPress={onOpenSettings}
          className="w-11 h-11 rounded-full items-center justify-center bg-paper-50/15 active:opacity-70"
        >
          <FontAwesome name="cog" size={18} color="#FBF7EE" />
        </Pressable>
      </View>
    </View>
  );
}
