# Task 06-07: Verify typecheck and commit useHomeDashboardData changes

> Parent Plan: [2026-08-01-home-tab-improv.md](../../plans/2026-08-01-home-tab-improv.md)
> Index: [00-task-index.md](./00-task-index.md)

## Goal

Run `tsc --noEmit` and confirm the hook file compiles cleanly, then commit.

## Dependencies

- [06-06](./task-06-06-return-shape.md)

## Files

- Modify: `hooks/useHomeDashboardData.ts` (already changed in 06-01..06-06)

## Steps

- [ ] **Step 1: Run TypeScript typecheck**

Run: `npx tsc --noEmit -p .`

Expected: errors only in `DashboardKPIGrid.tsx` and `app/(tabs)/home/index.tsx` (they reference the old `profitMargin: number` type). Tasks 07 and 08 fix them.

- [ ] **Step 2: Commit**

```bash
git add hooks/useHomeDashboardData.ts
git commit -m "feat(home): expose goal, suggestions, isError, real profitMargin"
```

## Next

Proceed to [Task 07](./task-07-slim-dashboard-kpi-grid.md).