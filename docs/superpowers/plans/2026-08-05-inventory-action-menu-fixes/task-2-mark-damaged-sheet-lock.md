# Task 2: Lock `MarkDamagedSheet` to a single product

> Sub-task of [`../2026-08-05-inventory-action-menu-fixes.md`](../2026-08-05-inventory-action-menu-fixes.md). Self-contained — code blocks are inlined and reference the actual file at `components/inventory/modals/MarkDamagedSheet.tsx`. Read that file first to confirm the current shape.

**Goal:** Replace `initialProductId: number | null` on `MarkDamagedSheet` with `lockedProduct: Product | null` so per-row callers can lock the sheet to a single product. Bulk flows (FAB) continue to pass `null` and the existing `ProductPicker` branch is preserved.

**File:** `components/inventory/modals/MarkDamagedSheet.tsx`

**Interfaces:**

- `Product` is **already imported** at line 7 — do not re-add.
- New prop signature on `MarkDamagedSheet`:

  ```ts
  interface Props {
    visible: boolean;
    onClose: () => void;
    onSubmitted?: (productId: number, qty: number) => void;
    lockedProduct: Product | null;
  }
  ```

- `ProductPicker`'s `onSelect` signature (from `components/inventory/modals/ProductPicker.tsx`) is `(id: number | null) => void`. The no-op must match exactly.

**Dependencies:** None. Can run in parallel with [Task 1](./task-1-adjust-stock-sheet-lock.md).

**Estimated scope:** S (one file, ~6 edits + import cleanup).

---

## Steps

### Step 1: Update the `Props` interface (lines 13-18)

Replace the existing block with:

```ts
interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmitted?: (productId: number, qty: number) => void;
  lockedProduct: Product | null;
}
```

### Step 2: Update the function signature (lines 20-25)

Replace the destructured parameter list so it becomes:

```ts
export function MarkDamagedSheet({
  visible,
  onClose,
  onSubmitted,
  lockedProduct,
}: Props) {
```

### Step 3: Drop `pickedId` state and reset it in the effect (lines 33, 39)

In the state declarations (line 33), remove the `pickedId` line so the block becomes:

```ts
const [qty, setQty] = useState(1);
const [note, setNote] = useState('');
```

In the existing `useEffect` (lines 37-43), drop `setPickedId(initialProductId);` and remove `initialProductId` from the deps so the block becomes:

```ts
useEffect(() => {
  if (visible) {
    setQty(1);
    setNote('');
  }
}, [visible]);
```

### Step 4: Resolve `product` directly from `lockedProduct` (lines 45-48)

Replace the `useMemo` derivation with a plain assignment:

```ts
const product = lockedProduct;
```

Delete the `useMemo` import on line 1 (it becomes unused after this change and after Step 3). The `useProducts()` call and `products` memo must remain (still needed for the bulk `ProductPicker` branch). The new imports line should be:

```ts
import React, { useEffect, useState } from 'react';
```

### Step 5: Branch the JSX on `lockedProduct` (lines 86-94)

Replace the conditional with:

```tsx
{lockedProduct ? (
  <SheetProductCard product={lockedProduct} />
) : (
  <ProductPicker
    products={products}
    selectedId={null}
    onSelect={() => {}}
  />
)}
```

Note: `ProductPicker.onSelect` is `(id: number | null) => void`. The `() => {}` no-op matches that signature. The bulk path doesn't write back to any state — `ProductPicker` is purely presentational in this branch.

### Step 6: Type-check

Run: `npm run typecheck`
Expected: PASS.

### Step 7: Commit

```bash
git add components/inventory/modals/MarkDamagedSheet.tsx
git commit -m "refactor(inventory): lock MarkDamagedSheet to a single product"
```

---

## Acceptance criteria

- [ ] `Props` declares `lockedProduct: Product | null` (lines 13-18)
- [ ] Function destructures `lockedProduct` from props (lines 20-25)
- [ ] No reference to `initialProductId` remains in the interface or signature
- [ ] `pickedId` state removed (no reference to `pickedId` or `setPickedId` anywhere)
- [ ] Reset effect depends only on `visible`; resets `qty`, `note` only
- [ ] `product = lockedProduct` (no `useMemo` wrapping)
- [ ] `useProducts()` and `products` memo preserved (still needed for bulk branch)
- [ ] JSX ternary branches on `lockedProduct`
- [ ] Bulk `ProductPicker` receives `selectedId={null}` and `onSelect={() => {}}` matching `(id: number | null) => void`
- [ ] `useMemo` import removed; `useState` and `useEffect` imports kept
- [ ] `handleSubmit` still references only `product.id`, `product.quantity`
- [ ] `npm run typecheck` passes
- [ ] Single commit: `refactor(inventory): lock MarkDamagedSheet to a single product`

## Verification

- `npm run typecheck` passes.
- `Grep` for `pickedId` and `initialProductId` in `components/inventory/modals/MarkDamagedSheet.tsx` returns no matches.
- `git diff HEAD~1 -- components/inventory/modals/MarkDamagedSheet.tsx` shows only the intended lines changed.
- `git log -1 --oneline` shows the expected commit message.

## Follow-ups

- [Task 3](./task-3-layout-signal-threading.md) threads the signal's `productId` into the layout so callers can actually pass `lockedProduct`.
- [Task 6](./task-6-locked-sheet-tests.md) adds the regression test that asserts the picker is hidden when `lockedProduct` is set.