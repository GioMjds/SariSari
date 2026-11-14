import { StyledText } from '@/components/elements';
import {
  CreditAgingChart,
  StockMovementDetails,
  BentoGrid,
  BentoHero,
  BentoKPICard,
  CollapsibleSection,
  DateRangeSelector,
  InsightCard,
  ProfitabilityRanking,
  SimpleBarChart,
  TopProductsList,
  PaymentSplitStrip,
  FinancialResultSection,
} from '@/components/reports';
import { router, useLocalSearchParams } from 'expo-router';
import { MoneyText, RefreshableScrollView, Skeleton } from '@/components/ui';
import {
  useAgingBuckets,
  useCashEntries,
  useCashSessions,
  useCreditsOverview,
  useInventoryMovement,
  useInventoryValue,
  useLowStockItems,
  useProductProfitability,
  useReportInsights,
  useReportKPIs,
  useReports,
  useSalesBreakdown,
  useSalesOverTime,
  useSlowMovingProducts,
  useTopSellingProducts,
} from '@/hooks';
import { formatPesos } from '@/lib/money';
import { DateRange, DateRangeType } from '@/types';
import {
  formatCompactCurrency,
  getDateRangeFromType,
  profitSubline,
} from '@/utils';
import { FontAwesome } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useTabBarBottomOffset } from '@/components/layout';
import { goBackToMore, MoreDetailHeader } from '@/components/more';
import { SariMascot, type SariState } from '@/components/mascot';
import { useTranslation } from 'react-i18next';
import {
  DEFAULT_CREDITS_OVERVIEW,
  DEFAULT_INVENTORY_MOVEMENT,
  DEFAULT_INVENTORY_VALUE,
  DEFAULT_KPIS,
  DEFAULT_SALES_BREAKDOWN,
} from '@/constants';

const EMPTY_ARRAY: never[] = [];

export default function ReportsScreen() {
  const { t } = useTranslation();
  const { section } = useLocalSearchParams<{ section?: string }>();
  const requestedSection = typeof section === 'string' ? section : undefined;

  const queryClient = useQueryClient();
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>('today');
  const [dateRange, setDateRange] = useState<DateRange>(
    getDateRangeFromType('today'),
  );

  const { invalidateReports } = useReports();

  const kpisQuery = useReportKPIs(dateRange);
  const salesOverTimeQuery = useSalesOverTime(dateRange);
  const topProductsQuery = useTopSellingProducts(dateRange, 5);
  const salesBreakdownQuery = useSalesBreakdown(dateRange);
  const inventoryMovementQuery = useInventoryMovement(dateRange);
  const inventoryValueQuery = useInventoryValue();
  const lowStockItemsQuery = useLowStockItems(10);
  const slowMovingProductsQuery = useSlowMovingProducts(dateRange, 5);
  const creditsOverviewQuery = useCreditsOverview(dateRange);
  const agingBucketsQuery = useAgingBuckets();
  const productProfitabilityQuery = useProductProfitability(dateRange, 10);
  const insightsQuery = useReportInsights(dateRange);
  const sessionsQuery = useCashSessions();

  const isInsightsLoading = insightsQuery.isLoading;
  const isKPIsLoading =
    kpisQuery.isLoading ||
    salesBreakdownQuery.isLoading ||
    creditsOverviewQuery.isLoading ||
    inventoryValueQuery.isLoading;
  const isSalesTrendLoading =
    salesOverTimeQuery.isLoading || salesBreakdownQuery.isLoading;
  const isTopProductsLoading =
    topProductsQuery.isLoading ||
    productProfitabilityQuery.isLoading ||
    kpisQuery.isLoading;
  const isStockLoading =
    inventoryMovementQuery.isLoading ||
    inventoryValueQuery.isLoading ||
    lowStockItemsQuery.isLoading ||
    slowMovingProductsQuery.isLoading;
  const isCreditAgingLoading =
    agingBucketsQuery.isLoading || creditsOverviewQuery.isLoading;
  const isSessionsLoading = sessionsQuery.isLoading;

  const isRefreshing =
    kpisQuery.isFetching ||
    salesOverTimeQuery.isFetching ||
    topProductsQuery.isFetching ||
    salesBreakdownQuery.isFetching ||
    inventoryMovementQuery.isFetching ||
    inventoryValueQuery.isFetching ||
    lowStockItemsQuery.isFetching ||
    slowMovingProductsQuery.isFetching ||
    creditsOverviewQuery.isFetching ||
    agingBucketsQuery.isFetching ||
    productProfitabilityQuery.isFetching ||
    insightsQuery.isFetching ||
    sessionsQuery.isFetching;

  const kpis = kpisQuery.data ?? DEFAULT_KPIS;
  const salesOverTime = salesOverTimeQuery.data ?? EMPTY_ARRAY;
  const topProducts = topProductsQuery.data ?? EMPTY_ARRAY;
  const salesBreakdown = salesBreakdownQuery.data ?? DEFAULT_SALES_BREAKDOWN;
  const inventoryMovement =
    inventoryMovementQuery.data ?? DEFAULT_INVENTORY_MOVEMENT;
  const inventoryValue = inventoryValueQuery.data ?? DEFAULT_INVENTORY_VALUE;
  const lowStockItems = lowStockItemsQuery.data ?? EMPTY_ARRAY;
  const fastMovingProducts = topProducts;
  const slowMovingProducts = slowMovingProductsQuery.data ?? EMPTY_ARRAY;
  const creditsOverview = creditsOverviewQuery.data ?? DEFAULT_CREDITS_OVERVIEW;
  const agingBuckets = agingBucketsQuery.data ?? EMPTY_ARRAY;
  const productProfitability = productProfitabilityQuery.data ?? EMPTY_ARRAY;
  const insights = insightsQuery.data ?? EMPTY_ARRAY;
  const sessions = sessionsQuery.data ?? EMPTY_ARRAY;

  const handleDateRangeChange = useCallback((type: DateRangeType) => {
    setDateRangeType(type);
    setDateRange(getDateRangeFromType(type));
  }, []);

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      invalidateReports(),
      queryClient.invalidateQueries({ queryKey: ['cash'] }),
    ]);
  }, [invalidateReports, queryClient]);

  const startDateStr = format(dateRange.startDate, 'yyyy-MM-dd');
  const endDateStr = format(dateRange.endDate, 'yyyy-MM-dd');

  const filteredSessions = (sessions || []).filter((session: any) => {
    if (!session?.businessDate) return false;
    return (
      session.businessDate >= startDateStr && session.businessDate <= endDateStr
    );
  });

  const tabBarBottomOffset = useTabBarBottomOffset();

  // Sari's pose and line follow the most urgent thing in the data.
  const sari: { state: SariState; text: string } = (() => {
    if (isKPIsLoading || isStockLoading) {
      return { state: 'loading', text: 'Counting your numbers...' };
    }
    if (kpis.totalSales === 0 && salesBreakdown.totalTransactions === 0) {
      return {
        state: 'reports',
        text: 'No sales in this period yet. Make a sale and I will tally it.',
      };
    }
    if (lowStockItems.length > 0) {
      const n = lowStockItems.length;
      return {
        state: 'low-stock',
        text: `${n} ${n === 1 ? 'item is' : 'items are'} running low. Check Stock and movement.`,
      };
    }
    if (creditsOverview.outstanding > 0) {
      return {
        state: 'outstanding-balance',
        text: `${formatCompactCurrency(creditsOverview.outstanding)} utang still unpaid from ${creditsOverview.activeAccounts} ${creditsOverview.activeAccounts === 1 ? 'suki' : 'sukis'}.`,
      };
    }
    return {
      state: 'sales',
      text: `${formatCompactCurrency(kpis.totalSales)} in sales. Stock and utang look fine.`,
    };
  })();

  return (
    <View className="flex-1 bg-paper-200">
      <MoreDetailHeader
        title={t('common:reportsTitle')}
        onBack={goBackToMore}
        backAccessibilityLabel={t('common:moreBackA11y')}
      />
      <RefreshableScrollView
        className="flex-1 bg-paper-200"
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: tabBarBottomOffset + 24,
        }}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      >
        <View className="px-5 flex-row items-center">
          <View className="flex-1 bg-paper-50 border border-ink-100 rounded-2xl px-4 py-3 shadow-paper">
            <StyledText
              variant="extrabold"
              className="text-[10px] text-persimmon-600 uppercase tracking-wider mb-1"
            >
              Sari says
            </StyledText>
            <StyledText
              variant="semibold"
              className="text-sm text-ink-800 leading-snug"
              accessibilityLiveRegion="polite"
            >
              {sari.text}
            </StyledText>
          </View>
          {/* Bubble tail pointing at Sari */}
          <View
            style={{
              width: 10,
              height: 10,
              marginLeft: -6,
              marginRight: -2,
              backgroundColor: '#FAFAF7',
              borderTopWidth: 1,
              borderRightWidth: 1,
              borderColor: '#EAE6DF',
              transform: [{ rotate: '45deg' }],
            }}
          />
          <SariMascot state={sari.state} size={96} />
        </View>

        <View className="px-5 mt-3">
          <DateRangeSelector
            activeRange={dateRangeType}
            onRangeChange={handleDateRangeChange}
          />
        </View>

        {/* ─── Smart Alerts / Insights ────────────────────────── */}
        {(isInsightsLoading || insights.length > 0) && (
          <View className="px-5 mt-2">
            {isInsightsLoading ? (
              <View className="mt-3 bg-paper-50 rounded-xl p-4 border border-ink-100/60 shadow-sm gap-y-2">
                <Skeleton width="40%" height={14} borderRadius={4} />
                <Skeleton width="90%" height={12} borderRadius={4} />
                <Skeleton width="70%" height={12} borderRadius={4} />
              </View>
            ) : (
              <View className="mt-3">
                {insights.map((insight, index) => (
                  <InsightCard key={index} {...insight} icon={insight.icon} />
                ))}
              </View>
            )}
          </View>
        )}

        {/* ─── Bento KPI grid ─────────────────────────────────── */}
        <View className="px-5 mt-6">
          {isKPIsLoading ? (
            <View className="mt-3 gap-y-3">
              <View className="bg-paper-50 rounded-2xl p-5 border border-ink-100/60 shadow-sm gap-y-3">
                <Skeleton width={140} height={12} borderRadius={4} />
                <Skeleton width={180} height={32} borderRadius={6} />
                <Skeleton width="60%" height={14} borderRadius={4} />
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1 bg-paper-50 rounded-2xl p-4 border border-ink-100/60 shadow-sm gap-y-2">
                  <Skeleton width={90} height={10} borderRadius={4} />
                  <Skeleton width={100} height={24} borderRadius={6} />
                  <Skeleton width="80%" height={12} borderRadius={4} />
                </View>
                <View className="flex-1 bg-paper-50 rounded-2xl p-4 border border-ink-100/60 shadow-sm gap-y-2">
                  <Skeleton width={90} height={10} borderRadius={4} />
                  <Skeleton width={100} height={24} borderRadius={6} />
                  <Skeleton width="80%" height={12} borderRadius={4} />
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1 bg-paper-50 rounded-2xl p-4 border border-ink-100/60 shadow-sm gap-y-2">
                  <Skeleton width={90} height={10} borderRadius={4} />
                  <Skeleton width={100} height={24} borderRadius={6} />
                  <Skeleton width="80%" height={12} borderRadius={4} />
                </View>
                <View className="flex-1 bg-paper-50 rounded-2xl p-4 border border-ink-100/60 shadow-sm gap-y-2">
                  <Skeleton width={90} height={10} borderRadius={4} />
                  <Skeleton width={100} height={24} borderRadius={6} />
                  <Skeleton width="80%" height={12} borderRadius={4} />
                </View>
              </View>

              <View className="mt-1 bg-paper-50 rounded-2xl p-4 border border-ink-100/60 shadow-sm gap-y-2">
                <Skeleton width={140} height={14} borderRadius={4} />
                <Skeleton width="100%" height={40} borderRadius={8} />
              </View>
            </View>
          ) : (
            <View className="mt-3">
              <BentoGrid>
                <BentoHero
                  animationKey={`${dateRangeType}-${kpis.totalSales}`}
                  kicker="Cash sales"
                  headline={formatCompactCurrency(kpis.totalSales)}
                  subline={`${salesBreakdown.totalTransactions} ${
                    salesBreakdown.totalTransactions === 1
                      ? 'transaction'
                      : 'transactions'
                  } · utang not counted until paid`}
                  icon={
                    <FontAwesome
                      name="shopping-cart"
                      size={14}
                      color="#FBF7EE"
                    />
                  }
                  accent="persimmon"
                />

                <View className="flex-row gap-3">
                  <BentoKPICard
                    kicker="Tubo (gross profit)"
                    headline={
                      kpis.totalProfit === null
                        ? '—'
                        : formatCompactCurrency(kpis.totalProfit)
                    }
                    subline={
                      kpis.totalProfit === null
                        ? 'Add cost prices to compute tubo'
                        : `${profitSubline(kpis.marginPercent)} · includes utang`
                    }
                    icon={
                      <FontAwesome
                        name="line-chart"
                        size={16}
                        color="#3D5E1B"
                      />
                    }
                    accent="sage"
                  />
                  <BentoKPICard
                    kicker="Utang not yet paid"
                    headline={formatCompactCurrency(
                      creditsOverview.outstanding,
                    )}
                    subline={`${creditsOverview.activeAccounts} ${
                      creditsOverview.activeAccounts === 1
                        ? 'suki owes'
                        : 'sukis owe'
                    } you`}
                    icon={
                      <FontAwesome
                        name="credit-card"
                        size={16}
                        color="#A1370C"
                      />
                    }
                    accent="persimmon"
                  />
                </View>

                <View className="flex-row gap-3">
                  <BentoKPICard
                    kicker="Stock value (at cost)"
                    headline={formatCompactCurrency(
                      inventoryValue.currentStockValue,
                    )}
                    subline={
                      inventoryValue.costCoverage !== null &&
                      inventoryValue.costCoverage < 1
                        ? `${Math.round(
                            inventoryValue.costCoverage * 100,
                          )}% of stock has cost data`
                        : `Potential retail: ${formatCompactCurrency(
                            inventoryValue.potentialSalesValue,
                          )}`
                    }
                    icon={
                      <FontAwesome name="archive" size={16} color="#391C0A" />
                    }
                    accent="cinnamon"
                  />
                  <BentoKPICard
                    kicker="Cash collected"
                    headline={formatCompactCurrency(salesBreakdown.cashSales)}
                    subline={`Avg ticket: ${formatCompactCurrency(
                      salesBreakdown.averageTransactionValue,
                    )}`}
                    icon={
                      <FontAwesome name="money" size={16} color="#3D5E1B" />
                    }
                    accent="sage"
                  />
                </View>
              </BentoGrid>

              <View className="mt-4">
                <FinancialResultSection
                  kpis={kpis}
                  onOpenLedger={() => router.push('/settings/cash-entries')}
                />
              </View>
            </View>
          )}
        </View>

        {/* ─── Sales Trend & Payments ─────────────────────────── */}
        <View className="px-5 mt-6">
          <View>
            <CollapsibleSection
              id="trend"
              title="Sales and payments"
              subtitle="Daily sales and how customers paid"
              tone="persimmon"
              icon={<FontAwesome name="bar-chart" size={16} color="#A1370C" />}
              defaultExpanded={
                requestedSection === 'trend' || requestedSection === undefined
              }
            >
              {isSalesTrendLoading ? (
                <View className="py-2 gap-y-4">
                  <Skeleton width="100%" height={180} borderRadius={12} />
                  <View
                    style={{
                      borderBottomWidth: 1,
                      borderStyle: 'dashed',
                      borderColor: '#D1D5DC',
                    }}
                  />
                  <View className="gap-y-2">
                    <Skeleton width="100%" height={24} borderRadius={6} />
                    <View className="flex-row justify-between">
                      <Skeleton width={100} height={14} borderRadius={4} />
                      <Skeleton width={100} height={14} borderRadius={4} />
                    </View>
                  </View>
                </View>
              ) : (
                <View>
                  <SimpleBarChart data={salesOverTime} height={200} />

                  {/* Perforation between chart and breakdown */}
                  <View
                    style={{
                      marginTop: 20,
                      marginBottom: 12,
                      borderBottomWidth: 1,
                      borderStyle: 'dashed',
                      borderColor: '#D1D5DC',
                    }}
                  />

                  <PaymentSplitStrip
                    cash={salesBreakdown.cashSales}
                    credit={salesBreakdown.creditSales}
                    total={kpis.totalSales}
                    transactions={salesBreakdown.totalTransactions}
                    avgTicket={salesBreakdown.averageTransactionValue}
                  />
                </View>
              )}
            </CollapsibleSection>
          </View>
        </View>

        {/* ─── Top Products ──────────────────────────────────── */}
        <View className="px-5 mt-6">
          <CollapsibleSection
            id="top"
            title="Top products and profit"
            subtitle="Best sellers and what earns the most"
            tone="cinnamon"
            icon={<FontAwesome name="trophy" size={16} color="#391C0A" />}
            defaultExpanded={requestedSection === 'top'}
          >
            {isTopProductsLoading ? (
              <View className="py-2 gap-y-4">
                <Skeleton width={160} height={12} borderRadius={4} />
                {Array.from({ length: 3 }).map((_, i) => (
                  <View
                    key={`top-prod-skel-${i}`}
                    className="flex-row items-center justify-between py-2 border-b border-ink-100/50"
                  >
                    <View className="flex-row items-center flex-1 mr-3 gap-2">
                      <Skeleton width={24} height={24} circle />
                      <Skeleton width="60%" height={14} borderRadius={4} />
                    </View>
                    <Skeleton width={70} height={16} borderRadius={4} />
                  </View>
                ))}

                <View className="my-2 flex-row items-center">
                  <View className="flex-1 h-px bg-ink-200" />
                </View>

                <Skeleton width={180} height={12} borderRadius={4} />
                {Array.from({ length: 3 }).map((_, i) => (
                  <View
                    key={`profit-skel-${i}`}
                    className="flex-row items-center justify-between py-2 border-b border-ink-100/50"
                  >
                    <Skeleton width="50%" height={14} borderRadius={4} />
                    <Skeleton width={60} height={14} borderRadius={4} />
                  </View>
                ))}
              </View>
            ) : (
              <View>
                {/* Top by revenue */}
                <StyledText
                  variant="semibold"
                  className="text-sm text-ink-700 mb-3"
                >
                  Top sellers by sales
                </StyledText>
                <TopProductsList products={topProducts} />

                <View className="my-4 h-px bg-ink-200" />

                {/* Most profitable */}
                <View className="flex-row items-center justify-between mb-3">
                  <StyledText
                    variant="semibold"
                    className="text-sm text-ink-700"
                  >
                    Most profitable (tubo)
                  </StyledText>
                  {kpis.totalProfit === null && (
                    <StyledText
                      variant="medium"
                      className="text-ink-500 text-xs"
                    >
                      Add cost prices
                    </StyledText>
                  )}
                </View>
                <ProfitabilityRanking products={productProfitability} />
              </View>
            )}
          </CollapsibleSection>
        </View>

        {/* ─── Stock Movement ────────────────────────────────── */}
        <View className="px-5 mt-6">
          <CollapsibleSection
            id="stock"
            title="Stock and movement"
            subtitle="What sold, what is running low"
            tone="sage"
            icon={<FontAwesome name="archive" size={16} color="#3D5E1B" />}
            defaultExpanded={requestedSection === 'stock'}
          >
            {isStockLoading ? (
              <View className="py-2 gap-y-4">
                <View className="flex-row flex-wrap gap-2">
                  <View className="w-[48%] bg-paper-50 p-3 rounded-xl border border-ink-100/60 gap-y-1.5">
                    <Skeleton width={80} height={10} borderRadius={4} />
                    <Skeleton width={50} height={20} borderRadius={4} />
                  </View>
                  <View className="w-[48%] bg-paper-50 p-3 rounded-xl border border-ink-100/60 gap-y-1.5">
                    <Skeleton width={80} height={10} borderRadius={4} />
                    <Skeleton width={50} height={20} borderRadius={4} />
                  </View>
                </View>

                <View className="flex-row items-stretch border border-ink-200 rounded-xl overflow-hidden bg-paper-50 p-3 gap-3">
                  <View className="flex-1 gap-y-2">
                    <Skeleton width={60} height={10} borderRadius={4} />
                    <Skeleton width={80} height={16} borderRadius={4} />
                  </View>
                  <View className="flex-1 gap-y-2">
                    <Skeleton width={60} height={10} borderRadius={4} />
                    <Skeleton width={80} height={16} borderRadius={4} />
                  </View>
                </View>
              </View>
            ) : (
              <View>
                <StockMovementDetails
                  itemsSold={inventoryMovement.itemsSold}
                  lowStockCount={inventoryMovement.lowStockCount}
                  outOfStockCount={inventoryMovement.outOfStockCount}
                  fastMoving={fastMovingProducts}
                  slowMoving={slowMovingProducts}
                />

                {/* Inventory value sub-block */}
                <View className="mt-4 flex-row items-stretch border border-ink-200 rounded-xl overflow-hidden">
                  <View className="flex-1 p-3 border-r border-dashed border-ink-200 bg-cinnamon-50/40">
                    <StyledText
                      variant="semibold"
                      className="text-sm text-cinnamon-700 mb-1"
                    >
                      At cost
                    </StyledText>
                    <MoneyText
                      value={inventoryValue.currentStockValue}
                      size="md"
                      variant="default"
                      className="text-ink-900 text-sm"
                    />
                    {inventoryValue.costCoverage !== null &&
                      inventoryValue.costCoverage < 1 && (
                        <StyledText
                          variant="medium"
                          className="text-ink-500 text-xs mt-1"
                        >
                          {Math.round(inventoryValue.costCoverage * 100)}% cost
                          coverage
                        </StyledText>
                      )}
                  </View>
                  <View className="flex-1 p-3 bg-sage-50/40">
                    <StyledText
                      variant="semibold"
                      className="text-sm text-sage-700 mb-1"
                    >
                      At retail
                    </StyledText>
                    <MoneyText
                      value={inventoryValue.potentialSalesValue}
                      size="md"
                      variant="success"
                      className="text-sm"
                    />
                    <StyledText
                      variant="medium"
                      className="text-ink-500 text-xs mt-1"
                    >
                      Potential takings
                    </StyledText>
                  </View>
                </View>

                {/* Low stock alert */}
                {lowStockItems.length > 0 && (
                  <View className="mt-4 rounded-xl border border-semantic-warning p-3 bg-semantic-warning-50">
                    <View className="flex-row items-center mb-2">
                      <View className="w-6 h-6 rounded-full bg-semantic-warning items-center justify-center mr-2">
                        <FontAwesome
                          name="exclamation"
                          size={12}
                          color="#FBF7EE"
                        />
                      </View>
                      <StyledText
                        variant="extrabold"
                        className="text-sm text-ink-900"
                      >
                        {`Low stock: ${lowStockItems.length} ${
                          lowStockItems.length === 1 ? 'item' : 'items'
                        }`}
                      </StyledText>
                    </View>
                    {lowStockItems.slice(0, 4).map((item) => (
                      <View
                        key={item.id}
                        className="flex-row items-center justify-between mt-1"
                      >
                        <StyledText
                          variant="medium"
                          className="text-ink-700 text-sm flex-1"
                          numberOfLines={1}
                        >
                          · {item.name}
                        </StyledText>
                        <StyledText
                          variant="extrabold"
                          className={`text-sm ${
                            item.quantity === 0
                              ? 'text-semantic-danger'
                              : 'text-semantic-warning'
                          }`}
                        >
                          {item.quantity} left
                        </StyledText>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </CollapsibleSection>
        </View>

        {/* ─── Suki Credit Aging ─────────────────────────────── */}
        <View className="px-5 mt-6">
          <CollapsibleSection
            id="aging"
            title="Utang aging"
            subtitle="How long each suki has owed you"
            tone="cinnamon"
            icon={
              <FontAwesome name="hourglass-half" size={16} color="#391C0A" />
            }
            defaultExpanded={requestedSection === 'aging'}
          >
            {isCreditAgingLoading ? (
              <View className="py-2 gap-y-4">
                <Skeleton width="100%" height={140} borderRadius={12} />
                <View className="flex-row gap-3">
                  <View className="flex-1 p-3 border border-ink-200 rounded-xl bg-paper-50 gap-y-2">
                    <Skeleton width={60} height={10} borderRadius={4} />
                    <Skeleton width={80} height={16} borderRadius={4} />
                  </View>
                  <View className="flex-1 p-3 border border-ink-200 rounded-xl bg-paper-50 gap-y-2">
                    <Skeleton width={60} height={10} borderRadius={4} />
                    <Skeleton width={80} height={16} borderRadius={4} />
                  </View>
                </View>
              </View>
            ) : (
              <View>
                <CreditAgingChart
                  buckets={agingBuckets}
                  totalOutstanding={creditsOverview.outstanding}
                />

                <View className="mt-4 flex-row gap-3">
                  <View className="flex-1 p-3 border border-ink-200 rounded-xl bg-semantic-danger-50/30">
                    <StyledText
                      variant="semibold"
                      className="text-sm text-ink-700"
                    >
                      Utang given
                    </StyledText>
                    <MoneyText
                      value={creditsOverview.issued}
                      size="md"
                      variant="danger"
                      className="text-sm"
                    />
                  </View>
                  <View className="flex-1 p-3 border border-ink-200 rounded-xl bg-sage-50">
                    <StyledText
                      variant="semibold"
                      className="text-sm text-ink-700"
                    >
                      Collected
                    </StyledText>
                    <MoneyText
                      value={creditsOverview.collected}
                      size="md"
                      variant="success"
                      className="text-sm"
                    />
                  </View>
                </View>
              </View>
            )}
          </CollapsibleSection>
        </View>

        {/* ─── Cashbook History ──────────────────────────────── */}
        <View className="px-5 mt-6">
          <CollapsibleSection
            id="cashbook"
            title="Cash drawer history"
            subtitle="Daily drawer counts and any shortage or overage"
            tone="cinnamon"
            icon={<FontAwesome name="book" size={16} color="#391C0A" />}
            defaultExpanded={requestedSection === 'cashbook'}
          >
            {isSessionsLoading ? (
              <View className="py-2 gap-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <View
                    key={`session-skel-${i}`}
                    className="border border-ink-200 rounded-xl bg-paper-50 p-4 gap-y-2"
                  >
                    <View className="flex-row justify-between items-center">
                      <Skeleton width={100} height={16} borderRadius={4} />
                      <Skeleton width={50} height={18} borderRadius={10} />
                    </View>
                    <View className="flex-row gap-3">
                      <Skeleton width={90} height={12} borderRadius={4} />
                      <Skeleton width={90} height={12} borderRadius={4} />
                    </View>
                  </View>
                ))}
              </View>
            ) : filteredSessions.length === 0 ? (
              <View className="bg-paper-50 rounded-xl border border-dashed border-ink-200 p-6 items-center">
                <StyledText variant="regular" className="text-ink-400 text-sm">
                  No past drawer sessions in this period.
                </StyledText>
              </View>
            ) : (
              <View>
                {filteredSessions.map((session) => (
                  <CashSessionRow key={session.id} session={session} />
                ))}
              </View>
            )}
          </CollapsibleSection>
        </View>
      </RefreshableScrollView>
    </View>
  );
}

function CashSessionRow({ session }: { session: any }) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const { data: entries = [], isLoading } = useCashEntries(
    isExpanded ? session.id : undefined,
  );

  return (
    <View className="mb-3 border border-ink-200 rounded-xl bg-paper-50 p-4">
      {/* Clickable Header to Expand/Collapse */}
      <Pressable
        onPress={() => setIsExpanded(!isExpanded)}
        accessibilityRole="button"
        accessibilityLabel={`${session.businessDate} cash session`}
        accessibilityState={{ expanded: isExpanded }}
        className="flex-row justify-between items-center"
      >
        <View className="flex-1 mr-2">
          <View className="flex-row items-center gap-2">
            <StyledText variant="extrabold" className="text-ink-900 text-sm">
              {session.businessDate}
            </StyledText>
            <View
              className={`px-2 py-0.5 rounded-full ${
                session.status === 'open' ? 'bg-sage-700' : 'bg-ink-600'
              }`}
            >
              <StyledText variant="semibold" className="text-xs text-white">
                {session.status}
              </StyledText>
            </View>
          </View>
          <View className="flex-row mt-1.5 gap-x-3 gap-y-1 flex-wrap">
            <StyledText variant="regular" className="text-xs text-ink-500">
              Opened: {formatPesos(session.openingCash)}
            </StyledText>
            {session.actualCash !== null && (
              <StyledText variant="regular" className="text-xs text-ink-500">
                Counted: {formatPesos(session.actualCash)}
              </StyledText>
            )}
            {session.expectedCash !== null && (
              <StyledText variant="regular" className="text-xs text-ink-500">
                Expected: {formatPesos(session.expectedCash)}
              </StyledText>
            )}
          </View>
        </View>

        <View className="items-end mr-4">
          {session.variance !== null && (
            <StyledText
              variant="semibold"
              className={`text-xs ${session.variance >= 0 ? 'text-sage-600' : 'text-semantic-danger'}`}
            >
              Var: {session.variance >= 0 ? '+' : ''}
              {formatPesos(session.variance)}
            </StyledText>
          )}
        </View>

        <FontAwesome
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={12}
          color="#564E45"
        />
      </Pressable>

      {/* Expanded Section showing entries */}
      {isExpanded && (
        <View className="mt-4 pt-3 border-t border-dashed border-ink-200">
          <StyledText variant="semibold" className="text-ink-600 text-xs mb-2">
            Manual Movements ({entries.length})
          </StyledText>
          {isLoading ? (
            <View className="py-2 gap-y-2">
              <Skeleton width="100%" height={20} borderRadius={4} />
              <Skeleton width="100%" height={20} borderRadius={4} />
            </View>
          ) : entries.length === 0 ? (
            <StyledText
              variant="regular"
              className="text-ink-500 text-xs italic py-1"
            >
              No manual cash movements recorded.
            </StyledText>
          ) : (
            <View className="space-y-1.5">
              {entries.map((entry) => (
                <View
                  key={entry.id}
                  className="flex-row justify-between items-center py-1"
                >
                  <View className="flex-1 mr-2">
                    <View className="flex-row items-center gap-1.5 flex-wrap">
                      <StyledText
                        variant="semibold"
                        className={`text-xs ${
                          entry.type === 'owner_addition'
                            ? 'text-sage-600'
                            : 'text-semantic-danger'
                        }`}
                      >
                        {entry.type.replace('_', ' ')}
                      </StyledText>
                      <StyledText
                        variant="regular"
                        className="text-xs text-ink-500"
                      >
                        {entry.notes}
                      </StyledText>
                    </View>
                  </View>
                  <StyledText
                    variant="medium"
                    className={`text-xs ${
                      entry.type === 'owner_addition'
                        ? 'text-sage-600'
                        : 'text-semantic-danger'
                    }`}
                  >
                    {entry.type === 'owner_addition' ? '+' : '-'}
                    {formatPesos(entry.amount)}
                  </StyledText>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}
