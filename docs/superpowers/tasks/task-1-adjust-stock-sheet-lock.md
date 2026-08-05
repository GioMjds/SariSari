# Task 1: Lock `AdjustStockSheet` to a single product

> Sub-task of [`../2026-08-05-inventory-action-menu-fixes.md`](../2026-08-05-inventory-action-menu-fixes.md). This file is self-contained — code blocks are inlined so it can be handed to a sub-agent without re-reading the parent plan.

**Goal:** Replace `initialProductId` on `AdjustStockSheet` with a `lockedProduct: Product | null` prop so per-row callers can lock the sheet to a single product. Bulk flows (FAB) continue to pass `null` and the existing `ProductPicker` branch is preserved.

**Files:**

- Modify: `components/inventory/modals/AdjustStockSheet.tsx`
- No new tests (existing sheet tests do not cover this component; manual smoke is covered in [Task 7](./task-7-final-verify.md)).

**Interfaces:**

- Consumes: existing exports from `@/hooks/useProducts` and `@/hooks/useStockMutations`; `Product` from `@/types/products.types`.
- Produces: new prop signature on `AdjustStockSheet`:

  ```ts
  interface AdjustStockSheetProps {
    visible: boolean;
    onClose: () => void;
    onSubmitted?: (productId: number, newQty: number) => void;
    lockedProduct: Product | null;
  }
  ```

**Dependencies:** None.

**Estimated scope:** S (one file, ~5 edits).

---

## Steps

### Step 1: Update the `Props` interface

Replace the interface body so it becomes:

```ts
interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmitted?: (productId: number, newQty: number) => void;
  lockedProduct: Product | null;
}

export function AdjustStockSheet({
  visible,
  onClose,
  onSubmitted,
  lockedProduct,
}: Props) {
```

### Step 2: Drop `pickedId` and its reset effect

In the component body, delete the lines:

```ts
const [pickedId, setPickedId] = useState<number | null>(initialProductId);
const [direction, setDirection] = useState<Direction>('increase');
const [qty, setQty] = useState(1);
const [note, setNote] = useState('');

useEffect(() => {
  if (visible) {
    setPickedId(initialProductId);
    setDirection('increase');
    setQty(1);
    setNote('');
  }
}, [visible, initialProductId]);
```

Replace with:

```ts
const [direction, setDirection] = useState<Direction>('increase');
const [qty, setQty] = useState(1);
const [note, setNote] = useState('');

useEffect(() => {
  if (visible) {
    setDirection('increase');
    setQty(1);
    setNote('');
  }
}, [visible]);
```

Also remove the now-unused `useState` import if `useState` is no longer referenced. Keep `useEffect` and `useMemo` (still needed for `products` in the bulk branch).

### Step 3: Resolve the active product from `lockedProduct` directly

Replace the `product = useMemo(...)` derivation (currently `products.find(p => p.id === pickedId)`) with:

```ts
const product = lockedProduct;
```

The `useProducts()` call and `products` memo are still needed for the `ProductPicker` shown in the bulk branch.

### Step 4: Branch the body on `lockedProduct`

In the JSX, replace the conditional:

```tsx
{
  product ? (
    <SheetProductCard product={product} />
  ) : (
    <ProductPicker
      products={products}
      selectedId={pickedId}
      onSelect={setPickedId}
    />
  );
}
```

with:

```tsx
{
  lockedProduct ? (
    <SheetProductCard product={lockedProduct} />
  ) : (
    <ProductPicker
      products={products}
      selectedId={null}
      onSelect={() => {
        /* bulk path: selection handled inside ProductPicker */
      }}
    />
  );
}
```

Note: `ProductPicker`'s `onSelect` signature is `(id: number) => void`. Read the current `ProductPicker` props (in `components/inventory/modals/ProductPicker.tsx`) before editing — if it accepts a stable callback with no other side effects, the no-op arrow is fine. If it expects a real setter, pass a no-op `() => {}` and leave a TODO in the next task. (This task is about locking, not picker wiring.)

### Step 5: Remove the `pickedId` references in handlers

In `handleSubmit`, replace `product.id` (already correct) and `pickedId` references. The current code references `product.id` and `product.quantity` — both still resolve through `product = lockedProduct` when locked, so no change is needed there. Verify no other reference to `setPickedId` or `pickedId` remains.

### Step 6: Type-check

Run: `npm run typecheck`
Expected: PASS. If `ProductPicker`'s `onSelect` signature differs, adjust the no-op to match the expected type (likely `() => void` already, since the picker manages its own state in the bulk case).

### Step 7: Commit

```bash
git add components/inventory/modals/AdjustStockSheet.tsx
git commit -m "refactor(inventory): lock AdjustStockSheet to a single product"
```

---

## Acceptance criteria

- [ ] `Props` interface declares `lockedProduct: Product | null`
- [ ] Function destructures `lockedProduct` from props
- [ ] No reference to `initialProductId` remains in the interface or signature
- [ ] `Product` is imported from `@/types/products.types`
- [ ] `pickedId` state removed (not referenced anywhere)
- [ ] Reset effect depends only on `visible`; resets `direction`, `qty`, `note` only
- [ ] `useState` import remains if other state is still used; removed only if no other state remains
- [ ] `useEffect` and `useMemo` imports kept (still needed)
- [ ] `product` resolves to `lockedProduct` with no `useMemo` wrapping
- [ ] `useProducts()` call and the `products` array remain in place (still needed for the bulk `ProductPicker` branch)
- [ ] JSX ternary branches on `lockedProduct`, not the derived `product`
- [ ] Bulk `ProductPicker` receives `selectedId={null}` and a matching `onSelect` no-op
- [ ] No reference to `setPickedId` anywhere
- [ ] `handleSubmit` references only `product.id`, `product.quantity` (or the relevant fields)
- [ ] Single commit: `refactor(inventory): lock AdjustStockSheet to a single product`

## Verification

- `npm run typecheck` passes.
- `Grep` for `pickedId` and `initialProductId` in `components/inventory/modals/AdjustStockSheet.tsx` returns no matches.
- `git log -1 --oneline` shows the expected commit message.
- `git status` is clean for the touched file.

## Follow-ups

- Task 2 mirrors this task for `MarkDamagedSheet`. Run them in parallel.
- Task 3 threads the signal's `productId` into the layout so callers can actually pass `lockedProduct`.
- Task 6 adds the regression test that asserts the picker is hidden when `lockedProduct` is set.
