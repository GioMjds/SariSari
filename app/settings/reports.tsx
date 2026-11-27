import { Prof, withProf } from '@/utils/perf';
import { StyledText } from '@/components/elements';
import {
  AgingSkeleton,
  BentoGrid,
  BentoHero,
  BentoKPICard,
  CollapsibleSection,
  CreditAgingChart,
  DateRangeSelector,
  DeltaChip,
  FinancialResultSection,
  InfoButton,
  InsightCard,
  InsightsSkeleton,
  KpiSkeleton,
  PaymentSplitStrip,
  ProfitabilityRanking,
  ProfitFlowBar,
  SessionsSkeleton,
  SimpleBarChart,
  StockMovementDetails,
  StockSkeleton,
  TopProductsList,
  TopProductsSkeleton,
  TrendSkeleton,
  type Delta,
} from '@/components/reports';
import { getPreviousDateRange } from '@/components/reports/report-math';
import { percentChange } from '@/components/home/home-state';
import { router, useLocalSearchParams } from 'expo-router';
import { MoneyText, RefreshableScrollView, Sheet } from '@/components/ui';
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
import type { DateRange, DateRangeType } from '@/types';
import type { CashSession } from '@/types/cash.types';
import { formatCompactCurrency, getDateRangeFromType } from '@/utils';
import { FontAwesome } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
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

type SectionId = 'trend' | 'top' | 'stock' | 'aging' | 'cashbook';
const SECTION_IDS: SectionId[] = ['trend', 'top', 'stock', 'aging', 'cashbook'];

type ExplainKey =
  | 'profit'
  | 'sales'
  | 'utang'
  | 'stock'
  | 'expenses'
  | 'trend'
  | 'top'
  | 'stock_section'
  | 'aging'
  | 'cashbook';

// Title shown on each explainer sheet, reusing the label the owner tapped.
const EXPLAIN_TITLE: Record<ExplainKey, string> = {
  profit: 'common:reports.hero.kicker',
  sales: 'common:reports.kpi.sales',
  utang: 'common:reports.kpi.utang',
  stock: 'common:reports.kpi.stock',
  expenses: 'common:reports.kpi.expenses',
  trend: 'common:reports.sections.trend.title',
  top: 'common:reports.sections.top.title',
  stock_section: 'common:reports.sections.stock.title',
  aging: 'common:reports.sections.aging.title',
  cashbook: 'common:reports.sections.cashbook.title',
};

function rangesFor(type: DateRangeType) {
  const now = new Date();
  return {
    current: getDateRangeFromType(type, now),
    previous: getPreviousDateRange(type, now),
  };
}

function ReportsScreen() {
  const { t } = useTranslation();
  const { section } = useLocalSearchParams<{ section?: string }>();
  const requestedSection = SECTION_IDS.find((id) => id === section);

  const queryClient = useQueryClient();
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>('today');
  const [ranges, setRanges] = useState<{
    current: DateRange;
    previous: DateRange;
  }>(() => rangesFor('today'));
  const dateRange = ranges.current;
  const [explainKey, setExplainKey] = useState<ExplainKey | null>(null);
  // Last opened explainer stays rendered while the sheet slides out.
  const [shownExplainKey, setShownExplainKey] = useState<ExplainKey>('profit');

  // Collapsed sections load their data only once the owner first opens them.
  const [opened, setOpened] = useState<ReadonlySet<SectionId>>(
    () => new Set([requestedSection ?? 'trend']),
  );
  const markOpened = useCallback(
    (id: SectionId) =>
      setOpened((prev) => (prev.has(id) ? prev : new Set(prev).add(id))),
    [],
  );

  const { invalidateReports } = useReports();

  const kpisQuery = useReportKPIs(dateRange);
  const prevKpisQuery = useReportKPIs(ranges.previous);
  const salesOverTimeQuery = useSalesOverTime(dateRange);
  const salesBreakdownQuery = useSalesBreakdown(dateRange);
  const inventoryValueQuery = useInventoryValue();
  const lowStockItemsQuery = useLowStockItems(10);
  const creditsOverviewQuery = useCreditsOverview(dateRange);
  const insightsQuery = useReportInsights(dateRange);
  const topProductsQuery = useTopSellingProducts(
    dateRange,
    5,
    opened.has('top') || opened.has('stock'),
  );
  const productProfitabilityQuery = useProductProfitability(
    dateRange,
    10,
    opened.has('top'),
  );
  const inventoryMovementQuery = useInventoryMovement(
    dateRange,
    opened.has('stock'),
  );
  const slowMovingProductsQuery = useSlowMovingProducts(
    dateRange,
    5,
    opened.has('stock'),
  );
  const agingBucketsQuery = useAgingBuckets(opened.has('aging'));
  const sessionsQuery = useCashSessions(opened.has('cashbook'));

  const isKPIsLoading =
    kpisQuery.isLoading ||
    salesBreakdownQuery.isLoading ||
    creditsOverviewQuery.isLoading ||
    inventoryValueQuery.isLoading;
  const isSalesTrendLoading =
    salesOverTimeQuery.isLoading || salesBreakdownQuery.isLoading;
  const isTopProductsLoading =
    topProductsQuery.isLoading || productProfitabilityQuery.isLoading;
  const isStockLoading =
    inventoryMovementQuery.isLoading ||
    lowStockItemsQuery.isLoading ||
    slowMovingProductsQuery.isLoading ||
    topProductsQuery.isLoading;
  const isCreditAgingLoading = agingBucketsQuery.isLoading;

  const isRefreshing = [
    kpisQuery,
    prevKpisQuery,
    salesOverTimeQuery,
    salesBreakdownQuery,
    inventoryValueQuery,
    lowStockItemsQuery,
    creditsOverviewQuery,
    insightsQuery,
    topProductsQuery,
    productProfitabilityQuery,
    inventoryMovementQuery,
    slowMovingProductsQuery,
    agingBucketsQuery,
    sessionsQuery,
  ].some((q) => q.isFetching && !q.isLoading);

  const kpis = kpisQuery.data ?? DEFAULT_KPIS;
  const prevKpis = prevKpisQuery.data;
  const salesOverTime = salesOverTimeQuery.data ?? EMPTY_ARRAY;
  const topProducts = topProductsQuery.data ?? EMPTY_ARRAY;
  const salesBreakdown = salesBreakdownQuery.data ?? DEFAULT_SALES_BREAKDOWN;
  const inventoryMovement =
    inventoryMovementQuery.data ?? DEFAULT_INVENTORY_MOVEMENT;
  const inventoryValue = inventoryValueQuery.data ?? DEFAULT_INVENTORY_VALUE;
  const lowStockItems = lowStockItemsQuery.data ?? EMPTY_ARRAY;
  const slowMovingProducts = slowMovingProductsQuery.data ?? EMPTY_ARRAY;
  const creditsOverview = creditsOverviewQuery.data ?? DEFAULT_CREDITS_OVERVIEW;
  const agingBuckets = agingBucketsQuery.data ?? EMPTY_ARRAY;
  const productProfitability = productProfitabilityQuery.data ?? EMPTY_ARRAY;
  const insights = insightsQuery.data ?? EMPTY_ARRAY;
  const sessions = sessionsQuery.data ?? EMPTY_ARRAY;

  const handleDateRangeChange = useCallback(
    (type: DateRangeType) => {
      // Re-tapping the active chip would move the mid-day comparison window and refetch.
      if (type === dateRangeType) return;
      setDateRangeType(type);
      setRanges(rangesFor(type));
    },
    [dateRangeType],
  );

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      invalidateReports(),
      queryClient.invalidateQueries({ queryKey: ['cash'] }),
    ]);
  }, [invalidateReports, queryClient]);

  const filteredSessions = useMemo(() => {
    const start = format(dateRange.startDate, 'yyyy-MM-dd');
    const end = format(dateRange.endDate, 'yyyy-MM-dd');
    return (sessions as CashSession[]).filter(
      (s) =>
        !!s.businessDate && s.businessDate >= start && s.businessDate <= end,
    );
  }, [sessions, dateRange]);

  const tabBarBottomOffset = useTabBarBottomOffset();

  const period = t(`common:reports.compare.${ranges.previous.label}`);
  const makeDelta = (
    current: number | null,
    previous: number | null | undefined,
  ): Delta | undefined => {
    // Both sides must belong to the selected range, not a placeholder from the last one.
    if (kpisQuery.isPlaceholderData || prevKpisQuery.isPlaceholderData)
      return undefined;
    if (current === null || previous == null) return undefined;
    const pct = percentChange(current, previous);
    if (pct === null) return undefined;
    const key = pct > 0 ? 'up' : pct < 0 ? 'down' : 'same';
    return {
      pct,
      label: t(`common:reports.compare.${key}`, { pct: Math.abs(pct), period }),
    };
  };

  const profit = kpis.operatingProfit;
  const revenue = kpis.totalSales + kpis.utangSales;
  const profitDelta = makeDelta(profit, prevKpis?.operatingProfit);
  const salesDelta = makeDelta(kpis.totalSales, prevKpis?.totalSales);
  const expensesDelta = makeDelta(kpis.paidExpenses, prevKpis?.paidExpenses);

  const heroHeadline =
    profit === null
      ? t('common:reports.hero.noCostHeadline')
      : formatCompactCurrency(profit);
  const heroSubline =
    profit === null
      ? t('common:reports.hero.missingCost')
      : profit < 0
        ? t('common:reports.hero.lossLine')
        : t('common:reports.hero.profitLine');

  const explain = (key: ExplainKey) => () => {
    setShownExplainKey(key);
    setExplainKey(key);
  };
  const info = (key: ExplainKey, tone: 'ink' | 'paper' = 'ink') => (
    <InfoButton
      onPress={explain(key)}
      tone={tone}
      label={t('common:reports.explain.a11y', { name: t(EXPLAIN_TITLE[key]) })}
    />
  );
  const sectionProps = (id: SectionId) => ({
    id,
    title: t(`common:reports.sections.${id}.title`),
    subtitle: t(`common:reports.sections.${id}.subtitle`),
    defaultExpanded: opened.has(id),
    onToggle: () => markOpened(id),
    info: info(id === 'stock' ? 'stock_section' : id),
  });

  // Sari's pose and line follow the most urgent thing in the data.
  // No pose while loading, so Sari is built once with the pose the data calls for.
  const sari: { state: SariState | null; text: string } = (() => {
    if (isKPIsLoading || lowStockItemsQuery.isLoading) {
      return { state: null, text: t('common:reports.sari.loading') };
    }
    if (revenue === 0 && salesBreakdown.totalTransactions === 0) {
      return { state: 'reports', text: t('common:reports.sari.noSales') };
    }
    if (lowStockItems.length > 0) {
      return {
        state: 'low-stock',
        text: t('common:reports.sari.lowStock', {
          count: lowStockItems.length,
        }),
      };
    }
    if (profit !== null && profit < 0) {
      return { state: 'reports', text: t('common:reports.sari.loss') };
    }
    if (creditsOverview.outstanding > 0) {
      return {
        state: 'outstanding-balance',
        text: t('common:reports.sari.utang', {
          amount: formatCompactCurrency(creditsOverview.outstanding),
          count: creditsOverview.activeAccounts,
        }),
      };
    }
    if (profit === null) {
      return { state: 'reports', text: t('common:reports.hero.missingCost') };
    }
    return {
      state: 'sales',
      text: t('common:reports.sari.healthy', {
        amount: formatCompactCurrency(profit),
      }),
    };
  })();

  return (
    <View className="flex-1 bg-paper-200">
      <Prof id="Reports:Header">
        <MoreDetailHeader
          title={t('common:reportsTitle')}
          onBack={goBackToMore}
          backAccessibilityLabel={t('common:moreBackA11y')}
        />
      </Prof>
      <RefreshableScrollView
        className="flex-1 bg-paper-200"
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: tabBarBottomOffset + 24,
        }}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      >
        {/* Sari speech bubble */}
        <View className="px-5 flex-row items-center">
          <View className="flex-1 bg-paper-50 border border-ink-100 rounded-2xl px-4 py-3 shadow-paper">
            <StyledText
              variant="extrabold"
              className="text-xs text-persimmon-700 mb-1"
            >
              {t('common:reports.sariSays')}
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
          {sari.state ? (
            <SariMascot state={sari.state} size={96} animated={false} defer />
          ) : (
            <View style={{ width: 96, height: 96 }} />
          )}
        </View>

        <View className="px-5 mt-3">
          <Prof id="Reports:DateRange">
            <DateRangeSelector
              activeRange={dateRangeType}
              onRangeChange={handleDateRangeChange}
            />
          </Prof>
        </View>

        {/* Profit hero, money flow, and headline KPIs */}
        <View className="px-5 mt-4">
          {isKPIsLoading ? (
            <Prof id="Reports:KpiSkeleton">
              <KpiSkeleton />
            </Prof>
          ) : (
            <Prof id="Reports:BentoGrid">
              <BentoGrid>
                <BentoHero
                  animationKey={`${dateRangeType}-${profit}`}
                  kicker={t('common:reports.hero.kicker')}
                  headline={heroHeadline}
                  subline={heroSubline}
                  accessibilityLabel={`${t('common:reports.hero.kicker')}: ${heroHeadline}. ${heroSubline}`}
                  accent={
                    profit === null ? 'ink' : profit < 0 ? 'cinnamon' : 'sage'
                  }
                  icon={
                    <FontAwesome name="line-chart" size={14} color="#FBF7EE" />
                  }
                  info={info('profit', 'paper')}
                  delta={
                    profitDelta && <DeltaChip delta={profitDelta} onDark />
                  }
                  footer={
                    profit !== null && revenue > 0 ? (
                      <ProfitFlowBar
                        revenue={revenue}
                        cost={kpis.inventoryCostOut}
                        expenses={kpis.paidExpenses}
                        profit={profit}
                      />
                    ) : undefined
                  }
                />

                <View className="flex-row gap-3">
                  <BentoKPICard
                    kicker={t('common:reports.kpi.sales')}
                    headline={formatCompactCurrency(kpis.totalSales)}
                    subline={t('common:reports.kpi.salesSub', {
                      count: salesBreakdown.totalTransactions,
                      avg: formatCompactCurrency(
                        salesBreakdown.averageTransactionValue,
                      ),
                    })}
                    icon={
                      <FontAwesome
                        name="shopping-cart"
                        size={16}
                        color="#A1370C"
                      />
                    }
                    accent="persimmon"
                    info={info('sales')}
                    delta={salesDelta && <DeltaChip delta={salesDelta} />}
                  />
                  <BentoKPICard
                    kicker={t('common:reports.kpi.utang')}
                    headline={formatCompactCurrency(
                      creditsOverview.outstanding,
                    )}
                    subline={t('common:reports.kpi.utangSub', {
                      count: creditsOverview.activeAccounts,
                    })}
                    icon={
                      <FontAwesome
                        name="credit-card"
                        size={16}
                        color="#391C0A"
                      />
                    }
                    accent="cinnamon"
                    info={info('utang')}
                  />
                </View>

                <View className="flex-row gap-3">
                  <BentoKPICard
                    kicker={t('common:reports.kpi.stock')}
                    headline={formatCompactCurrency(
                      inventoryValue.currentStockValue,
                    )}
                    subline={
                      inventoryValue.costCoverage !== null &&
                      inventoryValue.costCoverage < 1
                        ? t('common:reports.kpi.stockCoverage', {
                            pct: Math.round(inventoryValue.costCoverage * 100),
                          })
                        : t('common:reports.kpi.stockRetail', {
                            amount: formatCompactCurrency(
                              inventoryValue.potentialSalesValue,
                            ),
                          })
                    }
                    icon={
                      <FontAwesome name="archive" size={16} color="#3D5E1B" />
                    }
                    accent="sage"
                    info={info('stock')}
                  />
                  <BentoKPICard
                    kicker={t('common:reports.kpi.expenses')}
                    headline={formatCompactCurrency(kpis.paidExpenses)}
                    subline={t('common:reports.kpi.expensesSub')}
                    icon={
                      <FontAwesome name="money" size={16} color="#28231D" />
                    }
                    accent="ink"
                    info={info('expenses')}
                    delta={
                      expensesDelta && (
                        <DeltaChip delta={expensesDelta} goodWhenUp={false} />
                      )
                    }
                  />
                </View>
              </BentoGrid>
            </Prof>
          )}
        </View>

        {/* Smart alerts */}
        {(insightsQuery.isLoading || insights.length > 0) && (
          <View className="px-5 mt-3">
            {insightsQuery.isLoading ? (
              <InsightsSkeleton />
            ) : (
              <View className="mt-3">
                {insights.map((insight, index) => (
                  <InsightCard key={index} {...insight} />
                ))}
              </View>
            )}
          </View>
        )}

        {/* How kita was counted */}
        {!isKPIsLoading && (
          <View className="px-5 mt-4">
            <Prof id="Reports:FinancialResult">
              <FinancialResultSection
                kpis={kpis}
                onOpenLedger={() => router.push('/settings/cash-entries')}
              />
            </Prof>
          </View>
        )}

        {/* Sales trend and payments */}
        <View className="px-5 mt-6">
          <Prof id="Reports:Section1">
            <CollapsibleSection
              {...sectionProps('trend')}
              tone="persimmon"
              icon={<FontAwesome name="bar-chart" size={16} color="#A1370C" />}
            >
              {isSalesTrendLoading ? (
                <TrendSkeleton />
              ) : (
                <View>
                  <SimpleBarChart data={salesOverTime} height={200} />
                  {/* Perforation between chart and breakdown */}
                  <View className="mt-5 mb-3 border-b border-dashed border-ink-200" />
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
          </Prof>
        </View>

        {/* Top products */}
        <View className="px-5 mt-6">
          <Prof id="Reports:Section2">
            <CollapsibleSection
              {...sectionProps('top')}
              tone="cinnamon"
              icon={<FontAwesome name="trophy" size={16} color="#391C0A" />}
            >
              {isTopProductsLoading ? (
                <TopProductsSkeleton />
              ) : (
                <View>
                  <StyledText
                    variant="semibold"
                    className="text-sm text-ink-700 mb-3"
                  >
                    {t('common:reports.top.bySales')}
                  </StyledText>
                  <TopProductsList products={topProducts} />

                  <View className="my-4 h-px bg-ink-200" />

                  <View className="flex-row items-center justify-between mb-3">
                    <StyledText
                      variant="semibold"
                      className="text-sm text-ink-700"
                    >
                      {t('common:reports.top.mostProfit')}
                    </StyledText>
                    {kpis.grossProfit === null && (
                      <StyledText
                        variant="medium"
                        className="text-ink-500 text-xs"
                      >
                        {t('common:reports.top.addCost')}
                      </StyledText>
                    )}
                  </View>
                  <ProfitabilityRanking products={productProfitability} />
                </View>
              )}
            </CollapsibleSection>
          </Prof>
        </View>

        {/* Stock movement */}
        <View className="px-5 mt-6">
          <Prof id="Reports:Section3">
            <CollapsibleSection
              {...sectionProps('stock')}
              tone="sage"
              icon={<FontAwesome name="archive" size={16} color="#3D5E1B" />}
            >
              {isStockLoading ? (
                <StockSkeleton />
              ) : (
                <View>
                  <StockMovementDetails
                    itemsSold={inventoryMovement.itemsSold}
                    lowStockCount={inventoryMovement.lowStockCount}
                    outOfStockCount={inventoryMovement.outOfStockCount}
                    fastMoving={topProducts}
                    slowMoving={slowMovingProducts}
                  />

                  {/* Inventory value sub-block */}
                  <View className="mt-4 flex-row items-stretch border border-ink-200 rounded-xl overflow-hidden">
                    <View className="flex-1 p-3 border-r border-dashed border-ink-200 bg-cinnamon-50/40">
                      <StyledText
                        variant="semibold"
                        className="text-sm text-cinnamon-700 mb-1"
                      >
                        {t('common:reports.stock.atCost')}
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
                            {t('common:reports.stock.coverage', {
                              pct: Math.round(
                                inventoryValue.costCoverage * 100,
                              ),
                            })}
                          </StyledText>
                        )}
                    </View>
                    <View className="flex-1 p-3 bg-sage-50/40">
                      <StyledText
                        variant="semibold"
                        className="text-sm text-sage-700 mb-1"
                      >
                        {t('common:reports.stock.atRetail')}
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
                        {t('common:reports.stock.retailNote')}
                      </StyledText>
                    </View>
                  </View>

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
                          {t('common:reports.stock.lowStock', {
                            count: lowStockItems.length,
                          })}
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
                                : 'text-semantic-warning-700'
                            }`}
                          >
                            {t('common:reports.stock.left', {
                              count: item.quantity,
                            })}
                          </StyledText>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </CollapsibleSection>
          </Prof>
        </View>

        {/* Utang aging */}
        <View className="px-5 mt-6">
          <Prof id="Reports:Section4">
            <CollapsibleSection
              {...sectionProps('aging')}
              tone="cinnamon"
              icon={
                <FontAwesome name="hourglass-half" size={16} color="#391C0A" />
              }
            >
              {isCreditAgingLoading ? (
                <AgingSkeleton />
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
                        {t('common:reports.aging.given')}
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
                        {t('common:reports.aging.collected')}
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
          </Prof>
        </View>

        {/* Cash drawer history */}
        <View className="px-5 mt-6">
          <Prof id="Reports:Section5">
            <CollapsibleSection
              {...sectionProps('cashbook')}
              tone="cinnamon"
              icon={<FontAwesome name="book" size={16} color="#391C0A" />}
            >
              {sessionsQuery.isLoading ? (
                <SessionsSkeleton />
              ) : filteredSessions.length === 0 ? (
                <View className="bg-paper-50 rounded-xl border border-dashed border-ink-200 p-6 items-center">
                  <StyledText
                    variant="regular"
                    className="text-ink-500 text-sm"
                  >
                    {t('common:reports.cashbook.empty')}
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
          </Prof>
        </View>
      </RefreshableScrollView>

      <Sheet
        visible={explainKey !== null}
        onClose={() => setExplainKey(null)}
        title={t(EXPLAIN_TITLE[shownExplainKey])}
      >
        <View className="gap-y-3 pb-2">
          <StyledText
            variant="medium"
            className="text-base text-ink-800 leading-6"
          >
            {t(`common:reports.explain.${shownExplainKey}`)}
          </StyledText>
          {shownExplainKey === 'profit' && (
            <StyledText
              variant="medium"
              className="text-base text-ink-800 leading-6"
            >
              {t('common:reports.explain.flow')}
            </StyledText>
          )}
          <Pressable
            onPress={() => setExplainKey(null)}
            accessibilityRole="button"
            className="mt-2 h-12 rounded-xl bg-ink-900 items-center justify-center active:opacity-80"
          >
            <StyledText variant="extrabold" className="text-paper-50 text-base">
              {t('common:reports.explain.close')}
            </StyledText>
          </Pressable>
        </View>
      </Sheet>
    </View>
  );
}

function CashSessionRow({ session }: { session: CashSession }) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: entries = [], isLoading } = useCashEntries(
    isExpanded ? session.id : undefined,
  );

  return (
    <View className="mb-3 border border-ink-200 rounded-xl bg-paper-50 p-4">
      <Pressable
        onPress={() => setIsExpanded((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={t('common:reports.cashbook.sessionA11y', {
          date: session.businessDate,
        })}
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
                {t(`common:reports.cashbook.status.${session.status}`)}
              </StyledText>
            </View>
          </View>
          <View className="flex-row mt-1.5 gap-x-3 gap-y-1 flex-wrap">
            <StyledText variant="regular" className="text-xs text-ink-500">
              {t('common:reports.cashbook.opened', {
                amount: formatPesos(session.openingCash),
              })}
            </StyledText>
            {session.actualCash !== null && (
              <StyledText variant="regular" className="text-xs text-ink-500">
                {t('common:reports.cashbook.counted', {
                  amount: formatPesos(session.actualCash),
                })}
              </StyledText>
            )}
            {session.expectedCash !== null && (
              <StyledText variant="regular" className="text-xs text-ink-500">
                {t('common:reports.cashbook.expected', {
                  amount: formatPesos(session.expectedCash),
                })}
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
              {t('common:reports.cashbook.variance', {
                amount: `${session.variance >= 0 ? '+' : ''}${formatPesos(session.variance)}`,
              })}
            </StyledText>
          )}
        </View>

        <FontAwesome
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={12}
          color="#564E45"
        />
      </Pressable>

      {isExpanded && (
        <View className="mt-4 pt-3 border-t border-dashed border-ink-200">
          <StyledText variant="semibold" className="text-ink-600 text-xs mb-2">
            {t('common:reports.cashbook.movements', { count: entries.length })}
          </StyledText>
          {isLoading ? (
            <SessionsSkeleton />
          ) : entries.length === 0 ? (
            <StyledText
              variant="regular"
              className="text-ink-500 text-xs italic py-1"
            >
              {t('common:reports.cashbook.noMovements')}
            </StyledText>
          ) : (
            <View className="gap-y-1.5">
              {entries.map((entry) => {
                const isIn = entry.type === 'owner_addition';
                const tone = isIn ? 'text-sage-600' : 'text-semantic-danger';
                return (
                  <View
                    key={entry.id}
                    className="flex-row justify-between items-center py-1"
                  >
                    <View className="flex-1 mr-2 flex-row items-center gap-1.5 flex-wrap">
                      <StyledText
                        variant="semibold"
                        className={`text-xs ${tone}`}
                      >
                        {t(`common:reports.cashbook.type.${entry.type}`)}
                      </StyledText>
                      <StyledText
                        variant="regular"
                        className="text-xs text-ink-500"
                      >
                        {entry.notes}
                      </StyledText>
                    </View>
                    <StyledText variant="medium" className={`text-xs ${tone}`}>
                      {isIn ? '+' : '-'}
                      {formatPesos(entry.amount)}
                    </StyledText>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export default withProf(ReportsScreen, 'settings/reports');
