# Task 7: Final verify

> Sub-task of [`../2026-08-05-inventory-action-menu-fixes.md`](../2026-08-05-inventory-action-menu-fixes.md). Self-contained. **Sequential** after [Task 6](./task-6-locked-sheet-tests.md).

**Goal:** Confirm the full change set holds together: typecheck + all tests pass, and the per-row action menu behaves as specified end-to-end on a device (if the dev environment can run the app).

**Files:** Steps 1-2 modify nothing. Step 3 may append to `docs/activity-log.md`. Step 4 commits only if Step 3 changed the file.

**Dependencies:** [Task 6](./task-6-locked-sheet-tests.md).

**Estimated scope:** XS.

---

## Steps

### Step 1: Run the full verify suite

Run: `npm run verify`
Expected: PASS (typecheck + all tests, including the new ones from Tasks 5 and 6).

If it fails, the failure tells you which task regressed:

- New `tests/app/inventory/products.test.tsx` fails -> check whether Task 4's route change has been re-applied (it should already be at HEAD, but a rebase could have lost it).
- New `tests/components/inventory/modals/*.locked.test.tsx` tests fail -> check whether Tasks 1-3 have been re-applied (the `lockedProduct` prop must exist on both sheets).
- An unrelated test fails -> investigate separately; this task assumes all sub-task commits are clean.

### Step 2: Manual smoke (document in `docs/activity-log.md`)

If you can run the app (`npm start` with iOS/Android/web), verify the per-row action menu end-to-end:

1. Open the Products tab.
2. Long-press a row, tap the menu button.
3. Tap "Mark Damaged" — confirm the sheet shows only that product's card (no picker).
4. Tap "Adjust Stock" — same.
5. Tap "Edit Product" — confirm the edit form opens (not the read-only details).

If you cannot run the app (no simulator, no device, no time), note that explicitly in the activity log and rely on tests for the verification.

### Step 3: Append to activity log

Append a short entry to `docs/activity-log.md` summarizing:

- Per-row sheet is now locked (no picker when a product is set).
- Edit Product routes to the edit form (was already at HEAD before this plan ran).
- Tests added (one for the route, two for the locked sheets).

Keep the entry concise and consistent with previous entries (kebab-case style, dated `2026-08-05`). If Step 2 was skipped, say so.

### Step 4: Commit (only if `activity-log.md` changed)

```bash
git add docs/activity-log.md
git commit -m "docs(inventory): log action menu fixes"
```

If the file didn't change (no entry added — should not happen if Step 3 ran), skip this step. Per `CLAUDE.md`, do not auto-commit `activity-log.md` blindly: only commit if the file actually changed.

---

## Acceptance criteria

- [ ] `npm run verify` exits 0
- [ ] No new `.skip` or `.only` markers left in any of the new test files
- [ ] Manual smoke run if dev environment allows (documented in activity log) OR explicit note in activity log that smoke was skipped
- [ ] `docs/activity-log.md` has a new entry summarizing the changes
- [ ] If the activity log changed, a final commit exists: `docs(inventory): log action menu fixes`
- [ ] `git status` is clean after this task

## Verification

- `npm run verify` passes.
- `git status` clean.
- `git log --oneline -7` shows (in order, plus the optional docs commit if `activity-log.md` changed):
  1. `refactor(inventory): lock AdjustStockSheet to a single product` (Task 1)
  2. `refactor(inventory): lock MarkDamagedSheet to a single product` (Task 2)
  3. `feat(inventory): thread signal productId into stock sheet mounts` (Task 3)
  4. (Task 4 — already at HEAD, no new commit)
  5. `test(inventory): assert Edit Product routes to edit form` (Task 5)
  6. `test(inventory): assert stock sheets hide picker when locked` (Task 6)
  7. `docs(inventory): log action menu fixes` (optional, Task 7)

## Done criteria

The parent plan is complete when:

1. Both sheets accept `lockedProduct: Product | null`.
2. The layout threads the signal's `productId` into all three sheets and clears the captured id on close.
3. The per-row menu's "Edit Product" routes to `/(edit-forms)/edit-product/${id}` (was already at HEAD).
4. Three new tests cover the behavior (one for the route, two for the locked sheets).
5. `npm run verify` is green.
6. The activity log records the change (or skips it explicitly).