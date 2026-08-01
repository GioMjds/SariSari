# Task 15-02: Verify Home tab now has 2 sub-tabs

> Parent Plan: [2026-08-01-home-tab-improv.md](../../plans/2026-08-01-home-tab-improv.md)
> Index: [00-task-index.md](./00-task-index.md)

## Goal

Open Home and confirm the segmented control shows only "Overview" and "Today" — no "Alerts" chip. Tapping the bell in the store header opens NotificationSheet with up to 3 alerts; tapping "See all alerts" navigates to `/reports`.

## Dependencies

- [15-01](./task-15-01-dev-server-up.md)

## Files

- None

## Steps

- [ ] **Step 1: Visual check**

Open Home. The segmented control shows "Overview" and "Today" only — no "Alerts" chip.

- [ ] **Step 2: Bell + See-all behavior**

Tapping the bell opens `NotificationSheet` with up to 3 alerts; tapping "See all alerts" navigates to `/reports`.

## Next

Proceed to [Task 15-03](./task-15-03-overview-order.md).