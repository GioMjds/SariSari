# Task 2: Lock `MarkDamagedSheet` to a single product

> Sub-task of [`../2026-08-05-inventory-action-menu-fixes.md`](../2026-08-05-inventory-action-menu-fixes.md). Self-contained — code blocks inlined. Mirrors [Task 1](./task-1-adjust-stock-sheet-lock.md) for a different file.

**Goal:** Replace `initialProductId` on `MarkDamagedSheet` with a `lockedProduct: Product | null` prop so per-row callers can lock the sheet to a single product. Bulk flows (FAB) continue to pass `null` and the existing `ProductPicker` branch is preserved.

**Files:**

- Modify: `components/inventory/modals/MarkDamagedSheet.tsx`
- No new tests in this task. Regression tests for the locked behavior are added in [Task 6](./task-6-locked-sheet-tests.md).

**Interfaces:**

- Produces: new prop signature on `MarkDamagedSheet`:

  ```ts
  interface MarkDamagedSheetProps {
    visible: boolean;
    onClose: () => void;
    onSubmitted?: (productId: number, qty: number) => void;
    lockedProduct: Product | null;
  }
  ```

**Dependencies:** None. Can run in parallel with [Task 1](./task-1-adjust-stock-sheet-lock.md).

**Estimated scope:** S (one file, ~5 edits).

---

## Steps

### Step 1: Update the `Props` interface

In `components/inventory/modals/MarkDamagedSheet.tsx` (lines 13-19 per parent plan), replace the body with:

```ts
interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmitted?: (productId: number, qty: number) => void;
  lockedProduct: Product | null;
}

export function MarkDamagedSheet({
  visible,
  onClose,
  onSubmitted,
  lockedProduct,
}: Props) {
```

### Step 2: Drop `pickedId` and its reset effect

Replace the state declarations and effect with:

```ts
const [qty, setQty] = useState(1);
const [note, setNote] = useState('');

useEffect(() => {
  if (visible) {
    setQty(1);
    setNote('');
  }
}, [visible]);
```

### Step 3: Resolve the active product from `lockedProduct` directly

Replace the `product = useMemo(...)` derivation with:

```ts
const product = lockedProduct;
```

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
    <ProductPicker products={products} selectedId={null} onSelect={() => {}} />
  );
}
```

### Step 5: Type-check

Run: `npm run typecheck`
Expected: PASS.

### Step 6: Commit

```bash
git add components/inventory/modals/MarkDamagedSheet.tsx
git commit -m "refactor(inventory): lock MarkDamagedSheet to a single product"
```

---

## Acceptance criteria

- [ ] `Props` declares `lockedProduct: Product | null`
- [ ] No `initialProductId` remains in the interface or signature
- [ ] `Product` import present
- [ ] `pickedId` state removed
- [ ] Reset effect depends only on `visible`; resets `qty`, `note` only
- [ ] `product = lockedProduct` (no `useMemo` wrapping)
- [ ] `useProducts()` and `products` array preserved (still needed for bulk branch)
- [ ] JSX ternary branches on `lockedProduct`
- [ ] `ProductPicker` receives `selectedId={null}` and a matching `onSelect` no-op
- [ ] No `pickedId` / `setPickedId` references anywhere
- [ ] `handleSubmit` references only `product.id`, `product.quantity` (or the relevant fields)
- [ ] Single commit: `refactor(inventory): lock MarkDamagedSheet to a single product`

## Verification

- `npm run typecheck` passes.
- `Grep` for `pickedId` and `initialProductId` in `components/inventory/modals/MarkDamagedSheet.tsx` returns no matches.
- `git log -1 --oneline` shows the expected commit message.

## Follow-ups

- Task 3 threads the signal's `productId` into the layout so callers can actually pass `lockedProduct`.
- Task 6 adds the regression test that asserts the picker is hidden when `lockedProduct` is set.
