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
import { useReports, useCashSessions, useCashEntries } from '@/hooks';
import { formatPesos } from '@/lib/money';
import { DateRange, DateRangeType } from '@/types';
import {
  formatCompactCurrency,
  getDateRangeFromType,
  profitSubline,
} from '@/utils';
import { FontAwesome } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  View,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EMPTY_ARRAY: any[] = [];

const DEFAULT_KPIS = {
  totalSales: 0,
  totalProfit: null,
  totalCreditsIssued: 0,
  totalCreditsCollected: 0,
  totalExpenses: 0,
  inventoryCostOut: 0,
  profitCoverage: null,
};

const DEFAULT_SALES_BREAKDOWN = {
  cashSales: 0,
  creditSales: 0,
  averageTransactionValue: 0,
  totalTransactions: 0,
};

const DEFAULT_INVENTORY_MOVEMENT = {
  itemsSold: 0,
  lowStockCount: 0,
  outOfStockCount: 0,
};

const DEFAULT_INVENTORY_VALUE = {
  currentStockValue: 0,
  potentialSalesValue: 0,
  costCoverage: null,
};

const DEFAULT_CREDITS_OVERVIEW = {
  issued: 0,
  collected: 0,
  outstanding: 0,
  activeAccounts: 0,
};

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
  const queryClient = useQueryClient();
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
    useSlowMovingProducts,
    useCreditsOverview,
    useAgingBuckets,
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
  const slowMovingProductsQuery = useSlowMovingProducts(dateRange, 5);
  const creditsOverviewQuery = useCreditsOverview(dateRange);
  const agingBucketsQuery = useAgingBuckets();
  const productProfitabilityQuery = useProductProfitability(dateRange, 10);
  const insightsQuery = useReportInsights(dateRange);
  const sessionsQuery = useCashSessions();

  // Per-section loading flags — each section renders as soon as its own
  // data arrives without waiting for every other query to finish.
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

  const startOfDayDate = new Date(dateRange.startDate);
  startOfDayDate.setHours(0, 0, 0, 0);

  const endOfDayDate = new Date(dateRange.endDate);
  endOfDayDate.setHours(23, 59, 59, 999);

  const filteredSessions = (sessions || []).filter((session: any) => {
    const sessionDate = new Date(session.businessDate + 'T00:00:00');
    return sessionDate >= startOfDayDate && sessionDate <= endOfDayDate;
  });

  return (
    <SafeAreaView className="flex-1 bg-cinnamon-500" edges={['top']}>
      <View className="flex-1 bg-paper-200">
        <AlmanacMasthead
          dateRange={dateRange}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

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
          contentContainerStyle={{ paddingBottom: 90 }}
        >
          <View className="px-4 mt-4">
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
                <View className="mt-3 items-center py-4">
                  <ActivityIndicator size="small" color="#623418" />
                </View>
              ) : (
                <View className="mt-3">
                  {insights.map((insight, index) => (
                    <InsightCard
                      key={index}
                      {...insight}
                      icon={insight.icon as keyof typeof FontAwesome.glyphMap}
                    />
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ─── Bento KPI grid ─────────────────────────────────── */}
          <View className="px-4 mt-6">
            <EditorialEyebrow number="II" label="The four pillars" />
            {isKPIsLoading ? (
              <View className="mt-3 items-center py-8">
                <ActivityIndicator size="large" color="#623418" />
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
                        <FontAwesome
                          name="line-chart"
                          size={16}
                          color="#3D5E1B"
                        />
                      }
                      accent="sage"
                    />
                    <BentoKPICard
                      kicker="ACTIVE UTANG"
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
                      icon={
                        <FontAwesome name="money" size={16} color="#3D5E1B" />
                      }
                      accent="sage"
                    />
                  </View>
                </BentoGrid>
              </View>
            )}
          </View>

          {/* ─── Sales Trend & Payments ─────────────────────────── */}
          <View className="px-4 mt-8">
            <EditorialEyebrow
              number="III"
              label="Sales trend & payment split"
            />
            <View className="mt-3">
              <CollapsibleSection
                number="01"
                title="Sales Trend & Payments"
                subtitle="Daily takings and how customers paid"
                tone="persimmon"
                icon={
                  <FontAwesome name="bar-chart" size={16} color="#A1370C" />
                }
                defaultExpanded
              >
                {isSalesTrendLoading ? (
                  <View className="items-center py-8">
                    <ActivityIndicator size="large" color="#623418" />
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
              number="02"
              title="Top Products & Profitability"
              subtitle="The champions of the shelves"
              tone="cinnamon"
              icon={<FontAwesome name="trophy" size={16} color="#391C0A" />}
              defaultExpanded
            >
              {isTopProductsLoading ? (
                <View className="items-center py-8">
                  <ActivityIndicator size="large" color="#623418" />
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
              number="03"
              title="Stock Levels & Movement"
              subtitle="What left the shelves, what needs restock"
              tone="sage"
              icon={<FontAwesome name="archive" size={16} color="#3D5E1B" />}
              defaultExpanded
            >
              {isStockLoading ? (
                <View className="items-center py-8">
                  <ActivityIndicator size="large" color="#623418" />
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
                            {Math.round(inventoryValue.costCoverage * 100)}%
                            cost coverage
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
              number="04"
              title="Suki Credit Aging"
              subtitle="How long the debt has been sitting on the books"
              tone="cinnamon"
              icon={
                <FontAwesome name="hourglass-half" size={16} color="#391C0A" />
              }
              defaultExpanded
            >
              {isCreditAgingLoading ? (
                <View className="items-center py-8">
                  <ActivityIndicator size="large" color="#623418" />
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
              number="05"
              title="Cashbook History"
              subtitle="Daily drawer logs, counted physical cash, and variances"
              tone="cinnamon"
              icon={<FontAwesome name="book" size={16} color="#391C0A" />}
              defaultExpanded
            >
              {isSessionsLoading ? (
                <View className="items-center py-8">
                  <ActivityIndicator size="large" color="#623418" />
                </View>
              ) : filteredSessions.length === 0 ? (
                <View className="bg-paper-50 rounded-xl border border-dashed border-ink-200 p-6 items-center">
                  <StyledText
                    variant="regular"
                    className="text-ink-400 text-sm"
                  >
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
        </ScrollView>
      </View>
    </SafeAreaView>
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
            <ActivityIndicator size="small" color="#623418" className="py-2" />
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
