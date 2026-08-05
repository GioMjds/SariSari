# Task 7: Final verify

> Sub-task of [`../2026-08-05-inventory-action-menu-fixes.md`](../2026-08-05-inventory-action-menu-fixes.md). Self-contained. **Sequential** after [Task 6](./task-6-locked-sheet-tests.md).

**Goal:** Confirm the full change set holds together: typecheck + all tests pass, and the per-row action menu behaves as specified end-to-end on a device (if the dev environment can run the app).

**Files:** None modified by Steps 1-2. Step 3 may append to `docs/activity-log.md`.

**Dependencies:** [Task 6](./task-6-locked-sheet-tests.md).

**Estimated scope:** XS.

---

## Steps

### Step 1: Run the full verify suite

Run: `npm run verify`
Expected: PASS (typecheck + all tests).

### Step 2: Manual smoke (document in `docs/activity-log.md`)

If you can run the app, verify the per-row action menu:

1. Open the Products tab.
2. Long-press a row, tap the menu button.
3. Tap "Mark Damaged" — confirm the sheet shows only that product's card (no picker).
4. Tap "Adjust Stock" — same.
5. Tap "Edit Product" — confirm the edit form opens (not the read-only details).

If you cannot run the app, note that in the activity log and rely on tests for the verification.

### Step 3: Append to activity log

Append a short entry to `docs/activity-log.md` summarizing:

- Per-row sheet is now locked (no picker when a product is set).
- Edit Product routes to the edit form.
- Tests added (one for the route, two for the locked sheets).

Keep the entry concise and consistent with previous entries (kebab-case style, dated `2026-08-05`).

### Step 4: Commit (only if `activity-log.md` changed)

```bash
git add docs/activity-log.md
git commit -m "docs(inventory): log action menu fixes"
```

If the file didn't change, skip this step — `git status` should be clean.

---

## Acceptance criteria

- [ ] `npm run verify` exits 0
- [ ] No new skips (`.skip`) or `.only` markers left in tests
- [ ] Manual smoke run if dev environment allows (documented in activity log)
- [ ] `docs/activity-log.md` has a new entry summarizing the changes (or explicit note that smoke was skipped)
- [ ] If the activity log changed, a final commit exists: `docs(inventory): log action menu fixes`
- [ ] `git status` is clean after this task

## Verification

- `npm run verify` passes.
- `git status` clean.
- `git log --oneline -7` shows the seven commits (one per parent task) in order, plus the optional docs commit if `activity-log.md` changed.

## Done criteria

The parent plan is complete when:

1. Both sheets accept `lockedProduct: Product | null`.
2. The layout threads the signal's `productId` into all three sheets.
3. The per-row menu's "Edit Product" routes to `/(edit-forms)/edit-product/${id}`.
4. Three new tests cover the behavior.
5. `npm run verify` is green.
6. The activity log records the change.
