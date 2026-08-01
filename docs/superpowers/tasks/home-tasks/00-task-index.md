# Home Tab Improv — Task Index

> Parent Plan: [2026-08-01-home-tab-improv.md](../../plans/2026-08-01-home-tab-improv.md)
> Spec: [2026-08-01-home-tab-improv-design.md](../../specs/2026-08-01-home-tab-improv-design.md)

**Goal:** Remove the Alerts sub-tab from Home, slim the Overview into a single at-a-glance column that revives the unused `DashboardGoalCard`, `DashboardStockAlert`, `DashboardSuggestions`, `DashboardEmptyState`, `DashboardErrorState` (and an updated `HomeOverviewSkeleton`), slim the Today sub-tab to just the hourly timeline + transaction log with pull-to-refresh, and fix the hardcoded `profitMargin: 912` bug in `useHomeDashboardData`.

## Task List

| #   | File(s)                                                                                      | Title                                                                                   | Depends on | Phase      |
| --- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------- | ---------- |
| 01  | [task-01-01-locate-tabs.md](./task-01-01-locate-tabs.md)                                     | Locate HOME_SUB_TABS const and HomeSubTab type                                          | None       | Foundation |
|     | [task-01-02-narrow-tabs.md](./task-01-02-narrow-tabs.md)                                     | Narrow HOME_SUB_TABS to overview and today                                              | 01-01      | Foundation |
|     | [task-01-03-verify-and-commit.md](./task-01-03-verify-and-commit.md)                         | Verify typecheck and commit                                                             | 01-02      | Foundation |
| 02  | [task-02-narrow-dashboard-header-tabs.md](./task-02-narrow-dashboard-header-tabs.md)         | Update DashboardHeader to render 2 tabs                                                 | 01         | Header     |
| 03  | [task-03-01-simplify-router-logic.md](./task-03-01-simplify-router-logic.md)                 | Simplify getCurrentTab and remove handleNotificationPress                               | 01, 02     | Layout     |
|     | [task-03-02-drop-alerts-screen.md](./task-03-02-drop-alerts-screen.md)                       | Drop alerts from TopTabs.Screen list                                                    | 03-01      | Layout     |
|     | [task-03-03-update-dashboard-header-jsx.md](./task-03-03-update-dashboard-header-jsx.md)     | Drop alertCount and onNotificationPress from DashboardHeader JSX                        | 03-02      | Layout     |
|     | [task-03-04-verify-and-commit.md](./task-03-04-verify-and-commit.md)                         | Verify typecheck and commit                                                             | 03-03      | Layout     |
| 04  | [task-04-01-strip-bell-and-props.md](./task-04-01-strip-bell-and-props.md)                   | Strip bell + handler + bell props from DashboardHeader                                  | 02, 03     | Header     |
|     | [task-04-02-clean-unused-imports.md](./task-04-02-clean-unused-imports.md)                   | Remove unused imports from DashboardHeader                                              | 04-01      | Header     |
|     | [task-04-03-verify-and-commit.md](./task-04-03-verify-and-commit.md)                         | Verify typecheck and commit                                                             | 04-02      | Header     |
| 05  | [task-05-storeheader-redirect-seeall.md](./task-05-storeheader-redirect-seeall.md)           | Re-route StoreHeader.handleSeeAll to /reports                                           | None       | Layout     |
| 06  | [task-06-01-imports-and-prereqs.md](./task-06-01-imports-and-prereqs.md)                     | Add useHomeDashboardData imports for new fields                                         | None       | Data       |
|     | [task-06-02-profit-margin.md](./task-06-02-profit-margin.md)                                 | Replace hardcoded profitMargin with useReportKPIs source                                | 06-01      | Data       |
|     | [task-06-03-resolve-home-state-input.md](./task-06-03-resolve-home-state-input.md)           | Extract memoized HomeStateInput from hook deps                                          | 06-02      | Data       |
|     | [task-06-04-goal-suggestions.md](./task-06-04-goal-suggestions.md)                           | Compute goal and suggestions via resolveHomeState                                       | 06-03      | Data       |
|     | [task-06-05-is-error.md](./task-06-05-is-error.md)                                           | Compute isError from underlying query errors                                            | 06-04      | Data       |
|     | [task-06-06-return-shape.md](./task-06-06-return-shape.md)                                   | Update return shape with goal, suggestions, isError, profitMargin                       | 06-05      | Data       |
|     | [task-06-07-verify-and-commit.md](./task-06-07-verify-and-commit.md)                         | Verify typecheck and commit                                                             | 06-06      | Data       |
| 07  | [task-07-01-prop-type-and-nullable-render.md](./task-07-01-prop-type-and-nullable-render.md) | Slim DashboardKPIGrid props + render "—" for null profit                                | 06         | KPI Grid   |
|     | [task-07-02-remove-hero-and-store-summary.md](./task-07-02-remove-hero-and-store-summary.md) | Remove redundant hero block and STORE SUMMARY header                                    | 07-01      | KPI Grid   |
|     | [task-07-03-verify-and-commit.md](./task-07-03-verify-and-commit.md)                         | Verify typecheck and commit                                                             | 07-02      | KPI Grid   |
| 08  | [task-08-01-rewrite-overview-shell.md](./task-08-01-rewrite-overview-shell.md)               | Rewrite home/index.tsx shell with error/empty gates and hero                            | 06, 07     | Overview   |
|     | [task-08-02-embed-sections.md](./task-08-02-embed-sections.md)                               | Embed KPI grid, GoalCard, StockAlert, QuickActions, Suggestions, RecentSales, TopSeller | 08-01      | Overview   |
|     | [task-08-03-verify-and-commit.md](./task-08-03-verify-and-commit.md)                         | Verify typecheck and commit                                                             | 08-02      | Overview   |
| 09  | [task-09-slim-home-today.md](./task-09-slim-home-today.md)                                   | Slim home/today.tsx and add RefreshControl                                              | 06         | Today Tab  |
| 10  | [task-10-update-overview-skeleton.md](./task-10-update-overview-skeleton.md)                 | Update HomeOverviewSkeleton layout for new sections                                     | 06         | Skeleton   |
| 11  | [task-11-01-verify-importers.md](./task-11-01-verify-importers.md)                           | Verify no remaining importers of deleted alerts components                              | 01-10      | Cleanup    |
|     | [task-11-02-delete-files.md](./task-11-02-delete-files.md)                                   | Delete alerts.tsx, AlertCardItem, AlertFilterPills, HomeAlertsSkeleton                  | 11-01      | Cleanup    |
|     | [task-11-03-update-index-exports.md](./task-11-03-update-index-exports.md)                   | Remove deleted exports from components/home/index.ts                                    | 11-02      | Cleanup    |
|     | [task-11-04-verify-and-commit.md](./task-11-04-verify-and-commit.md)                         | Verify typecheck and commit cleanup batch                                               | 11-03      | Cleanup    |
| 12  | [task-12-update-home-skeletons-test.md](./task-12-update-home-skeletons-test.md)             | Drop HomeAlertsSkeleton from skeletons test                                             | 11         | Tests      |
| 13  | [task-13-add-profit-margin-test.md](./task-13-add-profit-margin-test.md)                     | Add focused test for the profitMargin bug fix                                           | 06         | Tests      |
| 14  | [task-14-update-dashboard-screen-mocks.md](./task-14-update-dashboard-screen-mocks.md)       | Update DashboardScreen.test.tsx mocks for new hook shape                                | 06         | Tests      |
| 15  | [task-15-01-dev-server-up.md](./task-15-01-dev-server-up.md)                                 | Bring dev server up                                                                     | 01-14      | Smoke      |
|     | [task-15-02-home-2-subtabs.md](./task-15-02-home-2-subtabs.md)                               | Verify Home tab now has 2 sub-tabs                                                      | 15-01      | Smoke      |
|     | [task-15-03-overview-order.md](./task-15-03-overview-order.md)                               | Verify Overview sections render in order                                                | 15-01      | Smoke      |
|     | [task-15-04-profit-no-912.md](./task-15-04-profit-no-912.md)                                 | Verify Est. Profit no longer hardcodes 912                                              | 15-01      | Smoke      |
|     | [task-15-05-empty-state.md](./task-15-05-empty-state.md)                                     | Verify empty state                                                                      | 15-01      | Smoke      |
|     | [task-15-06-error-state.md](./task-15-06-error-state.md)                                     | Verify error state                                                                      | 15-01      | Smoke      |
|     | [task-15-07-pull-to-refresh.md](./task-15-07-pull-to-refresh.md)                             | Verify pull-to-refresh on Overview                                                      | 15-01      | Smoke      |
|     | [task-15-08-today-slim.md](./task-15-08-today-slim.md)                                       | Verify Today is slimmed down                                                            | 15-01      | Smoke      |
|     | [task-15-09-alerts-404.md](./task-15-09-alerts-404.md)                                       | Verify /home/alerts returns 404                                                         | 15-01      | Smoke      |
|     | [task-15-10-commit-fixes.md](./task-15-10-commit-fixes.md)                                   | Commit any review fixes from smoke test                                                 | 15-09      | Smoke      |

## Checkpoints

### Checkpoint A — Foundation, Data Hook, Layout (Tasks 01–10)

- [ ] `HOME_SUB_TABS` narrowed to 2 entries; `HomeSubTab` union follows.
- [ ] `DashboardHeader` renders 2 tabs; bell removed; props stripped.
- [ ] `app/(tabs)/home/_layout.tsx` renders 2 `TopTabs.Screen`s.
- [ ] `StoreHeader.handleSeeAll` routes to `/reports`.
- [ ] `useHomeDashboardData` exposes `goal`, `suggestions`, `isError`, `profitMargin: number | null` (no more `912`).
- [ ] `DashboardKPIGrid` is 2x2 with nullable profit; renders "—".
- [ ] `app/(tabs)/home/index.tsx` is single-column Overview with hero → KPI grid → GoalCard → StockAlert → QuickActions → Suggestions → RecentSales → TopSeller; gates on error/empty states.
- [ ] `app/(tabs)/home/today.tsx` slimmed to HourlySalesTimeline + TodayTransactionLog with RefreshControl.
- [ ] `HomeOverviewSkeleton` layout expanded to match new sections.
- [ ] Alerts sub-tab and unused components deleted.
- [ ] `npx tsc --noEmit -p .` clean throughout.

### Checkpoint B — Tests + Manual Smoke (Tasks 11–15)

- [ ] Deleted exports removed from `components/home/index.ts` and test imports.
- [ ] New `tests/hooks/useHomeDashboardData.test.tsx` asserts `profitMargin === null` (not 912).
- [ ] `tests/components/DashboardScreen.test.tsx` mocks the new hook shape.
- [ ] `tests/components/HomeSkeletons.test.tsx` passes without `HomeAlertsSkeleton`.
- [ ] Manual smoke test checklist complete: 2 sub-tabs, Overview section order correct, Est. Profit "—" without data, empty state shows, error state shows, pull-to-refresh works on Overview and Today, Today is slimmed, `/home/alerts` 404s.
