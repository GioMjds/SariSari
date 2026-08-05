# Task 6: Add regression tests for the locked sheet

> Sub-task of [`../2026-08-05-inventory-action-menu-fixes.md`](../2026-08-05-inventory-action-menu-fixes.md). Self-contained — code blocks inlined. **Sequential** after [Task 1](./task-1-adjust-stock-sheet-lock.md), [Task 2](./task-2-mark-damaged-sheet-lock.md), and [Task 3](./task-3-layout-signal-threading.md).

**Goal:** Pin the locked-mode behavior of both sheets so a future refactor can't silently regress to rendering the picker when a product is locked.

**Files:**

- Create: `tests/components/inventory/modals/AdjustStockSheet.locked.test.tsx`
- Create: `tests/components/inventory/modals/MarkDamagedSheet.locked.test.tsx`
- Possibly edit: `components/inventory/modals/ProductPicker.tsx` (add `testID="product-picker"` if missing — see Step 1)
- Reference: `jest.setup.ts` and any sibling test under `tests/components/inventory/` for the test harness.

**Interfaces:**

- Consumes: `AdjustStockSheet` / `MarkDamagedSheet` with a `lockedProduct` set; mocked `useProducts` and `useAdjustStock` / `useRecordDamaged`.
- Produces: asserts that `ProductPicker` is NOT rendered when `lockedProduct` is non-null.

**Dependencies:** [Task 1](./task-1-adjust-stock-sheet-lock.md), [Task 2](./task-2-mark-damaged-sheet-lock.md), [Task 3](./task-3-layout-signal-threading.md).

**Estimated scope:** S (two new test files).

---

## Steps

### Step 1: Locate the sheet's `ProductPicker` testID

Read `components/inventory/modals/ProductPicker.tsx` to find its `testID` (or the role/text it exposes). If it has none, add a `testID="product-picker"` to its root `View` as part of this task. Note this in a follow-up commit if you add the testID.

### Step 2: Write the failing test for `AdjustStockSheet`

In `tests/components/inventory/modals/AdjustStockSheet.locked.test.tsx`:

```ts
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { AdjustStockSheet } from '@/components/inventory/modals/AdjustStockSheet';

jest.mock('@/hooks/useProducts', () => ({
  useProducts: () => ({ getAllProductsQuery: { data: [] } }),
}));

jest.mock('@/hooks/useStockMutations', () => ({
  useAdjustStock: () => ({ mutate: jest.fn(), isPending: false }),
}));

const product = {
  id: 1,
  name: 'Coke',
  quantity: 5,
  price: 12,
  created_at: 0,
  updated_at: 0,
  category: null,
  sku: null,
  barcode: null,
  supplier_id: null,
};

describe('AdjustStockSheet locked mode', () => {
  it('does not render the product picker when lockedProduct is set', () => {
    render(
      <AdjustStockSheet
        visible
        onClose={() => {}}
        lockedProduct={product as any}
      />,
    );
    expect(screen.queryByTestId('product-picker')).toBeNull();
  });
});
```

### Step 3: Run the test to verify it passes

Run: `npm test -- tests/components/inventory/modals/AdjustStockSheet.locked.test.tsx`
Expected: PASS — Phases 1 and 3 are already committed, so the prop exists and the picker is hidden.

(Note: in the parent plan's "fail then pass" sequence, this test would fail before Task 1's commit because `lockedProduct` wouldn't yet be a valid prop. In this execution order it passes on first run.)

### Step 4: Write the failing test for `MarkDamagedSheet`

In `tests/components/inventory/modals/MarkDamagedSheet.locked.test.tsx`:

```ts
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { MarkDamagedSheet } from '@/components/inventory/modals/MarkDamagedSheet';

jest.mock('@/hooks/useProducts', () => ({
  useProducts: () => ({ getAllProductsQuery: { data: [] } }),
}));

jest.mock('@/hooks/useStockMutations', () => ({
  useRecordDamaged: () => ({ mutate: jest.fn(), isPending: false }),
}));

const product = {
  id: 1,
  name: 'Coke',
  quantity: 5,
  price: 12,
  created_at: 0,
  updated_at: 0,
  category: null,
  sku: null,
  barcode: null,
  supplier_id: null,
};

describe('MarkDamagedSheet locked mode', () => {
  it('does not render the product picker when lockedProduct is set', () => {
    render(
      <MarkDamagedSheet
        visible
        onClose={() => {}}
        lockedProduct={product as any}
      />,
    );
    expect(screen.queryByTestId('product-picker')).toBeNull();
  });
});
```

### Step 5: Run both tests to verify they pass

Run: `npm test -- tests/components/inventory/modals/AdjustStockSheet.locked.test.tsx tests/components/inventory/modals/MarkDamagedSheet.locked.test.tsx`
Expected: PASS.

### Step 6: Commit

```bash
git add tests/components/inventory/modals/AdjustStockSheet.locked.test.tsx \
        tests/components/inventory/modals/MarkDamagedSheet.locked.test.tsx
git commit -m "test(inventory): assert stock sheets hide picker when locked"
```

If `ProductPicker.tsx` was edited in Step 1 to add the `testID`, include it in the same commit (or split into a focused commit before the tests commit if you prefer — note the testID is a prerequisite).

---

## Acceptance criteria

- [ ] `ProductPicker` has a `testID="product-picker"` on its root (added if missing)
- [ ] `tests/components/inventory/modals/AdjustStockSheet.locked.test.tsx` exists
- [ ] `tests/components/inventory/modals/MarkDamagedSheet.locked.test.tsx` exists
- [ ] Both tests render their sheet with a non-null `lockedProduct`
- [ ] Both tests expect `screen.queryByTestId('product-picker')` to be `null`
- [ ] `npm test -- tests/components/inventory/modals/AdjustStockSheet.locked.test.tsx` passes
- [ ] `npm test -- tests/components/inventory/modals/MarkDamagedSheet.locked.test.tsx` passes
- [ ] No unrelated test regressions in `tests/components/inventory/`
- [ ] Single commit: `test(inventory): assert stock sheets hide picker when locked`

## Verification

- Both new tests pass.
- `npm run verify` passes (Task 7 will run the full verify).
- `git log -1 --oneline` shows the expected commit.
