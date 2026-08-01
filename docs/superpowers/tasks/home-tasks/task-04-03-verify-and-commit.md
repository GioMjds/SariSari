# Task 04-03: Verify typecheck and commit

> Parent Plan: [2026-08-01-home-tab-improv.md](../../plans/2026-08-01-home-tab-improv.md)
> Index: [00-task-index.md](./00-task-index.md)

## Goal

Run `tsc --noEmit` and confirm the file is clean, then commit.

## Dependencies

- [04-02](./task-04-02-clean-unused-imports.md)

## Files

- Modify: `components/home/DashboardHeader.tsx` (already changed in 04-01..04-02)

## Steps

- [ ] **Step 1: Run TypeScript typecheck**

Run: `npx tsc --noEmit -p .`

Expected: clean. If any errors remain in `app/(tabs)/home/_layout.tsx`, ensure the `alertCount={0}` prop was already removed there in [Task 03-03](./task-03-03-update-dashboard-header-jsx.md).

- [ ] **Step 2: Commit**

```bash
git add components/home/DashboardHeader.tsx
git commit -m "refactor(home): remove bell from dashboard header"
```

## Next

Proceed to [Task 05](./task-05-storeheader-redirect-seeall.md).