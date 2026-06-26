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
  AlmanacMasthead,
  EditorialEyebrow,
} from '@/components/reports';
import { MoneyText } from '@/components/ui';
import { useReports } from '@/hooks';
import { DateRange, DateRangeType } from '@/types';
import {
  formatCompactCurrency,
  getDateRangeFromType,
  profitSubline,
} from '@/utils';
import { FontAwesome } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * General Reports — the offline store analytics almanac.
 *
 * A redesigned analytical surface that goes beyond the old
 * "Sales Reports" page. Pulls the same data hooks as before
 * (see `useReports`) but lays them out in a deliberately
 * editorial frame: almanac masthead, asymmetric Bento KPIs,
 * tear-off-coupon collapsibles, postage-stamp aging buckets,
 * and a tally-mark bar chart. No operations buttons — this
 * is read-only.
 */
export default function Reports() {
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>('today');
  const [dateRange, setDateRange] = useState<DateRange>(
    getDateRangeFromType('today'),
  );

  const {
    useReportKPIs,
    useSalesOverTime,
    useTopSellingProducts,
    useSalesBreakdown,
    useInventoryMovement,
    useInventoryValue,
    useLowStockItems,
    useFastMovingProducts,
    useSlowMovingProducts,
    useCreditsOverview,
    useAgingBuckets,
    useProfitability,
    useProductProfitability,
    useReportInsights,
    invalidateReports,
  } = useReports();

  const kpisQuery = useReportKPIs(dateRange);
  const salesOverTimeQuery = useSalesOverTime(dateRange);
  const topProductsQuery = useTopSellingProducts(dateRange, 5);
  const salesBreakdownQuery = useSalesBreakdown(dateRange);
  const inventoryMovementQuery = useInventoryMovement(dateRange);
  const inventoryValueQuery = useInventoryValue();
  const lowStockItemsQuery = useLowStockItems(10);
  const fastMovingProductsQuery = useFastMovingProducts(dateRange, 5);
  const slowMovingProductsQuery = useSlowMovingProducts(dateRange, 5);
  const creditsOverviewQuery = useCreditsOverview(dateRange);
  const agingBucketsQuery = useAgingBuckets();
  const profitabilityQuery = useProfitability(dateRange);
  const productProfitabilityQuery = useProductProfitability(dateRange, 10);
  const insightsQuery = useReportInsights(dateRange);

  const isLoading =
    kpisQuery.isLoading ||
    salesOverTimeQuery.isLoading ||
    topProductsQuery.isLoading ||
    salesBreakdownQuery.isLoading ||
    inventoryMovementQuery.isLoading ||
    inventoryValueQuery.isLoading ||
    lowStockItemsQuery.isLoading ||
    fastMovingProductsQuery.isLoading ||
    slowMovingProductsQuery.isLoading ||
    creditsOverviewQuery.isLoading ||
    agingBucketsQuery.isLoading ||
    profitabilityQuery.isLoading ||
    productProfitabilityQuery.isLoading ||
    insightsQuery.isLoading;

  const isRefreshing =
    kpisQuery.isFetching ||
    salesOverTimeQuery.isFetching ||
    topProductsQuery.isFetching ||
    salesBreakdownQuery.isFetching ||
    inventoryMovementQuery.isFetching ||
    inventoryValueQuery.isFetching ||
    lowStockItemsQuery.isFetching ||
    fastMovingProductsQuery.isFetching ||
    slowMovingProductsQuery.isFetching ||
    creditsOverviewQuery.isFetching ||
    agingBucketsQuery.isFetching ||
    profitabilityQuery.isFetching ||
    productProfitabilityQuery.isFetching ||
    insightsQuery.isFetching;

  const kpis = kpisQuery.data ?? {
    totalSales: 0,
    totalProfit: null,
    totalCreditsIssued: 0,
    totalCreditsCollected: 0,
    totalExpenses: 0,
    inventoryCostOut: 0,
    profitCoverage: null,
  };
  const salesOverTime = salesOverTimeQuery.data ?? [];
  const topProducts = topProductsQuery.data ?? [];
  const salesBreakdown = salesBreakdownQuery.data ?? {
    cashSales: 0,
    creditSales: 0,
    averageTransactionValue: 0,
    totalTransactions: 0,
  };
  const inventoryMovement = inventoryMovementQuery.data ?? {
    itemsSold: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  };
  const inventoryValue = inventoryValueQuery.data ?? {
    currentStockValue: 0,
    potentialSalesValue: 0,
    costCoverage: null,
  };
  const lowStockItems = lowStockItemsQuery.data ?? [];
  const fastMovingProducts = fastMovingProductsQuery.data ?? [];
  const slowMovingProducts = slowMovingProductsQuery.data ?? [];
  const creditsOverview = creditsOverviewQuery.data ?? {
    issued: 0,
    collected: 0,
    outstanding: 0,
    activeAccounts: 0,
  };
  const agingBuckets = agingBucketsQuery.data ?? [];
  const profitability = profitabilityQuery.data ?? {
    totalProfit: null,
    marginPercent: null,
    coverage: null,
  };
  const productProfitability = productProfitabilityQuery.data ?? [];
  const insights = insightsQuery.data ?? [];

  const handleDateRangeChange = (type: DateRangeType) => {
    setDateRangeType(type);
    setDateRange(getDateRangeFromType(type));
  };

  const handleRefresh = async () => {
    await invalidateReports();
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-cinnamon-500" edges={['top']}>
        <View className="flex-1 bg-paper-200 items-center justify-center">
          <ActivityIndicator size="large" color="#623418" />
          <StyledText
            variant="extrabold"
            className="text-label text-ink-400 mt-4 uppercase"
            style={{ letterSpacing: 1.4 }}
          >
            Loading reports...
          </StyledText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-cinnamon-500" edges={['top']}>
      <View className="flex-1 bg-paper-200">
        <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#623418"
            colors={['#623418']}
          />
        }
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        <AlmanacMasthead
          dateRange={dateRange}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        <View className="px-4 mt-4">
          <DateRangeSelector
            activeRange={dateRangeType}
            onRangeChange={handleDateRangeChange}
          />
        </View>

        {/* ─── Smart Alerts / Insights ────────────────────────── */}
        {insights.length > 0 && (
          <View className="px-4 mt-2">
            <EditorialEyebrow number="I" label="Dispatch from the counter" />
            <View className="mt-3">
              {insights.map((insight, index) => (
                <InsightCard
                  key={index}
                  {...insight}
                  icon={insight.icon as keyof typeof FontAwesome.glyphMap}
                />
              ))}
            </View>
          </View>
        )}

        {/* ─── Bento KPI grid ─────────────────────────────────── */}
        <View className="px-4 mt-6">
          <EditorialEyebrow number="II" label="The four pillars" />
          <View className="mt-3">
            <BentoGrid>
              <BentoHero
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
                      : profitSubline(profitability.marginPercent)
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
                  kicker="STOCK ASSET VALUE"
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
          </View>
        </View>

        {/* ─── Sales Trend & Payments ─────────────────────────── */}
        <View className="px-4 mt-8">
          <EditorialEyebrow number="III" label="Sales trend & payment split" />
          <View className="mt-3">
            <CollapsibleSection
              number="01"
              title="Sales Trend & Payments"
              subtitle="Daily takings and how customers paid"
              tone="persimmon"
              icon={<FontAwesome name="bar-chart" size={16} color="#A1370C" />}
              defaultExpanded
            >
              <View>
                <SimpleBarChart data={salesOverTime} height={200} />

                {/* Perforation between chart and breakdown */}
                <View className="mt-5 mb-3 flex-row justify-between">
                  {Array.from({ length: 28 }).map((_, i) => (
                    <View key={i} className="w-1 h-1 rounded-full bg-ink-200" />
                  ))}
                </View>

                <PaymentSplitStrip
                  cash={salesBreakdown.cashSales}
                  credit={salesBreakdown.creditSales}
                  total={kpis.totalSales}
                  transactions={salesBreakdown.totalTransactions}
                  avgTicket={salesBreakdown.averageTransactionValue}
                />
              </View>
            </CollapsibleSection>
          </View>
        </View>

        {/* ─── Top Products ──────────────────────────────────── */}
        <View className="px-4 mt-6">
          <CollapsibleSection
            number="02"
            title="Top Products & Profitability"
            subtitle="The champions of the shelves"
            tone="cinnamon"
            icon={<FontAwesome name="trophy" size={16} color="#391C0A" />}
            defaultExpanded
          >
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
                {profitability.totalProfit === null && (
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
          </CollapsibleSection>
        </View>

        {/* ─── Stock Movement ────────────────────────────────── */}
        <View className="px-4 mt-6">
          <CollapsibleSection
            number="03"
            title="Stock Levels & Movement"
            subtitle="What left the shelves, what needs restock"
            tone="sage"
            icon={<FontAwesome name="archive" size={16} color="#3D5E1B" />}
            defaultExpanded
          >
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
          </CollapsibleSection>
        </View>

        {/* ─── Suki Credit Aging ─────────────────────────────── */}
        <View className="px-4 mt-6">
          <CollapsibleSection
            number="04"
            title="Suki Credit Aging"
            subtitle="How long the debt has been sitting on the books"
            tone="cinnamon"
            icon={
              <FontAwesome name="hourglass-half" size={16} color="#391C0A" />
            }
            defaultExpanded
          >
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
          </CollapsibleSection>
        </View>

        {/* ─── Colophon ──────────────────────────────────────── */}
        <View className="px-4 mt-8 items-center">
          <View className="h-px bg-ink-200 w-12 mb-3" />
          <StyledText
            variant="extrabold"
            className="text-label text-ink-300"
            style={{ letterSpacing: 1.8 }}
          >
            END OF REPORT · STAY SHARP
          </StyledText>
          <StyledText
            variant="medium"
            className="text-ink-400 text-[10px] mt-1"
          >
            Pull down to refresh · 100% offline
          </StyledText>
        </View>
      </ScrollView>
      </View>
    </SafeAreaView>
  );
}
