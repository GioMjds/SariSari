# Task 15-04: Verify Est. Profit no longer hardcodes 912

> Parent Plan: [2026-08-01-home-tab-improv.md](../../plans/2026-08-01-home-tab-improv.md)
> Index: [00-task-index.md](./00-task-index.md)

## Goal

Confirm the Est. Profit tile shows "—" instead of the previously hardcoded "₱912" when no cost data exists.

## Dependencies

- [15-01](./task-15-01-dev-server-up.md)

## Files

- None

## Steps

- [ ] **Step 1: Visual check**

If no cost data exists, the Est. Profit tile should read "—" instead of "₱912".

Expected: tile shows "—" or a real peso amount, never "₱912" unless real data justifies it.

## Next

Proceed to [Task 15-05](./task-15-05-empty-state.md).