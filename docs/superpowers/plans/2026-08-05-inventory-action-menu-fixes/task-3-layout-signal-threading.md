# Task 3: Thread the signal's `productId` into the layout's sheet mounts

> Sub-task of [`../2026-08-05-inventory-action-menu-fixes.md`](../2026-08-05-inventory-action-menu-fixes.md). Self-contained — code blocks are inlined and reference the actual file at `app/(tabs)/inventory/_layout.tsx`. Read that file first to confirm the current shape.

**Goal:** Make the per-row action menu's signal actually flow into each sheet so the sheets can render `SheetProductCard` instead of a `ProductPicker`. Currently the layout stores the id in `useStockSheetSignal` but the effects clear the signal **before** capturing the id into local state, and the sheet mounts pass `initialProductId={null}`.

**File:** `app/(tabs)/inventory/_layout.tsx`

**Interfaces:**

- `useStockSheetSignal` (from `stores/useStockSheetSignal.ts`): slices `restock`, `damaged`, `adjust` each carry `{ productId: number | null }`. Cleared by `clearRestock()`, `clearDamaged()`, `clearAdjust()`.
- `useProducts` (from `hooks/useProducts.tsx`): returns `{ getAllProductsQuery: { data: Product[] | undefined, ... } }`.

**Dependencies:** [Task 1](./task-1-adjust-stock-sheet-lock.md) and [Task 2](./task-2-mark-damaged-sheet-lock.md) — the new `lockedProduct` prop must exist on the sheet components before any consumer references it.

**Estimated scope:** M (one file, but ~6 distinct edits in lockstep).

---

## Steps

### Step 1: Add `useProducts` import (top of file, after line 19)

The current file imports from `@/stores` on line 19 but does not import `useProducts`. Add a new import line **next to** the existing `useStockSheetSignal` import:

```ts
import { useProducts } from '@/hooks/useProducts';
import { useStockSheetSignal } from '@/stores';
```

Both go at the top with the other imports.

### Step 2: Add `resolveProduct` helper inside the component (after `useStockSheetSignal` call, line 39)

After `const signal = useStockSheetSignal();` (line 39), add:

```ts
const { getAllProductsQuery } = useProducts();
const products = getAllProductsQuery.data ?? [];
const resolveProduct = (id: number | null) =>
  id == null ? null : products.find((p) => p.id === id) ?? null;
```

Note: `getAllProductsQuery.data` is `Product[] | undefined`, so the `?? []` keeps the array never undefined. `products.find(...)` is wrapped in `?? null` to keep the resolver's return type honest.

### Step 3: Add `locked*Product` state slots (after line 37, near the existing visibility state)

The existing visibility slots are lines 35-37:

```ts
const [restockOpen, setRestockOpen] = useState(false);
const [damagedOpen, setDamagedOpen] = useState(false);
const [adjustOpen, setAdjustOpen] = useState(false);
```

Add three more slots immediately after:

```ts
const [restockProduct, setRestockProduct] = useState<number | null>(null);
const [damagedProduct, setDamagedProduct] = useState<number | null>(null);
const [adjustProduct, setAdjustProduct] = useState<number | null>(null);
```

### Step 4: Capture the id in each effect BEFORE clearing the signal

**Critical**: the order is `setXProduct(id); setXOpen(true); signal.clearX();`. Clearing before capturing would lose the value.

Current `adjust` effect (lines 90-95):

```ts
useEffect(() => {
  if (signal.adjust.productId !== null) {
    setAdjustOpen(true);
    signal.clearAdjust();
  }
}, [signal.adjust.productId, signal]);
```

Replace with:

```ts
useEffect(() => {
  if (signal.adjust.productId !== null) {
    setAdjustProduct(signal.adjust.productId);
    setAdjustOpen(true);
    signal.clearAdjust();
  }
}, [signal.adjust.productId, signal]);
```

Apply the same change to the `restock` effect (lines 97-102) and `damaged` effect (lines 104-109), capturing into `setRestockProduct` and `setDamagedProduct` respectively.

### Step 5: Resolve captured ids to `Product` at render time

Just before the sheet mount block (line 152), compute:

```ts
const lockedRestock = resolveProduct(restockProduct);
const lockedDamaged = resolveProduct(damagedProduct);
const lockedAdjust = resolveProduct(adjustProduct);
```

### Step 6: Update each sheet mount to use `lockedProduct` and clear id on close

Replace the current sheet mounts (lines 152-166) with:

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

Each `onClose` now has two responsibilities: flip visibility to `false` AND clear the captured id, so a subsequent bulk open doesn't briefly show the previous product.

### Step 7: Type-check

Run: `npm run typecheck`
Expected: PASS. If a sheet component still expects `initialProductId`, revisit Task 1 or Task 2 — that prop should no longer exist.

### Step 8: Commit

```bash
git add app/\(tabs\)/inventory/_layout.tsx
git commit -m "feat(inventory): thread signal productId into stock sheet mounts"
```

---

## Acceptance criteria

- [ ] `import { useProducts } from '@/hooks/useProducts';` added at the top of the file (next to existing `useStockSheetSignal` import)
- [ ] `getAllProductsQuery.data ?? []` destructured into `products`
- [ ] `resolveProduct(id)` defined: `(id) => id == null ? null : products.find(p => p.id === id) ?? null`
- [ ] Three new `useState<number | null>(null)` slots: `restockProduct`, `damagedProduct`, `adjustProduct` (placed after the visibility slots)
- [ ] All three `useEffect`s capture the id BEFORE clearing the signal: `setXProduct(signal.X.productId); setXOpen(true); signal.clearX();`
- [ ] Effects still depend on `signal.X.productId` and `signal`
- [ ] Three `const lockedX = resolveProduct(xProduct);` lines placed just before the sheet mount block
- [ ] `RestockSheet` mount passes `lockedProduct={lockedRestock}` and `onClose` clears `restockProduct`
- [ ] `MarkDamagedSheet` mount passes `lockedProduct={lockedDamaged}` and `onClose` clears `damagedProduct`
- [ ] `AdjustStockSheet` mount passes `lockedProduct={lockedAdjust}` and `onClose` clears `adjustProduct`
- [ ] No `initialProductId` prop on any sheet
- [ ] `npm run typecheck` passes
- [ ] Single commit: `feat(inventory): thread signal productId into stock sheet mounts`

## Verification

- `npm run typecheck` passes.
- Diff review confirms three effects are symmetric (each: capture id, open sheet, clear signal) and three `onClose` arrows are symmetric (each: clear id, close sheet).
- `git log -1 --oneline` shows the expected commit.

## Risks

- **Race (high)**: clearing the signal before capturing the id would lose the value and the sheet would open with `null`. Order matters — capture FIRST, clear LAST.
- **Stale display (medium)**: forgetting to clear `xProduct` on close would let the next bulk open briefly show the previous product. The `onClose` arrows must always set it back to `null`.
- **Type drift (low)**: if `Product` type's `id` field changes (e.g. becomes a string), the `resolveProduct` comparison would break silently. `npm run typecheck` catches the parameter mismatch but not value-level drift.