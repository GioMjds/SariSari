# Task 02: Update DashboardHeader to render 2 tabs

> Parent Plan: [2026-08-01-home-tab-improv.md](../../plans/2026-08-01-home-tab-improv.md)
> Index: [00-task-index.md](./00-task-index.md)

## Goal

Narrow the `HomeSubTab` type from three entries to two and drop the `'alerts'` entry from the `tabs` array in `DashboardHeader`. The bell icon + handlers stay in this step — Task 04 strips them. The `alertCount` prop also stays accepted (passed as `0`) until Task 04 removes it.

## Dependencies

- [01-03](./task-01-03-verify-and-commit.md)

## Files

- Modify: `components/home/DashboardHeader.tsx:7,28-32`

## Steps

- [ ] **Step 1: Locate the `HomeSubTab` type and the `tabs` array**

At the top of the file:

```ts
export type HomeSubTab = 'index' | 'today' | 'alerts';
```

Inside the component body:

```ts
const tabs = [
  { key: 'index', label: 'Overview', icon: 'th-large' },
  { key: 'today', label: 'Today', icon: 'calendar' },
  { key: 'alerts', label: 'Alerts', icon: 'bell', badgeCount: alertCount },
] satisfies SubTabItem<HomeSubTab>[];
```

- [ ] **Step 2: Replace the type**

```ts
export type HomeSubTab = 'index' | 'today';
```

- [ ] **Step 3: Remove the `'alerts'` entry**

```ts
const tabs = [
  { key: 'index', label: 'Overview', icon: 'th-large' },
  { key: 'today', label: 'Today', icon: 'calendar' },
] satisfies SubTabItem<HomeSubTab>[];
```

Keep accepting `alertCount` on the props interface for now (Task 03 may still pass it from `_layout.tsx`; Task 04 strips it together).

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit -p .`

Expected: errors only in `app/(tabs)/home/_layout.tsx` (still uses `'alerts'`). Task 03 fixes.

- [ ] **Step 5: Commit**

```bash
git add components/home/DashboardHeader.tsx
git commit -m "feat(home): drop alerts tab from dashboard header"
```

## Next

Proceed to [Task 03](./task-03-home-layout-2-subtabs.md).