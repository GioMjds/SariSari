# Reports as Home Sub-Tab — Design Spec

> **For agentic workers:** The follow-up plan is `docs/superpowers/plans/2026-08-01-reports-as-home-subtab.md` (created by the writing-plans skill after this spec is approved).

**Goal:** Move the existing `app/(tabs)/reports/index.tsx` screen into the Home tab as a second sub-tab. Home sub-tabs become `Overview` and `Reports`. The standalone `/reports` route and `app/more/reports.tsx` (a near-duplicate) are deleted. The current `Today` sub-tab is removed.

**Architecture:** The Reports screen file moves from `app/(tabs)/reports/index.tsx` to `app/(tabs)/home/reports.tsx` with no content change. `HOME_SUB_TABS` is narrowed to `['overview', 'reports']`; `MORE_SUB_TABS` is shrunk to `['insights', 'sync', 'settings']`. `app/(tabs)/home/_layout.tsx` swaps its third `<TopTabs.Screen>` from `today` to `reports` and extends `getCurrentTab`. `DashboardHeader` renders two chips. `useHomeDashboardData` is unchanged. The bell "See all alerts" CTA continues to work — its route string changes to `/(tabs)/home/reports`. No new data layer, no new components, no DB migrations.

**Tech Stack:** React Native 0.81, Expo 54, expo-router 6, TanStack Query 5, existing reports hooks (`useReportKPIs`, `useSalesOverTime`, `useInventoryMovement`, `useCreditsOverview`, `useCashSessions`, etc.).

## Global Constraints

- No emoji in code or comments (CLAUDE.md). Use `FontAwesome` icons.
- Touch targets min `44x44 px` (`min-h-[44px]`).
- Brand palette only: `paper-*`, `ink-*`, `cinnamon-*`, `persimmon-*`, `sage-*`, plus semantic `amber-*`, `rose-*`, `semantic-*`. No new colors.
- All strings use i18n `t(...)` with `defaultValue` fallbacks.
- Tab routes use existing `TopTabs` config (`swipeEnabled: true, lazy: true, lazyPreloadDistance: 0`).
- Don't auto-push any branch (CLAUDE.md). Commit incrementally.
- Tests live under `tests/` and follow the existing `@testing-library/react-native` + manual jest-mock pattern. No new test deps.
- File paths with parens (e.g. `app/(tabs)/home/index.tsx`) require escaping in shell commands.

## Decisions Locked With User

| # | Decision | Choice |
|---|----------|--------|
| Q1 | What happens to Today? | **Drop Today entirely.** Home sub-tabs become `['overview', 'reports']`. |
| Q2 | What happens to `app/more/reports.tsx`? | **Delete it.** More loses its Reports sub-route. |
| Q3 | Where does the Reports screen file live? | **Move it to `app/(tabs)/home/reports.tsx`.** |

## File Map

```folder
app/(tabs)/home/
  _layout.tsx                       [modify — register 'reports' sub-tab, update getCurrentTab]
  index.tsx                         [unchanged from home-tab-improv plan — keep Overview]
  today.tsx                         [DELETE]
  reports.tsx                       [CREATE — content moved from app/(tabs)/reports/index.tsx]

app/(tabs)/reports/
  index.tsx                         [DELETE — content moves to app/(tabs)/home/reports.tsx]

app/more/
  reports.tsx                       [DELETE — duplicate of Reports; More loses this sub-tab]

components/home/
  DashboardHeader.tsx               [modify — 2-tab array (index, reports), icons]
  HourlySalesTimeline.tsx           [DELETE — orphaned by Today removal]
  TodayTransactionLog.tsx           [DELETE — orphaned by Today removal]
  index.ts                          [modify — remove re-exports for deleted files]

components/reports/
  (untouched)

constants/
  tabs.ts                           [modify — HOME_SUB_TABS to ['overview','reports'], MORE_SUB_TABS to 3 entries, drop '/reports' from PRIMARY_TAB_PATHS]

hooks/
  useHomeDashboardData.ts           [unchanged — already exposes goal/suggestions/isError/null profitMargin]

components/home/home-state.ts       [modify — HomeDestination map: 'reports' -> '/(tabs)/home/reports']
components/layout/StoreHeader.tsx   [modify — handleSeeAll pushes '/(tabs)/home/reports']

tests/components/DashboardScreen.test.tsx
                                     [verify — update mock shape if HomeSubTab referenced]
```

## Design

### 1. Sub-tab routing

`HOME_SUB_TABS = ['overview', 'reports'] as const`. The `HomeSubTab` union narrows to `'index' | 'reports'`. `DashboardHeader` renders two `SubTabControl` chips: "Overview" (`th-large`) and "Reports" (`bar-chart`).

`app/(tabs)/home/_layout.tsx`:

```tsx
const getCurrentTab = (): HomeSubTab => {
  if (pathname.includes('reports')) return 'reports';
  return 'index';
};
```

`<TopTabs.Screen name="index" />` and `<TopTabs.Screen name="reports" />` are registered. Swipe-enabled, lazy, lazyPreloadDistance: 0 — unchanged.

### 2. Reports screen under Home

The Reports screen file moves to `app/(tabs)/home/reports.tsx`. The only structural change is dropping the outer `<View className="flex-1 bg-paper-200">` because the Home layout already provides it. All other JSX, hooks, and components stay identical.

```tsx
// app/(tabs)/home/reports.tsx — first ~10 lines after the move
import { StyledText } from '@/components/elements';
import {
  CreditAgingChart,
  StockMovementDetails,
  // ... all existing imports unchanged
} from '@/components/reports';
// ... rest unchanged
```

### 3. Today removal

`app/(tabs)/today.tsx` is deleted. `HourlySalesTimeline` and `TodayTransactionLog` components are deleted (no other consumers). `components/home/index.ts` drops their re-exports.

The Overview screen (`app/(tabs)/home/index.tsx`) keeps its current 8-section layout from the previous home-tab-improv plan — the hourly timeline is not added back into Overview. Today's data (recentSales, hourlySales) is still loaded by `useHomeDashboardData` but only consumed in Overview as `recentSales` for the RecentSales section.

### 4. More tab loses Reports

`app/more/reports.tsx` is deleted. `MORE_SUB_TABS` in `constants/tabs.ts` becomes:

```ts
export const MORE_SUB_TABS = ['insights', 'sync', 'settings'] as const;
```

The More tab now has 3 sub-tabs (`app/more/insights.tsx`, `sync.tsx`, `settings.tsx`).

### 5. PRIMARY_TAB_PATHS cleanup

`'/reports'` is removed from `PRIMARY_TAB_PATHS` in `constants/tabs.ts`. The route no longer exists, so the back-button exit-toast doesn't need to special-case it.

### 6. Route string sweep

Every existing `router.push('/reports' as Href)` (or the `/reports` map value in `home-state.ts`) becomes `router.push('/(tabs)/home/reports' as Href)`. Both paths resolve to the same screen via expo-router, but the explicit `(tabs)` form keeps the navigation tree readable.

Affected sites (per grep evidence):
- `app/(tabs)/home/index.tsx` — `handleGoalAction` map, `handleSuggestionPress` map, `DashboardKPIGrid` `onDetailsPress`, `onKpiPress('reports')`, `DashboardQuickActions` `onOpenReports`.
- `components/home/home-state.ts` — the `HomeDestination` map in the consumer (the type itself doesn't carry a URL — that map lives in the screen).
- `components/layout/StoreHeader.tsx:47` — `handleSeeAll`.

### 7. Tests

- `tests/components/DashboardScreen.test.tsx`: verify the `useHomeDashboardData` mock return shape still matches the production hook. No expected changes — the mock returns the same fields it returned last week.
- `tests/components/HomeSkeletons.test.tsx`: unchanged from the previous plan's Task 12.
- `tests/hooks/useHomeDashboardData.test.tsx`: unchanged from the previous plan's Task 13.
- No new test files. The Reports screen keeps its existing tests (if any) unchanged.

### 8. Smoke test checklist

- Bring dev server up.
- Home tab shows segmented control with 2 chips: "Overview" and "Reports". No "Today" chip.
- Tapping "Reports" chip swaps the body to the Reports editorial layout (BentoHero, AlmanacMasthead, date range selector, etc.).
- Swiping left from Overview switches to Reports; swiping right from Reports switches back.
- Pull-to-refresh on Reports works.
- Tapping the bell in `StoreHeader` opens the `NotificationSheet`; tapping "See all alerts" navigates to the Reports sub-tab of Home.
- Deep-linking to `/reports` returns the `+not-found.tsx` screen (the route is gone).
- Deep-linking to `/(tabs)/home/reports` renders Reports with the segmented chip active.
- More tab no longer shows "Reports" — sub-tabs are Insights / Sync / Settings.
- All `useReportKPIs` and friends continue to load (no data layer change).
- No new TypeScript errors introduced; existing 418 pre-existing errors in `tests/database/*`, `tests/onboarding/*`, `tests/components/utang/*`, and `utils/alert.ts` are unchanged.

## Out of Scope

- Extracting Reports into a shared component to deduplicate `app/(tabs)/reports/index.tsx` and `app/more/reports.tsx` — both files are deleted, so the duplication vanishes for free.
- Renaming the editorial layout (BentoHero, AlmanacMasthead, etc.).
- Adding new analytics sections to Reports.
- Changing the bottom tab bar configuration (still 5 tabs: Home, Sales, Inventory, Customers, More).
- Any change to `useHomeDashboardData` beyond what the previous plan already shipped.