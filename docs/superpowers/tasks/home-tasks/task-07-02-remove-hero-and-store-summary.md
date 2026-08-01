# Task 07-02: Remove the redundant hero block and STORE SUMMARY header

> Parent Plan: [2026-08-01-home-tab-improv.md](../../plans/2026-08-01-home-tab-improv.md)
> Index: [00-task-index.md](./00-task-index.md)

## Goal

Drop the Total-Sales hero block and the `STORE SUMMARY` header section from `DashboardKPIGrid`. The hero moves to a new inline JSX block in `app/(tabs)/home/index.tsx` (Task 08). The "Details >" affordance moves with it.

## Dependencies

- [07-01](./task-07-01-prop-type-and-nullable-render.md)

## Files

- Modify: `components/home/DashboardKPIGrid.tsx:91-139`

## Steps

- [ ] **Step 1: Remove the hero block (lines 91-119)**

Delete the entire `<View className="px-4 mb-5"> ... </View>` block that renders `TOTAL SALES TODAY`, the hero number, the transaction count, and the RECORDED badge.

- [ ] **Step 2: Remove the `STORE SUMMARY` header section (lines 121-139)**

Delete the `<View className="px-4 flex-row items-center justify-between mb-3"> ... </View>` block.

## Commit

None yet — verification + commit happen in `task-07-03`.