import {
  DashboardAttention,
  DashboardEmptyState,
  DashboardErrorState,
  DashboardMoneyToday,
  DashboardQuickActions,
  DashboardRecentSales,
  DashboardTodayCard,
  DashboardTopSellers,
  GettingStartedCard,
  HomeDestination,
  HomeOverviewSkeleton,
} from '@/components/home';
import { useTabBarBottomOffset } from '@/components/layout';
import { RefreshableScrollView } from '@/components/ui';
import { useHomeDashboardData } from '@/hooks/useHomeDashboardData';
import { Prof, useChangeLog, withProf } from '@/utils/perf';
import { Href, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';

const routes = {
  addProduct: '/(edit-forms)/add-product',
  inventory: '/inventory',
  restock: '/(tabs)/inventory/restock' as Href,
  stocktake: '/(tabs)/inventory/stocktake' as Href,
  utang: '/(tabs)/customers/all',
  newSale: '/(tabs)/sales/pos',
  reports: '/settings/reports',
  cashEntries: '/settings/cash-entries',
  receipts: '/(tabs)/sales/receipts' as Href,
} satisfies Record<HomeDestination, Href>;

const SALE_DETAILS = '/(edit-forms)/sale-details/';

function HomeScreen() {
  const router = useRouter();
  const tabBarBottomOffset = useTabBarBottomOffset();
  const data = useHomeDashboardData();
  const {
    stats,
    productCount,
    recentSales,
    topSellers,
    week,
    changeVsYesterday,
    attention,
    isError,
    isLoading,
    refreshing,
    refetchAll,
  } = data;
  useChangeLog('home/index', data);

  const contentContainerStyle = useMemo(
    () => ({ paddingTop: 8, paddingBottom: tabBarBottomOffset + 24 }),
    [tabBarBottomOffset],
  );

  // Stable handlers so memo'd sections never re-render from navigation props.
  const go = useCallback(
    (destination: HomeDestination) => router.push(routes[destination]),
    [router],
  );
  const goNewSale = useCallback(() => go('newSale'), [go]);
  const goAddProduct = useCallback(() => go('addProduct'), [go]);
  const goRestock = useCallback(() => go('restock'), [go]);
  const goUtang = useCallback(() => go('utang'), [go]);
  const goReports = useCallback(() => go('reports'), [go]);
  const goCashEntries = useCallback(() => go('cashEntries'), [go]);
  const goReceipts = useCallback(() => go('receipts'), [go]);
  const openSale = useCallback(
    (id: number) => router.push(`${SALE_DETAILS}${id}` as Href),
    [router],
  );

  if (isLoading) return <HomeOverviewSkeleton />;

  return (
    <RefreshableScrollView
      className="flex-1 bg-paper-200"
      contentContainerStyle={contentContainerStyle}
      isRefreshing={refreshing}
      onRefresh={refetchAll}
      refreshThreshold={80}
    >
      <Prof id="Home:GettingStartedCard">
        <GettingStartedCard />
      </Prof>

      {isError ? (
        <DashboardErrorState onRetry={refetchAll} />
      ) : productCount === 0 && stats.transactionCount === 0 ? (
        <DashboardEmptyState
          onAddProduct={goAddProduct}
          onStartFirstSale={goNewSale}
        />
      ) : (
        <>
          <Prof id="Home:DashboardTodayCard">
            <DashboardTodayCard
              salesTotal={stats.todaySalesTotal}
              transactionCount={stats.transactionCount}
              itemsSold={stats.itemsSold}
              changeVsYesterday={changeVsYesterday}
              week={week}
              profitToday={stats.profitToday}
              utangToday={stats.utangToday}
              collectedToday={stats.collectedToday}
              onPress={goReports}
            />
          </Prof>

          <Prof id="Home:DashboardQuickActions">
            <DashboardQuickActions
              onNewSale={goNewSale}
              onAddProduct={goAddProduct}
              onRestock={goRestock}
              onOpenUtang={goUtang}
              onOpenReports={goReports}
              overdueCount={stats.overdueCount}
            />
          </Prof>

          <Prof id="Home:DashboardAttention">
            <DashboardAttention items={attention} onPress={go} />
          </Prof>

          <Prof id="Home:DashboardMoneyToday">
            <DashboardMoneyToday
              cashSales={stats.todaySalesTotal}
              collected={stats.collectedToday}
              expenses={stats.expensesToday}
              drawings={stats.drawingsToday}
              onOpenCashEntries={goCashEntries}
            />
          </Prof>

          <Prof id="Home:DashboardTopSellers">
            <DashboardTopSellers sellers={topSellers} onSeeReport={goReports} />
          </Prof>

          <Prof id="Home:DashboardRecentSales">
            <DashboardRecentSales
              sales={recentSales}
              onOpenSale={openSale}
              onSeeAll={goReceipts}
            />
          </Prof>
        </>
      )}
    </RefreshableScrollView>
  );
}

export default withProf(HomeScreen, 'home/index');
