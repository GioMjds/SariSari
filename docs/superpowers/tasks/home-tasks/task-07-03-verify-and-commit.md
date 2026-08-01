# Task 07-03: Verify typecheck and commit DashboardKPIGrid changes

> Parent Plan: [2026-08-01-home-tab-improv.md](../../plans/2026-08-01-home-tab-improv.md)
> Index: [00-task-index.md](./00-task-index.md)

## Goal

Run `tsc --noEmit` and confirm only `app/(tabs)/home/index.tsx` has errors (it imports the old prop names), then commit.

## Dependencies

- [07-02](./task-07-02-remove-hero-and-store-summary.md)

## Files

- Modify: `components/home/DashboardKPIGrid.tsx` (already changed in 07-01..07-02)

## Steps

- [ ] **Step 1: Run TypeScript typecheck**

Run: `npx tsc --noEmit -p .`

Expected: errors only in `app/(tabs)/home/index.tsx` (it imports the old prop names). Task 08 fixes.

- [ ] **Step 2: Commit**

```bash
git add components/home/DashboardKPIGrid.tsx
git commit -m "refactor(home): slim DashboardKPIGrid to 2x2 only"
```

## Next

Proceed to [Task 08](./task-08-01-rewrite-overview-shell.md).