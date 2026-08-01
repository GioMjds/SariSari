# Task 03-03: Drop alertCount and onNotificationPress from DashboardHeader JSX

> Parent Plan: [2026-08-01-home-tab-improv.md](../../plans/2026-08-01-home-tab-improv.md)
> Index: [00-task-index.md](./00-task-index.md)

## Goal

Stop passing `onNotificationPress` to `<DashboardHeader>` and pass `alertCount={0}` for prop-shape compatibility until Task 04 strips the prop entirely.

## Dependencies

- [03-02](./task-03-02-drop-alerts-screen.md)

## Files

- Modify: `app/(tabs)/home/_layout.tsx`

## Steps

- [ ] **Step 1: Replace the `<DashboardHeader ...>` block**

Replace the entire `<DashboardHeader ...>` JSX with:

```tsx
<DashboardHeader
  storeName={storeName || ''}
  ownerInitials={ownerInitials || ''}
  activeTab={getCurrentTab()}
  alertCount={0}
  showTopHeader={false}
  onTabPress={handleTabPress}
/>
```

(`alertCount` is kept as `0` for prop-shape compatibility; Task 04 strips the prop from `DashboardHeader` once nothing else passes it.)

- [ ] **Step 2: Drop the now-unused imports**

The `useHomeDashboardData` import is still used for `profile` and `ownerName`, so keep it. `usePathname` and `useRouter` are still in use. No import changes in this step.

## Commit

None yet — verification + commit happen in `task-03-04`.