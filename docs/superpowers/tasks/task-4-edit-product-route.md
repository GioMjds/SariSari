# Task 4: Fix the Edit Product route

> Sub-task of [`../2026-08-05-inventory-action-menu-fixes.md`](../2026-08-05-inventory-action-menu-fixes.md). Self-contained — code blocks inlined. **Independent** of Tasks 1-3 (different file, single-line change).

**Goal:** Route the per-row action menu's "Edit Product" to `/(edit-forms)/edit-product/${id}` instead of the read-only `/(edit-forms)/product-details/${id}`.

**Files:**

- Modify: `app/(tabs)/inventory/products.tsx:123-129` (per parent plan)

**Interfaces:**

- Consumes: `useRouter` from `expo-router` (already in scope).
- Produces: `handleMenuEdit` pushes `/(edit-forms)/edit-product/${id}`.

**Dependencies:** None.

**Estimated scope:** XS (single-line change).

---

## Steps

### Step 1: Change the route

In `app/(tabs)/inventory/products.tsx`, replace the `handleMenuEdit` body (lines 123-129):

```ts
const handleMenuEdit = useCallback(
  (id: number) => {
    setMenuProduct(null);
    router.push(`/(edit-forms)/edit-product/${id}`);
  },
  [router],
);
```

### Step 2: Verify `handlePress` is unchanged

Confirm lines 78-80 still push `/(edit-forms)/product-details/${id}`. Do not modify.

### Step 3: Type-check

Run: `npm run typecheck`
Expected: PASS.

### Step 4: Commit

```bash
git add app/\(tabs\)/inventory/products.tsx
git commit -m "fix(inventory): route Edit Product to the edit form"
```

---

## Acceptance criteria

- [ ] `handleMenuEdit` pushes `/(edit-forms)/edit-product/${id}`
- [ ] `setMenuProduct(null)` still runs before navigation
- [ ] `useCallback` deps still only contain `router`
- [ ] `handlePress` body unchanged — still pushes `/(edit-forms)/product-details/${id}`
- [ ] `git diff` against `main` shows only `handleMenuEdit` was touched in this file
- [ ] Single commit: `fix(inventory): route Edit Product to the edit form`

## Verification

- `npm run typecheck` passes.
- `git diff` review confirms only `handleMenuEdit` changed in `app/(tabs)/inventory/products.tsx`.
- `git log -1 --oneline` shows the expected commit.

## Follow-ups

- Task 5 adds the regression test that asserts the route is `edit-product/${id}` and would fail if anyone reverts it.
