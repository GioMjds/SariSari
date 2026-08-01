# Task 15-08: Verify Today is slimmed down

> Parent Plan: [2026-08-01-home-tab-improv.md](../../plans/2026-08-01-home-tab-improv.md)
> Index: [00-task-index.md](./00-task-index.md)

## Goal

Confirm the Today sub-tab only renders `HourlySalesTimeline` + `TodayTransactionLog` and supports pull-to-refresh.

## Dependencies

- [15-01](./task-15-01-dev-server-up.md)

## Files

- None

## Steps

- [ ] **Step 1: Visual check**

Switch to the Today tab. The screen shows only:

- `HourlySalesTimeline` (Peak Sales Hours chart).
- `TodayTransactionLog` (up to 3 sales + "View all sales").

No `SalesTargetCard`, no `CashSessionCard`. Pull-to-refresh works.

## Next

Proceed to [Task 15-09](./task-15-09-alerts-404.md).