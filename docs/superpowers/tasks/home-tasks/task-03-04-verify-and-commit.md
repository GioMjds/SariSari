# Task 03-04: Verify typecheck and commit

> Parent Plan: [2026-08-01-home-tab-improv.md](../../plans/2026-08-01-home-tab-improv.md)
> Index: [00-task-index.md](./00-task-index.md)

## Goal

Run `tsc --noEmit` and confirm the file is clean, then commit.

## Dependencies

- [03-03](./task-03-03-update-dashboard-header-jsx.md)

## Files

- Modify: `app/(tabs)/home/_layout.tsx` (already changed in 03-01..03-03)

## Steps

- [ ] **Step 1: Run TypeScript typecheck**

Run: `npx tsc --noEmit -p .`

Expected: clean. (If `DashboardHeader` props include `onNotificationPress?` as optional, the missing prop is fine; we strip it in Task 04.)

- [ ] **Step 2: Commit**

```bash
git add "app/(tabs)/home/_layout.tsx"
git commit -m "feat(home): render 2 sub-tabs in home layout"
```

## Next

Proceed to [Task 04](./task-04-strip-dashboard-header-bell.md).