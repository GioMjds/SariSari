# Task 15-09: Verify /home/alerts returns 404

> Parent Plan: [2026-08-01-home-tab-improv.md](../../plans/2026-08-01-home-tab-improv.md)
> Index: [00-task-index.md](./00-task-index.md)

## Goal

Confirm that deep-linking to the deleted `/home/alerts` route resolves to the app's 404 screen.

## Dependencies

- [15-01](./task-15-01-dev-server-up.md)

## Files

- None

## Steps

- [ ] **Step 1: Visual check**

Navigate to `/(tabs)/home/alerts` directly (via deep link or URL bar in dev tools).

Expected: app shows its 404 screen (the alerts route file no longer exists).

## Next

Proceed to [Task 15-10](./task-15-10-commit-fixes.md).