# Task 6: Add regression tests for the locked sheet

> Sub-task of [`../2026-08-05-inventory-action-menu-fixes.md`](../2026-08-05-inventory-action-menu-fixes.md). Self-contained — test code is inlined and grounded against the actual sheet implementations.

**Goal:** Pin the locked-mode behavior of both sheets so a future refactor can't silently regress to rendering the picker when a product is locked.

**Files to create:**

- `tests/components/inventory/modals/AdjustStockSheet.locked.test.tsx`
- `tests/components/inventory/modals/MarkDamagedSheet.locked.test.tsx`

**Possibly edit:**

- `components/inventory/modals/ProductPicker.tsx` — add `testID="product-picker"` to the outermost `View` if missing.

**Reference for the test harness:** there is currently no `tests/components/inventory/` directory and no sibling sheet test to mirror. The only existing test is `tests/useStockMutations/useRecordDamaged.test.ts`, which is a hook test (no screen render). Use the inline mocks below verbatim — they target the actual exports of `AdjustStockSheet`, `MarkDamagedSheet`, `useProducts`, and `useStockMutations`.

**Mock paths (verified against the actual code):**

- `@/components/inventory/modals/AdjustStockSheet` exports `AdjustStockSheet` (component, function-style: `export function AdjustStockSheet(...)` at `components/inventory/modals/AdjustStockSheet.tsx:23`).
- `@/components/inventory/modals/MarkDamagedSheet` exports `MarkDamagedSheet` (`components/inventory/modals/MarkDamagedSheet.tsx:20`).
- `@/hooks/useProducts` returns `{ getAllProductsQuery: { data } }` (`hooks/useProducts.tsx:63`).
- `@/hooks/useStockMutations` exports `useAdjustStock` (`hooks/useStockMutations.ts:101`) and `useRecordDamaged` (`hooks/useStockMutations.ts:182`).
- `ProductPicker` is rendered inside the sheet when `lockedProduct` is null (`AdjustStockSheet.tsx:98-106`, `MarkDamagedSheet.tsx:86-94`). The tests assert that `ProductPicker` is **not** rendered when `lockedProduct` is set.

**Dependencies:** [Task 1](./task-1-adjust-stock-sheet-lock.md), [Task 2](./task-2-mark-damaged-sheet-lock.md), [Task 3](./task-3-layout-signal-threading.md).

**Estimated scope:** S (two new test files + possibly a 1-line `testID` edit).

---

## Steps

### Step 1: Verify `ProductPicker` has a `testID` (or add one)

Read `components/inventory/modals/ProductPicker.tsx`. The root element is a `<View className="gap-y-2">` at line 25 with no `testID`.

If the root View has no `testID`, add one:

```tsx
<View testID="product-picker" className="gap-y-2">
```

If it already has a `testID`, record the actual value (e.g. `testID="..."` at line 25) and update the test assertions in Steps 2 and 4 to use that exact value instead of `"product-picker"`.

If you added the `testID` in this step, include `components/inventory/modals/ProductPicker.tsx` in the final commit (Step 6). Otherwise omit it.

### Step 2: Write the `AdjustStockSheet` locked-mode test

Create the directory and file:

```bash
mkdir -p tests/components/inventory/modals
```

Then create `tests/components/inventory/modals/AdjustStockSheet.locked.test.tsx` with:

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

Notes:

- `useAdjustStock` is mocked to return `{ mutate, isPending }` because the production hook is `useMutation` (returns both). The sheet reads `adjust.isPending` at `AdjustStockSheet.tsx:170,175,181` and calls `adjust.mutate(...)` at line 67. The mock surface is minimal but sufficient.
- The product object covers the minimum fields the sheet touches: `id` (line 69), `quantity` (line 57), and the spread props (line 138). `as any` keeps the strict-type checker happy since this is a test fixture.
- If you recorded a different `testID` value for `ProductPicker` in Step 1, replace `'product-picker'` in the assertion with that value.

### Step 3: Run the test

Run: `npm test -- tests/components/inventory/modals/AdjustStockSheet.locked.test.tsx`
Expected: PASS. (Tasks 1 and 3 are already applied, so `lockedProduct` is a valid prop and `ProductPicker` is not rendered.)

### Step 4: Write the `MarkDamagedSheet` locked-mode test

Create `tests/components/inventory/modals/MarkDamagedSheet.locked.test.tsx` with:

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

Notes:

- `useRecordDamaged` is mocked to return `{ mutate, isPending }` because the production hook is `useMutation`. The sheet reads `damaged.isPending` at `MarkDamagedSheet.tsx:133,137,143` and calls `damaged.mutate(...)` at line 55.
- Same product fixture as the Adjust test — minimum fields touched are `id` (line 57) and `quantity` (line 102). `as any` keeps the strict-type checker happy.

### Step 5: Run both tests

Run: `npm test -- tests/components/inventory/modals/AdjustStockSheet.locked.test.tsx tests/components/inventory/modals/MarkDamagedSheet.locked.test.tsx`
Expected: PASS, both tests.

Then run the full suite to confirm no regressions:

```bash
npm run verify
```

Expected: PASS.

### Step 6: Commit

If you added `testID="product-picker"` to `ProductPicker.tsx` in Step 1:

```bash
git add tests/components/inventory/modals/AdjustStockSheet.locked.test.tsx \
        tests/components/inventory/modals/MarkDamagedSheet.locked.test.tsx \
        components/inventory/modals/ProductPicker.tsx
git commit -m "test(inventory): assert stock sheets hide picker when locked"
```

If you didn't touch `ProductPicker.tsx`:

```bash
git add tests/components/inventory/modals/AdjustStockSheet.locked.test.tsx \
        tests/components/inventory/modals/MarkDamagedSheet.locked.test.tsx
git commit -m "test(inventory): assert stock sheets hide picker when locked"
```

---

## Acceptance criteria

- [ ] `ProductPicker` has a `testID="product-picker"` on its root (added if missing; recorded value matches the test assertion)
- [ ] `tests/components/inventory/modals/AdjustStockSheet.locked.test.tsx` exists and passes
- [ ] `tests/components/inventory/modals/MarkDamagedSheet.locked.test.tsx` exists and passes
- [ ] Both tests render their sheet with a non-null `lockedProduct`
- [ ] Both tests expect `screen.queryByTestId('product-picker')` to be `null`
- [ ] `npm run verify` passes
- [ ] No unrelated test regressions
- [ ] Single commit: `test(inventory): assert stock sheets hide picker when locked`

## Verification

- Both new tests pass.
- `npm run verify` is green.
- `git log -1 --oneline` shows the expected commit.

## Follow-ups

- [Task 7](./task-7-final-verify.md) wraps everything up.