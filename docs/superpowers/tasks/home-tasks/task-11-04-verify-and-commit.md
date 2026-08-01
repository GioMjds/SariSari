# Task 11-04: Verify typecheck and commit cleanup batch

> Parent Plan: [2026-08-01-home-tab-improv.md](../../plans/2026-08-01-home-tab-improv.md)
> Index: [00-task-index.md](./00-task-index.md)

## Goal

Run `tsc --noEmit` and confirm the project compiles without the deleted files, then commit all four deletions plus the index update as a single cleanup commit.

## Dependencies

- [11-03](./task-11-03-update-index-exports.md)

## Files

- Delete: `app/(tabs)/home/alerts.tsx` (deleted in 11-02)
- Delete: `components/home/AlertCardItem.tsx` (deleted in 11-02)
- Delete: `components/home/AlertFilterPills.tsx` (deleted in 11-02)
- Delete: `components/home/HomeAlertsSkeleton.tsx` (deleted in 11-02)
- Modify: `components/home/index.ts` (already changed in 11-03)

## Steps

- [ ] **Step 1: Run TypeScript typecheck**

Run: `npx tsc --noEmit -p .`

Expected: clean. The only allowed errors at this point are in `tests/components/HomeSkeletons.test.tsx` (it imports the deleted `HomeAlertsSkeleton`). Task 12 fixes it.

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(home): delete alerts sub-tab and unused components"
```

## Next

Proceed to [Task 12](./task-12-update-home-skeletons-test.md).