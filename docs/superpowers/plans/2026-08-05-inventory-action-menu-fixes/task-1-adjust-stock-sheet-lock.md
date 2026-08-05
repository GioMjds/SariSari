# Task 1: Lock `AdjustStockSheet` to a single product

> Sub-task of [`../2026-08-05-inventory-action-menu-fixes.md`](../2026-08-05-inventory-action-menu-fixes.md). Self-contained — code blocks are inlined and reference the actual file at `components/inventory/modals/AdjustStockSheet.tsx`. Read that file first to confirm the current shape.

**Goal:** Replace `initialProductId: number | null` on `AdjustStockSheet` with `lockedProduct: Product | null` so per-row callers can lock the sheet to a single product. Bulk flows (FAB) continue to pass `null` and the existing `ProductPicker` branch is preserved.

**File:** `components/inventory/modals/AdjustStockSheet.tsx`

**Interfaces:**

- `Product` is **already imported** at line 7 — do not re-add.
- New prop signature on `AdjustStockSheet`:

  ```ts
  interface Props {
    visible: boolean;
    onClose: () => void;
    onSubmitted?: (productId: number, newQty: number) => void;
    lockedProduct: Product | null;
  }
  ```

- `ProductPicker`'s `onSelect` signature (from `components/inventory/modals/ProductPicker.tsx`) is `(id: number | null) => void`. The no-op must match exactly.

**Dependencies:** None.

**Estimated scope:** S (one file, ~6 edits + import cleanup).

---

## Steps

### Step 1: Update the `Props` interface (lines 16-21)

Replace the existing block with:

```ts
interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmitted?: (productId: number, newQty: number) => void;
  lockedProduct: Product | null;
}
```

### Step 2: Update the function signature (lines 23-28)

Replace the destructured parameter list so it becomes:

```ts
export function AdjustStockSheet({
  visible,
  onClose,
  onSubmitted,
  lockedProduct,
}: Props) {
```

### Step 3: Drop `pickedId` state and reset it in the effect (lines 36, 43)

In the state declarations (line 36), remove the `pickedId` line so the block becomes:

```ts
const [direction, setDirection] = useState<Direction>('increase');
const [qty, setQty] = useState(1);
const [note, setNote] = useState('');
```

In the existing `useEffect` (lines 41-48), drop `setPickedId(initialProductId);` and remove `initialProductId` from the deps so the block becomes:

```ts
useEffect(() => {
  if (visible) {
    setDirection('increase');
    setQty(1);
    setNote('');
  }
}, [visible]);
```

### Step 4: Resolve `product` directly from `lockedProduct` (lines 50-53)

Replace the `useMemo` derivation with a plain assignment:

```ts
const product = lockedProduct;
```

Delete the `useMemo` import on line 1 (it becomes unused after this change and after Step 3). The `useProducts()` call and `products` memo must remain (still needed for the bulk `ProductPicker` branch). The new imports line should be:

```ts
import React, { useEffect, useState } from 'react';
```

### Step 5: Branch the JSX on `lockedProduct` (lines 98-106)

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

Note: `ProductPicker.onSelect` is `(id: number | null) => void`. The `() => {}` no-op matches that signature. The bulk path doesn't write back to any state — `ProductPicker` is purely presentational in this branch (the picker is being deprecated for the bulk FAB flow but kept as a fallback).

### Step 6: Audit `handleSubmit` (lines 65-80)

`handleSubmit` already reads `product.id` and `product.quantity` through `product = lockedProduct` — no change needed. Confirm `Grep` returns no matches for `pickedId` or `setPickedId` anywhere in this file.

### Step 7: Type-check

Run: `npm run typecheck`
Expected: PASS.

### Step 8: Commit

```bash
git add components/inventory/modals/AdjustStockSheet.tsx
git commit -m "refactor(inventory): lock AdjustStockSheet to a single product"
```

---

## Acceptance criteria

- [ ] `Props` interface declares `lockedProduct: Product | null` (lines 16-21)
- [ ] Function destructures `lockedProduct` from props (lines 23-28)
- [ ] No reference to `initialProductId` remains in the interface or signature
- [ ] `pickedId` state removed (no reference to `pickedId` or `setPickedId` anywhere)
- [ ] Reset effect depends only on `visible`; resets `direction`, `qty`, `note` only
- [ ] `product = lockedProduct` (no `useMemo` wrapping)
- [ ] `useProducts()` and `products` memo preserved (still needed for bulk branch)
- [ ] JSX ternary branches on `lockedProduct`
- [ ] Bulk `ProductPicker` receives `selectedId={null}` and `onSelect={() => {}}` matching `(id: number | null) => void`
- [ ] `useMemo` import removed; `useState` and `useEffect` imports kept
- [ ] `handleSubmit` still references only `product.id`, `product.quantity`
- [ ] `npm run typecheck` passes
- [ ] Single commit: `refactor(inventory): lock AdjustStockSheet to a single product`

## Verification

- `npm run typecheck` passes.
- `Grep` for `pickedId` and `initialProductId` in `components/inventory/modals/AdjustStockSheet.tsx` returns no matches.
- `git diff HEAD~1 -- components/inventory/modals/AdjustStockSheet.tsx` shows only the intended lines changed.
- `git log -1 --oneline` shows the expected commit message.

## Follow-ups

- [Task 2](./task-2-mark-damaged-sheet-lock.md) mirrors this task for `MarkDamagedSheet`. Can run in parallel (different file).
- [Task 3](./task-3-layout-signal-threading.md) threads the signal's `productId` into the layout so callers can actually pass `lockedProduct`.
- [Task 6](./task-6-locked-sheet-tests.md) adds the regression test that asserts the picker is hidden when `lockedProduct` is set.