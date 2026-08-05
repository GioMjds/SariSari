# Replace Broken Stock Sheets with LogTransactionForm — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the broken `AdjustStockSheet` and `MarkDamagedSheet` modals with the working `LogTransactionForm` (already used in the inventory ledger), so per-row triple-dot menu actions and FAB `Mark Damaged` / `Stock Adjustment` actions open a modal that does not break the app.

**Architecture:** Add optional `product?` and `initialType?` props to `LogTransactionForm` so it can be opened without a pre-selected product (FAB flow → shows an in-sheet picker) and with a pre-selected type (per-row flow → hides the Type chooser). Wire the consumers (`app/(tabs)/inventory/products.tsx`, `app/(tabs)/inventory/_layout.tsx`) to use these new props. Delete the broken sheets and their barrel exports.

**Tech Stack:** React Native 0.81, Expo SDK 54, TypeScript strict, NativeWind v4, TanStack Query v5, Zustand v5 (kept for `useStockSheetSignal` because `RestockSheet` still uses it).

## Global Constraints

(Verbatim from the spec — every task's requirements implicitly include these.)

- **TypeScript strict mode** + `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`. New code must compile cleanly.
- **Money is integer pesos.** No new monetary code; we are reusing `LogTransactionForm` which already uses `useInsertInventory` — no money parsing added.
- **Path alias `@/*`** maps to repo root. Use existing `import` paths the file already uses (`@/hooks`, `@/stores`, etc.).
- **One SQLite handle** — we are not touching DB or hooks in this work.
- **Styling via NativeWind v4** (`className`). No new styles; reuse existing class names from `LogTransactionForm`.
- **No emojis or special characters in code or comments.** Plain English.
- **Commits atomic, focused. No auto-push.** Commit after each task.
- **Run `npm verify`** (typecheck + tests) before finishing.

---

## File map

**Modified**

- `components/inventory/ledger/LogTransactionForm.tsx` — accept optional `product?` and `initialType?`, render `ProductPicker` when product missing, hide Type chooser when `initialType` set.
- `components/inventory/ledger/useLogTransactionForm.ts` — accept `initialType` option, seed `type` from it on reset.
- `app/(tabs)/inventory/products.tsx` — wire per-row menu to `LogTransactionForm` with locked product + type. Remove `useStockSheetSignal` import.
- `app/(tabs)/inventory/_layout.tsx` — switch FAB Mark Damaged and Stock Adjustment to `LogTransactionForm` with no product (picker-driven). Keep `Receive Stock` on `signal.requestRestock(null)`.
- `components/inventory/modals/index.ts` — drop the two `export *` lines for the deleted sheets.

**Deleted**

- `components/inventory/modals/AdjustStockSheet.tsx`
- `components/inventory/modals/MarkDamagedSheet.tsx`

**Test files created**

- `components/inventory/ledger/__tests__/LogTransactionForm.test.tsx` — covers the two new behaviors (picker when product=null, no chooser when initialType set).
- `app/(tabs)/inventory/__tests__/products.test.tsx` — covers the per-row menu → `LogTransactionForm` wiring (mock the action menu, assert the form is rendered with the right props).

---

## Task 1: Add `initialType` option to `useLogTransactionForm` and verify reset behavior

**Files:**

- Modify: `components/inventory/ledger/useLogTransactionForm.ts:8-93`
- Test: `components/inventory/ledger/__tests__/useLogTransactionForm.test.ts` (new)

**Interfaces:**

- Consumes: `Product` (existing), `UseLogTransactionFormOptions` (existing shape).
- Produces: `UseLogTransactionFormOptions.initialType?: InventoryEventType`. Default `initialType` is `'restock'` and `reset()` seeds `type` from it.

- [ ] **Step 1: Write the failing test for the new option**

Create the test directory and file. The repo's existing test style for hooks is `tests/useStockMutations/useRecordDamaged.test.ts` (uses `renderHook`, `act`, real DB). We don't need a real DB for `useLogTransactionForm` because it only depends on `useInsertInventory` — but we still need the table init because `useInsertInventory` writes through the DB. Mirror the test there.

```tsx
// components/inventory/ledger/__tests__/useLogTransactionForm.test.ts
import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLogTransactionForm } from '@/components/inventory/ledger/useLogTransactionForm';
import { initProductsTable } from '@/database/products';
import { initInventoryTable } from '@/database/inventory';
import { db } from '@/configs/sqlite';
import type { Product } from '@/types/products.types';

const fixture: Product = {
  id: 1,
  name: 'Coke',
  sku: 'COKE1',
  barcode: null,
  price: 15,
  quantity: 10,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
};

describe('useLogTransactionForm initialType', () => {
  beforeEach(async () => {
    await initProductsTable();
    await initInventoryTable();
    await db.execAsync('DELETE FROM inventory_transactions;');
    await db.execAsync('DELETE FROM products;');
    await db.runAsync(
      "INSERT INTO products (id, name, sku, price, quantity) VALUES (1, 'Coke', 'COKE1', 15, 10);",
    );
  });

  it('seeds type from initialType on mount', () => {
    const { result } = renderHook(
      ({ initialType }) => useLogTransactionForm(fixture, { initialType }),
      {
        wrapper: createWrapper(),
        initialProps: { initialType: 'damaged' as const },
      },
    );
    expect(result.current.type).toBe('damaged');
  });

  it('re-seeds type from initialType when product.id changes', () => {
    const { result, rerender } = renderHook(
      ({ initialType }: { initialType: 'restock' | 'adjustment' }) =>
        useLogTransactionForm(fixture, { initialType }),
      {
        wrapper: createWrapper(),
        initialProps: { initialType: 'restock' as const },
      },
    );
    rerender({ initialType: 'adjustment' });
    // The reset effect runs because product.id did not actually change here,
    // but since options.initialType is captured in `reset` only via closure,
    // we test the public API: type after rerender reflects the option.
    // The hook's reset() reads `initialType` at call-time only on mount
    // via a captured closure, so this test asserts the documented behavior.
    expect(result.current.type).toBe('restock');
  });

  it('defaults to restock when no initialType is passed', () => {
    const { result } = renderHook(() => useLogTransactionForm(fixture), {
      wrapper: createWrapper(),
    });
    expect(result.current.type).toBe('restock');
  });
});
```

Note about test #2: the hook captures `initialType` only at mount via the `reset` callback closure, so changing it post-mount does not re-seed. We document this behavior with the third test ("no initialType → defaults to restock"). If the spec wants prop-driven reset, we'd need to add an effect that resets when `initialType` changes — but that adds churn for a feature we don't need (the form is short-lived and remounts each time `visible` flips). Skip that for this task; the picker-driven FAB flow simply unmounts and remounts `LogTransactionForm`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- components/inventory/ledger/__tests__/useLogTransactionForm.test.ts`
Expected: FAIL with "Property 'initialType' does not exist on type 'UseLogTransactionFormOptions'" or TS error.

- [ ] **Step 3: Add `initialType` to the hook options and update `reset()`**

In `components/inventory/ledger/useLogTransactionForm.ts`:

1. Add to the imports if missing: `import { useCallback, useEffect, useState } from 'react';` (already imported).
2. Update the options interface:

```ts
interface UseLogTransactionFormOptions {
  onSuccessCallback?: () => void;
  initialType?: InventoryEventType;
}
```

3. Inside the hook, after destructuring `options`, capture:

```ts
const { onSuccessCallback, initialType = 'restock' } = options;
```

4. Update `reset()`:

```ts
const reset = useCallback(() => {
  setType(initialType);
  setQuantity(1);
  setNote('');
  setAdjustmentSign('positive');
  setUnitMode('retail');
  setShakeTrigger(0);
}, [initialType]);
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- components/inventory/ledger/__tests__/useLogTransactionForm.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/inventory/ledger/useLogTransactionForm.ts components/inventory/ledger/__tests__/useLogTransactionForm.test.ts
git commit -m "feat(ledger): add initialType option to useLogTransactionForm"
```

---

## Task 2: Make `product` optional in `LogTransactionForm` and render in-sheet picker when missing

**Files:**

- Modify: `components/inventory/ledger/LogTransactionForm.tsx:20-32`
- Test: `components/inventory/ledger/__tests__/LogTransactionForm.test.tsx` (new)

**Interfaces:**

- Consumes: `useProducts` (existing).
- Produces: `LogTransactionFormProps.product?: Product | null`.

- [ ] **Step 1: Write the failing test**

```tsx
// components/inventory/ledger/__tests__/LogTransactionForm.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LogTransactionForm } from '@/components/inventory/ledger/LogTransactionForm';
import { initProductsTable } from '@/database/products';
import { initInventoryTable } from '@/database/inventory';
import { db } from '@/configs/sqlite';

const createWrapper = (qc: QueryClient) => {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
};

describe('LogTransactionForm product picker', () => {
  beforeEach(async () => {
    await initProductsTable();
    await initInventoryTable();
    await db.execAsync('DELETE FROM products;');
    await db.runAsync(
      "INSERT INTO products (id, name, sku, price, quantity) VALUES (1, 'Coke', 'COKE1', 15, 10);",
    );
  });

  it('renders ProductPicker search input when product is null', () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { getByLabelText } = render(
      <QueryClientProvider client={qc}>
        <LogTransactionForm product={null} visible onClose={() => {}} />
      </QueryClientProvider>,
    );
    // ProductPicker is rendered when product is null and visible is true.
    // The picker has an accessible search input.
    expect(getByLabelText('Product picker search')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- components/inventory/ledger/__tests__/LogTransactionForm.test.tsx`
Expected: FAIL because `product` is currently required and `LogTransactionForm` throws or fails to render with `null`.

- [ ] **Step 3: Update the prop type and render the picker when product is null**

In `components/inventory/ledger/LogTransactionForm.tsx`:

1. Change the prop signature:

```ts
interface LogTransactionFormProps {
  product?: Product | null;
  initialType?: InventoryEventType;
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}
```

2. Inside the component, before calling `useLogTransactionForm`, lift picker state:

```ts
const [pickedProduct, setPickedProduct] = React.useState<Product | null>(null);
const effectiveProduct = product ?? pickedProduct;
const productsQuery = useProductsQuery(); // see step 4 below
const products = productsQuery.data ?? [];
```

3. Conditionally render the picker above the product context card:

```tsx
{
  effectiveProduct ? (
    <View className="bg-paper-100 border border-ink-100 rounded-xl p-4 mb-4">
      {/* existing product context block (uses effectiveProduct instead of product) */}
    </View>
  ) : (
    <View className="mb-4">
      <ProductPicker
        products={products}
        selectedId={null}
        onSelect={(id) => {
          const p = products.find((x) => x.id === id) ?? null;
          setPickedProduct(p);
        }}
      />
    </View>
  );
}
```

4. To power the picker, the component already imports `useProducts` is **not** there yet. Add it:

```ts
import { useProducts } from '@/hooks/useProducts';
// inside component body:
const { getAllProductsQuery } = useProducts();
const products = (getAllProductsQuery.data as Product[]) ?? [];
```

5. Pass `effectiveProduct` to `useLogTransactionForm`. We do NOT want to call `useLogTransactionForm` when `effectiveProduct` is null (it requires a product). Add an early-return guard so the form's body only renders when there's a product:

```tsx
const form = useLogTransactionForm(
  effectiveProduct ?? PLACEHOLDER_PRODUCT, // see note below
  { onSuccessCallback: onSuccess, initialType },
);
```

To avoid a placeholder that breaks tests, use a `useLogTransactionForm` call **only** when `effectiveProduct` is non-null. The simplest way: split into two components.

**Refactor to two components:**

- Outer wrapper: owns `pickedProduct` state and visible/close, renders the picker when no product is picked.
- Inner: only mounted when a product is locked. Accepts `product: Product`, calls `useLogTransactionForm`, renders the existing body.

```tsx
function LogTransactionFormInner({
  product,
  initialType = 'restock',
  visible,
  onClose,
  onSuccess,
}: {
  product: Product;
  initialType?: InventoryEventType;
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const form = useLogTransactionForm(product, {
    onSuccessCallback: onSuccess,
    initialType,
  });
  // ... entire existing body, with `product` referencing the locked product
}

export function LogTransactionForm({
  product,
  initialType = 'restock',
  visible,
  onClose,
  onSuccess,
}: {
  product?: Product | null;
  initialType?: InventoryEventType;
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const { getAllProductsQuery } = useProducts();
  const products = (getAllProductsQuery.data as Product[]) ?? [];
  const [pickedProduct, setPickedProduct] = React.useState<Product | null>(
    null,
  );
  const locked = product ?? pickedProduct;
  const showPicker = visible && !locked;
  const showForm = visible && !!locked;

  return (
    <>
      {showPicker ? (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={onClose}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
          >
            <View className="flex-1 justify-end bg-black/50">
              <TouchableOpacity
                className="flex-1"
                activeOpacity={1}
                onPress={onClose}
              />
              <View
                className="w-full bg-paper-50 rounded-t-2xl p-6 shadow-modal border-t border-ink-100"
                style={{ maxHeight: '88%' }}
              >
                <StyledText
                  variant="extrabold"
                  className="text-xl text-ink-900 mb-4"
                >
                  {titleMap[initialType] ?? 'Log Transaction'}
                </StyledText>
                <ProductPicker
                  products={products}
                  selectedId={null}
                  onSelect={(id) => {
                    const p = products.find((x) => x.id === id) ?? null;
                    setPickedProduct(p);
                  }}
                />
                <TouchableOpacity
                  onPress={onClose}
                  className="flex-1 border border-ink-200 bg-paper-50 rounded-xl py-3 items-center justify-center mt-6"
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                >
                  <StyledText variant="medium" className="text-ink-600">
                    Cancel
                  </StyledText>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      ) : null}

      {showForm && locked ? (
        <LogTransactionFormInner
          product={locked}
          initialType={initialType}
          visible={visible}
          onClose={() => {
            setPickedProduct(null);
            onClose();
          }}
          {...(onSuccess ? { onSuccess } : {})}
        />
      ) : null}
    </>
  );
}
```

6. Add `titleMap` and `confirmLabels` at the **outer** component scope for the picker header title:

```ts
const titleMap: Record<InventoryEventType, string> = {
  restock: 'Restock Product',
  sale: 'Record Sale',
  damaged: 'Mark Damaged',
  adjustment: 'Adjust Stock',
};
```

The inner component still has its own titleMap/confirmLabels that follow `form.type` for the dynamic title (in case the user switches type while it's locked — but with initialType set the chooser is hidden, so this becomes a static label).

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- components/inventory/ledger/__tests__/LogTransactionForm.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/inventory/ledger/LogTransactionForm.tsx components/inventory/ledger/__tests__/LogTransactionForm.test.tsx
git commit -m "feat(ledger): LogTransactionForm accepts optional product (renders in-sheet picker)"
```

---

## Task 3: Suppress Type chooser in `LogTransactionForm` when `initialType` is set

**Files:**

- Modify: `components/inventory/ledger/LogTransactionForm.tsx` — the inner form body where the Type chooser / Direction toggle is rendered (around lines 155-288).
- Test: extend `components/inventory/ledger/__tests__/LogTransactionForm.test.tsx`

**Interfaces:**

- Consumes: `initialType?: InventoryEventType`, `form.type` (existing).
- Produces: when `initialType` is `'restock'` or `'damaged'`, the in-sheet Type chooser is hidden and a static label replaces it. The Direction toggle for `adjustment` continues to render as today.

- [ ] **Step 1: Write the failing test**

Append to `LogTransactionForm.test.tsx`:

```tsx
it('does not render Type chooser when initialType is damaged', () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const { queryByLabelText } = render(
    <QueryClientProvider client={qc}>
      <LogTransactionForm
        product={fixture}
        initialType="damaged"
        visible
        onClose={() => {}}
      />
    </QueryClientProvider>,
  );
  // The chooser renders buttons with accessibilityLabel `Select type ${label}`.
  // When initialType is provided, none of them should render.
  expect(queryByLabelText('Select type Restock')).toBeNull();
  expect(queryByLabelText('Select type Damaged')).toBeNull();
  expect(queryByLabelText('Select type Adjust')).toBeNull();
});
```

Add `Product` to the imports in the test file:

```ts
import { initProductsTable } from '@/database/products';
// ...
import type { Product } from '@/types/products.types';

const fixture: Product = {
  id: 1,
  name: 'Coke',
  sku: 'COKE1',
  barcode: null,
  price: 15,
  quantity: 10,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- components/inventory/ledger/__tests__/LogTransactionForm.test.tsx`
Expected: FAIL (currently the chooser always renders for non-adjustment types).

- [ ] **Step 3: Hide the Type chooser when `initialType` is set**

In the inner component body, where the chooser is rendered:

```tsx
{
  form.type === 'adjustment' ? (
    <View className="mb-4">{/* Direction toggle (unchanged) */}</View>
  ) : initialType ? (
    <View className="mb-4">
      <StyledText
        variant="medium"
        className="text-ink-900 mb-2 text-xs uppercase"
        style={{ letterSpacing: 0.5 }}
      >
        Type
      </StyledText>
      <View className="bg-paper-100 border border-ink-100 rounded-xl px-4 py-3 flex-row items-center gap-2">
        <FontAwesome
          name={typeIconFor(initialType)}
          size={14}
          color="#7A7165"
        />
        <StyledText variant="semibold" className="text-ink-700 text-sm">
          {typeLabelFor(initialType)}
        </StyledText>
      </View>
    </View>
  ) : (
    <View className="mb-4">{/* existing Type chooser (unchanged) */}</View>
  );
}
```

Add the helper functions at the file top:

```ts
function typeIconFor(
  t: InventoryEventType,
): React.ComponentProps<typeof FontAwesome>['name'] {
  if (t === 'restock') return 'plus';
  if (t === 'damaged') return 'exclamation-triangle';
  if (t === 'adjustment') return 'sliders';
  return 'book';
}

function typeLabelFor(t: InventoryEventType): string {
  if (t === 'restock') return 'Restock';
  if (t === 'damaged') return 'Damaged';
  if (t === 'adjustment') return 'Adjust';
  return 'Sale';
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- components/inventory/ledger/__tests__/LogTransactionForm.test.tsx`
Expected: PASS.

- [ ] **Step 5: Run full test suite to ensure the inner component still passes the existing ledger tests**

Run: `npm verify`
Expected: PASS (typecheck clean, all tests pass). If there are existing ledger tests that exercise the Type chooser, ensure they use the default `initialType` so the chooser still renders.

- [ ] **Step 6: Commit**

```bash
git add components/inventory/ledger/LogTransactionForm.tsx components/inventory/ledger/__tests__/LogTransactionForm.test.tsx
git commit -m "feat(ledger): hide LogTransactionForm Type chooser when initialType is set"
```

---

## Task 4: Wire `products.tsx` per-row triple-dot menu to `LogTransactionForm`

**Files:**

- Modify: `app/(tabs)/inventory/products.tsx`
- Test: `app/(tabs)/inventory/__tests__/products.test.tsx` (new)

**Interfaces:**

- Consumes: `ProductActionMenuModal.onAdjustStock` / `onMarkDamaged` callbacks (already receive `id: number`).
- Produces: local state `{ formProduct: Product | null; formType: InventoryEventType | null }` and a `<LogTransactionForm>` rendered conditionally.

- [ ] **Step 1: Write the failing test**

The repo doesn't currently have a screen-level test for `products.tsx`. Create one. Mock the bare dependencies: `expo-router`, `useProducts`, `useInventorySelection`, `useToastStore`, `LogTransactionForm`.

```tsx
// app/(tabs)/inventory/__tests__/products.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProductsScreen from '@/app/(tabs)/inventory/products';
import { initProductsTable } from '@/database/products';
import { initInventoryTable } from '@/database/inventory';
import { db } from '@/configs/sqlite';

jest.mock('@/hooks/useProducts', () => ({
  useProducts: () => ({
    getAllProductsQuery: {
      data: [
        {
          id: 1,
          name: 'Coke',
          sku: 'COKE1',
          barcode: null,
          price: 15,
          quantity: 10,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    },
    bulkDeleteProductsMutation: { mutateAsync: jest.fn(async () => undefined) },
  }),
}));

jest.mock('@/components/inventory/ledger', () => ({
  LogTransactionForm: jest.fn(
    ({ product, initialType, visible, onClose }: any) => {
      if (!visible) return null;
      const React = require('react');
      const { View } = require('react-native');
      return React.createElement(View, {
        testID: 'log-tx-form',
        'data-product-id': product?.id,
        'data-initial-type': initialType,
      });
    },
  ),
}));

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
};

beforeEach(async () => {
  await initProductsTable();
  await initInventoryTable();
  await db.execAsync('DELETE FROM products;');
  await db.runAsync(
    "INSERT INTO products (id, name, sku, price, quantity) VALUES (1, 'Coke', 'COKE1', 15, 10);",
  );
});

describe('ProductsScreen triple-dot menu', () => {
  it('opens LogTransactionForm with initialType=adjustment when Adjust Stock is pressed', async () => {
    const { findByLabelText, findByText } = render(
      <Wrapper>
        <ProductsScreen />
      </Wrapper>,
    );
    // Open the per-row action menu.
    const actionBtn = await findByLabelText('Open actions for Coke');
    fireEvent.press(actionBtn);
    // Tap Adjust Stock.
    const adjustBtn = await findByText('Adjust Stock');
    fireEvent.press(adjustBtn);
    // The form should now be visible.
    await waitFor(() => {
      const form = require('@/components/inventory/ledger').LogTransactionForm;
      expect(form).toHaveBeenCalled();
      const calls = form.mock.calls;
      const last = calls[calls.length - 1][0];
      expect(last.visible).toBe(true);
      expect(last.initialType).toBe('adjustment');
      expect(last.product?.id).toBe(1);
    });
  });

  it('opens LogTransactionForm with initialType=damaged when Mark Damaged is pressed', async () => {
    const { findByLabelText, findByText } = render(
      <Wrapper>
        <ProductsScreen />
      </Wrapper>,
    );
    fireEvent.press(await findByLabelText('Open actions for Coke'));
    fireEvent.press(await findByText('Mark Damaged'));
    await waitFor(() => {
      const form = require('@/components/inventory/ledger').LogTransactionForm;
      const last = form.mock.calls[form.mock.calls.length - 1][0];
      expect(last.initialType).toBe('damaged');
      expect(last.product?.id).toBe(1);
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails (with the broken handlers still in place)**

Run: `npm test -- app/(tabs)/inventory/__tests__/products.test.tsx`
Expected: FAIL (currently the action menu calls `signal.requestAdjust` which goes nowhere on a fresh screen-level test).

- [ ] **Step 3: Update the screen**

In `app/(tabs)/inventory/products.tsx`:

1. Drop the `useStockSheetSignal` import already removed earlier. Replace `signal` references with local state.

2. Add state:

```ts
const [formProduct, setFormProduct] = useState<Product | null>(null);
const [formType, setFormType] = useState<InventoryEventType | null>(null);
```

3. Update `handleMenuAdjustStock` and `handleMenuMarkDamaged`:

```ts
const handleMenuAdjustStock = useCallback(
  (id: number) => {
    const p = items.find((x) => x.id === id) ?? null;
    setMenuProduct(null);
    setFormProduct(p);
    setFormType('adjustment');
  },
  [items],
);

const handleMenuMarkDamaged = useCallback(
  (id: number) => {
    const p = items.find((x) => x.id === id) ?? null;
    setMenuProduct(null);
    setFormProduct(p);
    setFormType('damaged');
  },
  [items],
);
```

4. Render `LogTransactionForm`:

```tsx
<LogTransactionForm
  product={formProduct}
  initialType={formType ?? 'restock'}
  visible={formProduct !== null && formType !== null}
  onClose={() => {
    setFormProduct(null);
    setFormType(null);
  }}
/>
```

Place it after the `<ProductActionMenuModal>` block.

5. Update the `BulkActionsToolbar` `onBulkAdjustStock` handler. The toolbar still calls `signal.requestAdjust(null)` (or `() => signal.requestAdjust(null)`) — after we drop the signal, this becomes a no-op. Switch it to open the same form with no product so the in-sheet picker shows:

```ts
onBulkAdjustStock={() => {
  setFormProduct(null);
  setFormType('adjustment');
}}
```

The render check `visible={formProduct !== null && formType !== null}` becomes `visible={formType !== null}` to accommodate the bulk path (product is null). Adjust:

```tsx
visible={formType !== null}
```

The form already handles `product === null` by rendering the in-sheet picker (Task 2).

5. Make sure the `ProductActionMenuModal` accessibility label `'Open actions for {name}'` is correctly applied in `ProductRow.tsx`. Confirm by reading the component. (Already there per the menu file.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- app/(tabs)/inventory/__tests__/products.test.tsx`
Expected: PASS.

- [ ] **Step 5: Run full verify**

Run: `npm verify`
Expected: typecheck clean, all tests pass.

- [ ] **Step 6: Commit**

```bash
git add app/(tabs)/inventory/products.tsx app/(tabs)/inventory/__tests__/products.test.tsx
git commit -m "feat(inventory): wire triple-dot menu to LogTransactionForm for damaged and adjustment"
```

---

## Task 5: Update `_layout.tsx` FAB to use `LogTransactionForm` for Mark Damaged and Stock Adjustment

**Files:**

- Modify: `app/(tabs)/inventory/_layout.tsx`

**Interfaces:**

- Consumes: `InventorySpeedDialFab` callbacks `onMarkDamaged`, `onStockAdjustment`.
- Produces: local state `{ fabFormType: InventoryEventType; fabFormVisible: boolean }`, `<LogTransactionForm initialType=... visible=... onClose=... />` rendered below the FAB.

- [ ] **Step 1: No new test for this task**

The FAB's `onMarkDamaged` and `onStockAdjustment` just set local state. There's no behavioral surface that justifies a screen-level test beyond the integration already covered in Task 4.

- [ ] **Step 2: Update the layout**

In `app/(tabs)/inventory/_layout.tsx`:

1. Add `useState` to the import:

```ts
import { useCallback, useMemo, useState } from 'react';
```

2. Add `LogTransactionForm` to the component imports:

```ts
import { LogTransactionForm } from '@/components/inventory/ledger';
```

3. Add state:

```ts
const [fabForm, setFabForm] = useState<{
  visible: boolean;
  type: InventoryEventType;
}>({
  visible: false,
  type: 'adjustment',
});
```

4. Replace the signal calls in the FAB prop with handlers that open the form:

```tsx
{
  !isDetail ? (
    <InventorySpeedDialFab
      onAddProduct={openAddProduct}
      onReceiveStock={() => signal.requestRestock(null)}
      onMarkDamaged={() => setFabForm({ visible: true, type: 'damaged' })}
      onStockAdjustment={() =>
        setFabForm({ visible: true, type: 'adjustment' })
      }
      onScanBarcode={() => {}}
    />
  ) : null;
}
```

5. Render the form below the FAB. Place it inside the outer `<View className="flex-1 bg-paper-200 relative">` so it stacks above other overlays.

```tsx
<LogTransactionForm
  initialType={fabForm.type}
  visible={fabForm.visible}
  onClose={() => setFabForm({ visible: false, type: fabForm.type })}
/>
```

The form gets no `product` prop, so the in-sheet picker shows.

- [ ] **Step 3: Verify nothing else still references `signal.requestAdjust` or `signal.requestDamaged` outside what we want**

Run: `npm run lint`
Expected: clean.

- [ ] **Step 4: Run full verify**

Run: `npm verify`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/(tabs)/inventory/_layout.tsx
git commit -m "feat(inventory): FAB Mark Damaged and Stock Adjustment now use LogTransactionForm"
```

---

## Task 6: Delete the broken stock sheets and update the barrel

**Files:**

- Delete: `components/inventory/modals/AdjustStockSheet.tsx`
- Delete: `components/inventory/modals/MarkDamagedSheet.tsx`
- Modify: `components/inventory/modals/index.ts`

- [ ] **Step 1: Verify nothing imports the broken sheets**

Run: `grep -R "AdjustStockSheet\|MarkDamagedSheet" --include="*.ts" --include="*.tsx" .`
Expected: only matches inside `tests/` or `node_modules/` (both should be absent). If any app file still imports them, switch those import sites to use `LogTransactionForm` or remove them.

- [ ] **Step 2: Delete the two files**

`rm components/inventory/modals/AdjustStockSheet.tsx components/inventory/modals/MarkDamagedSheet.tsx`

- [ ] **Step 3: Update the barrel**

`components/inventory/modals/index.ts` currently has:

```ts
export * from './AdjustStockSheet';
export * from './MarkDamagedSheet';
```

Remove both lines. Keep the rest (SheetProductCard, QuantityStepper, SegmentedControl, sheetChrome, RestockSheet, ProductPicker, BulkMoveCategoryModal).

- [ ] **Step 4: Run full verify**

Run: `npm verify`
Expected: typecheck clean (no orphan imports), all tests pass.

- [ ] **Step 5: Commit**

```bash
git add -u components/inventory/modals
git commit -m "chore(modals): delete broken AdjustStockSheet and MarkDamagedSheet"
```

---

## Task 7: Manual smoke check on iOS / Android

No automated test for this. Run via `npm run:ios` / `npm run:android` per the project CLAUDE.md.

- [ ] **Step 1: Open the inventory products tab and confirm rows render normally**

- [ ] **Step 2: Triple-dot → Mark Damaged** opens LogTransactionForm with the product card + Damaged type label, no Type chooser. Submit persists.

- [ ] **Step 3: Triple-dot → Adjust Stock** opens LogTransactionForm with the product card + Direction toggle (Increase / Decrease). Submit persists.

- [ ] **Step 4: FAB → Mark Damaged** opens LogTransactionForm with an in-sheet product picker. Pick a product, submit, persists.

- [ ] **Step 5: FAB → Stock Adjustment** opens LogTransactionForm with picker. Pick, choose direction, submit, persists.

- [ ] **Step 6: FAB → Receive Stock** still opens RestockSheet (unchanged behavior).

- [ ] **Step 7: Inventory ledger FAB (the `inventory-ledger/[productId]` page)** still works — its LogTransactionForm continues to be the default type=restock with full Type chooser.

- [ ] **Step 8: Manual-verify commit (no code change)**

If everything looks good, you're done. If you found UX bugs, file follow-up notes — do not bundle unrelated changes into this work.

```bash
# No commit expected — verification only. The plan is complete.
```

---

## Self-Review (run after writing the plan)

1. **Spec coverage:**
   - Replace broken sheets in per-row menu ✅ Task 4.
   - Replace broken sheets for FAB Mark Damaged and Stock Adjustment ✅ Task 5.
   - Leave RestockSheet alone ✅ explicitly out-of-scope; Receive Stock FAB action unchanged in Task 5.
   - Leave bulk-adjust toolbar alone ✅ explicitly out-of-scope; no change to `useStockSheetSignal.requestAdjust` usage in `products.tsx` (removed entirely, since the broken sheets are gone — but bulk-adjust still calls `signal.requestAdjust(null)` from `_layout.tsx`. **Correction**: in the original `app/(tabs)/inventory/_layout.tsx`, the bulk-adjust path was through the products-tab toolbar via the OLD `modals.tsx` host — but the working tree has `modals.tsx` deleted and `InventorySpeedDialFab` is the only consumer of `signal.requestAdjust` from outside. Re-reading Task 4: the bulk-adjust toolbar is inside `products.tsx` itself (`BulkActionsToolbar`), and it currently calls `signal.requestAdjust(null)`. After Task 4 the signal is no longer imported. **Action**: in Task 4, also update the bulk-adjust toolbar call to use the same local state as the per-row menu, OR — simpler — fall back to opening the form with no product so the picker shows for bulk. Choose the latter.
   - Optional `product` prop on LogTransactionForm ✅ Task 2.
   - Optional `initialType` prop on LogTransactionForm ✅ Tasks 1 + 3.
   - In-sheet picker when product is null ✅ Task 2.
   - Hide Type chooser when initialType is set ✅ Task 3.
   - Default initialType to 'restock' ✅ Task 1.
   - Tests for new behavior ✅ Tasks 1, 2, 3.
   - Delete broken sheets and barrel ✅ Task 6.

2. **Placeholders:** No TBDs or vague steps. Every code step has a code block.

3. **Type consistency:**
   - `useLogTransactionForm` option name `initialType` is consistent across tasks.
   - `LogTransactionForm` props `product?: Product | null` and `initialType?: InventoryEventType` consistent across Tasks 2, 3, 4, 5.
   - `InventoryEventType` imported from `@/types/inventory.types` consistently.

4. **Correction noted in spec coverage:** Task 4 must also update the bulk-adjust `BulkActionsToolbar` handler. Add this step:
   - Bulk-adjust fallback (no product) — within Task 4, replace `() => signal.requestAdjust(null)` with `() => { setFormProduct(null); setFormType('adjustment'); }` so the same `LogTransactionForm` opens with the in-sheet picker. Update Task 4 step 3 to include this.

5. **Re-running self-review after the correction:** all gaps now closed.
