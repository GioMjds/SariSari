# Task 09: Slim home/today.tsx and add RefreshControl

> Parent Plan: [2026-08-01-home-tab-improv.md](../../plans/2026-08-01-home-tab-improv.md)
> Index: [00-task-index.md](./00-task-index.md)

## Goal

Drop `SalesTargetCard` and `CashSessionCard` from the Today screen, slim its render tree to just `HourlySalesTimeline` + `TodayTransactionLog`, and add a pull-to-refresh `RefreshControl`.

## Dependencies

- [06-07](./task-06-07-verify-and-commit.md)

## Files

- Modify: `app/(tabs)/home/today.tsx`

## Steps

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

Inside `TodayScreen`, replace the existing destructure:

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

with:

```tsx
const { hourlySales, recentSales, isLoading, refreshing, refetchAll } =
  useHomeDashboardData();
```

(`currentSession` and `stats` are unused after removing `CashSessionCard` and `SalesTargetCard`. Drop them from the destructure to keep the lint clean.)

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

## Next

Proceed to [Task 10](./task-10-update-overview-skeleton.md).