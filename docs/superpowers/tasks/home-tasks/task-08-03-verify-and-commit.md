# Task 08-03: Verify typecheck and commit Overview rewrite

> Parent Plan: [2026-08-01-home-tab-improv.md](../../plans/2026-08-01-home-tab-improv.md)
> Index: [00-task-index.md](./00-task-index.md)

## Goal

Run `tsc --noEmit` and confirm the screen compiles, then commit.

## Dependencies

- [08-02](./task-08-02-embed-sections.md)

## Files

- Modify: `app/(tabs)/home/index.tsx` (already rewritten in 08-01..08-02)

## Steps

- [ ] **Step 1: Run TypeScript typecheck**

Run: `npx tsc --noEmit -p .`

Expected: clean. If any errors remain, double-check:

- `StyledText` is imported from `@/components/elements`.
- `useTabBarBottomOffset` is exported from `@/components/layout`.
- `HomeRecommendation` and `HomeDestination` are exported from `@/components/home` (re-exported from `home-state`).

- [ ] **Step 2: Commit**

```bash
git add "app/(tabs)/home/index.tsx"
git commit -m "feat(home): rewrite overview as single-column at-a-glance"
```

## Next

Proceed to [Task 09](./task-09-slim-home-today.md).