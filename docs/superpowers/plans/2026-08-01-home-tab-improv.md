# Home Tab Improv Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Alerts sub-tab from Home, slim the Overview into a single at-a-glance column that revives the unused `DashboardGoalCard`, `DashboardStockAlert`, `DashboardSuggestions`, `DashboardEmptyState`, `DashboardErrorState` (and an updated `HomeOverviewSkeleton`), slim the Today sub-tab to just the hourly timeline + transaction log with pull-to-refresh, and fix the hardcoded `profitMargin: 912` bug in `useHomeDashboardData`.

**Architecture:** The plan keeps `useHomeDashboardData` as the single hook feeding both Overview and Today. We extend its return shape with `goal: HomeRecommendation` and `suggestions: HomeRecommendation[]` (computed via the existing `resolveHomeState` from `home-state.ts`), and change `profitMargin` from a hardcoded `912` to `number | null` sourced from `useReportKPIs(todayRange).data?.totalProfit`. The Overview screen is rewritten as one `<ScrollView>` whose children render in fixed top-to-bottom order with conditional `<>` wrappers for the optional sections (StockAlert, Suggestions). The Alerts sub-tab, `AlertCardItem`, `AlertFilterPills`, and `HomeAlertsSkeleton` are deleted. The Today screen drops `SalesTargetCard` and `CashSessionCard` from its render tree and gains a `RefreshControl` wrapping. The bell → NotificationSheet → "See all" target changes from `/home/alerts` to `/reports`. No new components, no new hooks, no DB migrations.

**Tech Stack:** React Native 0.81, Expo 54, expo-router 6 (`useRouter`, `usePathname`), TanStack Query 5, existing `useReportKPIs` (`hooks/useReports.tsx`), existing `resolveHomeState` (`components/home/home-state.ts`), `@testing-library/react-native`, Jest.

## Global Constraints

- No emoji in code or comments (CLAUDE.md). Use `FontAwesome` icons.
- Touch targets min `44x44 px` (`min-h-[44px]`).
- Brand palette only: `paper-*`, `ink-*`, `cinnamon-*`, `persimmon-*`, `sage-*`, plus semantic `amber-*`, `rose-*`, `semantic-*`. No new colors.
- All strings use i18n `t(...)` with `defaultValue` fallbacks (matches `DashboardQuickActions`).
- React Query mutations must `invalidateQueries` on success (matches existing patterns).
- Tab routes use existing `TopTabs` config (`swipeEnabled: true, lazy: true, lazyPreloadDistance: 0`).
- Don't auto-push any branch (CLAUDE.md). Commit incrementally; user reviews and pushes.
- Tests live under `tests/` and follow the existing `@testing-library/react-native` + manual jest-mock pattern. No new test deps.
- File paths with parens (e.g. `app/(tabs)/home/index.tsx`) require escaping in shell commands.

---

## File Map

```
app/(tabs)/home/
  _layout.tsx                       [modify — render 2 sub-tabs, simplify getCurrentTab]
  index.tsx                         [rewrite — single-column layout, gate on error/empty]
  today.tsx                         [modify — drop SalesTargetCard + CashSessionCard, add RefreshControl]
  alerts.tsx                        [DELETE]

constants/
  tabs.ts                           [modify — narrow HOME_SUB_TABS + HomeSubTab]

components/home/
  DashboardHeader.tsx               [modify — narrow tabs to index + today]
  DashboardKPIGrid.tsx              [modify — drop hero, accept profitMargin: number | null, render "—"]
  AlertCardItem.tsx                 [DELETE]
  AlertFilterPills.tsx              [DELETE]
  HomeAlertsSkeleton.tsx            [DELETE]
  HomeOverviewSkeleton.tsx          [modify — extend layout array for new sections]
  index.ts                          [modify — remove deleted exports, add SuggestedDestinationMapper if needed]

components/layout/
  StoreHeader.tsx                   [modify — handleSeeAll routes to /reports]

hooks/
  useHomeDashboardData.ts           [modify — fix profitMargin, expose goal + suggestions + isError]
```

---

## Task 01: Narrow HOME_SUB_TABS const and HomeSubTab type

**Files:**

- Modify: `constants/tabs.ts:66,82`

**Interfaces:**

- Consumes: existing `HOME_SUB_TABS` and `HomeSubTab` types. Downstream consumers (`DashboardHeader`, `home/_layout.tsx`) still reference `'alerts'` everywhere.
- Produces: `HOME_SUB_TABS = ['overview', 'today'] as const` and `HomeSubTab = 'overview' | 'today'`. Task 02 updates the two consumers.

- [ ] **Step 1: Open `constants/tabs.ts` and locate lines 66 and 82**

Both lines define:

```ts
// line 66
export const HOME_SUB_TABS = ['overview', 'today', 'alerts'] as const;

// line 82
export type HomeSubTab = (typeof HOME_SUB_TABS)[number];
```

- [ ] **Step 2: Replace `'alerts'` with removal**

In `HOME_SUB_TABS`:

```ts
export const HOME_SUB_TABS = ['overview', 'today'] as const;
```

`HomeSubTab` follows automatically since it's derived from `HOME_SUB_TABS`.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit -p .`
Expected: errors in `DashboardHeader.tsx` and `home/_layout.tsx` (each references `'alerts'`). Those are fixed in Task 02 and Task 03. No new errors anywhere else.

- [ ] **Step 4: Commit**

```bash
git add constants/tabs.ts
git commit -m "feat(home): narrow HOME_SUB_TABS to overview and today"
```

---

## Task 02: Update `DashboardHeader` to render 2 tabs

**Files:**

- Modify: `components/home/DashboardHeader.tsx:7,28-32`

**Interfaces:**

- Consumes: narrowed `HomeSubTab` from Task 01 (`'overview' | 'today'`).
- Produces: `tabs` array drops the `'alerts'` entry. `HomeSubTab` import reflects the narrower union.

- [ ] **Step 1: Locate the `HomeSubTab` type and the `tabs` array**

At the top:

```ts
export type HomeSubTab = 'index' | 'today' | 'alerts';
```

Inside the component body:

```ts
const tabs = [
  { key: 'index', label: 'Overview', icon: 'th-large' },
  { key: 'today', label: 'Today', icon: 'calendar' },
  { key: 'alerts', label: 'Alerts', icon: 'bell', badgeCount: alertCount },
] satisfies SubTabItem<HomeSubTab>[];
```

- [ ] **Step 2: Replace the type**

```ts
export type HomeSubTab = 'index' | 'today';
```

- [ ] **Step 3: Remove the `'alerts'` entry**

```ts
const tabs = [
  { key: 'index', label: 'Overview', icon: 'th-large' },
  { key: 'today', label: 'Today', icon: 'calendar' },
] satisfies SubTabItem<HomeSubTab>[];
```

The `alertCount` prop becomes unused. Keep accepting it on the props interface for now (Task 03 may still pass it from `_layout.tsx`; we'll strip it together).

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit -p .`
Expected: errors only in `app/(tabs)/home/_layout.tsx` (still uses `'alerts'`). Task 03 fixes.

- [ ] **Step 5: Commit**

```bash
git add components/home/DashboardHeader.tsx
git commit -m "feat(home): drop alerts tab from dashboard header"
```

---

## Task 03: Simplify `home/_layout.tsx` to render 2 sub-tabs

**Files:**

- Modify: `app/(tabs)/home/_layout.tsx:22-26,36-38,60-62`

**Interfaces:**

- Consumes: narrowed `HomeSubTab` and updated `DashboardHeader` (Task 02).
- Produces: `getCurrentTab` no longer branches on `'alerts'`. `handleNotificationPress` is removed (the bell now stays in `StoreHeader`, which Task 11 re-targets). `TopTabs.Screen` list drops `alerts`. `DashboardHeader` props shrink to remove `onNotificationPress` and `alertCount`.

- [ ] **Step 1: Simplify `getCurrentTab`**

Replace:

```ts
const getCurrentTab = (): HomeSubTab => {
  if (pathname.includes('today')) return 'today';
  if (pathname.includes('alerts')) return 'alerts';
  return 'index';
};
```

with:

```ts
const getCurrentTab = (): HomeSubTab => {
  if (pathname.includes('today')) return 'today';
  return 'index';
};
```

- [ ] **Step 2: Remove the unused `handleNotificationPress` callback**

Delete this block:

```ts
const handleNotificationPress = () => {
  router.push('/(tabs)/home/alerts' as Href);
};
```

- [ ] **Step 3: Drop `alerts` from `TopTabs.Screen` list**

Replace:

```tsx
<TopTabs.Screen name="index" />
<TopTabs.Screen name="today" />
<TopTabs.Screen name="alerts" />
```

with:

```tsx
<TopTabs.Screen name="index" />
<TopTabs.Screen name="today" />
```

- [ ] **Step 4: Drop `alertCount` and `onNotificationPress` from `<DashboardHeader>`**

Replace the entire `<DashboardHeader ...>` block with:

```tsx
<DashboardHeader
  storeName={storeName || ''}
  ownerInitials={ownerInitials || ''}
  activeTab={getCurrentTab()}
  alertCount={0}
  showTopHeader={false}
  onTabPress={handleTabPress}
/>
```

(`alertCount` is kept as `0` for prop-shape compatibility; Task 04 strips the prop from `DashboardHeader` once nothing else passes it.)

- [ ] **Step 5: Drop the now-unused imports**

The `useHomeDashboardData` import is still used for `profile` and `ownerName`, so keep it. `usePathname` and `useRouter` are still in use. No import changes.

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit -p .`
Expected: clean. (If `DashboardHeader` props include `onNotificationPress?` as optional, the missing prop is fine; we strip it in Task 04.)

- [ ] **Step 7: Commit**

```bash
git add "app/(tabs)/home/_layout.tsx"
git commit -m "feat(home): render 2 sub-tabs in home layout"
```

---

## Task 04: Strip `alertCount` and `onNotificationPress` props from `DashboardHeader`

**Files:**

- Modify: `components/home/DashboardHeader.tsx:9-21`

**Interfaces:**

- Consumes: nothing from earlier tasks.
- Produces: `DashboardHeaderProps` no longer includes `alertCount` or `onNotificationPress`. This forces the only consumer (`app/(tabs)/home/_layout.tsx`) to drop those props in Task 03's Step 4 — if you skipped it, do it now.

- [ ] **Step 1: Replace the `DashboardHeaderProps` interface**

Replace:

```ts
export interface DashboardHeaderProps {
  storeName: string;
  ownerInitials: string;
  activeTab: HomeSubTab;
  alertCount: number;
  showTopHeader: boolean;
  onTabPress: (tab: HomeSubTab) => void;
  onNotificationPress?: () => void;
}
```

with:

```ts
export interface DashboardHeaderProps {
  storeName: string;
  ownerInitials: string;
  activeTab: HomeSubTab;
  showTopHeader: boolean;
  onTabPress: (tab: HomeSubTab) => void;
}
```

- [ ] **Step 2: Remove the bell + handlers from inside the component**

Delete the entire `handleNotificationSelect` function (lines 34-37) and the `<Pressable>` bell block (lines 67-79). The `Header` collapses to:

```tsx
return (
  <View className="bg-paper-200 px-4 pt-1 pb-3">
    {showTopHeader && (
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center flex-1 mr-2">
          <View className="w-10 h-10 rounded-full bg-cinnamon-500 items-center justify-center mr-3 shadow-sm">
            <StyledText variant="extrabold" className="text-paper-50 text-base">
              {ownerInitials}
            </StyledText>
          </View>
          <View className="flex-1">
            <StyledText variant="extrabold" className="text-ink-900 text-lg" numberOfLines={1}>
              {storeName}
            </StyledText>
          </View>
        </View>
      </View>
    )}
    <SubTabControl tabs={tabs} activeTab={activeTab} onTabPress={onTabPress} containerClassName="mb-0" />
  </View>
);
```

- [ ] **Step 3: Remove unused imports**

Delete the `Pressable` import from `react-native` and the `FontAwesome5` import from `@expo/vector-icons` if no longer used. `Haptics` is only used inside the deleted handler — drop it too. Keep `StyledText` and `SubTabControl`.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit -p .`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add components/home/DashboardHeader.tsx
git commit -m "refactor(home): remove bell from dashboard header"
```

---

## Task 05: Re-route `StoreHeader.handleSeeAll` to `/reports`

**Files:**

- Modify: `components/layout/StoreHeader.tsx:45-48`

**Interfaces:**

- Consumes: nothing.
- Produces: The "See all alerts" CTA inside `NotificationSheet` navigates to `/reports` instead of the (deleted) `/home/alerts`.

- [ ] **Step 1: Replace the `handleSeeAll` callback body**

Replace:

```ts
const handleSeeAll = useCallback(() => {
  setSheetVisible(false);
  router.push('/(tabs)/home/alerts' as Href);
}, [router]);
```

with:

```ts
const handleSeeAll = useCallback(() => {
  setSheetVisible(false);
  router.push('/reports' as Href);
}, [router]);
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit -p .`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add components/layout/StoreHeader.tsx
git commit -m "feat(home): route notification 'see all' to reports tab"
```

---

## Task 06: Extend `useHomeDashboardData` with `goal`, `suggestions`, `isError`, and real `profitMargin`

**Files:**

- Modify: `hooks/useHomeDashboardData.ts`

**Interfaces:**

- Consumes: existing imports + `resolveHomeState`, `HomeRecommendation`, `HomeStateInput` from `components/home/home-state`, and `useReportKPIs`, `getDateRangeFromType` from `@/hooks` and `@/utils`.
- Produces: the hook's return shape changes:
  - `stats.profitMargin: number | null` (was `912` literal).
  - new `goal: HomeRecommendation`.
  - new `suggestions: HomeRecommendation[]`.
  - new `isError: boolean` (any underlying query errored).

- [ ] **Step 1: Add new imports at the top**

Replace the existing import block (lines 1-10) with:

```ts
import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentSession } from './useCash';
import { useCreditKPIs, useCustomers } from './useCredits';
import { useProducts } from './useProducts';
import { useRecentSales, useSales } from './useSales';
import { useProfile } from './useProfile';
import { useReports } from './useReports';
import { getDateRangeFromType } from '@/utils';
import { groupSalesByHour, HourlySalesGroup } from '@/utils';
import { SaleWithItems } from '@/types/sales.types';
import { formatPesos } from '@/lib/money';
import { HomeRecommendation, resolveHomeState } from '@/components/home/home-state';
```

- [ ] **Step 2: Replace the `stats.profitMargin: 912` literal**

Inside the `useMemo` for the returned object, the `profitMargin` field currently reads `912`. Replace it with a real value from `useReportKPIs`:

Inside the hook body, after the existing `useProducts` and `useSales` calls, add:

```ts
const todayRange = useMemo(() => getDateRangeFromType('today'), []);
const { data: todayKpis } = useReports();
const profitMargin: number | null = useMemo(() => {
  const kpis = todayKpis?.data; // not used directly; placeholder for the bound kpis fetch
  return null; // replaced below
}, [todayKpis]);
```

Actually, since `useReports` returns a bag of hooks (not just `useReportKPIs`), use the explicit `useReportKPIs` directly:

```ts
import { useReportKPIs } from './useReports';

// inside the hook body:
const todayRange = useMemo(() => getDateRangeFromType('today'), []);
const { data: todayKpisData } = useReportKPIs(todayRange);
const profitMargin: number | null = useMemo(() => {
  return todayKpisData?.totalProfit ?? null;
}, [todayKpisData]);
```

Drop the placeholder `useReports()` and `todayKpis` block above; they're not needed.

Now replace the `profitMargin: 912` line in the returned `stats` object with:

```ts
profitMargin,
```

- [ ] **Step 3: Compute `goal` and `suggestions`**

Inside the hook body, after the `profitMargin` memo:

```ts
const goal = useMemo<HomeRecommendation>(() => {
  const state = resolveHomeState({
    productQuantities: (products ?? []).map((p: any) => p.quantity ?? 0),
    hasAnySales: (stats?.transaction_count ?? 0) > 0,
    overdueCount: creditKpis?.overdueCount ?? 0,
    cashSession: currentSession
      ? {
          status: currentSession.status === 'closed' ? 'closed' : 'open',
          variance: currentSession.variance ?? null,
        }
      : null,
    hour: new Date().getHours(),
  });
  return state.goal;
}, [products, stats, creditKpis, currentSession]);

const suggestions = useMemo<HomeRecommendation[]>(() => {
  const state = resolveHomeState({
    productQuantities: (products ?? []).map((p: any) => p.quantity ?? 0),
    hasAnySales: (stats?.transaction_count ?? 0) > 0,
    overdueCount: creditKpis?.overdueCount ?? 0,
    cashSession: currentSession
      ? {
          status: currentSession.status === 'closed' ? 'closed' : 'open',
          variance: currentSession.variance ?? null,
        }
      : null,
    hour: new Date().getHours(),
  });
  return state.suggestions;
}, [products, stats, creditKpis, currentSession]);
```

Refactor to avoid duplication by extracting a single memoized input:

```ts
const homeStateInput = useMemo(
  () => ({
    productQuantities: (products ?? []).map((p: any) => p.quantity ?? 0),
    hasAnySales: (stats?.transaction_count ?? 0) > 0,
    overdueCount: creditKpis?.overdueCount ?? 0,
    cashSession: currentSession
      ? {
          status: (currentSession.status === 'closed' ? 'closed' : 'open') as
            | 'open'
            | 'closed',
          variance: currentSession.variance ?? null,
        }
      : null,
    hour: new Date().getHours(),
  }),
  [products, stats, creditKpis, currentSession],
);

const { goal, suggestions } = useMemo(
  () => resolveHomeState(homeStateInput),
  [homeStateInput],
);
```

- [ ] **Step 4: Compute `isError`**

After the existing `isLoading` aggregation:

```ts
const isError =
  getTodayStatsQuery.error != null ||
  getAllProductsQuery.error != null ||
  recentLoading ||
  creditKpisLoading ||
  customersLoading ||
  sessionLoading ||
  profileLoading ||
  todayKpisData === undefined;
```

Actually a cleaner formulation uses the underlying query booleans:

```ts
const isError =
  !!getTodayStatsQuery.error ||
  !!getAllProductsQuery.error ||
  !!recentSalesData === false && recentLoading === false; // no-op fallback
```

The pragmatic version:

```ts
const isError =
  !!getTodayStatsQuery.error ||
  !!getAllProductsQuery.error ||
  !!creditKpis === false && !creditKpisLoading;
```

Simplify to:

```ts
const isError =
  !!getTodayStatsQuery.error ||
  !!getAllProductsQuery.error ||
  (creditKpis === undefined && !creditKpisLoading);
```

`recentSales` returning empty is not an error; only the underlying server failures count.

- [ ] **Step 5: Update the return shape**

Add `goal`, `suggestions`, and `isError` to the returned object alongside the existing fields:

```ts
return {
  stats: {
    todaySalesTotal: stats?.total ?? 0,
    transactionCount: stats?.transaction_count ?? 0,
    profitMargin,
    lowStockCount: lowStockProducts.length,
    overdueCount: creditKpis?.overdueCount ?? 0,
    overdueAmount: creditKpis?.totalOverdueAmount ?? 0,
  },
  products: products ?? [],
  recentSales,
  hourlySales,
  topProduct,
  alerts,
  alertCount: alerts.length,
  goal,
  suggestions,
  isError,
  profile,
  currentSession,
  isLoading:
    statsLoading ||
    productsLoading ||
    sessionLoading ||
    profileLoading ||
    recentLoading ||
    creditKpisLoading ||
    customersLoading,
  refreshing,
  refetchAll,
};
```

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit -p .`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add hooks/useHomeDashboardData.ts
git commit -m "feat(home): expose goal, suggestions, isError, real profitMargin"
```

---

## Task 07: Update `DashboardKPIGrid` to drop hero and accept nullable profit

**Files:**

- Modify: `components/home/DashboardKPIGrid.tsx`

**Interfaces:**

- Consumes: `profitMargin: number | null` from the parent (Task 06).
- Produces: The internal Total-Sales hero block is removed. The KPI tile for "Est. Profit" renders "—" when `profitMargin === null`.

- [ ] **Step 1: Update the prop type**

Replace:

```ts
export interface DashboardKPIGridProps {
  totalSales: number;
  transactionCount: number;
  profitMargin: number;
  ...
}
```

with:

```ts
export interface DashboardKPIGridProps {
  totalSales: number;
  transactionCount: number;
  profitMargin: number | null;
  ...
}
```

- [ ] **Step 2: Render "—" when profitMargin is null**

Inside the `kpis` array, the "EST. PROFIT" entry currently does:

```ts
value: formatCurrency(profitMargin),
```

Replace with:

```ts
value: profitMargin === null ? '—' : formatCurrency(profitMargin),
```

- [ ] **Step 3: Remove the hero block (lines 91-119)**

Delete the entire `<View className="px-4 mb-5"> ... </View>` block that renders `TOTAL SALES TODAY`, the hero number, the transaction count, and the RECORDED badge. This block is replaced by a new component in Task 08.

- [ ] **Step 4: Remove the `STORE SUMMARY` header section (lines 121-139)**

Delete the `<View className="px-4 flex-row items-center justify-between mb-3"> ... </View>` block. Its "Details >" affordance will move to the new hero in Task 08.

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit -p .`
Expected: errors only in `app/(tabs)/home/index.tsx` (it imports the old prop names). Task 08 fixes.

- [ ] **Step 6: Commit**

```bash
git add components/home/DashboardKPIGrid.tsx
git commit -m "refactor(home): slim DashboardKPIGrid to 2x2 only"
```

---

## Task 08: Rewrite `app/(tabs)/home/index.tsx` to the new single-column layout

**Files:**

- Modify: `app/(tabs)/home/index.tsx`

**Interfaces:**

- Consumes: extended `useHomeDashboardData` (Task 06) returning `goal`, `suggestions`, `isError`, `profitMargin: number | null`. Updated `DashboardKPIGrid` (Task 07).
- Produces: a single `<ScrollView>` rendering (in order):
  1. Slim total-sales hero (inline JSX)
  2. `<DashboardKPIGrid>`
  3. `<DashboardGoalCard recommendation={goal} onPress={...} />`
  4. `<DashboardStockAlert lowStockCount={...} onRestock={...} />` (conditional)
  5. `<DashboardQuickActions>`
  6. `<DashboardSuggestions suggestions={suggestions} onPress={...} />` (conditional — only when `suggestions.length > 0`)
  7. `<DashboardRecentSales>`
  8. `<MiniInsightsCard>`

- [ ] **Step 1: Replace the file body**

Replace the entire file content with:

```tsx
import { RefreshControl, ScrollView, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
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
      {/* Error state — full-screen fallback */}
      {isError ? (
        <DashboardErrorState onRetry={refetchAll} />
      ) : (
        <>
          {/* Empty state — zero products + zero sales */}
          {products.length === 0 && stats.transactionCount === 0 ? (
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

              {/* 2. KPI 2x2 grid */}
              <DashboardKPIGrid
                totalSales={stats.todaySalesTotal}
                transactionCount={stats.transactionCount}
                profitMargin={stats.profitMargin}
                cashSessionStatus={
                  currentSession?.status === 'closed' ? 'Closed' : 'Open'
                }
                startingFloat={
                  currentSession?.startingFloat
                    ? currentSession.startingFloat / 100
                    : 500
                }
                lowStockCount={stats.lowStockCount}
                totalCredits={stats.overdueAmount}
                creditCustomersCount={stats.overdueCount}
                onDetailsPress={() => router.push('/reports' as Href)}
                onKpiPress={(target) => {
                  if (target === 'inventory') router.push('/inventory' as Href);
                  else if (target === 'utang') router.push('/utang' as Href);
                  else if (target === 'cash')
                    router.push('/(edit-forms)/cash-session' as Href);
                  else router.push('/reports' as Href);
                }}
              />

              {/* 3. GoalCard */}
              <DashboardGoalCard
                recommendation={goal}
                onPress={() => handleGoalAction(goal)}
              />

              {/* 4. StockAlert (conditional) */}
              {stats.lowStockCount > 0 && (
                <DashboardStockAlert
                  lowStockCount={stats.lowStockCount}
                  onRestock={() => router.push('/inventory' as Href)}
                />
              )}

              {/* 5. Quick Actions */}
              <DashboardQuickActions
                onNewSale={() => router.push('/(tabs)/sales/pos' as Href)}
                onAddProduct={() => router.push('/(edit-forms)/add-product' as any)}
                onAddStock={() => router.push('/inventory' as Href)}
                onOpenCredits={() => router.push('/utang' as Href)}
                onOpenReports={() => router.push('/reports' as Href)}
                overdueCount={stats.overdueCount}
              />

              {/* 6. Suggestions (conditional — already filtered by resolveHomeState) */}
              {suggestions.length > 0 && (
                <DashboardSuggestions
                  suggestions={suggestions}
                  onPress={handleSuggestionPress}
                />
              )}

              {/* 7. Recent Activity */}
              <DashboardRecentSales
                sales={recentSales}
                onOpenSale={(id) =>
                  router.push(`/(edit-forms)/sale-details/${id}` as Href)
                }
                onSeeAll={() => router.push('/sales' as Href)}
              />

              {/* 8. Top Seller */}
              <MiniInsightsCard
                topProductName={topProduct.name}
                unitsSold={topProduct.unitsSold}
              />
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}
```

Add `StyledText` to the import list:

```ts
import { StyledText } from '@/components/elements';
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit -p .`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add "app/(tabs)/home/index.tsx"
git commit -m "feat(home): rewrite overview as single-column at-a-glance"
```

---

## Task 09: Slim `home/today.tsx` and add `RefreshControl`

**Files:**

- Modify: `app/(tabs)/home/today.tsx`

**Interfaces:**

- Consumes: existing `useHomeDashboardData`.
- Produces: `SalesTargetCard` and `CashSessionCard` removed from the render tree. A `RefreshControl` wraps the `<ScrollView>`.

- [ ] **Step 1: Update imports**

Replace the import block:

```tsx
import {
  SalesTargetCard,
  CashSessionCard,
  HourlySalesTimeline,
  TodayTransactionLog,
  TodaySnapshotSkeleton,
} from '@/components/home';
```

with:

```tsx
import {
  HourlySalesTimeline,
  TodayTransactionLog,
  TodaySnapshotSkeleton,
} from '@/components/home';
```

Add `RefreshControl` to the `react-native` import:

```tsx
import { RefreshControl, ScrollView } from 'react-native';
```

- [ ] **Step 2: Pull `refreshing` and `refetchAll` from the hook**

Inside `TodayScreen`, expand the destructure:

```tsx
const {
  stats,
  currentSession,
  isLoading,
  hourlySales,
  recentSales,
  refreshing,
  refetchAll,
} = useHomeDashboardData();
```

(`currentSession` and `stats` are unused after removing `CashSessionCard` and `SalesTargetCard`. Drop them from the destructure to keep the lint clean:)

```tsx
const { hourlySales, recentSales, isLoading, refreshing, refetchAll } =
  useHomeDashboardData();
```

- [ ] **Step 3: Replace the render tree**

Replace the entire `return` statement with:

```tsx
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
    <HourlySalesTimeline hourlyData={hourlySales} />
    <TodayTransactionLog
      sales={recentSales}
      onOpenSale={(id) =>
        router.push(`/(edit-forms)/sale-details/${id}` as Href)
      }
      onSeeAll={() => router.push('/sales' as Href)}
    />
  </ScrollView>
);
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit -p .`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add "app/(tabs)/home/today.tsx"
git commit -m "refactor(home): slim today tab to timeline and transaction log"
```

---

## Task 10: Update `HomeOverviewSkeleton` layout to match new sections

**Files:**

- Modify: `components/home/HomeOverviewSkeleton.tsx`

**Interfaces:**

- Consumes: nothing.
- Produces: the skeleton layout array has 8 slots (one per Overview section) instead of 4, with heights that match the live section heights.

- [ ] **Step 1: Replace the `layout` array**

Inside `HomeOverviewSkeleton()`, replace:

```ts
const layout: SkeletonLayout = [
  {
    key: 'hero-kpi-card',
    width: '100%',
    height: 250,
    borderRadius: 24,
    marginBottom: 16,
  },
  {
    key: 'quick-actions-card',
    width: '100%',
    height: 180,
    borderRadius: 24,
    marginBottom: 16,
  },
  {
    key: 'recent-sales-card',
    width: '100%',
    height: 180,
    borderRadius: 24,
    marginBottom: 16,
  },
  {
    key: 'mini-insights-card',
    width: '100%',
    height: 76,
    borderRadius: 20,
    marginBottom: 16,
  },
];
```

with:

```ts
const layout: SkeletonLayout = [
  {
    key: 'hero-kpi-card',
    width: '100%',
    height: 110,
    borderRadius: 16,
    marginBottom: 12,
  },
  {
    key: 'kpi-grid',
    width: '100%',
    height: 220,
    borderRadius: 20,
    marginBottom: 12,
  },
  {
    key: 'goal-card',
    width: '100%',
    height: 160,
    borderRadius: 20,
    marginBottom: 12,
  },
  {
    key: 'quick-actions-card',
    width: '100%',
    height: 180,
    borderRadius: 20,
    marginBottom: 12,
  },
  {
    key: 'suggestions-card',
    width: '100%',
    height: 56,
    borderRadius: 14,
    marginBottom: 12,
  },
  {
    key: 'recent-sales-card',
    width: '100%',
    height: 220,
    borderRadius: 20,
    marginBottom: 12,
  },
  {
    key: 'mini-insights-card',
    width: '100%',
    height: 76,
    borderRadius: 20,
    marginBottom: 16,
  },
];
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit -p .`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add components/home/HomeOverviewSkeleton.tsx
git commit -m "feat(home): expand skeleton layout to match new sections"
```

---

## Task 11: Delete Alerts sub-tab and unused components

**Files:**

- Delete: `app/(tabs)/home/alerts.tsx`
- Delete: `components/home/AlertCardItem.tsx`
- Delete: `components/home/AlertFilterPills.tsx`
- Delete: `components/home/HomeAlertsSkeleton.tsx`
- Modify: `components/home/index.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: those files no longer exist. `components/home/index.ts` no longer re-exports them.

- [ ] **Step 1: Verify no remaining importers**

Run: `grep -rn "AlertCardItem\|AlertFilterPills\|HomeAlertsSkeleton\|alerts.tsx\|home/alerts" app/ components/ hooks/`
Expected: zero hits outside the files we are about to delete and the index file.

If any hits remain (other than the files being deleted), fix those imports before proceeding.

- [ ] **Step 2: Delete the four files**

```bash
rm "app/(tabs)/home/alerts.tsx" components/home/AlertCardItem.tsx components/home/AlertFilterPills.tsx components/home/HomeAlertsSkeleton.tsx
```

- [ ] **Step 3: Remove the exports from `components/home/index.ts`**

In `components/home/index.ts`, delete these three lines:

```ts
export * from './AlertCardItem';
export * from './AlertFilterPills';
export * from './HomeAlertsSkeleton';
```

The file should retain exports for the now-revived components (`DashboardGoalCard`, `DashboardSuggestions`, `DashboardStockAlert`, `DashboardEmptyState`, `DashboardErrorState`) and the existing live ones. Verify by reading:

```ts
export * from './home-state';
export * from './DashboardContextHeader';
export * from './DashboardGoalCard';
export * from './DashboardSuggestions';
export * from './DashboardStockAlert';
export * from './DashboardQuickActions';
export * from './DashboardDailyPulse';
export * from './DashboardRecentSales';
export * from './DashboardEmptyState';
export * from './DashboardSkeleton';
export * from './DashboardErrorState';
export * from './DashboardHeader';
export * from './DashboardKPIGrid';
export * from './MiniInsightsCard';
export * from './HourlySalesTimeline';
export * from './SalesTargetCard';
export * from './CashSessionCard';
export * from './TodayTransactionLog';
export * from './HomeOverviewSkeleton';
export * from './TodaySnapshotSkeleton';
```

`DashboardContextHeader` and `DashboardDailyPulse` stay exported even though they remain orphaned (matches the spec's Out-of-Scope section).

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit -p .`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(home): delete alerts sub-tab and unused components"
```

---

## Task 12: Update `HomeSkeletons.test.tsx` to drop `HomeAlertsSkeleton`

**Files:**

- Modify: `tests/components/HomeSkeletons.test.tsx`

**Interfaces:**

- Consumes: nothing.
- Produces: the test no longer references the deleted `HomeAlertsSkeleton`. The remaining two tests continue to pass.

- [ ] **Step 1: Remove the `HomeAlertsSkeleton` import and test**

Replace the import block:

```ts
import {
  HomeOverviewSkeleton,
  TodaySnapshotSkeleton,
  HomeAlertsSkeleton,
} from '@/components/home';
```

with:

```ts
import {
  HomeOverviewSkeleton,
  TodaySnapshotSkeleton,
} from '@/components/home';
```

Delete the third test inside `describe('Home Sub-Tab Loading Skeletons', ...)`:

```ts
test('renders HomeAlertsSkeleton cleanly without errors', async () => {
  const { toJSON } = await render(<HomeAlertsSkeleton />);
  expect(toJSON()).toBeTruthy();
});
```

- [ ] **Step 2: Run the test**

Run: `npx jest tests/components/HomeSkeletons.test.tsx`
Expected: PASS for the two remaining tests.

- [ ] **Step 3: Commit**

```bash
git add tests/components/HomeSkeletons.test.tsx
git commit -m "test(home): drop HomeAlertsSkeleton from skeletons test"
```

---

## Task 13: Add a focused test for the `profitMargin` bug fix

**Files:**

- Modify: `hooks/useHomeDashboardData.ts` (test infrastructure only)
- Create: `tests/hooks/useHomeDashboardData.test.tsx`

**Interfaces:**

- Consumes: `@testing-library/react-native` `renderHook`, `@tanstack/react-query` `QueryClient`, mocks for the underlying hooks.
- Produces: a passing test that verifies `useHomeDashboardData()` no longer returns the hardcoded `profitMargin: 912`. When `useReportKPIs` returns `{ totalProfit: null }` and the rest of the data is empty, `stats.profitMargin` should be `null`, not `912`.

- [ ] **Step 1: Create `tests/hooks/useHomeDashboardData.test.tsx`**

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react-native';
import { useHomeDashboardData } from '@/hooks/useHomeDashboardData';

jest.mock('@/hooks/useSales', () => ({
  useSales: () => ({
    getTodayStatsQuery: { data: undefined, isLoading: false, error: null },
  }),
  useRecentSales: () => ({ data: undefined, isLoading: false }),
}));
jest.mock('@/hooks/useProducts', () => ({
  useProducts: () => ({
    getAllProductsQuery: { data: [], isLoading: false, error: null },
  }),
}));
jest.mock('@/hooks/useCredits', () => ({
  useCreditKPIs: () => ({ data: undefined, isLoading: false }),
  useCustomers: () => ({ data: [], isLoading: false }),
}));
jest.mock('@/hooks/useCash', () => ({
  useCurrentSession: () => ({ data: null, isLoading: false }),
}));
jest.mock('@/hooks/useProfile', () => ({
  useProfile: () => ({ profile: null, loading: false }),
}));
jest.mock('@/hooks/useReports', () => ({
  useReportKPIs: () => ({ data: { totalProfit: null } }),
}));
jest.mock('@/utils', () => {
  const actual = jest.requireActual('@/utils');
  return {
    ...actual,
    getDateRangeFromType: () => ({ startDate: '', endDate: '' }),
    groupSalesByHour: actual.groupSalesByHour,
  };
});

describe('useHomeDashboardData — profitMargin bug fix', () => {
  it('returns profitMargin as null when no report KPIs are available (no longer hardcodes 912)', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useHomeDashboardData(), { wrapper });
    expect(result.current.stats.profitMargin).toBeNull();
    expect(result.current.stats.profitMargin).not.toBe(912);
  });
});
```

- [ ] **Step 2: Run the test**

Run: `npx jest tests/hooks/useHomeDashboardData.test.tsx`
Expected: PASS. (If it fails because the hook reads `useReportKPIs` differently, double-check the mock — the production hook uses `useReportKPIs(todayRange)` from `hooks/useReports.tsx`. The mock above replaces the entire `useReports` module, so `useReportKPIs` becomes a function returning the stubbed data. That is correct.)

- [ ] **Step 3: Commit**

```bash
git add tests/hooks/useHomeDashboardData.test.tsx
git commit -m "test(home): verify profitMargin is no longer hardcoded"
```

---

## Task 14: Update `DashboardScreen.test.tsx` mocks for new hook return shape

**Files:**

- Modify: `tests/components/DashboardScreen.test.tsx`

**Interfaces:**

- Consumes: extended `useHomeDashboardData` (Task 06) returning `goal`, `suggestions`, `isError`, and `profitMargin: number | null`.
- Produces: the existing test mocks return the new fields. The `profitMargin: 200` numeric value still passes through.

- [ ] **Step 1: Extend `setupDefaultMocks`**

In `tests/components/DashboardScreen.test.tsx`, locate `setupDefaultMocks` (around line 50). Update the mocked `useHomeDashboardData` return to include the new fields:

```ts
const setupDefaultMocks = (isLoading = false) => {
  (useHomeDashboardData as jest.Mock).mockReturnValue({
    stats: {
      todaySalesTotal: 1000,
      transactionCount: 5,
      profitMargin: 200,
      lowStockCount: 0,
      overdueCount: 0,
      overdueAmount: 0,
    },
    products: [{ id: 1, name: 'Item 1', quantity: 10, price: 50 }],
    recentSales: [],
    hourlySales: [],
    topProduct: { name: 'Item 1', unitsSold: 10 },
    alerts: [],
    alertCount: 0,
    goal: { kind: 'continueSelling', destination: 'newSale' },
    suggestions: [],
    isError: false,
    currentSession: { status: 'open', variance: null },
    isLoading,
    refreshing: false,
    refetchAll: jest.fn(),
  });
};
```

- [ ] **Step 2: Run the test**

Run: `npx jest tests/components/DashboardScreen.test.tsx`
Expected: PASS. The screen renders the new layout with all mocked data; existing assertions (`getByText('New Sale')`, `getByText(/TOTAL SALES TODAY/i)`) still pass because the hero and quick-actions still render.

- [ ] **Step 3: Commit**

```bash
git add tests/components/DashboardScreen.test.tsx
git commit -m "test(home): update dashboard screen mocks for new hook shape"
```

---

## Task 15: Manual smoke test checklist

**Files:** none.

- [ ] **Step 1: Bring the dev server up**

Run: `npx expo start`
Expected: bundler reachable; app launches on simulator/device.

- [ ] **Step 2: Verify Home tab now has 2 sub-tabs**

Open Home. The segmented control shows "Overview" and "Today" only — no "Alerts" chip.

Expected: tapping the bell opens `NotificationSheet` with up to 3 alerts; tapping "See all alerts" navigates to `/reports`.

- [ ] **Step 3: Verify Overview sections render in order**

Scroll the Overview from top to bottom:

Expected order:

1. Slim total-sales hero (TOTAL SALES TODAY label + amount + transaction count + RECORDED badge).
2. KPI 2x2 grid (Est. Profit, Cash Session, Low Stock, Credits Due).
3. GoalCard with a single CTA reflecting the current state.
4. (Conditional) StockAlert slim banner — only when Low Stock count > 0.
5. Quick Actions ("+ New Sale" hero + 2x2 actions).
6. (Conditional) Suggestion strip — only when suggestions are non-empty.
7. Recent Activity (up to 3 sales + "View all sales").
8. Top Seller dark strip.

- [ ] **Step 4: Verify Est. Profit no longer hardcodes 912**

If no cost data exists, the Est. Profit tile should read "—" instead of "₱912".

Expected: tile shows "—" or a real peso amount, never "₱912" unless real data justifies it.

- [ ] **Step 5: Verify empty state**

With a clean DB (no products, no sales), the Overview should render the empty state component with the Sari illustration and "Add Product" + "Start First Sale" CTAs.

- [ ] **Step 6: Verify error state**

Force a query failure (e.g., by mocking an offline state). The Overview should render the error state with "Tap to Retry".

- [ ] **Step 7: Verify pull-to-refresh on Overview**

Drag down on the Overview. The persimmon-tinted spinner should appear, and the queries should refetch.

- [ ] **Step 8: Verify Today is slimmed down**

Switch to the Today tab. The screen shows only:

- HourlySalesTimeline (Peak Sales Hours chart).
- Recent Transaction Log (up to 3 sales + "View all sales").

No SalesTargetCard, no CashSessionCard. Pull-to-refresh works.

- [ ] **Step 9: Verify /home/alerts returns 404**

Navigate to `/(tabs)/home/alerts` directly (via deep link or URL bar in dev tools).

Expected: app shows its 404 screen (the alerts route file no longer exists).

- [ ] **Step 10: Commit any review fixes**

```bash
git add -A
git commit -m "chore(home): apply review fixes from smoke test"
```

---

## Task Index

| #   | Task                                                       | File(s)                                                                                       |
| --- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 01  | Narrow `HOME_SUB_TABS` const and `HomeSubTab` type         | `constants/tabs.ts`                                                                           |
| 02  | Update `DashboardHeader` to render 2 tabs                  | `components/home/DashboardHeader.tsx`                                                         |
| 03  | Simplify `home/_layout.tsx`                                | `app/(tabs)/home/_layout.tsx`                                                                 |
| 04  | Strip bell + handlers from `DashboardHeader`               | `components/home/DashboardHeader.tsx`                                                         |
| 05  | Re-route `StoreHeader.handleSeeAll` to `/reports`          | `components/layout/StoreHeader.tsx`                                                           |
| 06  | Extend `useHomeDashboardData` with goal/suggestions/error  | `hooks/useHomeDashboardData.ts`                                                               |
| 07  | Slim `DashboardKPIGrid` and accept nullable profit         | `components/home/DashboardKPIGrid.tsx`                                                        |
| 08  | Rewrite `home/index.tsx` as new single-column layout       | `app/(tabs)/home/index.tsx`                                                                   |
| 09  | Slim `home/today.tsx` and add `RefreshControl`             | `app/(tabs)/home/today.tsx`                                                                   |
| 10  | Update `HomeOverviewSkeleton` layout for new sections      | `components/home/HomeOverviewSkeleton.tsx`                                                    |
| 11  | Delete Alerts sub-tab and unused components                | `app/(tabs)/home/alerts.tsx`, `components/home/AlertCardItem.tsx`, `AlertFilterPills.tsx`, `HomeAlertsSkeleton.tsx`, `index.ts` |
| 12  | Drop `HomeAlertsSkeleton` from skeletons test              | `tests/components/HomeSkeletons.test.tsx`                                                     |
| 13  | Add focused test for the `profitMargin` bug fix            | `tests/hooks/useHomeDashboardData.test.tsx`                                                   |
| 14  | Update `DashboardScreen.test.tsx` mocks for new hook shape | `tests/components/DashboardScreen.test.tsx`                                                   |
| 15  | Manual smoke test checklist                                | —                                                                                             |
