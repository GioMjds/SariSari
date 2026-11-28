import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui';
import {
  DEFAULT_CREDITS_OVERVIEW,
  DEFAULT_INVENTORY_MOVEMENT,
  DEFAULT_INVENTORY_VALUE,
  DEFAULT_SALES_BREAKDOWN,
} from '@/constants';
import {
  useAgingBuckets,
  useCreditsOverview,
  useInventoryMovement,
  useInventoryValue,
  useLowStockItems,
  useProductProfitability,
  useReportKPIs,
  useSalesBreakdown,
  useSalesOverTime,
  useSlowMovingProducts,
  useTopSellingProducts,
} from '@/hooks';
import type { DateRange } from '@/types';
import { FontAwesome } from '@expo/vector-icons';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { CreditAgingChart, StockMovementDetails } from './AgingBucketsChart';
import { PaymentSplitStrip } from './PaymentSplitStrip';
import { ProfitabilityRanking } from './ProfitabilityRanking';
import {
  AgingSkeleton,
  StockSkeleton,
  TopProductsSkeleton,
  TrendSkeleton,
} from './ReportsSkeletons';
import { SimpleBarChart } from './SimpleBarChart';
import { TopProductsList } from './TopProductsList';

// Each body owns its queries so a query settling re-renders only its section,
// and mounts only while its section is open.

type BodyProps = { dateRange: DateRange };

const EMPTY_ARRAY: never[] = [];

export const TrendBody = memo(function TrendBody({ dateRange }: BodyProps) {
  const salesOverTimeQuery = useSalesOverTime(dateRange);
  const salesBreakdownQuery = useSalesBreakdown(dateRange);
  const kpisQuery = useReportKPIs(dateRange);

  if (salesOverTimeQuery.isLoading || salesBreakdownQuery.isLoading) {
    return <TrendSkeleton />;
  }

  const salesBreakdown = salesBreakdownQuery.data ?? DEFAULT_SALES_BREAKDOWN;
  return (
    <View>
      <SimpleBarChart
        data={salesOverTimeQuery.data ?? EMPTY_ARRAY}
        height={200}
      />
      {/* Perforation between chart and breakdown */}
      <View className="mt-5 mb-3 border-b border-dashed border-ink-200" />
      <PaymentSplitStrip
        cash={salesBreakdown.cashSales}
        credit={salesBreakdown.creditSales}
        total={kpisQuery.data?.totalSales ?? 0}
        transactions={salesBreakdown.totalTransactions}
        avgTicket={salesBreakdown.averageTransactionValue}
      />
    </View>
  );
});

export const TopProductsBody = memo(function TopProductsBody({
  dateRange,
}: BodyProps) {
  const { t } = useTranslation();
  const topProductsQuery = useTopSellingProducts(dateRange, 5);
  const productProfitabilityQuery = useProductProfitability(dateRange, 10);
  const kpisQuery = useReportKPIs(dateRange);

  if (topProductsQuery.isLoading || productProfitabilityQuery.isLoading) {
    return <TopProductsSkeleton />;
  }

  return (
    <View>
      <StyledText variant="semibold" className="text-sm text-ink-700 mb-3">
        {t('common:reports.top.bySales')}
      </StyledText>
      <TopProductsList products={topProductsQuery.data ?? EMPTY_ARRAY} />

      <View className="my-4 h-px bg-ink-200" />

      <View className="flex-row items-center justify-between mb-3">
        <StyledText variant="semibold" className="text-sm text-ink-700">
          {t('common:reports.top.mostProfit')}
        </StyledText>
        {kpisQuery.data?.grossProfit === null && (
          <StyledText variant="medium" className="text-ink-500 text-xs">
            {t('common:reports.top.addCost')}
          </StyledText>
        )}
      </View>
      <ProfitabilityRanking
        products={productProfitabilityQuery.data ?? EMPTY_ARRAY}
      />
    </View>
  );
});

export const StockBody = memo(function StockBody({ dateRange }: BodyProps) {
  const { t } = useTranslation();
  const inventoryMovementQuery = useInventoryMovement(dateRange);
  const lowStockItemsQuery = useLowStockItems(10);
  const slowMovingProductsQuery = useSlowMovingProducts(dateRange, 5);
  const topProductsQuery = useTopSellingProducts(dateRange, 5);
  const inventoryValueQuery = useInventoryValue();

  if (
    inventoryMovementQuery.isLoading ||
    lowStockItemsQuery.isLoading ||
    slowMovingProductsQuery.isLoading ||
    topProductsQuery.isLoading
  ) {
    return <StockSkeleton />;
  }

  const inventoryMovement =
    inventoryMovementQuery.data ?? DEFAULT_INVENTORY_MOVEMENT;
  const inventoryValue = inventoryValueQuery.data ?? DEFAULT_INVENTORY_VALUE;
  const lowStockItems = lowStockItemsQuery.data ?? EMPTY_ARRAY;

  return (
    <View>
      <StockMovementDetails
        itemsSold={inventoryMovement.itemsSold}
        lowStockCount={inventoryMovement.lowStockCount}
        outOfStockCount={inventoryMovement.outOfStockCount}
        fastMoving={topProductsQuery.data ?? EMPTY_ARRAY}
        slowMoving={slowMovingProductsQuery.data ?? EMPTY_ARRAY}
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
                  pct: Math.round(inventoryValue.costCoverage * 100),
                })}
              </StyledText>
            )}
        </View>
        <View className="flex-1 p-3 bg-sage-50/40">
          <StyledText variant="semibold" className="text-sm text-sage-700 mb-1">
            {t('common:reports.stock.atRetail')}
          </StyledText>
          <MoneyText
            value={inventoryValue.potentialSalesValue}
            size="md"
            variant="success"
            className="text-sm"
          />
          <StyledText variant="medium" className="text-ink-500 text-xs mt-1">
            {t('common:reports.stock.retailNote')}
          </StyledText>
        </View>
      </View>

      {lowStockItems.length > 0 && (
        <View className="mt-4 rounded-xl border border-semantic-warning p-3 bg-semantic-warning-50">
          <View className="flex-row items-center mb-2">
            <View className="w-6 h-6 rounded-full bg-semantic-warning items-center justify-center mr-2">
              <FontAwesome name="exclamation" size={12} color="#FBF7EE" />
            </View>
            <StyledText variant="extrabold" className="text-sm text-ink-900">
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
                {t('common:reports.stock.left', { count: item.quantity })}
              </StyledText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
});

export const AgingBody = memo(function AgingBody({ dateRange }: BodyProps) {
  const { t } = useTranslation();
  const agingBucketsQuery = useAgingBuckets();
  const creditsOverview =
    useCreditsOverview(dateRange).data ?? DEFAULT_CREDITS_OVERVIEW;

  if (agingBucketsQuery.isLoading) return <AgingSkeleton />;

  return (
    <View>
      <CreditAgingChart
        buckets={agingBucketsQuery.data ?? EMPTY_ARRAY}
        totalOutstanding={creditsOverview.outstanding}
      />
      <View className="mt-4 flex-row gap-3">
        <View className="flex-1 p-3 border border-ink-200 rounded-xl bg-semantic-danger-50/30">
          <StyledText variant="semibold" className="text-sm text-ink-700">
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
          <StyledText variant="semibold" className="text-sm text-ink-700">
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
  );
});
