import React, { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { StyledText } from '@/components/elements';
import { ValuationSummaryCard } from '@/components/inventory/ValuationSummaryCard';
import { InventoryHeroCard } from '@/components/inventory/InventoryHeroCard';
import { InventoryErrorState } from '@/components/inventory/InventoryErrorState';
import { useInventoryOverview } from '@/hooks/useInventoryOverview';
import { useChartPalette } from './useChartPalette';
import { useProducts } from '@/hooks/useProducts';
import { AnalyticsSkeleton } from './AnalyticsSkeleton';
import { ChartEmptyState } from './ChartEmptyState';

function formatPesos(n: number) {
  return `₱${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function AnalyticsCharts() {
  const { getAllProductsQuery } = useProducts();
  const overview = useInventoryOverview();

  if (overview.isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (overview.error) {
    return <InventoryErrorState onRetry={() => overview.refetch()} />;
  }

  const products = useMemo(
    () => getAllProductsQuery.data ?? [],
    [getAllProductsQuery.data],
  );
  const catPalette = useChartPalette('categorical');
  const valuePalette = useChartPalette('value');

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p: any) => {
      const k = p.category ?? 'Uncategorized';
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    const entries = Array.from(map.entries()).map(([name, count], i) => ({
      value: count,
      label: name,
      frontColor: catPalette[i % catPalette.length] ?? '#623418',
    }));
    return entries.sort((a, b) => b.value - a.value);
  }, [products, catPalette]);

  const byValue = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p: any) => {
      const k = p.category ?? 'Uncategorized';
      map.set(k, (map.get(k) ?? 0) + (p.price ?? 0) * (p.quantity ?? 0));
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value], i) => ({
        value,
        text: name,
        color: valuePalette[i % valuePalette.length] ?? '#E85A1F',
      }));
  }, [products, valuePalette]);

  const totals = useMemo(() => {
    let cost = 0;
    let retail = 0;
    for (const p of products) {
      cost += (p.cost_price ?? 0) * (p.quantity ?? 0);
      retail += (p.price ?? 0) * (p.quantity ?? 0);
    }
    return { cost, retail, profit: retail - cost };
  }, [products]);

  const categoryLabel = useMemo(() => {
    if (byCategory.length === 0) return '';
    const total = byCategory.reduce((s, c) => s + c.value, 0);
    return byCategory
      .map((c) => `${c.label}: ${c.value} of ${total}`)
      .join(', ');
  }, [byCategory]);

  const valueLabel = useMemo(() => {
    if (byValue.length === 0) return '';
    return byValue
      .map((c) => `${c.text}: ${formatPesos(c.value)}`)
      .join(', ');
  }, [byValue]);

  return (
    <ScrollView
      className="flex-1 bg-paper-50"
      contentContainerClassName="p-4 gap-y-4 pb-32"
    >
      <InventoryHeroCard
        totalValue={overview.totalValue ?? 0}
        productCount={overview.productCount ?? 0}
        unitCount={overview.unitCount ?? 0}
      />

      <ValuationSummaryCard
        totalCostValue={totals.cost}
        totalRetailValue={totals.retail}
        potentialProfit={totals.profit}
      />

      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={`Stock by category. ${categoryLabel}`}
        className="bg-paper-50 rounded-2xl p-4 border border-paper-300 gap-y-2"
      >
        <StyledText variant="extrabold" className="text-sm text-ink-900">
          Stock by Category
        </StyledText>
        {byCategory.length === 0 ? (
          <ChartEmptyState message="Add products to see category breakdown." />
        ) : (
          <>
            <BarChart data={byCategory} barWidth={28} spacing={12} hideRules />
            {byCategory[0] ? (
              <StyledText className="text-[11px] text-ink-500 mt-1">
                Top: {byCategory[0].label} · {byCategory[0].value} products
              </StyledText>
            ) : null}
          </>
        )}
      </View>

      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={`Stock value distribution. ${valueLabel}`}
        className="bg-paper-50 rounded-2xl p-4 border border-paper-300 gap-y-2"
      >
        <StyledText variant="extrabold" className="text-sm text-ink-900">
          Stock Value Distribution
        </StyledText>
        {byValue.length === 0 ? (
          <ChartEmptyState message="No value data yet." />
        ) : (
          <>
            <PieChart data={byValue} donut radius={80} innerRadius={48} />
            {byValue[0] ? (
              <StyledText className="text-[11px] text-ink-500 mt-1">
                Top: {byValue[0].text} · {formatPesos(byValue[0].value)}
              </StyledText>
            ) : null}
          </>
        )}
      </View>
    </ScrollView>
  );
}
