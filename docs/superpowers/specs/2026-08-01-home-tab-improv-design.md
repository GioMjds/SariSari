# Home Tab Improv — Design

**Date:** 2026-08-01
**Branch:** `revamp/more-tabs`
**Status:** Approved

## Context

The Home tab currently has 3 sub-tabs (Overview, Today, Alerts) with substantial dead code:

- `DashboardGoalCard`, `DashboardSuggestions`, `DashboardStockAlert`, `DashboardEmptyState`, `DashboardErrorState`, `DashboardContextHeader` are all built but never rendered in any current Home page.
- The Alerts sub-tab duplicates notification functionality already in `NotificationSheet`, and the Reports tab already has a "Dispatch from the counter" insight block plus an inline Low Stock alert in the Stock Levels section.
- `useHomeDashboardData.ts:135` hardcodes `profitMargin: 912`, which renders fake data on the Overview's "Est. Profit" KPI tile.
- The Today sub-tab contains `SalesTargetCard` (a setting, not a snapshot) and `CashSessionCard` (duplicates Overview's Cash Session KPI tile).

The StoreHeader still has the bell icon → `NotificationSheet` (top 3 alerts → "See all" CTA). The "See all" target currently navigates to `/home/alerts`, which is being removed.

## Goals

1. Remove the Alerts sub-tab from Home. Alerts remain accessible via the NotificationSheet (top 3) and the Reports tab (full list).
2. Deliver a single-column Overview that reads top-to-bottom: hero → KPIs → goal → quick actions → recent activity → top seller.
3. Revive the unused `DashboardGoalCard`, `DashboardStockAlert`, `DashboardSuggestions`, `DashboardEmptyState`, `DashboardErrorState`, and the `HomeOverviewSkeleton` (with updated layout to match the new sections).
4. Slim Today down to `HourlySalesTimeline` + `TodayTransactionLog`. Add pull-to-refresh.
5. Fix the hardcoded `profitMargin: 912` bug.

## Non-Goals

- No new analytics, no new report types.
- No redesign of the Reports tab — its existing "Dispatch from the counter" insight block and Low Stock alert section serve as the new full-alerts-list alternative.
- No new destinations for `DashboardContextHeader` (stays orphaned in this revision).
- No changes to `NotificationSheet`, `StyledTab`, `StoreHeader`.
- No i18n key changes (current Overview uses existing keys; new pieces reuse existing keys).
- No DB migrations.

## Success Criteria

- Home has 2 sub-tabs (Overview, Today). The Alerts sub-tab route `/home/alerts` returns 404.
- Overview renders all 8 sections in the order specified below, with the right conditional rendering (`DashboardStockAlert` only when `lowStockCount > 0`, `DashboardSuggestions` only when its destination differs from the goal, etc.).
- The hardcoded `profitMargin: 912` is gone — the Est. Profit tile shows the real `totalProfit` value when available, otherwise shows "—".
- Pull-to-refresh works on Overview and Today.
- Empty state shows on first launch; error state shows on query failure.
- Manual smoke test: with zero products + zero sales, Overview shows the empty state with "Add Product" CTA. With 3 overdue customers + 0 cash session, the goal card shows the overdue-credits goal with count=3.

## Architecture

### Sub-tab structure

Home has 2 sub-tabs (down from 3): **Overview** (default landing) and **Today**. The `Alerts` sub-tab is removed. The `app/(tabs)/home/alerts.tsx` file is deleted. The `AlertCardItem` and `AlertFilterPills` components are deleted (after we confirm they are not used elsewhere — only the `alerts.tsx` screen imports them).

The `HomeSubTab` type in `constants/tabs.ts` narrows from `'index' | 'today' | 'alerts'` to `'index' | 'today'`. The `HOME_SUB_TABS` const narrows accordingly. `DashboardHeader` and `app/(tabs)/home/_layout.tsx` simplify to render 2 tabs.

The bell icon in `StoreHeader` still opens `NotificationSheet`. The "See all" CTA's `targetPath` changes from `/home/alerts` to `/reports` (intentional new home for the full alert list).

### Overview screen layout

Single-column scroll, top-to-bottom:

1. **Slim total-sales hero** — replaces the current hero inside `DashboardKPIGrid`. Just the number, transaction count, and a "RECORDED" badge. No drawer badge, no settings cog (those already live in `StoreHeader`).
2. **KPI 2x2 grid** — slim version that drops its own duplicate total-sales hero. Just the 4 tiles: Est. Profit, Cash Session, Low Stock, Credits Due. Each tile stays tappable to its respective destination.
3. **`DashboardGoalCard`** — the highest-priority recommendation (restock, overdue credits, open drawer, etc.) via `resolveHomeState` from `home-state.ts`. Drives one big CTA.
4. **`DashboardStockAlert`** — slim banner, only renders when `lowStockCount > 0`, sits between Goal and Quick Actions. Goes to inventory.
5. **Quick Actions** — unchanged. "+ New Sale" hero + 2x2 action grid (Add Product, Add Stock, Utang, Reports).
6. **`DashboardSuggestions`** — single contextual time-of-day suggestion (morning = inventory, midday = keep selling, evening = review reports). Already filters suggestions whose destination matches the goal.
7. **Recent Activity** — last 3 sales, "View all sales" link.
8. **Top Seller strip** — `MiniInsightsCard` unchanged.

The `DashboardErrorState` replaces the whole scroll when data fetch fails. The `DashboardEmptyState` handles first-time stores. `HomeOverviewSkeleton` becomes the loading state with a layout updated to match the new sections (no layout shift).

### Today screen

`Today` sub-tab keeps the live-activity focus. Drops two components:

- **`SalesTargetCard` removed** — daily target is a setting, not a snapshot. The `SalesTargetCard` component is **not** deleted; it just stops being referenced from Today. Kept in the codebase for future use.
- **`CashSessionCard` removed** — drawer status is already a KPI tile on Overview. End-of-day expected/variance is closer to the Reports tab's "Cashbook History" section.

What stays: `HourlySalesTimeline` + `TodayTransactionLog`. Order: timeline (hourly sales chart) on top, transaction log below. Add pull-to-refresh via `RefreshControl` (currently absent on Today).

### Data flow

`useHomeDashboardData` is the single hook feeding both Overview and Today. No new hooks needed.

`resolveHomeState` from `home-state.ts` already provides everything `DashboardGoalCard` and `DashboardSuggestions` need (out-of-stock count, low-stock count, overdue count, cash session, hasAnySales). The hook currently exposes `lowStockProducts` and `overdueCustomers` — both flow into the goal-state computation. Wire `goal` and `suggestions` through the hook return.

**Bug fix:** `useHomeDashboardData.ts:135` currently returns `profitMargin: 912`. Replace with a real value:

- If `useReportKPIs` is available for today's date range, pass through `totalProfit`.
- Otherwise, return `null` and have the KPI tile render "—" (matching the existing Reports tab pattern at `formatCurrency`-of-null-safe).

The hook return shape changes: `profitMargin: number | null`. The `DashboardKPIGrid` tile handles `null` by rendering "—".

### Error handling + empty states

**Error state:** `DashboardErrorState` shows when any of the queries feeding `useHomeDashboardData` fails. The current Overview has no error fallback — silent failure means the owner sees stale (or absent) numbers. The hook already exposes `refetchAll`; `DashboardErrorState` already wires a "Tap to Retry" button. This revision gates the whole screen on that error state.

**Empty state:** New stores (no products, no sales) hit `DashboardEmptyState`. The current Overview has no empty state — it just renders zeros. The empty-state component already exists with "Add Product" and "Start First Sale" CTAs. This revision gates Overview on it when `products.length === 0 && stats.transactionCount === 0`.

**Refreshing:** Pull-to-refresh already works on Overview and Alerts (the new Overview inherits this). Today screen currently does not pull-to-refresh — gain that behavior in this revision by adding the same `RefreshControl` wrapping.

## Files Modified

### `constants/tabs.ts`

- `HOME_SUB_TABS` const narrows from `['overview', 'today', 'alerts']` to `['overview', 'today']`.
- `HomeSubTab` type follows.

### `app/(tabs)/home/_layout.tsx`

- Render 2 sub-tabs instead of 3. Remove `alerts` from `TopTabs.Screen` list.
- Simplify `getCurrentTab` to handle `'index' | 'today'` only.

### `app/(tabs)/home/index.tsx`

- New single-column layout. Order: hero → KPI grid → `DashboardGoalCard` → `DashboardStockAlert` (conditional) → `DashboardQuickActions` → `DashboardSuggestions` (conditional) → `DashboardRecentSales` → `MiniInsightsCard`.
- Gate on `DashboardErrorState` when `useHomeDashboardData.isError` is true.
- Gate on `DashboardEmptyState` when `products.length === 0 && stats.transactionCount === 0`.
- Pass `goal` and `suggestions` from the hook into the new components.

### `app/(tabs)/home/today.tsx`

- Remove `SalesTargetCard` and `CashSessionCard` from the render tree.
- Add `RefreshControl` with `refetchAll` from the hook.
- Render `HourlySalesTimeline` + `TodayTransactionLog` only.

### `app/(tabs)/home/alerts.tsx`

- Delete the file.

### `components/home/DashboardHeader.tsx`

- Reduce `tabs` array to 2 entries: `'index' | 'today'`. Update `HomeSubTab` import to match the narrower type.

### `components/home/DashboardKPIGrid.tsx`

- Drop the Total-Sales hero block from the top. Keep the 2x2 grid only.
- Accept `profitMargin: number | null` and render "—" when null.

### `components/home/AlertCardItem.tsx` and `components/home/AlertFilterPills.tsx`

- Delete both files (only used by `alerts.tsx`).

### `components/home/index.ts`

- Remove exports for `AlertCardItem` and `AlertFilterPills`.

### `hooks/useHomeDashboardData.ts`

- Replace `profitMargin: 912` with a real value (or `null`).
- Add `goal: HomeRecommendation` and `suggestions: HomeRecommendation[]` to the return shape, computed via `resolveHomeState`.
- Add `isError` aggregate (true if any of the underlying queries errored).

### `components/home/HomeOverviewSkeleton.tsx`

- Update the skeleton layout array to add slots for: goal card, stock alert banner, suggestions, top seller. Layout heights should match the new screen sections (no layout shift).

### `components/layout/StoreHeader.tsx`

- The `handleSeeAll` callback routes to `/reports` instead of `/home/alerts`.

## Components Reused

- `DashboardGoalCard`, `DashboardStockAlert`, `DashboardSuggestions`, `DashboardEmptyState`, `DashboardErrorState`, `DashboardQuickActions`, `DashboardKPIGrid`, `DashboardRecentSales`, `MiniInsightsCard`, `HomeOverviewSkeleton`, `HourlySalesTimeline`, `TodayTransactionLog` (all exist).
- `resolveHomeState` from `home-state.ts` (already built and tested).
- `useHomeDashboardData` (extended, not replaced).

## Out of Scope (Kept for Future Revisions)

- `DashboardContextHeader` — built but unused; stays orphaned in this revision.
- `SalesTargetCard` — kept in the codebase, removed from Today. Re-homing it (e.g., Settings) is a separate task.
- `DashboardDailyPulse` — built but unused; stays orphaned.
- `DashboardSkeleton` — kept (used by `DashboardEmptyState`'s adjacent loading pattern if needed).
- Localization key changes — current Overview keys serve the new layout.
