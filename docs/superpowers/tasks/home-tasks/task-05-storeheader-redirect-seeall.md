# Task 05: Re-route StoreHeader.handleSeeAll to /reports

> Parent Plan: [2026-08-01-home-tab-improv.md](../../plans/2026-08-01-home-tab-improv.md)
> Index: [00-task-index.md](./00-task-index.md)

## Goal

Change the "See all alerts" CTA inside `NotificationSheet` (mounted by `StoreHeader`) to navigate to `/reports` instead of the soon-to-be-deleted `/home/alerts` route.

## Dependencies

- None

## Files

- Modify: `components/layout/StoreHeader.tsx:45-48`

## Steps

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

## Next

Proceed to [Task 06](./task-06-01-imports-and-prereqs.md).