# Task 01-03: Verify typecheck and commit

> Parent Plan: [2026-08-01-home-tab-improv.md](../../plans/2026-08-01-home-tab-improv.md)
> Index: [00-task-index.md](./00-task-index.md)

## Goal

Run `tsc --noEmit` and confirm the only errors are in `DashboardHeader.tsx` and `app/(tabs)/home/_layout.tsx` (each references `'alerts'`). Commit the change to `constants/tabs.ts`.

## Dependencies

- [01-02](./task-01-02-narrow-tabs.md)

## Files

- Modify: `constants/tabs.ts` (already changed in 01-02)

## Steps

- [ ] **Step 1: Run TypeScript typecheck**

Run: `npx tsc --noEmit -p .`

Expected: errors only in:

- `components/home/DashboardHeader.tsx` — `tabs` array still has the `'alerts'` entry.
- `app/(tabs)/home/_layout.tsx` — `getCurrentTab` still branches on `'alerts'`.

No new errors anywhere else. If you see errors in unrelated files, revert and investigate before proceeding.

- [ ] **Step 2: Commit**

```bash
git add constants/tabs.ts
git commit -m "feat(home): narrow HOME_SUB_TABS to overview and today"
```

## Next

Proceed to [Task 02](./task-02-narrow-dashboard-header-tabs.md).