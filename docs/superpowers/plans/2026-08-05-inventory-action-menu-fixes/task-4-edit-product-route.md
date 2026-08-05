# Task 4: Verify the Edit Product route is fixed

> Sub-task of [`../2026-08-05-inventory-action-menu-fixes.md`](../2026-08-05-inventory-action-menu-fixes.md). Self-contained.

**Goal:** Confirm that the per-row action menu's "Edit Product" already routes to `/(edit-forms)/edit-product/${id}` rather than the read-only `/(edit-forms)/product-details/${id}`. As of `2026-08-05` this change is already in `app/(tabs)/inventory/products.tsx` — Task 5's regression test depends on it being there.

**File:** `app/(tabs)/inventory/products.tsx`

**Dependencies:** None.

**Estimated scope:** XS (verification only; no code changes expected).

---

## Background

The parent plan (Tasks 1-7 in `2026-08-05-inventory-action-menu-fixes.md`) was written assuming Task 4 still needed implementing. At HEAD, `handleMenuEdit` in `app/(tabs)/inventory/products.tsx:121-127` already does the right thing:

```ts
const handleMenuEdit = useCallback(
  (id: number) => {
    setMenuProduct(null);
    router.push(`/(edit-forms)/edit-product/${id}`);
  },
  [router],
);
```

The original wrong route (`/(edit-forms)/product-details/${id}`) is now only used by `handlePress` (lines 78-81), which is the row-tap behavior — and that one **should** stay on the read-only details view. The two routes are intentionally different: tap-the-row = view details; tap-menu-Edit = open the edit form.

## Steps

### Step 1: Verify `handleMenuEdit` routes to `edit-product`

Open `app/(tabs)/inventory/products.tsx` and read lines 121-127. Confirm the body is:

```ts
const handleMenuEdit = useCallback(
  (id: number) => {
    setMenuProduct(null);
    router.push(`/(edit-forms)/edit-product/${id}`);
  },
  [router],
);
```

If the body still says `product-details/${id}` instead of `edit-product/${id}`, the task has regressed — apply the fix (replace `product-details` with `edit-product`) and commit it before continuing. If the body matches above, proceed.

### Step 2: Verify `handlePress` is unchanged

Confirm lines 78-81 still push `/(edit-forms)/product-details/${id}`:

```ts
const handlePress = useCallback(
  (id: number) => router.push(`/(edit-forms)/product-details/${id}`),
  [router],
);
```

This is intentional — `handlePress` is the row-tap path that goes to the read-only view.

### Step 3: Verify no other code path pushes `product-details` from the menu

```bash
grep -n "product-details" /d/giomj/Projects/sarisari/app/\(tabs\)/inventory/products.tsx
```

Expected: only the `handlePress` line appears. If a second hit exists (e.g. inside `handleMenuEdit`), the bug has regressed.

### Step 4: Type-check

Run: `npm run typecheck`
Expected: PASS.

### Step 5: Decide whether to commit

If Step 1 found the body was wrong and you fixed it, commit:

```bash
git add app/\(tabs\)/inventory/products.tsx
git commit -m "fix(inventory): route Edit Product to the edit form"
```

If Step 1 confirmed the body was already correct, no commit is needed. `git status` should be clean for this file.

---

## Acceptance criteria

- [ ] `handleMenuEdit` (lines 121-127) pushes `/(edit-forms)/edit-product/${id}`
- [ ] `handlePress` (lines 78-81) unchanged — still pushes `/(edit-forms)/product-details/${id}`
- [ ] `grep -n "product-details" app/(tabs)/inventory/products.tsx` returns exactly one hit (the `handlePress` line)
- [ ] `npm run typecheck` passes
- [ ] If the fix needed to be reapplied: commit `fix(inventory): route Edit Product to the edit form`
- [ ] If the fix was already in place: no commit, `git status` clean for this file

## Verification

- Typecheck passes.
- `git log` shows no new commit for Task 4 (already applied at HEAD), OR shows the new commit if you re-applied it.
- `grep` returns one hit only.

## Follow-ups

- [Task 5](./task-5-edit-product-route-test.md) adds the regression test that pins this behavior so it can't silently regress again.