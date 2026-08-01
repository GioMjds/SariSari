# Task 11-03: Remove deleted exports from components/home/index.ts

> Parent Plan: [2026-08-01-home-tab-improv.md](../../plans/2026-08-01-home-tab-improv.md)
> Index: [00-task-index.md](./00-task-index.md)

## Goal

Drop the three `export * from ...` lines for the now-deleted components so the barrel no longer points at missing files.

## Dependencies

- [11-02](./task-11-02-delete-files.md)

## Files

- Modify: `components/home/index.ts`

## Steps

- [ ] **Step 1: Delete the three export lines**

In `components/home/index.ts`, delete these three lines:

```ts
export * from './AlertCardItem';
export * from './AlertFilterPills';
export * from './HomeAlertsSkeleton';
```

The file should retain exports for the now-revived components (`DashboardGoalCard`, `DashboardSuggestions`, `DashboardStockAlert`, `DashboardEmptyState`, `DashboardErrorState`) and the existing live ones. Verify by reading the resulting file contains (at minimum):

```ts
export * from './home-state';
export * from './DashboardContextHeader';
export * from './DashboardGoalCard';
export * from './DashboardSuggestions';
export * from './DashboardStockAlert';
export * from './DashboardQuickActions';
export * from './DashboardDailyPulse';
export * from './DashboardRecentSales';
export * from './DashboardEmptyState';
export * from './DashboardSkeleton';
export * from './DashboardErrorState';
export * from './DashboardHeader';
export * from './DashboardKPIGrid';
export * from './MiniInsightsCard';
export * from './HourlySalesTimeline';
export * from './SalesTargetCard';
export * from './CashSessionCard';
export * from './TodayTransactionLog';
export * from './HomeOverviewSkeleton';
export * from './TodaySnapshotSkeleton';
```

`DashboardContextHeader` and `DashboardDailyPulse` stay exported even though they remain orphaned (matches the spec's Out-of-Scope section).

## Commit

None yet — verification + commit happen in `task-11-04`.