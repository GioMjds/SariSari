# Task 01-01: Locate HOME_SUB_TABS const and HomeSubTab type

> Parent Plan: [2026-08-01-home-tab-improv.md](../../plans/2026-08-01-home-tab-improv.md)
> Index: [00-task-index.md](./00-task-index.md)

## Goal

Open `constants/tabs.ts` and locate the two lines that define `HOME_SUB_TABS` and the `HomeSubTab` derived type. This is the foundation for narrowing Home to 2 sub-tabs.

## Dependencies

- None

## Files

- Modify: `constants/tabs.ts` (read-only in this step)

## Steps

- [ ] **Step 1: Read `constants/tabs.ts` to confirm line numbers**

Confirm the file contains:

```ts
// line 66
export const HOME_SUB_TABS = ['overview', 'today', 'alerts'] as const;

// line 82
export type HomeSubTab = (typeof HOME_SUB_TABS)[number];
```

If line numbers shift in your local copy, that is fine — the shapes above are what to match. Verify by reading the file directly.

- [ ] **Step 2: Note downstream consumers of `'alerts'`**

Both `DashboardHeader.tsx` and `app/(tabs)/home/_layout.tsx` reference `'alerts'` in their `tabs` arrays. Removing it from `HOME_SUB_TABS` will produce type errors there until Tasks 02 and 03 fix them. This is expected.

## Commit

None — read-only step.
