# Task 06-04: Compute goal and suggestions via resolveHomeState

> Parent Plan: [2026-08-01-home-tab-improv.md](../../plans/2026-08-01-home-tab-improv.md)
> Index: [00-task-index.md](./00-task-index.md)

## Goal

Call `resolveHomeState(homeStateInput)` once inside a memo and destructure the result into `goal` and `suggestions`.

## Dependencies

- [06-03](./task-06-03-resolve-home-state-input.md)

## Files

- Modify: `hooks/useHomeDashboardData.ts`

## Steps

- [ ] **Step 1: Add the memoized destructure**

After the `homeStateInput` memo:

```ts
const { goal, suggestions } = useMemo(
  () => resolveHomeState(homeStateInput),
  [homeStateInput],
);
```

`goal` is a `HomeRecommendation`. `suggestions` is a `HomeRecommendation[]`. Both are pure functions of `homeStateInput`.

## Commit

None yet — verification + commit happen in `task-06-07`.