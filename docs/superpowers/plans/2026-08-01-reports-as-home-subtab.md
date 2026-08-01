# Reports as Home Sub-Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the existing `app/(tabs)/reports/index.tsx` screen into the Home tab as a second sub-tab. Home sub-tabs become `Overview` and `Reports`. The standalone `/reports` route and `app/more/reports.tsx` (a near-duplicate) are deleted. The current `Today` sub-tab is removed.

**Architecture:** The Reports screen file moves from `app/(tabs)/reports/index.tsx` to `app/(tabs)/home/reports.tsx` with no content change beyond dropping the outer `<View className="flex-1 bg-paper-200">` (the Home layout already provides it). `HOME_SUB_TABS` is narrowed to `['overview', 'reports']`; `MORE_SUB_TABS` is shrunk to `['insights', 'sync', 'settings']`. `app/(tabs)/home/_layout.tsx` swaps its third `<TopTabs.Screen>` from `today` to `reports` and extends `getCurrentTab`. `DashboardHeader` renders two chips with `bar-chart` for Reports. Every `router.push('/reports' as Href)` is updated to `/(tabs)/home/reports`. No new data layer, no new components, no DB migrations.

**Tech Stack:** React Native 0.81, Expo 54, expo-router 6 (`useRouter`, `usePathname`), TanStack Query 5, existing reports hooks (`useReportKPIs`, `useSalesOverTime`, `useInventoryMovement`, `useCreditsOverview`, `useCashSessions`, etc.).

## Global Constraints

- No emoji in code or comments (CLAUDE.md). Use `FontAwesome` icons.
- Touch targets min `44x44 px` (`min-h-[44px]`).
- Brand palette only: `paper-*`, `ink-*`, `cinnamon-*`, `persimmon-*`, `sage-*`, plus semantic `amber-*`, `rose-*`, `semantic-*`. No new colors.
- All strings use i18n `t(...)` with `defaultValue` fallbacks.
- Tab routes use existing `TopTabs` config (`swipeEnabled: true, lazy: true, lazyPreloadDistance: 0`).
- Don't auto-push any branch (CLAUDE.md). Commit incrementally; user reviews and pushes.
- Tests live under `tests/` and follow the existing `@testing-library/react-native` + manual jest-mock pattern. No new test deps.
- File paths with parens (e.g. `app/(tabs)/home/index.tsx`) require escaping in shell commands.
- `tsc --noEmit -p .` MUST be clean (zero new errors) for every home tab file at the end of each task. Pre-existing 418 errors in `tests/database/*`, `tests/onboarding/*`, `tests/components/utang/*`, and `utils/alert.ts` are out of scope and remain unchanged.

---

## File Map

```folder
app/(tabs)/home/
  _layout.tsx                       [modify — register 'reports' sub-tab, update getCurrentTab]
  index.tsx                         [unchanged — Overview content stays as-is from previous plan]
  today.tsx                         [DELETE]
  reports.tsx                       [CREATE — moved content from app/(tabs)/reports/index.tsx]

app/(tabs)/reports/
  index.tsx                         [DELETE — content moves to app/(tabs)/home/reports.tsx]

app/more/
  reports.tsx                       [DELETE — duplicate of Reports; More loses this sub-tab]

components/home/
  DashboardHeader.tsx               [modify — narrow HomeSubTab to 'index'|'reports', update tabs array]
  HourlySalesTimeline.tsx           [DELETE — orphaned by Today removal]
  TodayTransactionLog.tsx           [DELETE — orphaned by Today removal]
  index.ts                          [modify — remove re-exports for deleted files]

components/reports/
  (untouched)

constants/
  tabs.ts                           [modify — HOME_SUB_TABS to ['overview','reports'], MORE_SUB_TABS to 3 entries, drop '/reports' from PRIMARY_TAB_PATHS]

hooks/
  useHomeDashboardData.ts           [unchanged]

components/layout/StoreHeader.tsx   [modify — handleSeeAll pushes '/(tabs)/home/reports']

app/(tabs)/home/index.tsx           [modify — sweep 5 '/reports' route strings to '/(tabs)/home/reports']
```

---

## Task 01: Narrow `HOME_SUB_TABS` and `MORE_SUB_TABS`; drop `/reports` from `PRIMARY_TAB_PATHS`

**Files:**

- Modify: `constants/tabs.ts:11-21, 66, 75-80`

**Interfaces:**

- Consumes: existing `HOME_SUB_TABS`, `MORE_SUB_TABS`, `PRIMARY_TAB_PATHS`.
- Produces: `HOME_SUB_TABS = ['overview', 'reports'] as const`; `MORE_SUB_TABS = ['insights', 'sync', 'settings'] as const`; `PRIMARY_TAB_PATHS` no longer contains `'/reports'`. `HomeSubTab` and `MoreSubTab` unions follow automatically.

- [ ] **Step 1: Open `constants/tabs.ts` and locate the three ranges**

At the top (lines 11-21):

```ts
export const PRIMARY_TAB_PATHS = [
  '/',
  '/home',
  '/sales',
  '/inventory',
  '/customers',
  '/more',
  '/utang',
  '/reports',
  '/sell',
] as const;
```

At line 66:

```ts
export const HOME_SUB_TABS = ['overview', 'today'] as const;
```

At lines 75-80:

```ts
export const MORE_SUB_TABS = [
  'reports',
  'insights',
  'sync',
  'settings',
] as const;
```

- [ ] **Step 2: Remove `'/reports'` from `PRIMARY_TAB_PATHS`**

Delete the line `'/reports',` from the array. Result:

```ts
export const PRIMARY_TAB_PATHS = [
  '/',
  '/home',
  '/sales',
  '/inventory',
  '/customers',
  '/more',
  '/utang',
  '/sell',
] as const;
```

- [ ] **Step 3: Replace `HOME_SUB_TABS`**

```ts
export const HOME_SUB_TABS = ['overview', 'reports'] as const;
```

`HomeSubTab` follows automatically since it's derived from `HOME_SUB_TABS`.

- [ ] **Step 4: Replace `MORE_SUB_TABS`**

```ts
export const MORE_SUB_TABS = ['insights', 'sync', 'settings'] as const;
```

`MoreSubTab` follows automatically.

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit -p . 2>&1 | grep -E "(constants/tabs\.ts|home/|DashboardHeader|DashboardQuickActions|TodayTransactionLog|HourlySalesTimeline)"`
Expected: errors in `DashboardHeader.tsx` (still uses `'today'`), `app/(tabs)/home/_layout.tsx` (still uses `'today'`), and `components/home/index.ts` (still re-exports files we'll delete). Those are fixed in Tasks 02-05. No new errors anywhere else.

- [ ] **Step 6: Commit**

```bash
git add constants/tabs.ts
git commit -m "feat(home): narrow HOME_SUB_TABS to overview and reports"
```

---

## Task 02: Update `DashboardHeader` to render 2 chips (`Overview`, `Reports`)

**Files:**

- Modify: `components/home/DashboardHeader.tsx:5, 22-25`

**Interfaces:**

- Consumes: narrowed `HomeSubTab = 'index' | 'reports'` from Task 01.
- Produces: `tabs` array has only two entries — `index` (Overview, `th-large` icon) and `reports` (Reports, `bar-chart` icon). `HomeSubTab` export reflects the narrower union.

- [ ] **Step 1: Locate the `HomeSubTab` type and the `tabs` array**

At line 5:

```ts
export type HomeSubTab = 'index' | 'today';
```

Inside the component body (lines 22-25):

```ts
const tabs = [
  { key: 'index', label: 'Overview', icon: 'th-large' },
  { key: 'today', label: 'Today', icon: 'calendar' },
] satisfies SubTabItem<HomeSubTab>[];
```

- [ ] **Step 2: Replace the type**

```ts
export type HomeSubTab = 'index' | 'reports';
```

- [ ] **Step 3: Replace the `tabs` array**

```ts
const tabs = [
  { key: 'index', label: 'Overview', icon: 'th-large' },
  { key: 'reports', label: 'Reports', icon: 'bar-chart' },
] satisfies SubTabItem<HomeSubTab>[];
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit -p . 2>&1 | grep -E "(components/home/DashboardHeader|app/\(tabs\)/home/_layout)"`
Expected: errors only in `app/(tabs)/home/_layout.tsx` (still uses `'today'`). Tasks 03-04 fix.

- [ ] **Step 5: Commit**

```bash
git add components/home/DashboardHeader.tsx
git commit -m "feat(home): replace today tab with reports in dashboard header"
```

---

## Task 03: Register `reports` sub-tab in `app/(tabs)/home/_layout.tsx`

**Files:**

- Modify: `app/(tabs)/home/_layout.tsx:22-25, 53-54`

**Interfaces:**

- Consumes: narrowed `HomeSubTab` from Task 02 (already `'index' | 'reports'`).
- Produces: `getCurrentTab` switches on `'reports'`. The `<TopTabs.Screen name="today" />` becomes `<TopTabs.Screen name="reports" />`.

- [ ] **Step 1: Replace `getCurrentTab`**

Inside the file, replace:

```ts
const getCurrentTab = (): HomeSubTab => {
  if (pathname.includes('today')) return 'today';
  return 'index';
};
```

with:

```ts
const getCurrentTab = (): HomeSubTab => {
  if (pathname.includes('reports')) return 'reports';
  return 'index';
};
```

- [ ] **Step 2: Swap the `TopTabs.Screen`**

Replace:

```tsx
        <TopTabs.Screen name="index" />
        <TopTabs.Screen name="today" />
```

with:

```tsx
        <TopTabs.Screen name="index" />
        <TopTabs.Screen name="reports" />
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit -p . 2>&1 | grep -E "(components/home/DashboardHeader|app/\(tabs\)/home/_layout|components/home/index)" | head -20`
Expected: errors in `components/home/index.ts` (still re-exports `HourlySalesTimeline`, `TodayTransactionLog`, `TodaySnapshotSkeleton`) and possibly `app/(tabs)/today.tsx` if it still imports things. Tasks 04-05 fix.

- [ ] **Step 4: Commit**

```bash
git add "app/(tabs)/home/_layout.tsx"
git commit -m "feat(home): swap today sub-tab for reports in home layout"
```

---

## Task 04: Move `app/(tabs)/reports/index.tsx` to `app/(tabs)/home/reports.tsx`

**Files:**

- Create: `app/(tabs)/home/reports.tsx`
- Delete: `app/(tabs)/reports/index.tsx` (and the empty parent directory `app/(tabs)/reports/` if it becomes empty)

**Interfaces:**

- Consumes: the existing `app/(tabs)/reports/index.tsx` content (841 lines).
- Produces: a new file at `app/(tabs)/home/reports.tsx` with the same imports and JSX, except the outer `<View className="flex-1 bg-paper-200">` and its closing `</View>` are removed (the Home layout already wraps the body in `<View className="flex-1 bg-paper-200">`).

- [ ] **Step 1: Read `app/(tabs)/reports/index.tsx` carefully**

Specifically note:

- The current wrapping is:

  ```tsx
  return (
    <View className="flex-1 bg-paper-200">
      <View className="flex-1 bg-paper-200">
        <AlmanacMasthead ... />
        <ScrollView ...>
          {/* ...all sections... */}
        </ScrollView>
      </View>
    </View>
  );
  ```

  That's **two nested `<View className="flex-1 bg-paper-200">`** wrappers (lines 200 and 201).

- [ ] **Step 2: Create `app/(tabs)/home/reports.tsx` with the same content minus the wrappers**

The new file is identical to `app/(tabs)/reports/index.tsx` EXCEPT:

- The outer two `<View>` wrappers and their closing `</View>` tags are removed.
- The `default export function Reports()` becomes `default export function ReportsScreen()` (purely a name change; the file name is `reports.tsx`, but the component name being `Reports` would conflict with the export). Actually — keep the name `Reports` to minimize the diff and avoid unused name churn. The Home `_layout.tsx` uses `<TopTabs.Screen name="reports" />` which doesn't care about the export name.

  Final structure:

  ```tsx
  import { StyledText } from '@/components/elements';
  import {
    CreditAgingChart,
    StockMovementDetails,
    // ... all existing imports unchanged
  } from '@/components/reports';
  // ... all other imports unchanged (router, hooks, react-native, etc.)

  const EMPTY_ARRAY: any[] = [];
  // ... all consts (DEFAULT_KPIS, DEFAULT_SALES_BREAKDOWN, etc.) unchanged

  export default function Reports() {
    // ... full body unchanged ...
    return (
      <>
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
          {/* ...all sections (DateRangeSelector, BentoGrid, CollapsibleSection, etc.) unchanged... */}
        </ScrollView>
      </>
    );
  }

  // CashSessionRow helper at the bottom unchanged
  ```

  Note: the original return used `View` as root — replacing with a fragment (`<>...</>`) requires removing the `View` import if it's unused after the change. Check that `View` is still used inside the JSX (e.g., in `CashSessionRow`'s returned Pressable > View); if not, remove `View` from the `react-native` import.

- [ ] **Step 3: Verify both files exist briefly before deleting**

Run:

```bash
ls -la 'D:\giomj\Projects\sarisari\app\(tabs)\home\reports.tsx'
```

Expected: file exists.

- [ ] **Step 4: Verify `tsc` is clean for the new file**

Run: `npx tsc --noEmit -p . 2>&1 | grep -E "reports\.tsx" | head -10`
Expected: no errors referencing the new path. (Errors may still exist for `app/(tabs)/reports/index.tsx` — that's fine, we delete it next.)

- [ ] **Step 5: Delete `app/(tabs)/reports/index.tsx` and the empty parent directory**

```bash
rm "app/(tabs)/reports/index.tsx"
rmdir "app/(tabs)/reports" 2>/dev/null || true
```

If `rmdir` fails because the directory is non-empty, leave it. Verify:

```bash
ls 'D:\giomj\Projects\sarisari\app\(tabs)\reports' 2>/dev/null && echo "STILL EXISTS" || echo "REMOVED"
```

Expected: `REMOVED`.

- [ ] **Step 6: Verify the full typecheck filter**

Run: `npx tsc --noEmit -p . 2>&1 | grep -E "(app/\(tabs\)/home/reports|app/\(tabs\)/reports|components/home)" | head -20`
Expected: errors only in `components/home/index.ts` (re-exports soon-to-be-deleted files). Tasks 05-06 fix.

- [ ] **Step 7: Commit**

```bash
git add -A "app/(tabs)/home/reports.tsx" "app/(tabs)/reports/"
git commit -m "feat(home): move reports screen into home sub-tab"
```

(If `app/(tabs)/reports/` was successfully removed, `-A` will stage the deletion of the directory. If `rmdir` failed, list the leftover file explicitly.)

---

## Task 05: Delete `app/(tabs)/today.tsx` and orphaned `Today`-related components

**Files:**

- Delete: `app/(tabs)/today.tsx` (file is from the previous home-tab-improv plan; if it doesn't exist, skip)
- Delete: `components/home/HourlySalesTimeline.tsx`
- Delete: `components/home/TodayTransactionLog.tsx`
- Modify: `components/home/index.ts` (drop the re-exports)

**Interfaces:**

- Consumes: nothing.
- Produces: those files no longer exist. `components/home/index.ts` no longer re-exports `HourlySalesTimeline`, `TodayTransactionLog`, `TodaySnapshotSkeleton`, `SalesTargetCard`, `CashSessionCard`, `DashboardDailyPulse`, `DashboardContextHeader`, `DashboardSkeleton`.

  Wait — `DashboardDailyPulse`, `DashboardContextHeader`, `DashboardSkeleton` are not in the spec's "delete this" list. Check before deleting.

- [ ] **Step 1: Verify no remaining importers of soon-to-be-deleted files**

Run:

```bash
grep -rn "HourlySalesTimeline\|TodayTransactionLog\|TodaySnapshotSkeleton\|SalesTargetCard\|CashSessionCard" 'D:\giomj\Projects\sarisari\app' 'D:\giomj\Projects\sarisari\components' 'D:\giomj\Projects\sarisari\hooks' 'D:\giomj\Projects\sarisari\tests' 2>&1 | head -20
```

Expected: zero hits outside the files about to be deleted.

- [ ] **Step 2: Verify `DashboardDailyPulse`, `DashboardContextHeader`, `DashboardSkeleton` are not used by Overview**

Run:

```bash
grep -rn "DashboardDailyPulse\|DashboardContextHeader\|DashboardSkeleton" 'D:\giomj\Projects\sarisari\app' 'D:\giomj\Projects\sarisari\components' 'D:\giomj\Projects\sarisari\hooks' 2>&1 | head -20
```

Expected: zero hits. These are orphans from the previous plan's spec ("DashboardContextHeader and DashboardDailyPulse stay exported even though they remain orphaned"). Per the spec, **keep them** in `index.ts` for now. Only delete the Today-related re-exports.

- [ ] **Step 3: Delete the files**

```bash
rm "components/home/HourlySalesTimeline.tsx"
rm "components/home/TodayTransactionLog.tsx"
```

If `app/(tabs)/today.tsx` exists:

```bash
rm "app/(tabs)/today.tsx"
```

If `app/(tabs)/today.tsx` does not exist (already deleted): silently skip.

- [ ] **Step 4: Update `components/home/index.ts`**

Replace the current contents (lines 1-20):

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

with:

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
export * from './HomeOverviewSkeleton';
```

(`'./HourlySalesTimeline'`, `'./SalesTargetCard'`, `'./CashSessionCard'`, `'./TodayTransactionLog'`, and `'./TodaySnapshotSkeleton'` re-exports are removed.)

- [ ] **Step 5: Verify zero new home-tab errors**

Run: `npx tsc --noEmit -p . 2>&1 | grep -E "(components/home|app/\(tabs\)/home|app/\(tabs\)/today|app/\(tabs\)/reports)" | head -20`
Expected: zero errors. (Pre-existing 418 errors elsewhere are unchanged.)

- [ ] **Step 6: Commit**

```bash
git add -A components/home/ "app/(tabs)/today.tsx" 2>/dev/null || git add -A components/home/
git commit -m "feat(home): delete today sub-tab and orphaned components"
```

(`-A` handles the case where `app/(tabs)/today.tsx` doesn't exist; `-A` stages only the deletions that actually happened.)

---

## Task 06: Delete `app/more/reports.tsx`

**Files:**

- Delete: `app/more/reports.tsx`

**Interfaces:**

- Consumes: nothing.
- Produces: `app/more/reports.tsx` no longer exists. The More tab's sub-tab list shrinks from 4 to 3 entries.

- [ ] **Step 1: Verify no remaining importers**

Run:

```bash
grep -rn "app/more/reports\|more/reports" 'D:\giomj\Projects\sarisari\app' 'D:\giomj\Projects\sarisari\components' 'D:\giomj\Projects\sarisari\hooks' 2>&1 | head -20
```

Expected: zero hits outside the file to delete.

- [ ] **Step 2: Delete the file**

```bash
rm 'D:\giomj\Projects\sarisari\app\more\reports.tsx'
```

- [ ] **Step 3: Verify the typecheck is still clean**

Run: `npx tsc --noEmit -p . 2>&1 | grep -E "(app/more|app/\(tabs\)/home|app/\(tabs\)/reports)" | head -20`
Expected: zero errors. The More tab is mounted via `app/more/_layout.tsx` (which is empty, so it uses the default layout). The More sub-tabs are referenced from `MORE_SUB_TABS`, but `MORE_SUB_TABS` is currently a const used... where? Let me check.

- [ ] **Step 4: Confirm `MORE_SUB_TABS` is used somewhere or stays orphaned**

Run:

```bash
grep -rn "MORE_SUB_TABS\|MoreSubTab" 'D:\giomj\Projects\sarisari\app' 'D:\giomj\Projects\sarisari\components' 'D:\giomj\Projects\sarisari\hooks' 2>&1 | head -20
```

Expected: zero hits (the const may be unused — that's pre-existing, not introduced by this plan). If `MORE_SUB_TABS` is truly unused, leave it as-is; per the spec, the focus is on the Home sub-tab change, not refactoring the More tab.

- [ ] **Step 5: Commit**

```bash
git add -A app/more/reports.tsx
git commit -m "feat(more): delete duplicate reports screen"
```

(If the file already exists in git, `-A` stages the deletion. If it was never tracked, `git rm` will fail; use `git add -A`.)

---

## Task 07: Sweep `router.push('/reports')` callers to `/(tabs)/home/reports`

**Files:**

- Modify: `components/layout/StoreHeader.tsx:47`
- Modify: `app/(tabs)/home/index.tsx:48, 60, 136, 141, 165`

**Interfaces:**

- Consumes: nothing from earlier tasks.
- Produces: every `router.push('/reports' as Href)` becomes `router.push('/(tabs)/home/reports' as Href)`. Both URLs resolve to the same screen via expo-router, but the explicit `(tabs)` form keeps the navigation tree readable.

- [ ] **Step 1: Locate all `/reports` push calls**

Run:

```bash
grep -rn "router.push.*'/reports'\|router.push.*\"/reports\"" 'D:\giomj\Projects\sarisari\app' 'D:\giomj\Projects\sarisari\components' 'D:\giomj\Projects\sarisari\hooks' 2>&1 | head -20
```

Expected: 6 hits — `StoreHeader.tsx:47` and 5 in `app/(tabs)/home/index.tsx` (lines 48, 60, 136, 141, 165).

- [ ] **Step 2: Update `StoreHeader.tsx`**

Replace:

```ts
router.push('/reports' as Href);
```

(line 47, inside `handleSeeAll`)

with:

```ts
router.push('/(tabs)/home/reports' as Href);
```

- [ ] **Step 3: Update `app/(tabs)/home/index.tsx`**

There are 5 `'/reports'` literals. **All become `'/reports' as Href` → `'(tabs)/home/reports' as Href`**:

- Line 48 (in `handleGoalAction` map):

  ```ts
      reports: '/reports',
  ```

  becomes:

  ```ts
      reports: '/(tabs)/home/reports',
  ```

- Line 60 (in `handleSuggestionPress` map):

  ```ts
      reports: '/reports',
  ```

  becomes:

  ```ts
      reports: '/(tabs)/home/reports',
  ```

- Line 136 (`DashboardKPIGrid` `onDetailsPress`):

  ```ts
            onDetailsPress={() => router.push('/reports' as Href)}
  ```

  becomes:

  ```ts
            onDetailsPress={() => router.push('/(tabs)/home/reports' as Href)}
  ```

- Line 141 (`DashboardKPIGrid` `onKpiPress` else branch):

  ```ts
              else router.push('/reports' as Href);
  ```

  becomes:

  ```ts
              else router.push('/(tabs)/home/reports' as Href);
  ```

- Line 165 (`DashboardQuickActions` `onOpenReports`):

  ```ts
            onOpenReports={() => router.push('/reports' as Href)}
  ```

  becomes:

  ```ts
            onOpenReports={() => router.push('/(tabs)/home/reports' as Href)}
  ```

- [ ] **Step 4: Verify the sweep is complete**

Run:

```bash
grep -rn "router.push.*'/reports'\|router.push.*\"/reports\"\|reports: '/reports'" 'D:\giomj\Projects\sarisari\app' 'D:\giomj\Projects\sarisari\components' 'D:\giomj\Projects\sarisari\hooks' 2>&1 | head -20
```

Expected: zero hits.

- [ ] **Step 5: Verify the typecheck is still clean**

Run: `npx tsc --noEmit -p . 2>&1 | grep -E "(components/layout/StoreHeader|app/\(tabs\)/home/index)" | head -20`
Expected: zero errors.

- [ ] **Step 6: Commit**

```bash
git add components/layout/StoreHeader.tsx "app/(tabs)/home/index.tsx"
git commit -m "feat(home): route '/reports' callers to '/(tabs)/home/reports'"
```

---

## Task 08: Verify `tests/components/DashboardScreen.test.tsx` mock shape

**Files:**

- Modify: `tests/components/DashboardScreen.test.tsx` (only if the mock still references the old `HomeSubTab` union or `'today'`)

**Interfaces:**

- Consumes: nothing.
- Produces: the test file passes the typecheck (or stays as-is if it doesn't reference the changed shape).

- [ ] **Step 1: Read the test file**

Run: `Read 'D:\giomj\Projects\sarisari\tests\components\DashboardScreen.test.tsx'`

Look for:

- Any reference to `'today'` or `'alerts'`.
- Any use of `HomeSubTab` from `@/components/home`.
- Any `useHomeDashboardData` mock that hardcodes the old union.

- [ ] **Step 2: Update the mock if needed**

If the test references `'today'` anywhere, replace with `'reports'`.

If the test mocks `HomeSubTab` directly (unlikely), update the union to `'index' | 'reports'`.

If the test mocks `useHomeDashboardData` with a return shape that includes `subTabTab` or similar, leave it — it doesn't.

- [ ] **Step 3: Run the typecheck**

Run: `npx tsc --noEmit -p . 2>&1 | grep -E "tests/components/DashboardScreen" | head -20`
Expected: zero errors.

- [ ] **Step 4: Test the dashboard screen renders**

Run: `npx jest tests/components/DashboardScreen.test.tsx 2>&1 | tail -30`
Expected: PASS or the same pre-existing infrastructure failure (the `expo-blur` / `EventEmitter` Jest setup issue). If it's the pre-existing failure, document it and move on — this is out of scope for this plan.

- [ ] **Step 5: Commit (only if changes were made)**

```bash
git add tests/components/DashboardScreen.test.tsx
git commit -m "test(home): update dashboard screen mock for narrowed HomeSubTab"
```

(If no changes were made, skip this step.)

---

## Task 09: Manual smoke test checklist

**Files:** none.

- [ ] **Step 1: Bring the dev server up**

Run: `npx expo start`
Expected: bundler reachable; app launches on simulator/device.

- [ ] **Step 2: Verify Home tab now has 2 sub-tabs**

Open Home. The segmented control shows two chips: "Overview" and "Reports". No "Today" chip.

Expected: tapping the Reports chip swaps the body to the Reports editorial layout (AlmanacMasthead, date range selector, BentoGrid, etc.).

- [ ] **Step 3: Verify swipe between Overview and Reports**

Swipe left from Overview → Reports. Swipe right from Reports → Overview. Both work.

- [ ] **Step 4: Verify pull-to-refresh on Reports**

Drag down on the Reports screen. The cinammon-tinted spinner should appear, and the queries should refetch.

- [ ] **Step 5: Verify bell "See all alerts" lands on Reports**

Tap the bell in `StoreHeader`. The `NotificationSheet` opens. Tap "See all alerts".

Expected: navigates to the Reports sub-tab of Home (the segmented chip flips to Reports).

- [ ] **Step 6: Verify `/reports` URL returns 404**

Open a deep link or use the dev tools URL bar to navigate to `/reports` (or `http://localhost:8081/reports`).

Expected: app shows the `+not-found.tsx` screen (the route is gone).

- [ ] **Step 7: Verify `/(tabs)/home/reports` deep links work**

Open `/(tabs)/home/reports` directly.

Expected: Home renders with the Reports sub-tab active.

- [ ] **Step 8: Verify the More tab no longer shows Reports**

Open the More tab. The sub-tabs are: Insights, Sync, Settings. No "Reports" entry.

- [ ] **Step 9: Verify the rest of the app still works**

Tap Sales, Inventory, Customers, More — each loads. The back-button exit-toast still works on the primary tabs.

- [ ] **Step 10: Commit any review fixes**

```bash
git add -A
git commit -m "chore(home): apply review fixes from smoke test"
```

---

## Task 10: Final typecheck and report

**Files:** none.

- [ ] **Step 1: Run the full typecheck and count errors**

Run:

```bash
npx tsc --noEmit -p . 2>&1 | tee /tmp/tsc-after.txt | wc -l
```

Expected: still 418 lines (the pre-existing errors in `tests/database/*`, `tests/onboarding/*`, `tests/components/utang/*`, and `utils/alert.ts` are unchanged). Zero new errors in any home tab file.

- [ ] **Step 2: Verify zero new errors in the changed files**

Run: `grep -E "(components/home|app/\(tabs\)/home|app/\(tabs\)/reports|app/more/reports|components/layout/StoreHeader|constants/tabs)" /tmp/tsc-after.txt | head -20`
Expected: zero matches.

- [ ] **Step 3: Verify the test file sweep is clean**

Run: `npx jest tests/components/HomeSkeletons.test.tsx 2>&1 | tail -10`
Expected: same pre-existing `expo-blur` / `EventEmitter` failure (out of scope). The plan's test file from the previous home-tab-improv plan is unchanged.

- [ ] **Step 4: Summary report**

Print the final commit log:

```bash
git log --oneline -10
```

Expected: the commits from Tasks 01-09 appear at the top of the log, on `revamp/more-tabs`.

If the user asks, push the branch (do not auto-push):

```bash
git push origin revamp/more-tabs
```

---

## Task Index

| #   | Task                                                                                 | Files                                                                                                                                    |
| --- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | Narrow `HOME_SUB_TABS` and `MORE_SUB_TABS`; drop `/reports` from `PRIMARY_TAB_PATHS` | `constants/tabs.ts`                                                                                                                      |
| 02  | Update `DashboardHeader` to render 2 chips (`Overview`, `Reports`)                   | `components/home/DashboardHeader.tsx`                                                                                                    |
| 03  | Register `reports` sub-tab in `app/(tabs)/home/_layout.tsx`                          | `app/(tabs)/home/_layout.tsx`                                                                                                            |
| 04  | Move `app/(tabs)/reports/index.tsx` → `app/(tabs)/home/reports.tsx`                  | `app/(tabs)/home/reports.tsx`, `app/(tabs)/reports/index.tsx`                                                                            |
| 05  | Delete `app/(tabs)/today.tsx` and orphaned `Today`-related components                | `app/(tabs)/today.tsx`, `components/home/HourlySalesTimeline.tsx`, `components/home/TodayTransactionLog.tsx`, `components/home/index.ts` |
| 06  | Delete `app/more/reports.tsx`                                                        | `app/more/reports.tsx`                                                                                                                   |
| 07  | Sweep `router.push('/reports')` callers to `/(tabs)/home/reports`                    | `components/layout/StoreHeader.tsx`, `app/(tabs)/home/index.tsx`                                                                         |
| 08  | Verify `tests/components/DashboardScreen.test.tsx` mock shape                        | `tests/components/DashboardScreen.test.tsx`                                                                                              |
| 09  | Manual smoke test checklist                                                          | —                                                                                                                                        |
| 10  | Final typecheck and report                                                           | —                                                                                                                                        |
