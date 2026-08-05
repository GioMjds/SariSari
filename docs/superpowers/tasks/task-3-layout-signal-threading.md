# Task 3: Thread the signal's `productId` into the layout's sheet mounts

> Sub-task of [`../2026-08-05-inventory-action-menu-fixes.md`](../2026-08-05-inventory-action-menu-fixes.md). Self-contained — code blocks inlined. **Sequential** after [Task 1](./task-1-adjust-stock-sheet-lock.md) and [Task 2](./task-2-mark-damaged-sheet-lock.md) because the new `lockedProduct` prop must exist before this task references it.

**Goal:** Make the per-row action menu's signal actually flow into each sheet so the sheets can render `SheetProductCard` instead of a `ProductPicker`. Currently the layout stores the id in `useStockSheetSignal` but mounts the sheets with `initialProductId={null}` (or no id at all).

**Files:**

- Modify: `app/(tabs)/inventory/_layout.tsx`

**Interfaces:**

- Consumes: `useStockSheetSignal` (unchanged API), `useProducts` from `@/hooks/useProducts` (already used elsewhere).
- Produces: each sheet receives `lockedProduct={matchedProduct}` where `matchedProduct` is the product resolved from the signal's `productId` plus the products list.

**Dependencies:** [Task 1](./task-1-adjust-stock-sheet-lock.md) and [Task 2](./task-2-mark-damaged-sheet-lock.md) (the new prop shape must exist before any consumer references it).

**Estimated scope:** M (three `useEffect` blocks to modify in lockstep, three sheet mounts to update, one new helper).

---

## Steps

### Step 1: Add the product list hook and a `matchedProduct` resolver

Near the existing `useProducts` call (none currently in this file), add at the top of the component body (after `const signal = useStockSheetSignal();` on line 39 per parent plan):

```ts
import { useProducts } from '@/hooks/useProducts';
```

Then inside the component:

```ts
const { getAllProductsQuery } = useProducts();
const products = getAllProductsQuery.data ?? [];
const resolveProduct = (id: number | null) =>
  id == null ? null : (products.find((p) => p.id === id) ?? null);
```

### Step 2: Open the sheets with the resolved product

The three existing `useEffect` blocks at lines 90-109 currently only flip a boolean. Extend each so the id is captured before the signal is cleared.

Add three new state slots next to the existing `setAdjustOpen`:

```ts
const [adjustProduct, setAdjustProduct] = useState<number | null>(null);
const [damagedProduct, setDamagedProduct] = useState<number | null>(null);
const [restockProduct, setRestockProduct] = useState<number | null>(null);
```

Replace the `adjust` effect with:

```ts
useEffect(() => {
  if (signal.adjust.productId !== null) {
    setAdjustProduct(signal.adjust.productId);
    setAdjustOpen(true);
    signal.clearAdjust();
  }
}, [signal.adjust.productId, signal]);
```

Apply the same pattern to the `restock` and `damaged` blocks, capturing into `setRestockProduct` and `setDamagedProduct` respectively. When a sheet closes (via the `onClose` callback), also clear the captured id (e.g. `setAdjustProduct(null)` inside the `onClose` arrow) so the next bulk open doesn't briefly show the previous product.

### Step 3: Resolve the captured id to a `Product` at render time

Just before the sheet mount block, compute:

```ts
const lockedAdjust = resolveProduct(adjustProduct);
const lockedDamaged = resolveProduct(damagedProduct);
const lockedRestock = resolveProduct(restockProduct);
```

### Step 4: Pass the new prop to each sheet

Update the three sheet mounts to use the new prop:

```tsx
<RestockSheet
  visible={restockOpen}
  lockedProduct={lockedRestock}
  onClose={() => {
    setRestockOpen(false);
    setRestockProduct(null);
  }}
/>
<MarkDamagedSheet
  visible={damagedOpen}
  lockedProduct={lockedDamaged}
  onClose={() => {
    setDamagedOpen(false);
    setDamagedProduct(null);
  }}
/>
<AdjustStockSheet
  visible={adjustOpen}
  lockedProduct={lockedAdjust}
  onClose={() => {
    setAdjustOpen(false);
    setAdjustProduct(null);
  }}
/>
```

### Step 5: Type-check

Run: `npm run typecheck`
Expected: PASS.

### Step 6: Commit

```bash
git add app/\(tabs\)/inventory/_layout.tsx
git commit -m "feat(inventory): thread signal productId into stock sheet mounts"
```

---

## Acceptance criteria

- [ ] `import { useProducts } from '@/hooks/useProducts';` present at the top of `app/(tabs)/inventory/_layout.tsx`
- [ ] `getAllProductsQuery.data ?? []` destructured into `products`
- [ ] `resolveProduct(id)` defined as `(id) => id == null ? null : products.find(p => p.id === id) ?? null`
- [ ] Three `useState<number | null>(null)` slots: `adjustProduct`, `damagedProduct`, `restockProduct`
- [ ] All three `useEffect`s call `setXProduct(signal.X.productId); setXOpen(true); signal.clearX();` — capture before clear
- [ ] Effects still depend on `signal.X.productId` and `signal`
- [ ] Three `const lockedX = resolveProduct(xProduct);` lines added
- [ ] `RestockSheet` mount passes `lockedProduct={lockedRestock}` and clears `restockProduct` on close
- [ ] `MarkDamagedSheet` mount passes `lockedProduct={lockedDamaged}` and clears `damagedProduct` on close
- [ ] `AdjustStockSheet` mount passes `lockedProduct={lockedAdjust}` and clears `adjustProduct` on close
- [ ] No `initialProductId` prop on any sheet
- [ ] `npm run typecheck` passes
- [ ] Single commit: `feat(inventory): thread signal productId into stock sheet mounts`

## Verification

- `npm run typecheck` passes.
- Diff review confirms three effects are symmetric (each captures id, opens sheet, clears signal) and three `onClose` arrows are symmetric (each clears id and closes sheet).
- `git log -1 --oneline` shows the expected commit.

## Risks

- **Race**: clearing the signal before capturing the id would lose the value. Order matters: `setXProduct(id); setXOpen(true); signal.clearX();`.
- **Stale display**: forgetting to clear `xProduct` on close would let the next bulk open briefly show the previous product. The `onClose` arrows must always set it back to `null`.
