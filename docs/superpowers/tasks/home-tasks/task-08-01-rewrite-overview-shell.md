# Task 08-01: Rewrite home/index.tsx shell with error/empty gates and hero

> Parent Plan: [2026-08-01-home-tab-improv.md](../../plans/2026-08-01-home-tab-improv.md)
> Index: [00-task-index.md](./00-task-index.md)

## Goal

Replace `app/(tabs)/home/index.tsx` with the new single-column layout. This step installs the imports, the destination map, the loading skeleton gate, the error-state gate, the empty-state gate, and the slim total-sales hero. The KPI grid and below-the-fold sections are added in `task-08-02`.

## Dependencies

- [07-03](./task-07-03-verify-and-commit.md)

## Files

- Modify: `app/(tabs)/home/index.tsx`

## Steps

- [ ] **Step 1: Replace the file body**

Replace the entire file content with the shell below — placeholder JSX for the inner sections will be expanded in `task-08-02`:

```tsx
import { RefreshControl, ScrollView, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { StyledText } from '@/components/elements';
import {
  DashboardKPIGrid,
  DashboardGoalCard,
  DashboardQuickActions,
  DashboardRecentSales,
  DashboardStockAlert,
  DashboardSuggestions,
  DashboardEmptyState,
  DashboardErrorState,
  HomeOverviewSkeleton,
  MiniInsightsCard,
  HomeRecommendation,
  HomeDestination,
} from '@/components/home';
import { useHomeDashboardData } from '@/hooks/useHomeDashboardData';
import { useTabBarBottomOffset } from '@/components/layout';
import { formatCurrency } from '@/utils';

export default function OverviewScreen() {
  const router = useRouter();
  const tabBarBottomOffset = useTabBarBottomOffset();
  const {
    stats,
    products,
    recentSales,
    topProduct,
    currentSession,
    goal,
    suggestions,
    isError,
    isLoading,
    refreshing,
    refetchAll,
  } = useHomeDashboardData();

  if (isLoading) return <HomeOverviewSkeleton />;

  const handleGoalAction = (rec: HomeRecommendation) => {
    const map: Record<HomeRecommendation['destination'], Href> = {
      addProduct: '/(edit-forms)/add-product',
      inventory: '/inventory',
      utang: '/utang',
      cashSession: '/(edit-forms)/cash-session',
      newSale: '/(tabs)/sales/pos',
      reports: '/reports',
    };
    router.push(map[rec.destination] as Href);
  };

  const handleSuggestionPress = (destination: HomeDestination) => {
    const map: Record<HomeDestination, Href> = {
      addProduct: '/(edit-forms)/add-product',
      inventory: '/inventory',
      utang: '/utang',
      cashSession: '/(edit-forms)/cash-session',
      newSale: '/(tabs)/sales/pos',
      reports: '/reports',
    };
    router.push(map[destination] as Href);
  };

  return (
    <ScrollView
      className="flex-1 bg-paper-200"
      contentContainerStyle={{
        paddingTop: 8,
        paddingBottom: tabBarBottomOffset + 24,
      }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refetchAll}
          tintColor="#E85A1F"
          colors={['#E85A1F']}
        />
      }
    >
      {isError ? (
        <DashboardErrorState onRetry={refetchAll} />
      ) : products.length === 0 && stats.transactionCount === 0 ? (
        <DashboardEmptyState
          onAddProduct={() => router.push('/(edit-forms)/add-product' as Href)}
          onStartFirstSale={() => router.push('/(tabs)/sales/pos' as Href)}
        />
      ) : (
        <>
          {/* 1. Slim total-sales hero */}
          <View className="px-4 mb-5">
            <StyledText
              variant="extrabold"
              className="text-ink-500 text-xs tracking-wider uppercase"
            >
              TOTAL SALES TODAY
            </StyledText>
            <View className="flex-row items-baseline gap-3 mt-1.5">
              <StyledText variant="extrabold" className="text-ink-900 text-hero">
                {formatCurrency(stats.todaySalesTotal)}
              </StyledText>
            </View>
            <View className="flex-row items-center gap-2 mt-2">
              <StyledText variant="regular" className="text-ink-500 text-xs">
                {stats.transactionCount} transactions today
              </StyledText>
              <View className="bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                <StyledText variant="extrabold" className="text-emerald-800 text-[11px]">
                  RECORDED
                </StyledText>
              </View>
            </View>
          </View>

          {/* Sections 2–8 are added in task-08-02 */}
          <></>
        </>
      )}
    </ScrollView>
  );
}
```

This step ends with the screen compiling but rendering only the hero. `task-08-02` adds the rest.

## Commit

None yet — verification + commit happen in `task-08-03`.