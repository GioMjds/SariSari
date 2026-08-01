# Task 03-01: Simplify getCurrentTab and remove unused handleNotificationPress

> Parent Plan: [2026-08-01-home-tab-improv.md](../../plans/2026-08-01-home-tab-improv.md)
> Index: [00-task-index.md](./00-task-index.md)

## Goal

Drop the `'alerts'` branch from `getCurrentTab` and remove the `handleNotificationPress` callback that points at `/home/alerts` (a route we are about to delete in Task 11).

## Dependencies

- [02-narrow-dashboard-header-tabs](./task-02-narrow-dashboard-header-tabs.md)

## Files

- Modify: `app/(tabs)/home/_layout.tsx:22-26,36-38`

## Steps

- [ ] **Step 1: Simplify `getCurrentTab`**

Replace:

```ts
const getCurrentTab = (): HomeSubTab => {
  if (pathname.includes('today')) return 'today';
  if (pathname.includes('alerts')) return 'alerts';
  return 'index';
};
```

with:

```ts
const getCurrentTab = (): HomeSubTab => {
  if (pathname.includes('today')) return 'today';
  return 'index';
};
```

- [ ] **Step 2: Remove the unused `handleNotificationPress` callback**

Delete this block:

```ts
const handleNotificationPress = () => {
  router.push('/(tabs)/home/alerts' as Href);
};
```

## Commit

None yet — verification + commit happen in `task-03-04`.