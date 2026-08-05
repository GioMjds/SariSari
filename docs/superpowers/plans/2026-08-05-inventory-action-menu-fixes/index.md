# Inventory Action Menu Fixes — Sub-task index

Sub-task files for [`../2026-08-05-inventory-action-menu-fixes.md`](../2026-08-05-inventory-action-menu-fixes.md).

The parent plan has **7 tasks**; this directory splits each into a self-contained sub-task file with full code blocks inlined so any one can be handed to a sub-agent without re-reading the parent plan.

## Sub-tasks

| # | Sub-task | File | Depends on | Commit message (if applied) |
|---|---|---|---|---|
| 1 | Lock `AdjustStockSheet` to a single product | [task-1-adjust-stock-sheet-lock.md](./task-1-adjust-stock-sheet-lock.md) | — | `refactor(inventory): lock AdjustStockSheet to a single product` |
| 2 | Lock `MarkDamagedSheet` to a single product | [task-2-mark-damaged-sheet-lock.md](./task-2-mark-damaged-sheet-lock.md) | — (parallel with 1) | `refactor(inventory): lock MarkDamagedSheet to a single product` |
| 3 | Thread the signal's `productId` into the layout's sheet mounts | [task-3-layout-signal-threading.md](./task-3-layout-signal-threading.md) | 1, 2 | `feat(inventory): thread signal productId into stock sheet mounts` |
| 4 | Verify the Edit Product route is fixed | [task-4-edit-product-route.md](./task-4-edit-product-route.md) | — (independent of 1-3) | `fix(inventory): route Edit Product to the edit form` (only if route had regressed) |
| 5 | Add a regression test for the Edit Product route | [task-5-edit-product-route-test.md](./task-5-edit-product-route-test.md) | 4 | `test(inventory): assert Edit Product routes to edit form` |
| 6 | Add regression tests for the locked sheet | [task-6-locked-sheet-tests.md](./task-6-locked-sheet-tests.md) | 1, 2, 3 | `test(inventory): assert stock sheets hide picker when locked` |
| 7 | Final verify | [task-7-final-verify.md](./task-7-final-verify.md) | 6 | `docs(inventory): log action menu fixes` (only if `activity-log.md` changed) |

## Dependency graph

```
T1 ─┐
    ├─▶ T3 ──┐
T2 ─┘        │
             ├─▶ T6 ─▶ T7
T4 ──▶ T5 ───┘
```

Parallelizable groups:

- **Group A (concurrent):** T1, T2, T4 — different files. T4 is verify-only.
- **Group B (after A):** T3 consumes T1+T2.
- **Group C (after A, independent of B):** T5 consumes T4 only.
- **Group D (after B):** T6 consumes T1/T2/T3.
- **Group E:** T7 after everything.

## Execution order

Two safe serial orderings:

1. **Layered:** T1, T2 (parallel) → T3 → T4 → T5 → T6 → T7
2. **Stream-grouped:** T1, T2, T4 (parallel) → T3, T5 (parallel) → T6 → T7

Pick whichever fits the execution harness.

## Notes

- Each sub-task file is self-contained — code blocks from the parent plan are inlined, and line numbers / file paths / hook signatures are verified against the actual code as of `2026-08-05`.
- The `-breakdown.md` companion file in the parent directory contains a finer-grained (35-step) breakdown used during planning; the sub-task files in this directory are the ones to actually execute.
- Per `CLAUDE.md`, do not auto-commit `docs/activity-log.md` — Task 7 Step 4 only commits if the file actually changed.
- **Important context for the executor:** Task 4's work is already at HEAD before this plan runs. The Edit Product route (`/(edit-forms)/edit-product/${id}`) is already correct in `app/(tabs)/inventory/products.tsx:121-127`. Task 4 is therefore a verification step, not an implementation step. Do not run Task 4's `git commit` unless you discover the route has regressed.
- **Important context for the executor:** Tasks 1 and 3 are **not** at HEAD — the sheets still use `initialProductId` and the layout still passes `initialProductId={null}`. The executor must run these before Task 6's tests will pass.