import { FontAwesome } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useRouter, Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  BackHandler,
  Image,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  DashboardAlertCards,
  DashboardAttentionSection,
  DashboardEmptyState,
  DashboardHero,
  DashboardQuickActions,
  DashboardSkeleton,
} from '@/components/dashboard';
import { StyledText } from '@/components/elements';
import { Modal as CustomModal } from '@/components/ui';
import { LOW_STOCK_THRESHOLD } from '@/constants/stocks';
import { useCredits, useProducts, useSales } from '@/hooks';
import { useDialogStore } from '@/stores';

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
 *   - New Sale -> /sell?tab=new-sale
 *   - Add Stock -> /products (existing restock flow requires a product)
 *   - Record Payment -> /credits (existing payment form needs a suki)
 *   - View All stock -> /products
 *   - View All utang -> /credits
 *   - View All sales -> /sales
 *
 * Money handling: every centavo flow is integer — we never multiply
 * or divide before formatting. `MoneyText` handles the render edge.
 */
const sariExitImage = require('@/assets/images/sari-emotions/sari-exit-state.png');

const Routes = {
  newSale: '/sell?tab=new-sale',
  products: '/inventory',
  credits: '/utang',
  sales: '/sell',
} satisfies Record<string, Href>;

export default function Dashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { visible: dialogVisible, showDialog, hideDialog } = useDialogStore();

  const [refreshing, setRefreshing] = useState<boolean>(false);

  // ─── Data sources ─────────────────────────────────────────────
  const { getTodayStatsQuery, getAllSalesQuery } = useSales();
  const { getAllProductsQuery } = useProducts();
  const { useCustomers, useCreditKPIs } = useCredits();

  const { data: stats, isLoading: statsLoading } = getTodayStatsQuery;
  const { data: sales = [] } = getAllSalesQuery;
  const { data: products, isLoading: productsLoading } = getAllProductsQuery;
  const { data: kpis } = useCreditKPIs();
  const { data: priorityCustomers = [] } = useCustomers(
    'with_balance',
    'balance_desc',
  );

  const isLoading = statsLoading || productsLoading;

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
   * Top 3 newest sales. The store hook already returns timestamp-desc
   * ordering, so we just take the first three.
   */
  const recentSales = useMemo(() => {
    return sales.slice(0, 3).map((sale) => ({ sale }));
  }, [sales]);

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
  const hasAnySales = sales.length > 0;
  const isFreshStore = !hasAnyProducts && !hasAnySales;

  // ─── Refresh ──────────────────────────────────────────────────

  const refetchAll = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['sales-stats'] }),
      queryClient.invalidateQueries({ queryKey: ['sales'] }),
      queryClient.invalidateQueries({ queryKey: ['products'] }),
      queryClient.invalidateQueries({ queryKey: ['credit-kpis'] }),
      queryClient.invalidateQueries({ queryKey: ['customers'] }),
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

  useFocusEffect(
    useCallback(() => {
      refetchAll();
    }, [refetchAll]),
  );

  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        showDialog({
          title: 'Exit App',
          message: 'Are you sure you want to exit the app?',
          showCloseButton: false,
        });
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction,
      );

      return () => backHandler.remove();
    }, [showDialog]),
  );

  const handleExitApp = () => {
    hideDialog();
    BackHandler.exitApp();
  };

  const handleCancelExit = () => {
    hideDialog();
  };

  const handleNewSale = useCallback(() => {
    router.push(Routes.newSale);
  }, [router]);

  const handleAddStock = useCallback(() => {
    router.push(Routes.products);
  }, [router]);

  const handleRecordPayment = useCallback(() => {
    router.push(Routes.credits);
  }, [router]);

  return (
    <SafeAreaView className="flex-1 bg-paper-200">
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
        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            <DashboardHeader />

            <DashboardHero
              totalCentavos={stats?.total ?? 0}
              transactionCount={stats?.transaction_count ?? 0}
              itemsSold={stats?.items_sold ?? 0}
              creditSales={stats?.credit_sales ?? 0}
            />

            <DashboardQuickActions
              onNewSale={handleNewSale}
              onAddStock={handleAddStock}
              onRecordPayment={handleRecordPayment}
            />

            <DashboardAlertCards
              lowStockCount={stockCounts.lowStockCount}
              outOfStockCount={stockCounts.outOfStockCount}
              outstandingCentavos={kpis?.totalOutstanding ?? 0}
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
                onViewAllSales={() => router.push(Routes.sales)}
              />
            )}
          </>
        )}
      </ScrollView>

      <CustomModal
        visible={dialogVisible}
        onClose={handleCancelExit}
        title="Exit App"
        description="Are you sure you want to exit the app?"
        variant="warning"
        buttons={[
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: handleCancelExit,
          },
          {
            text: 'Exit',
            style: 'destructive',
            onPress: handleExitApp,
          },
        ]}
      >
        <View className="items-center mt-2 mb-1">
          <Image
            source={sariExitImage}
            style={{ width: 140, height: 140 }}
            resizeMode="contain"
          />
        </View>
      </CustomModal>
    </SafeAreaView>
  );
}

function DashboardHeader() {
  return (
    <View className="bg-cinnamon-500 px-5 pt-3 pb-6">
      <View className="flex-row items-center mb-3">
        <View
          className="w-8 h-8 rounded-full bg-persimmon-500 items-center justify-center mr-2"
          style={{
            shadowColor: '#564E45',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 6,
            elevation: 2,
          }}
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
          COUNTER COMMAND CENTER
        </StyledText>
      </View>

      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-3">
          <StyledText
            variant="extrabold"
            className="text-h1 text-paper-50 text-3xl"
            style={{ letterSpacing: -0.28 }}
          >
            Dashboard
          </StyledText>
          <StyledText
            variant="regular"
            className="text-sm text-paper-200 opacity-90 mt-1"
          >
            Your counter at a glance
          </StyledText>
        </View>

        <View className="w-11 h-11 rounded-full items-center justify-center bg-paper-50/15">
          <FontAwesome name="area-chart" size={18} color="#FBF7EE" />
        </View>
      </View>
    </View>
  );
}
