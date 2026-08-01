# Task 11-01: Verify no remaining importers of deleted alerts components

> Parent Plan: [2026-08-01-home-tab-improv.md](../../plans/2026-08-01-home-tab-improv.md)
> Index: [00-task-index.md](./00-task-index.md)

## Goal

Confirm that nothing in `app/`, `components/`, or `hooks/` still imports `AlertCardItem`, `AlertFilterPills`, `HomeAlertsSkeleton`, or the old `app/(tabs)/home/alerts` route before we delete those files.

## Dependencies

- [01-10](./task-01-03-verify-and-commit.md) through [10](./task-10-update-overview-skeleton.md) (any of them)

## Files

- None (read-only)

## Steps

- [ ] **Step 1: Grep for remaining references**

Run:

```bash
grep -rn "AlertCardItem\|AlertFilterPills\|HomeAlertsSkeleton\|alerts.tsx\|home/alerts" app/ components/ hooks/
```

Expected: zero hits outside the files we are about to delete and the index file. If any hits remain (other than the files being deleted), fix those imports before proceeding.

## Commit

None — read-only verification step.