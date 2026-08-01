# Task 10: Update HomeOverviewSkeleton layout for new sections

> Parent Plan: [2026-08-01-home-tab-improv.md](../../plans/2026-08-01-home-tab-improv.md)
> Index: [00-task-index.md](./00-task-index.md)

## Goal

Expand the skeleton `layout` array to mirror the seven Overview sections (hero, KPI grid, goal card, quick actions, suggestions, recent sales, top seller) so loading state has no layout shift.

## Dependencies

- [06-07](./task-06-07-verify-and-commit.md)

## Files

- Modify: `components/home/HomeOverviewSkeleton.tsx`

## Steps

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

## Next

Proceed to [Task 11](./task-11-01-verify-importers.md).