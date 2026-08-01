# Task 12: Update HomeSkeletons.test.tsx to drop HomeAlertsSkeleton

> Parent Plan: [2026-08-01-home-tab-improv.md](../../plans/2026-08-01-home-tab-improv.md)
> Index: [00-task-index.md](./00-task-index.md)

## Goal

Remove the import and test for the deleted `HomeAlertsSkeleton`. The remaining two tests continue to pass.

## Dependencies

- [11-04](./task-11-04-verify-and-commit.md)

## Files

- Modify: `tests/components/HomeSkeletons.test.tsx`

## Steps

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

## Next

Proceed to [Task 13](./task-13-add-profit-margin-test.md).