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
  EditorialEyebrow,
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
import {
  DEFAULT_CREDITS_OVERVIEW,
  DEFAULT_INVENTORY_MOVEMENT,
  DEFAULT_INVENTORY_VALUE,
  DEFAULT_KPIS,
  DEFAULT_SALES_BREAKDOWN,
} from '@/constants';

const EMPTY_ARRAY: never[] = [];

export default function TodayScreen() {
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

  return (
    <RefreshableScrollView
      className="flex-1 bg-paper-200"
      contentContainerStyle={{
        paddingTop: 8,
        paddingBottom: tabBarBottomOffset + 24,
      }}
      isRefreshing={isRefreshing}
      onRefresh={handleRefresh}
    >
      <View className="px-4 mt-2">
        <DateRangeSelector
          activeRange={dateRangeType}
          onRangeChange={handleDateRangeChange}
        />
      </View>

      {/* ─── Smart Alerts / Insights ────────────────────────── */}
      {(isInsightsLoading || insights.length > 0) && (
        <View className="px-4 mt-2">
          <EditorialEyebrow number="I" label="Dispatch from the counter" />
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
      <View className="px-4 mt-6">
        <EditorialEyebrow number="II" label="The four pillars" />
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
                kicker="TOTAL SALES · COVER STORY"
                headline={formatCompactCurrency(kpis.totalSales)}
                subline={`${salesBreakdown.totalTransactions} ${
                  salesBreakdown.totalTransactions === 1
                    ? 'transaction'
                    : 'transactions'
                } · cash & credit combined`}
                icon={
                  <FontAwesome name="shopping-cart" size={14} color="#FBF7EE" />
                }
                accent="persimmon"
              />

              <View className="flex-row gap-3">
                <BentoKPICard
                  kicker="TUBO · GROSS PROFIT"
                  headline={
                    kpis.totalProfit === null
                      ? '—'
                      : formatCompactCurrency(kpis.totalProfit)
                  }
                  subline={
                    kpis.totalProfit === null
                      ? 'Add cost prices to compute tubo'
                      : profitSubline(kpis.marginPercent)
                  }
                  icon={
                    <FontAwesome name="line-chart" size={16} color="#3D5E1B" />
                  }
                  accent="sage"
                />
                <BentoKPICard
                  kicker="ACTIVE UTANG"
                  headline={formatCompactCurrency(creditsOverview.outstanding)}
                  subline={`${creditsOverview.activeAccounts} ${
                    creditsOverview.activeAccounts === 1
                      ? 'suki owes'
                      : 'sukis owe'
                  } you`}
                  icon={
                    <FontAwesome name="credit-card" size={16} color="#A1370C" />
                  }
                  accent="persimmon"
                />
              </View>

              <View className="flex-row gap-3">
                <BentoKPICard
                  kicker="STOCK ASSET VALUE · AT COST"
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
                  kicker="CASH COLLECTED"
                  headline={formatCompactCurrency(salesBreakdown.cashSales)}
                  subline={`Avg ticket: ${formatCompactCurrency(
                    salesBreakdown.averageTransactionValue,
                  )}`}
                  icon={<FontAwesome name="money" size={16} color="#3D5E1B" />}
                  accent="sage"
                />
              </View>
            </BentoGrid>

            <View className="mt-4">
              <FinancialResultSection
                kpis={kpis}
                onOpenLedger={() => router.push('/gastos-kaha')}
              />
            </View>
          </View>
        )}
      </View>

      {/* ─── Sales Trend & Payments ─────────────────────────── */}
      <View className="px-4 mt-8">
        <EditorialEyebrow number="III" label="Sales trend & payment split" />
        <View className="mt-3">
          <CollapsibleSection
            id="trend"
            number="01"
            title="Sales Trend & Payments"
            subtitle="Daily takings and how customers paid"
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
      <View className="px-4 mt-6">
        <CollapsibleSection
          id="top"
          number="02"
          title="Top Products & Profitability"
          subtitle="The champions of the shelves"
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
                variant="extrabold"
                className="text-label text-ink-400 mb-3"
                style={{ letterSpacing: 1.4 }}
              >
                TOP RANKING BY REVENUE
              </StyledText>
              <TopProductsList products={topProducts} />

              {/* Dashed separator between sub-sections */}
              <View className="my-4 flex-row items-center">
                <View className="flex-1 h-px bg-ink-200" />
                <StyledText
                  variant="extrabold"
                  className="text-label text-ink-300 mx-3"
                  style={{ letterSpacing: 1.6 }}
                >
                  · · ·
                </StyledText>
                <View className="flex-1 h-px bg-ink-200" />
              </View>

              {/* Most profitable */}
              <View className="flex-row items-center justify-between mb-3">
                <StyledText
                  variant="extrabold"
                  className="text-label text-ink-400"
                  style={{ letterSpacing: 1.4 }}
                >
                  MOST PROFITABLE · TUBO LEADERS
                </StyledText>
                {kpis.totalProfit === null && (
                  <StyledText
                    variant="medium"
                    className="text-ink-400 text-[10px]"
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
      <View className="px-4 mt-6">
        <CollapsibleSection
          id="stock"
          number="03"
          title="Stock Levels & Movement"
          subtitle="What left the shelves, what needs restock"
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

              <View className="flex-row items-stretch border border-ink-200 rounded-md overflow-hidden bg-paper-50 p-3 gap-3">
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
              <View className="mt-4 flex-row items-stretch border border-ink-200 rounded-md overflow-hidden">
                <View className="flex-1 p-3 border-r border-dashed border-ink-200 bg-cinnamon-50/40">
                  <StyledText
                    variant="extrabold"
                    className="text-label text-cinnamon-700 mb-1"
                    style={{ letterSpacing: 1.2 }}
                  >
                    AT COST
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
                        className="text-ink-400 text-[10px] mt-1"
                      >
                        {Math.round(inventoryValue.costCoverage * 100)}% cost
                        coverage
                      </StyledText>
                    )}
                </View>
                <View className="flex-1 p-3 bg-sage-50/40">
                  <StyledText
                    variant="extrabold"
                    className="text-label text-sage-700 mb-1"
                    style={{ letterSpacing: 1.2 }}
                  >
                    AT RETAIL
                  </StyledText>
                  <MoneyText
                    value={inventoryValue.potentialSalesValue}
                    size="md"
                    variant="success"
                    className="text-sm"
                  />
                  <StyledText
                    variant="medium"
                    className="text-ink-400 text-[10px] mt-1"
                  >
                    Potential takings
                  </StyledText>
                </View>
              </View>

              {/* Low stock alert */}
              {lowStockItems.length > 0 && (
                <View className="mt-4 rounded-md border-2 border-dashed border-semantic-warning p-3 bg-semantic-warning-50">
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
                      className="text-label text-semantic-warning"
                      style={{ letterSpacing: 1.4 }}
                    >
                      LOW STOCK · {lowStockItems.length} ITEMS
                    </StyledText>
                  </View>
                  {lowStockItems.slice(0, 4).map((item) => (
                    <View
                      key={item.id}
                      className="flex-row items-center justify-between mt-1"
                    >
                      <StyledText
                        variant="medium"
                        className="text-ink-700 text-xs flex-1"
                        numberOfLines={1}
                      >
                        · {item.name}
                      </StyledText>
                      <StyledText
                        variant="extrabold"
                        className={`text-xs ${
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
      <View className="px-4 mt-6">
        <CollapsibleSection
          id="aging"
          number="04"
          title="Suki Credit Aging"
          subtitle="How long the debt has been sitting on the books"
          tone="cinnamon"
          icon={<FontAwesome name="hourglass-half" size={16} color="#391C0A" />}
          defaultExpanded={requestedSection === 'aging'}
        >
          {isCreditAgingLoading ? (
            <View className="py-2 gap-y-4">
              <Skeleton width="100%" height={140} borderRadius={12} />
              <View className="flex-row gap-3">
                <View className="flex-1 p-3 border border-ink-200 rounded-md bg-paper-50 gap-y-2">
                  <Skeleton width={60} height={10} borderRadius={4} />
                  <Skeleton width={80} height={16} borderRadius={4} />
                </View>
                <View className="flex-1 p-3 border border-ink-200 rounded-md bg-paper-50 gap-y-2">
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
                <View className="flex-1 p-3 border border-ink-200 rounded-md bg-semantic-danger-50/30">
                  <StyledText
                    variant="extrabold"
                    className="text-label text-semantic-danger"
                    style={{ letterSpacing: 1.2 }}
                  >
                    ISSUED
                  </StyledText>
                  <MoneyText
                    value={creditsOverview.issued}
                    size="md"
                    variant="danger"
                    className="text-sm"
                  />
                </View>
                <View className="flex-1 p-3 border border-ink-200 rounded-md bg-sage-50">
                  <StyledText
                    variant="extrabold"
                    className="text-label text-sage-700"
                    style={{ letterSpacing: 1.2 }}
                  >
                    COLLECTED
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
      <View className="px-4 mt-6">
        <CollapsibleSection
          id="cashbook"
          number="05"
          title="Cashbook History"
          subtitle="Daily drawer logs, counted physical cash, and variances"
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
                No cash sessions found in this date range.
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
                session.status === 'open' ? 'bg-sage-500' : 'bg-ink-400'
              }`}
            >
              <StyledText
                variant="semibold"
                className="text-[10px] text-white uppercase"
              >
                {session.status}
              </StyledText>
            </View>
          </View>
          <View className="flex-row mt-1.5 gap-x-3 gap-y-1 flex-wrap">
            <StyledText variant="regular" className="text-[11px] text-ink-500">
              Opened: {formatPesos(session.openingCash)}
            </StyledText>
            {session.actualCash !== null && (
              <StyledText
                variant="regular"
                className="text-[11px] text-ink-500"
              >
                Counted: {formatPesos(session.actualCash)}
              </StyledText>
            )}
            {session.expectedCash !== null && (
              <StyledText
                variant="regular"
                className="text-[11px] text-ink-500"
              >
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
          <StyledText
            variant="semibold"
            className="label-caps text-ink-500 text-[10px] mb-2"
          >
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
              className="text-ink-400 text-xs italic py-1"
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
                        className={`text-[10px] uppercase font-stack-sans-bold ${
                          entry.type === 'owner_addition'
                            ? 'text-sage-600'
                            : 'text-semantic-danger'
                        }`}
                      >
                        {entry.type.replace('_', ' ')}
                      </StyledText>
                      <StyledText
                        variant="regular"
                        className="text-[11px] text-ink-500"
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
