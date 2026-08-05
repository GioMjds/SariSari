# Inventory Action Menu Fixes — Sub-Task Breakdown

Granular decomposition of the 7 tasks in `2026-08-05-inventory-action-menu-fixes.md`. Each sub-task has acceptance criteria, verification, dependencies, files, and scope (XS/S/M/L). Parent tasks remain as phases so parallelization is visible.

## Dependency Graph (high level)

```
T1.1 - T1.7   (AdjustStockSheet lock)
T2.1 - T2.6   (MarkDamagedSheet lock)        ─┐
                                               ├─▶ T3.1 - T3.6  (layout signal threading)
T4.1 - T4.4   (Edit Product route fix)         │        │
                                               │        ├─▶ T6.1 - T6.6  (locked-sheet tests)
T5.1 - T5.5   (Edit Product route test) ◀─────┘        │
                                                        └─▶ T7.1 - T7.4  (final verify)

Parallelizable groups:
- Group A (concurrent): T1.* and T2.* touch different files; T4.* is on a third file.
- Group B (sequential after A): T3 consumes T1 + T2 outputs.
- Group C (concurrent after A, independent of B): T5 consumes T4 only.
- Group D (sequential after B): T6 consumes T1/T2/T3 outputs.
- Group E: T7 after everything.
```

---

## Phase 1: Lock `AdjustStockSheet` to a single product

### Task 1.1: Update `Props` interface on `AdjustStockSheet`

**Description:** Replace `initialProductId: number | null` with `lockedProduct: Product | null` in the sheet's prop signature and destructure it on the function signature.

**Acceptance criteria:**

- [ ] `Props` interface declares `lockedProduct: Product | null`
- [ ] Function destructures `lockedProduct` from props
- [ ] No reference to `initialProductId` remains in the interface or signature
- [ ] `Product` is imported from `@/types/products.types`

**Verification:** `npm run typecheck` passes.

**Dependencies:** None.

**Files:**

- `components/inventory/modals/AdjustStockSheet.tsx`

**Estimated scope:** XS (1 file, interface-only edit).

---

### Task 1.2: Drop `pickedId` state and its reset effect

**Description:** Remove the `pickedId` `useState`, the setter line in the existing `useEffect`, and the `initialProductId` dependency in that effect.

**Acceptance criteria:**

- [ ] `pickedId` state removed (not referenced anywhere)
- [ ] Reset effect depends only on `visible`; resets `direction`, `qty`, `note` only
- [ ] `useState` import remains if other state is still used; remove only if no other state remains
- [ ] `useEffect` and `useMemo` imports kept (still needed)

**Verification:** `npm run typecheck` passes.

**Dependencies:** 1.1 (interface must match before state cleanup).

**Files:**

- `components/inventory/modals/AdjustStockSheet.tsx`

**Estimated scope:** XS.

---

### Task 1.3: Resolve `product` directly from `lockedProduct`

**Description:** Replace the `useMemo` derivation `products.find(p => p.id === pickedId)` with a direct assignment `const product = lockedProduct;`.

**Acceptance criteria:**

- [ ] `product` resolves to `lockedProduct` with no `useMemo` wrapping
- [ ] `useProducts()` call and the `products` array remain in place (still needed for the bulk `ProductPicker` branch)
- [ ] `useMemo` import removed if no other use remains

**Verification:** `npm run typecheck` passes.

**Dependencies:** 1.2.

**Files:**

- `components/inventory/modals/AdjustStockSheet.tsx`

**Estimated scope:** XS.

---

### Task 1.4: Branch the JSX body on `lockedProduct`

**Description:** Replace the `product ? <SheetProductCard /> : <ProductPicker />` ternary to test `lockedProduct` directly and pass a no-op `onSelect` to `ProductPicker` in the bulk branch.

**Acceptance criteria:**

- [ ] Ternary branches on `lockedProduct`, not the derived `product`
- [ ] Bulk `ProductPicker` receives `selectedId={null}` and an `onSelect` callback matching its expected signature (read `ProductPicker.tsx` props first)
- [ ] No reference to `pickedId` in JSX
- [ ] No reference to `setPickedId` anywhere

**Verification:**

- `npm run typecheck` passes.
- If `ProductPicker`'s `onSelect` signature is `(id: number) => void`, the no-op arrow body must match exactly or typecheck fails.

**Dependencies:** 1.3.

**Files:**

- `components/inventory/modals/AdjustStockSheet.tsx`

**Estimated scope:** S (JSX edit + signature alignment).

---

### Task 1.5: Audit `handleSubmit` for stale references

**Description:** Confirm `handleSubmit` reads `product.id` and `product.quantity` correctly through the new `product = lockedProduct` aliasing. Remove any leftover `setPickedId` or `pickedId` references.

**Acceptance criteria:**

- [ ] `handleSubmit` references only `product.id`, `product.quantity` (or the relevant fields)
- [ ] No `setPickedId` / `pickedId` references anywhere in the file
- [ ] Type-check passes

**Verification:** `npm run typecheck` passes; `Grep` for `pickedId` in the file returns no matches.

**Dependencies:** 1.4.

**Files:**

- `components/inventory/modals/AdjustStockSheet.tsx`

**Estimated scope:** XS.

---

### Task 1.6: Type-check and self-review

**Description:** Run `npm run typecheck` and read the diff once to confirm the locked mode renders `SheetProductCard` and the bulk mode renders `ProductPicker`.

**Acceptance criteria:**

- [ ] `npm run typecheck` exits 0
- [ ] Manual diff review confirms only the intended lines changed

**Verification:** Typecheck + diff review.

**Dependencies:** 1.5.

**Files:** None modified.

**Estimated scope:** XS.

---

### Task 1.7: Commit Task 1

**Description:** Stage the single file and commit with the agreed message.

**Acceptance criteria:**

- [ ] Single commit: `refactor(inventory): lock AdjustStockSheet to a single product`
- [ ] No untracked or unrelated staged files

**Verification:** `git log -1 --oneline` shows the commit; `git status` clean for the file.

**Dependencies:** 1.6.

**Files:** `components/inventory/modals/AdjustStockSheet.tsx` (staged).

**Estimated scope:** XS.

---

## Phase 2: Lock `MarkDamagedSheet` to a single product

> This phase mirrors Phase 1; runs in parallel with Phase 1 (different file, same shape).

### Task 2.1: Update `Props` interface on `MarkDamagedSheet`

**Description:** Same shape as 1.1, but for `MarkDamagedSheet`.

**Acceptance criteria:**

- [ ] `Props` declares `lockedProduct: Product | null`
- [ ] No `initialProductId` remains in the interface or signature
- [ ] `Product` import present

**Verification:** `npm run typecheck` passes.

**Dependencies:** None.

**Files:**

- `components/inventory/modals/MarkDamagedSheet.tsx`

**Estimated scope:** XS.

---

### Task 2.2: Drop `pickedId` state and its reset effect

**Description:** Same shape as 1.2.

**Acceptance criteria:**

- [ ] `pickedId` state removed
- [ ] Reset effect depends only on `visible`; resets `qty`, `note` only
- [ ] Imports cleaned

**Verification:** `npm run typecheck` passes.

**Dependencies:** 2.1.

**Files:**

- `components/inventory/modals/MarkDamagedSheet.tsx`

**Estimated scope:** XS.

---

### Task 2.3: Resolve `product` directly from `lockedProduct`

**Description:** Same shape as 1.3.

**Acceptance criteria:**

- [ ] `product = lockedProduct` (no `useMemo`)
- [ ] `useProducts()` and `products` array preserved (still needed for bulk branch)

**Verification:** `npm run typecheck` passes.

**Dependencies:** 2.2.

**Files:**

- `components/inventory/modals/MarkDamagedSheet.tsx`

**Estimated scope:** XS.

---

### Task 2.4: Branch the JSX body on `lockedProduct`

**Description:** Same shape as 1.4, with `ProductPicker` no-op.

**Acceptance criteria:**

- [ ] Ternary branches on `lockedProduct`
- [ ] `ProductPicker` receives `selectedId={null}` and a matching `onSelect` no-op
- [ ] No `pickedId` / `setPickedId` references in JSX

**Verification:** `npm run typecheck` passes.

**Dependencies:** 2.3.

**Files:**

- `components/inventory/modals/MarkDamagedSheet.tsx`

**Estimated scope:** S.

---

### Task 2.5: Type-check and commit

**Description:** Run typecheck, then commit with the agreed message.

**Acceptance criteria:**

- [ ] `npm run typecheck` passes
- [ ] Commit: `refactor(inventory): lock MarkDamagedSheet to a single product`

**Verification:** Typecheck + `git log -1`.

**Dependencies:** 2.4.

**Files:**

- `components/inventory/modals/MarkDamagedSheet.tsx`

**Estimated scope:** XS.

---

### Checkpoint: After Phase 1 + Phase 2

- [ ] Both sheets compile with the new `lockedProduct` prop
- [ ] Both sheets still need the layout to thread the id through (Phase 3)
- [ ] Locked mode is currently unreachable from any caller — safe to commit because no caller yet passes `lockedProduct` in a way that breaks the bulk path
- [ ] Review with human before Phase 3 begins (cross-file wiring is the riskiest change)

---

## Phase 3: Thread signal productId into the layout's sheet mounts

### Task 3.1: Add `useProducts` import and `matchedProduct` resolver

**Description:** Import `useProducts` and define a `resolveProduct(id: number | null) => Product | null` helper near the top of the inventory layout component.

**Acceptance criteria:**

- [ ] `import { useProducts } from '@/hooks/useProducts';` present
- [ ] `getAllProductsQuery.data ?? []` is destructured into `products`
- [ ] `resolveProduct` defined: `(id) => id == null ? null : products.find(p => p.id === id) ?? null`
- [ ] Function placement is inside the component body, after `useStockSheetSignal()`

**Verification:** `npm run typecheck` passes.

**Dependencies:** 1.7 and 2.5 (the new prop shapes must already exist before consumers reference them).

**Files:**

- `app/(tabs)/inventory/_layout.tsx`

**Estimated scope:** XS (function declaration only).

---

### Task 3.2: Capture the signal's `productId` into local state per sheet

**Description:** Add three `useState<number | null>(null)` slots — `adjustProduct`, `damagedProduct`, `restockProduct` — and extend each of the three existing `useEffect` blocks that flip sheet visibility so they capture the id before clearing the signal.

**Acceptance criteria:**

- [ ] Three `useState` slots added next to the existing `setAdjustOpen` / `setDamagedOpen` / `setRestockOpen` lines
- [ ] All three `useEffect`s now call `setXProduct(signal.X.productId); setXOpen(true); signal.clearX();`
- [ ] Effects still depend on `signal.X.productId` and `signal`
- [ ] No race where the id is lost before the sheet reads it (effect captures synchronously before clearing)

**Verification:** `npm run typecheck` passes.

**Dependencies:** 3.1.

**Files:**

- `app/(tabs)/inventory/_layout.tsx`

**Estimated scope:** M (three effects to modify in lockstep).

---

### Task 3.3: Resolve captured id to `Product` at render time

**Description:** Compute `lockedAdjust`, `lockedDamaged`, `lockedRestock` via `resolveProduct` just before the sheet mount block.

**Acceptance criteria:**

- [ ] Three `const lockedX = resolveProduct(xProduct);` lines added
- [ ] `resolveProduct` is the helper from 3.1

**Verification:** `npm run typecheck` passes.

**Dependencies:** 3.2.

**Files:**

- `app/(tabs)/inventory/_layout.tsx`

**Estimated scope:** XS.

---

### Task 3.4: Pass `lockedProduct` to each sheet and clear id on close

**Description:** Update each of the three sheet mounts (`RestockSheet`, `MarkDamagedSheet`, `AdjustStockSheet`) to accept `lockedProduct={lockedX}` and clear the captured id inside the existing `onClose` arrows (e.g. `setAdjustProduct(null)`) so the next bulk open doesn't briefly show the previous product.

**Acceptance criteria:**

- [ ] `RestockSheet` mount passes `lockedProduct={lockedRestock}` and clears `restockProduct` on close
- [ ] `MarkDamagedSheet` mount passes `lockedProduct={lockedDamaged}` and clears `damagedProduct` on close
- [ ] `AdjustStockSheet` mount passes `lockedProduct={lockedAdjust}` and clears `adjustProduct` on close
- [ ] No `initialProductId` prop on any sheet (those props are gone)

**Verification:** `npm run typecheck` passes.

**Dependencies:** 3.3.

**Files:**

- `app/(tabs)/inventory/_layout.tsx`

**Estimated scope:** S.

---

### Task 3.5: Type-check, manual diff review

**Description:** Run typecheck and read the diff.

**Acceptance criteria:**

- [ ] Typecheck passes
- [ ] The three effects are symmetric (each captures id, opens sheet, clears signal)
- [ ] `onClose` arrows are symmetric (each clears id and closes sheet)

**Verification:** Typecheck + diff review.

**Dependencies:** 3.4.

**Files:** None modified.

**Estimated scope:** XS.

---

### Task 3.6: Commit Task 3

**Description:** Single commit with the agreed message.

**Acceptance criteria:**

- [ ] Commit: `feat(inventory): thread signal productId into stock sheet mounts`

**Verification:** `git log -1 --oneline`.

**Dependencies:** 3.5.

**Files:**

- `app/(tabs)/inventory/_layout.tsx`

**Estimated scope:** XS.

---

## Phase 4: Fix the Edit Product route

> Independent of Phases 1-3. Can run in parallel with Phase 1 or 2 (different file, single-line change).

### Task 4.1: Update `handleMenuEdit` to push the edit form

**Description:** Replace the `product-details/${id}` push inside `handleMenuEdit` with `edit-product/${id}`.

**Acceptance criteria:**

- [ ] `handleMenuEdit` pushes `/(edit-forms)/edit-product/${id}`
- [ ] `setMenuProduct(null)` still runs before navigation
- [ ] `useCallback` deps still only contain `router`

**Verification:** `npm run typecheck` passes.

**Dependencies:** None.

**Files:**

- `app/(tabs)/inventory/products.tsx`

**Estimated scope:** XS.

---

### Task 4.2: Verify `handlePress` is unchanged

**Description:** Confirm `handlePress` (lines 78-80 per the plan) still pushes `/(edit-forms)/product-details/${id}`. Do not modify.

**Acceptance criteria:**

- [ ] `handlePress` body unchanged
- [ ] `git diff` against `main` shows only `handleMenuEdit` was touched in this file

**Verification:** `git diff` review.

**Dependencies:** 4.1.

**Files:**

- `app/(tabs)/inventory/products.tsx`

**Estimated scope:** XS.

---

### Task 4.3: Type-check

**Description:** Run typecheck.

**Acceptance criteria:**

- [ ] `npm run typecheck` passes

**Verification:** Typecheck.

**Dependencies:** 4.2.

**Files:** None modified.

**Estimated scope:** XS.

---

### Task 4.4: Commit Task 4

**Description:** Commit with the agreed message.

**Acceptance criteria:**

- [ ] Commit: `fix(inventory): route Edit Product to the edit form`

**Verification:** `git log -1 --oneline`.

**Dependencies:** 4.3.

**Files:**

- `app/(tabs)/inventory/products.tsx`

**Estimated scope:** XS.

---

## Phase 5: Add a regression test for the Edit Product route

> Sequential after Phase 4 (the route must be wrong before the test can fail).

### Task 5.1: Locate a sibling test harness

**Description:** Find a `tests/app/inventory/*.test.tsx` (or `tests/components/inventory/`) that mocks `expo-router`, `useProducts`, store hooks, and modal components. Mirror its import style, mock shape, and render helpers.

**Acceptance criteria:**

- [ ] A reference test file is identified
- [ ] Its top-of-file `jest.mock(...)` block is read in full
- [ ] Any custom `render` helper or wrapper components are noted for reuse

**Verification:** Reading the file and listing its imports in a scratch note.

**Dependencies:** None.

**Files:** Existing test file under `tests/` (read-only).

**Estimated scope:** XS.

---

### Task 5.2: Write the failing test

**Description:** Create `tests/app/inventory/products.test.tsx` per the inline plan code block. Asserts `router.push('/(edit-forms)/edit-product/42')` after the menu's Edit Product is fired.

**Acceptance criteria:**

- [ ] File created at the plan-specified path
- [ ] Test uses the inlined mocks (expo-router, useProducts, stores, modal components)
- [ ] `ProductsList` mock exposes an `onActionPress` shim
- [ ] `ProductActionMenuModal` mock renders only when visible + product is set
- [ ] Single test asserts `push` called with `/(edit-forms)/edit-product/42`

**Verification:** Review that the file matches the plan's inline snippet (modulo sibling-test harness variations).

**Dependencies:** 5.1.

**Files:**

- `tests/app/inventory/products.test.tsx` (new)

**Estimated scope:** S.

---

### Task 5.3: Run the test, verify it fails on the unfixed route

**Description:** Run `npm test -- tests/app/inventory/products.test.tsx`. Expected failure: `push` was called with `product-details/42`, not `edit-product/42`.

**Acceptance criteria:**

- [ ] Test fails with an `expect(...)` failure on the route argument
- [ ] Failure reason names the wrong route

**Verification:** Test output.

**Dependencies:** 5.2.

**Files:** None modified.

**Estimated scope:** XS.

---

### Task 5.4: Re-run `npm run verify` after Phase 4 is committed

**Description:** Confirm typecheck and the new test pass once Phase 4's commit is applied.

**Acceptance criteria:**

- [ ] `npm run verify` exits 0
- [ ] The new test now passes (route is `edit-product/42`)

**Verification:** `npm run verify`.

**Dependencies:** 5.3 and 4.4 (Phase 4 must be committed so the route change is in place).

**Files:** None modified.

**Estimated scope:** XS.

---

### Task 5.5: Commit Task 5

**Description:** Commit the new test file.

**Acceptance criteria:**

- [ ] Commit: `test(inventory): assert Edit Product routes to edit form`

**Verification:** `git log -1 --oneline`.

**Dependencies:** 5.4.

**Files:**

- `tests/app/inventory/products.test.tsx` (new)

**Estimated scope:** XS.

---

## Phase 6: Add regression tests for the locked sheet

> Sequential after Phases 1, 2, 3. Both sheets must already have `lockedProduct` support before these tests can pass.

### Task 6.1: Locate or add `ProductPicker` testID

**Description:** Read `components/inventory/modals/ProductPicker.tsx`. If its root has no `testID`, add `testID="product-picker"` to the outermost `<View>` (or equivalent wrapper). Record whether a follow-up commit is needed.

**Acceptance criteria:**

- [ ] Either confirm `testID="product-picker"` already exists, or note a follow-up commit is needed
- [ ] No other behavior changes

**Verification:** `Grep` for `product-picker` in the components tree.

**Dependencies:** None.

**Files:**

- `components/inventory/modals/ProductPicker.tsx` (read; possibly edit `testID`)

**Estimated scope:** XS.

---

### Task 6.2: Write failing test for `AdjustStockSheet.locked.test.tsx`

**Description:** Create the test per the inline plan code. Mocks `useProducts` and `useAdjustStock`. Asserts `screen.queryByTestId('product-picker')` is `null` when `lockedProduct` is set.

**Acceptance criteria:**

- [ ] File created at `tests/components/inventory/modals/AdjustStockSheet.locked.test.tsx`
- [ ] Test renders the sheet with a non-null `lockedProduct`
- [ ] Expects the picker is not in the tree

**Verification:** Review against the plan's inline snippet.

**Dependencies:** 6.1.

**Files:**

- `tests/components/inventory/modals/AdjustStockSheet.locked.test.tsx` (new)

**Estimated scope:** S.

---

### Task 6.3: Run test, verify it fails before locking is applied

**Description:** If run against an un-fixed sheet, the test should fail with a type error (or a runtime error if types are loose). Note: in the plan's execution order, Phases 1-3 are already committed, so this test should pass without re-application.

**Acceptance criteria:**

- [ ] Either: test fails clearly (props don't accept `lockedProduct`), OR test passes because Phases 1-3 are already committed (expected at this point in execution)

**Verification:** Test output.

**Dependencies:** 6.2.

**Files:** None modified.

**Estimated scope:** XS.

---

### Task 6.4: Write failing test for `MarkDamagedSheet.locked.test.tsx`

**Description:** Mirror of 6.2 for `MarkDamagedSheet`. Mocks `useRecordDamaged` and `useProducts`.

**Acceptance criteria:**

- [ ] File created at `tests/components/inventory/modals/MarkDamagedSheet.locked.test.tsx`
- [ ] Test asserts picker is not rendered when locked

**Verification:** Review against the plan's inline snippet.

**Dependencies:** 6.1 (parallel with 6.2; independent of 6.3's outcome).

**Files:**

- `tests/components/inventory/modals/MarkDamagedSheet.locked.test.tsx` (new)

**Estimated scope:** S.

---

### Task 6.5: Run both locked-sheet tests, verify both pass

**Description:** `npm test -- tests/components/inventory/modals/AdjustStockSheet.locked.test.tsx tests/components/inventory/modals/MarkDamagedSheet.locked.test.tsx`.

**Acceptance criteria:**

- [ ] Both tests pass
- [ ] No unrelated test regressions in the inventory test directory

**Verification:** Test output.

**Dependencies:** 6.3 and 6.4.

**Files:** None modified.

**Estimated scope:** XS.

---

### Task 6.6: Commit Task 6

**Description:** Commit both new test files (and the `ProductPicker` `testID` if it was added in 6.1).

**Acceptance criteria:**

- [ ] Commit: `test(inventory): assert stock sheets hide picker when locked`

**Verification:** `git log -1 --oneline`.

**Dependencies:** 6.5.

**Files:**

- `tests/components/inventory/modals/AdjustStockSheet.locked.test.tsx`
- `tests/components/inventory/modals/MarkDamagedSheet.locked.test.tsx`
- (Possibly) `components/inventory/modals/ProductPicker.tsx`

**Estimated scope:** XS.

---

## Phase 7: Final verify

### Task 7.1: Run full `npm run verify`

**Description:** Typecheck + all tests.

**Acceptance criteria:**

- [ ] `npm run verify` exits 0
- [ ] No new skips or `.only` left behind

**Verification:** `npm run verify`.

**Dependencies:** 6.6.

**Files:** None modified.

**Estimated scope:** XS.

---

### Task 7.2: Manual smoke (if app can run)

**Description:** Per the plan: long-press a row in Products, tap the menu, verify the locked sheet behavior and the Edit Product route.

**Acceptance criteria:**

- [ ] Per-row menu "Mark Damaged" opens the sheet showing only that product
- [ ] Per-row menu "Adjust Stock" same
- [ ] Per-row menu "Edit Product" opens the edit form, not the read-only details

**Verification:** Manual device/simulator run. If the dev environment cannot run the app, note that in the activity log and rely on tests.

**Dependencies:** 7.1.

**Files:** None modified.

**Estimated scope:** XS.

---

### Task 7.3: Append to `docs/activity-log.md`

**Description:** Add a short entry summarizing: per-row sheet is now locked; Edit Product routes to the edit form; tests added.

**Acceptance criteria:**

- [ ] Entry is concise (a few lines)
- [ ] Uses kebab-case style consistent with previous entries
- [ ] Date is `2026-08-05` per today

**Verification:** Read the appended block.

**Dependencies:** 7.2 (manual smoke results inform the entry).

**Files:**

- `docs/activity-log.md`

**Estimated scope:** XS.

---

### Task 7.4: Final commit (only if `activity-log.md` changed)

**Description:** Stage and commit the activity log entry, if it was actually changed.

**Acceptance criteria:**

- [ ] Only commit if the file changed
- [ ] Commit message: `docs(inventory): log action menu fixes`

**Verification:** `git status`; `git log -1 --oneline` if committed.

**Dependencies:** 7.3.

**Files:**

- `docs/activity-log.md` (possibly)

**Estimated scope:** XS.

---

## Checkpoint Summary

| Checkpoint             | After tasks | What must be true                                                               |
| ---------------------- | ----------- | ------------------------------------------------------------------------------- |
| Sheets compile         | 1.7, 2.5    | `lockedProduct` prop is on both sheets; signature drift is complete but unused  |
| Layout wired           | 3.6         | Signal productId flows through to all three sheets; old broken behavior is gone |
| Tests cover both fixes | 6.6         | Two new sheet tests + one new menu-route test commit clean                      |
| Done                   | 7.1-7.4     | `npm run verify` passes; activity log updated; manual smoke (if possible) green |

## Risks and Mitigations

| Risk                                                               | Impact                                       | Mitigation                                                                                            |
| ------------------------------------------------------------------ | -------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `ProductPicker` `onSelect` signature mismatch with no-op           | Medium — typecheck fails                     | Read `ProductPicker.tsx` props before editing (1.4, 2.4); adjust no-op to match exactly               |
| Layout effect captures id after signal is cleared                  | High — picker briefly shows previous product | Capture order: `setXProduct(id); setXOpen(true); signal.clearX();` (3.2) — never clear before capture |
| `initialProductId` still referenced somewhere in the sheets        | Low — leftover dead code                     | Run `Grep pickedId\|initialProductId` after 1.5 / 2.5                                                 |
| Test harness mismatch with `tests/app/inventory/products.test.tsx` | Medium — test fails to import or mock        | Always complete 5.1 (locate sibling) before 5.2 (write)                                               |
| `npm run verify` reveals unrelated flake                           | Low                                          | Re-run to confirm; investigate only on persistent failure                                             |

## Scope Distribution

- XS: 27 sub-tasks (interface, state, import, commit, typecheck steps)
- S: 7 sub-tasks (small JSX edits, single-file tests, signature alignment)
- M: 1 sub-task (Task 3.2: three `useEffect` blocks in lockstep)
- L or larger: none — every sub-task is single-file and verifiable in one focused session

Total: ~35 sub-tasks across 7 phases.
