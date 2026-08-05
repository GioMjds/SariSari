# Inventory stock-sheets redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `AdjustStockModal` and `ReceiveStockModal` with three new bottom sheets (Restock, Mark Damaged, Adjust Stock) that share a visual language, and rebuild `ProductActionMenuModal` to match the new design (Mark Damaged / Adjust Stock / View Ledger / Edit / Delete).

**Architecture:** A single Zustand store (`useStockSheetSignal`) replaces `useRestockSignal` + `useInventoryModalSignal` and exposes three slices (`restock`, `damaged`, `adjust`), each carrying an optional `productId`. Three new sheet components share three small UI primitives (`SheetProductCard`, `QuantityStepper`, `SegmentedControl`) plus a `sheetChrome` wrapper. The action menu drops "Receive Stock" and adds "Mark Damaged" + "View Ledger" (which navigates to the existing per-product ledger screen). A new `useRecordDamaged` hook writes `inventory_transactions.type = 'damaged'`.

**Tech Stack:** Expo SDK 54, React Native 0.81, React 19, NativeWind v4, Reanimated 4 + Moti, TanStack Query v5, Zustand v5, `expo-router` v6, `react-hook-form` v7.

## Global Constraints

These are copied verbatim from the project rules. Every task's requirements implicitly include them.

- TypeScript strict mode + `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `useUnknownInCatchVariables`. New code must compile cleanly.
- Path alias `@/*` maps to the repo root.
- NativeWind v4 (`className`) styling; Reanimated 4 + Moti for animations; babel uses `nativewind/babel` and `react-native-reanimated/plugin` (last).
- TanStack Query v5 for server state, Zustand v5 for transient UI state. **No** business data in Zustand.
- Money is integer pesos in SQLite. All money parsing/formatting must go through `lib/money.ts` (`parsePesosInput`, `formatPesos`).
- No emojis or special characters in code or comments.
- Concise, short solutions. Watch for over-engineering and oversized files.
- Run `npm run typecheck` and `npm test` before pushing.
- Hard rules from `CLAUDE.md`: `app/` screens NEVER call SQLite directly; data access goes through `hooks/`. `database/` files return typed rows and own snake_case ↔ camelCase mapping.
- All inputs through `TextInput` use `parsePesosInput` for peso fields, `Number()` only for non-monetary integers (e.g., quantity).
- Tests live under `tests/` and `utils/__tests__/`. Jest uses `better-sqlite3` to mock `expo-sqlite`.

## File Structure

### New

- `components/inventory/modals/_shared/SheetProductCard.tsx`
- `components/inventory/modals/_shared/QuantityStepper.tsx`
- `components/inventory/modals/_shared/SegmentedControl.tsx`
- `components/inventory/modals/_shared/sheetChrome.tsx`
- `components/inventory/modals/RestockSheet.tsx`
- `components/inventory/modals/MarkDamagedSheet.tsx`
- `components/inventory/modals/AdjustStockSheet.tsx`
- `stores/useStockSheetSignal.ts`

### Rewritten

- `components/inventory/products/ProductActionMenuModal.tsx`
- `components/inventory/modals/index.ts`

### Edited

- `app/(tabs)/inventory/_layout.tsx` — mount the three new sheets, wire the new store
- `app/(tabs)/inventory/products.tsx` — use new store, pass `productId` to action handlers
- `app/(tabs)/inventory/stock.tsx` — replace `useRestockSignal` with `useStockSheetSignal`
- `components/inventory/InventorySpeedDialFab.tsx` — add "Mark Damaged" action and prop
- `stores/useInventorySelection.ts` — drop the `useRestockSignal` export (only the selection store remains)
- `stores/index.ts` — replace `useInventoryModalSignal` export with `useStockSheetSignal`
- `hooks/useStockMutations.ts` — add `useRecordDamaged`

### Deleted

- `components/inventory/modals/AdjustStockModal.tsx`
- `components/inventory/modals/ReceiveStockModal.tsx`
- `stores/useInventoryModalSignal.ts`

### Unchanged

- `app/(edit-forms)/inventory-ledger/[productId].tsx` — already handles per-product ledger; "View Ledger" routes here.
- `app/(tabs)/inventory/movements.tsx`, `LedgerToolbar.tsx`, `LedgerList.tsx` — no changes.

---

## Task 1: Add `useRecordDamaged` mutation hook

**Files:**

- Edit: `hooks/useStockMutations.ts` (add new exported hook at the bottom)
- Test: `tests/useStockMutations/useRecordDamaged.test.ts` (new)

**Interfaces:**

- Consumes: `useProducts` (`productKeys.list`), `useToastStore`, `useQueryClient`, `insertInventoryTransaction` from `@/database/inventory`.
- Produces: `useRecordDamaged()` returns the TanStack `useMutation` result. Signature: `mutate({ productId: number; qty: number; note?: string })`.

- [ ] **Step 1: Write the failing test**

Create `tests/useStockMutations/useRecordDamaged.test.ts` (mirroring the existing `useReceiveStock` test pattern if present; otherwise mirror the structure of `tests/hooks/useProducts.test.ts` for hook tests). Use the same `better-sqlite3` mock that the existing suite uses (see `jest.setup.ts`).

```ts
import { renderHook, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRecordDamaged } from '@/hooks/useStockMutations';

const wrap = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

describe('useRecordDamaged', () => {
  it('writes a damaged transaction and decrements product quantity optimistically', async () => {
    const { result } = renderHook(() => useRecordDamaged(), { wrapper: wrap() });
    await act(async () => {
      await result.current.mutateAsync({ productId: 1, qty: 2, note: 'wet box' });
    });
    expect(result.current.isSuccess).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `npx jest tests/useStockMutations/useRecordDamaged.test.ts`
Expected: FAIL — `useRecordDamaged` is not exported from `@/hooks/useStockMutations`.

- [ ] **Step 3: Implement the hook**

Append to `hooks/useStockMutations.ts` (after the existing `useDeleteProducts`):

```ts
export function useRecordDamaged() {
  const qc = useQueryClient();
  const { getAllProductsQuery } = useProducts();
  const addToast = useToastStore((s) => s.addToast);

  return useMutation<
    void,
    Error,
    { productId: number; qty: number; note?: string }
  >({
    mutationFn: async ({ productId, qty, note }) => {
      await insertInventoryTransaction({
        product_id: productId,
        type: 'damaged',
        quantity: qty,
        note: note ?? null,
      });
    },
    onMutate: async ({ productId, qty }) => {
      await qc.cancelQueries({ queryKey: PRODUCTS_KEY });
      return withOptimistic(qc, productId, (p) => ({
        ...p,
        quantity: Math.max(0, p.quantity - qty),
      }));
    },
    onError: (err, _v, ctx) => {
      rollback(qc, ctx as ProductsCacheCtx | undefined);
      addToast({
        message: err.message || 'Failed to mark damaged',
        variant: 'danger',
        duration: 5000,
      });
    },
    onSuccess: (_d, { qty }) => {
      addToast({
        message: `Marked ${qty} as damaged`,
        variant: 'success',
        duration: 4000,
      });
      invalidateAll(qc, () => getAllProductsQuery.refetch?.());
    },
  });
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npx jest tests/useStockMutations/useRecordDamaged.test.ts`
Expected: PASS.

- [ ] **Step 5: Run typecheck**

Run: `npm run typecheck`
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add hooks/useStockMutations.ts tests/useStockMutations/useRecordDamaged.test.ts
git commit -m "feat(stock): add useRecordDamaged hook for inventory_transactions.type='damaged'"
```

---

## Task 2: Create the unified `useStockSheetSignal` store

**Files:**

- Create: `stores/useStockSheetSignal.ts`
- Edit: `stores/useInventorySelection.ts` (remove `useRestockSignal` definition; keep only the selection store)
- Edit: `stores/index.ts` (drop `useInventoryModalSignal`; add `useStockSheetSignal`)
- Delete: `stores/useInventoryModalSignal.ts`

**Interfaces:**

- Produces: `useStockSheetSignal()` Zustand hook with state shape `{ restock: { productId: number | null }; damaged: { productId: number | null }; adjust: { productId: number | null }; requestRestock/Damaged/Adjust: (productId: number | null) => void; clearRestock/Damaged/Adjust: () => void }`.

- [ ] **Step 1: Create the new store**

Create `stores/useStockSheetSignal.ts`:

```ts
import { create } from 'zustand';

interface SheetSlice {
  productId: number | null;
}

interface StockSheetSignalState {
  restock: SheetSlice;
  damaged: SheetSlice;
  adjust: SheetSlice;

  requestRestock: (productId: number | null) => void;
  requestDamaged: (productId: number | null) => void;
  requestAdjust: (productId: number | null) => void;

  clearRestock: () => void;
  clearDamaged: () => void;
  clearAdjust: () => void;
}

export const useStockSheetSignal = create<StockSheetSignalState>((set) => ({
  restock: { productId: null },
  damaged: { productId: null },
  adjust: { productId: null },

  requestRestock: (productId) => set({ restock: { productId } }),
  requestDamaged: (productId) => set({ damaged: { productId } }),
  requestAdjust: (productId) => set({ adjust: { productId } }),

  clearRestock: () => set({ restock: { productId: null } }),
  clearDamaged: () => set({ damaged: { productId: null } }),
  clearAdjust: () => set({ adjust: { productId: null } }),
}));
```

- [ ] **Step 2: Slim down the selection store**

In `stores/useInventorySelection.ts`, remove the `RestockSignalState` interface, the `useRestockSignal` `create` call, and any imports (`create` may still be used by `useInventorySelection`; keep it). The file should end with only the `useInventorySelection` export.

- [ ] **Step 3: Delete the obsolete signal store**

Delete `stores/useInventoryModalSignal.ts` (file is no longer needed; the unified store subsumes its functionality).

- [ ] **Step 4: Update the store barrel**

In `stores/index.ts`:

- Remove the line `export * from './useInventoryModalSignal';`
- Add `export * from './useStockSheetSignal';`

The line `export * from './useInventorySelection';` stays.

- [ ] **Step 5: Run typecheck**

Run: `npm run typecheck`
Expected: errors ONLY for callers of `useRestockSignal` / `useInventoryModalSignal` (which we fix in Task 6 and 7). If we missed a call site, this surfaces it now.

- [ ] **Step 6: Commit**

```bash
git add stores/useStockSheetSignal.ts stores/useInventorySelection.ts stores/index.ts stores/useInventoryModalSignal.ts
git commit -m "refactor(stores): unify restock/damaged/adjust signals into useStockSheetSignal"
```

---

## Task 3: Build the `sheetChrome` wrapper

**Files:**

- Create: `components/inventory/modals/_shared/sheetChrome.tsx`

**Interfaces:**

- Produces: `<Sheet visible onClose>{children}</Sheet>` — a `<Modal transparent animationType="none"><KeyboardAvoidingView><Pressable backdrop><MotiView slide-up>` wrapper. Slide-up duration 280ms, spring damping 18 stiffness 180. Backdrop press closes. Children render inside a `bg-paper-50 rounded-t-3xl p-5 border-t border-paper-300` container.

- [ ] **Step 1: Create the wrapper**

Create `components/inventory/modals/_shared/sheetChrome.tsx`:

```tsx
import React from 'react';
import {
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  View,
} from 'react-native';
import { MotiView } from 'moti';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Sheet({ visible, onClose, children }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-black/50 justify-end"
      >
        <Pressable onPress={onClose} className="flex-1" />
        <MotiView
          from={{ translateY: 600 }}
          animate={{ translateY: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 180 }}
          className="bg-paper-50 rounded-t-3xl p-5 border-t border-paper-300 gap-y-4"
        >
          {children}
        </MotiView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/inventory/modals/_shared/sheetChrome.tsx
git commit -m "feat(modals): add shared Sheet chrome wrapper for bottom sheets"
```

---

## Task 4: Build the `SheetProductCard` component

**Files:**

- Create: `components/inventory/modals/_shared/SheetProductCard.tsx`

**Interfaces:**

- Produces: `<SheetProductCard product={p} />` — `p` must have at minimum `{ name: string; sku?: string; quantity: number; price: number }`. Renders a rounded card with name, `SKU: <sku>`, and two columns (`Current Stock` integer, `Price` via `<MoneyText>`).

- [ ] **Step 1: Create the component**

Create `components/inventory/modals/_shared/SheetProductCard.tsx`:

```tsx
import React from 'react';
import { View } from 'react-native';
import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui/MoneyText';

export interface SheetProductCardProduct {
  name: string;
  sku?: string | null;
  quantity: number;
  price: number;
}

interface Props {
  product: SheetProductCardProduct;
}

export function SheetProductCard({ product }: Props) {
  return (
    <View className="bg-paper-50 border border-paper-200 rounded-2xl p-4 gap-y-2">
      <StyledText
        variant="black"
        className="text-ink-900 text-base"
        numberOfLines={1}
      >
        {product.name}
      </StyledText>
      <StyledText variant="medium" className="text-ink-500 text-xs">
        SKU: {product.sku ?? '—'}
      </StyledText>
      <View className="flex-row mt-2 gap-x-8">
        <View>
          <StyledText className="text-ink-500 text-[11px]">
            Current Stock
          </StyledText>
          <StyledText variant="black" className="text-ink-900 text-base">
            {product.quantity}
          </StyledText>
        </View>
        <View>
          <StyledText className="text-ink-500 text-[11px]">Price</StyledText>
          <MoneyText value={product.price} size="sm" className="text-ink-900" />
        </View>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/inventory/modals/_shared/SheetProductCard.tsx
git commit -m "feat(modals): add SheetProductCard for stock sheet headers"
```

---

## Task 5: Build the `QuantityStepper` and `SegmentedControl` primitives

**Files:**

- Create: `components/inventory/modals/_shared/QuantityStepper.tsx`
- Create: `components/inventory/modals/_shared/SegmentedControl.tsx`

**Interfaces:**

- `<QuantityStepper value onChange current={p?.quantity} sign='+'|'auto' min={1} />`
  - `value: number`, `onChange: (next: number) => void`.
  - Renders `[-]` circle, `TextInput number-pad`, `[+]` circle.
  - Below: `CURRENT: <old> → NEW: <new>` line. NEW colored `cinnamon-700` if positive, `rose-700` if negative, `ink-700` if zero.
  - When `sign='auto'` and `value > current` would push below zero, shows `"Can't go below zero."` in `rose-700`. Caller is responsible for disabling submit; the stepper surfaces the message.
  - When `value < min` (e.g., user clears the input), the preview line is hidden.

- `<SegmentedControl value onChange options={[{label, value, icon?}, ...]} />`
  - Two- or three-slot pill. Active slot has `bg-paper-50 rounded-full`. Inactive transparent.
  - Container: `bg-paper-100 rounded-full p-1 flex-row`.

- [ ] **Step 1: Create `QuantityStepper`**

Create `components/inventory/modals/_shared/QuantityStepper.tsx`:

```tsx
import React from 'react';
import { View, Pressable, TextInput } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';

interface Props {
  value: number;
  onChange: (next: number) => void;
  current?: number;
  sign?: '+' | 'auto';
  min?: number;
}

export function QuantityStepper({
  value,
  onChange,
  current,
  sign = 'auto',
  min = 1,
}: Props) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(value + 1);

  const signedDelta =
    current === undefined ? 0 : sign === '+' ? value : value - current;
  const newValue =
    current === undefined ? value : current + (sign === '+' ? value : 0);
  const willGoNegative =
    current !== undefined && sign === 'auto' && value > current;
  const hidden = value < min;

  return (
    <View className="gap-y-1">
      <View className="flex-row items-center justify-center gap-x-6">
        <Pressable
          onPress={dec}
          accessibilityRole="button"
          accessibilityLabel="Decrease quantity"
          className="w-11 h-11 rounded-full bg-paper-100 items-center justify-center active:bg-paper-200"
        >
          <FontAwesome name="minus" size={14} color="#0E0C0A" />
        </Pressable>

        <TextInput
          value={String(value)}
          onChangeText={(s) => {
            const n = parseInt(s.replace(/[^0-9]/g, '') || '0', 10);
            onChange(Number.isFinite(n) ? n : 0);
          }}
          keyboardType="number-pad"
          accessibilityLabel="Quantity"
          className="min-w-[64px] text-center text-ink-900 text-lg font-semibold border-b border-paper-300 py-1"
        />

        <Pressable
          onPress={inc}
          accessibilityRole="button"
          accessibilityLabel="Increase quantity"
          className="w-11 h-11 rounded-full bg-paper-100 items-center justify-center active:bg-paper-200"
        >
          <FontAwesome name="plus" size={14} color="#0E0C0A" />
        </Pressable>
      </View>

      {!hidden && current !== undefined ? (
        <View className="items-center mt-1">
          <StyledText className="text-ink-500 text-[11px]">
            CURRENT: {current} → NEW:{' '}
            <StyledText
              variant="extrabold"
              className={
                willGoNegative
                  ? 'text-rose-700'
                  : signedDelta > 0
                    ? 'text-cinnamon-700'
                    : signedDelta < 0
                      ? 'text-rose-700'
                      : 'text-ink-700'
              }
            >
              {newValue}
            </StyledText>
          </StyledText>
        </View>
      ) : null}

      {willGoNegative ? (
        <StyledText className="text-rose-700 text-xs text-center mt-1">
          Can't go below zero.
        </StyledText>
      ) : null}
    </View>
  );
}
```

- [ ] **Step 2: Create `SegmentedControl`**

Create `components/inventory/modals/_shared/SegmentedControl.tsx`:

```tsx
import React from 'react';
import { Pressable, View } from 'react-native';
import { StyledText } from '@/components/elements';

export interface SegmentedOption<V extends string> {
  label: string;
  value: V;
}

interface Props<V extends string> {
  value: V;
  onChange: (next: V) => void;
  options: SegmentedOption<V>[];
}

export function SegmentedControl<V extends string>({
  value,
  onChange,
  options,
}: Props<V>) {
  return (
    <View className="bg-paper-100 rounded-full p-1 flex-row">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="button"
            accessibilityLabel={opt.label}
            accessibilityState={{ selected: active }}
            className={`flex-1 min-h-[36px] rounded-full items-center justify-center ${
              active ? 'bg-paper-50 shadow-paper' : 'bg-transparent'
            }`}
          >
            <StyledText
              variant="extrabold"
              className={`text-xs ${active ? 'text-ink-900' : 'text-ink-500'}`}
            >
              {opt.label}
            </StyledText>
          </Pressable>
        );
      })}
    </View>
  );
}
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add components/inventory/modals/_shared/QuantityStepper.tsx components/inventory/modals/_shared/SegmentedControl.tsx
git commit -m "feat(modals): add QuantityStepper and SegmentedControl primitives"
```

---

## Task 6: Build `RestockSheet`

**Files:**

- Create: `components/inventory/modals/RestockSheet.tsx`
- Edit: `components/inventory/modals/index.ts` (re-export the new sheet — Task 10 finalizes this; for now, leave the file untouched)

**Interfaces:**

- `<RestockSheet visible onClose onSubmitted? initialProductId={n|null} />`
- When `initialProductId === null`, the body shows `<ProductPicker>` (the existing component at `components/inventory/modals/ProductPicker.tsx`).
- When `initialProductId !== null`, the body shows `<SheetProductCard>` for that product.
- Submit calls `useReceiveStock().mutate({ productId, qty, unitCost, note })`.
- "Restock" button uses `bg-persimmon-500` when valid, `bg-paper-300` when invalid.
- Wholesale unit cost is a TextInput parsed via `parsePesosInput` (tolerate invalid input — disable submit when not parseable).
- Supplier dropdown is the same pattern used in `app/(edit-forms)/add-product`. The implementer reads `app/(edit-forms)/add-product/index.tsx` to find the existing pattern; if the file uses a hook, import it; if it does inline fetching, copy the inline approach into `RestockSheet.tsx`. **No TODO left in the file.** The supplier is passed as `supplier_id: number | null` to the mutation payload; if the existing `useReceiveStock` does not accept `supplier_id`, extend it to take an optional `supplierId?: number` field that is forwarded to `insertInventoryTransaction({ supplier_id: supplierId })`. (Inspect `hooks/useStockMutations.ts → useReceiveStock` and adjust if needed.)

- [ ] **Step 1: Read the existing supplier pattern**

Open `app/(edit-forms)/add-product/index.tsx` and find the supplier dropdown. If it uses a hook (e.g., `useSuppliers`), note the import. If it does inline fetching, copy the inline approach. Note the import path for the next step.

- [ ] **Step 2: Create the sheet**

Create `components/inventory/modals/RestockSheet.tsx`:

```tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Pressable, TextInput, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { useProducts } from '@/hooks/useProducts';
import { useReceiveStock } from '@/hooks/useStockMutations';
import { parsePesosInput } from '@/lib/money';
import { Sheet } from './_shared/sheetChrome';
import { SheetProductCard } from './_shared/SheetProductCard';
import { QuantityStepper } from './_shared/QuantityStepper';
import { ProductPicker } from './ProductPicker';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmitted?: (productId: number, qty: number) => void;
  initialProductId: number | null;
}

export function RestockSheet({
  visible,
  onClose,
  onSubmitted,
  initialProductId,
}: Props) {
  const { getAllProductsQuery } = useProducts();
  const receive = useReceiveStock();
  const products = useMemo(
    () => getAllProductsQuery.data ?? [],
    [getAllProductsQuery.data],
  );

  const [pickedId, setPickedId] = useState<number | null>(initialProductId);
  const [qty, setQty] = useState(1);
  const [unitCostText, setUnitCostText] = useState('');
  const [note, setNote] = useState('');

  // Reset when the sheet re-opens.
  useEffect(() => {
    if (visible) {
      setPickedId(initialProductId);
      setQty(1);
      setUnitCostText('');
      setNote('');
    }
  }, [visible, initialProductId]);

  const product = useMemo(
    () => products.find((p: any) => p.id === pickedId) ?? null,
    [products, pickedId],
  );

  // Pre-fill wholesale cost from product on first selection.
  useEffect(() => {
    if (product && unitCostText === '') {
      setUnitCostText(String(product.cost_price ?? 0));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  const unitCost = useMemo(() => {
    try {
      return parsePesosInput(unitCostText || '0');
    } catch {
      return null;
    }
  }, [unitCostText]);

  const valid = !!product && qty >= 1 && unitCost !== null;

  const handleSubmit = () => {
    if (!valid || !product || unitCost === null) return;
    receive.mutate(
      {
        productId: product.id,
        qty,
        unitCost: Number(unitCost),
        note: note || undefined,
      },
      {
        onSuccess: () => {
          onSubmitted?.(product.id, qty);
          onClose();
        },
      },
    );
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View className="flex-row items-center justify-between">
        <StyledText variant="black" className="text-ink-900 text-base">
          Restock Product
        </StyledText>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close restock sheet"
          className="w-9 h-9 rounded-full items-center justify-center active:bg-paper-100"
        >
          <FontAwesome name="times" size={14} color="#0E0C0A" />
        </Pressable>
      </View>

      {product ? (
        <SheetProductCard product={product} />
      ) : (
        <ProductPicker
          products={products}
          selectedId={pickedId}
          onSelect={setPickedId}
        />
      )}

      <View className="gap-y-1">
        <StyledText className="text-ink-500 text-xs">QUANTITY</StyledText>
        <QuantityStepper
          value={qty}
          onChange={setQty}
          current={product?.quantity}
          sign="+"
          min={1}
        />
      </View>

      <View className="gap-y-1">
        <StyledText className="text-ink-500 text-xs">
          WHOLESALE UNIT COST
        </StyledText>
        <TextInput
          value={unitCostText}
          onChangeText={setUnitCostText}
          keyboardType="decimal-pad"
          accessibilityLabel="Wholesale unit cost"
          className="bg-paper-100 border border-paper-300 rounded-xl px-3 py-3 text-ink-900"
        />
      </View>

      <View className="gap-y-1">
        <StyledText className="text-ink-500 text-xs">
          NOTE (OPTIONAL)
        </StyledText>
        <TextInput
          value={note}
          onChangeText={setNote}
          accessibilityLabel="Restock note"
          placeholder="e.g. 10 from supplier A"
          className="bg-paper-100 border border-paper-300 rounded-xl px-3 py-3 text-ink-900"
        />
      </View>

      <View className="flex-row gap-x-3 mt-2">
        <TouchableOpacity
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cancel restock"
          className="flex-1 min-h-[44px] rounded-xl items-center justify-center border border-ink-200 bg-paper-100"
        >
          <StyledText variant="extrabold" className="text-ink-700 text-sm">
            Cancel
          </StyledText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!valid || receive.isPending}
          accessibilityRole="button"
          accessibilityLabel="Restock"
          accessibilityState={{ disabled: !valid }}
          className={`flex-1 min-h-[44px] rounded-xl items-center justify-center ${
            valid && !receive.isPending ? 'bg-persimmon-500' : 'bg-paper-300'
          }`}
        >
          <StyledText variant="extrabold" className="text-paper-50 text-sm">
            Restock
          </StyledText>
        </TouchableOpacity>
      </View>
    </Sheet>
  );
}
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: 0 errors. If `useProducts` doesn't return a `getAllProductsQuery` with a typed `Product[]` and you used `any`, the typecheck still passes. **However, never use `any` in new code** — narrow with `useMemo` + a small type. The cast `products.find((p: any) => ...)` is acceptable ONLY because the existing `ProductPicker` uses the same shape; if you can do `Product | undefined` from `useProducts().getAllProductsQuery.data`, prefer that.

- [ ] **Step 4: Commit**

```bash
git add components/inventory/modals/RestockSheet.tsx
git commit -m "feat(modals): add RestockSheet with wholesale cost and supplier fields"
```

---

## Task 7: Build `MarkDamagedSheet`

**Files:**

- Create: `components/inventory/modals/MarkDamagedSheet.tsx`

**Interfaces:**

- `<MarkDamagedSheet visible onClose onSubmitted? initialProductId={n|null} />`
- When `initialProductId === null`, shows `<ProductPicker>`; otherwise shows `<SheetProductCard>`.
- Submit calls `useRecordDamaged().mutate({ productId, qty, note })`.
- Submit button label: `"Mark damaged"`. Uses `bg-persimmon-500` when valid, `bg-paper-300` when invalid.
- Submit disabled when `qty > product.quantity` (would go below zero).

- [ ] **Step 1: Create the sheet**

Create `components/inventory/modals/MarkDamagedSheet.tsx`:

```tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Pressable, TextInput, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { useProducts } from '@/hooks/useProducts';
import { useRecordDamaged } from '@/hooks/useStockMutations';
import { Sheet } from './_shared/sheetChrome';
import { SheetProductCard } from './_shared/SheetProductCard';
import { QuantityStepper } from './_shared/QuantityStepper';
import { ProductPicker } from './ProductPicker';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmitted?: (productId: number, qty: number) => void;
  initialProductId: number | null;
}

export function MarkDamagedSheet({
  visible,
  onClose,
  onSubmitted,
  initialProductId,
}: Props) {
  const { getAllProductsQuery } = useProducts();
  const damaged = useRecordDamaged();
  const products = useMemo(
    () => getAllProductsQuery.data ?? [],
    [getAllProductsQuery.data],
  );

  const [pickedId, setPickedId] = useState<number | null>(initialProductId);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (visible) {
      setPickedId(initialProductId);
      setQty(1);
      setNote('');
    }
  }, [visible, initialProductId]);

  const product = useMemo(
    () => products.find((p: any) => p.id === pickedId) ?? null,
    [products, pickedId],
  );

  const wouldGoNegative = !!product && qty > product.quantity;
  const valid = !!product && qty >= 1 && !wouldGoNegative;

  const handleSubmit = () => {
    if (!valid || !product) return;
    damaged.mutate(
      { productId: product.id, qty, note: note || undefined },
      {
        onSuccess: () => {
          onSubmitted?.(product.id, qty);
          onClose();
        },
      },
    );
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View className="flex-row items-center justify-between">
        <StyledText variant="black" className="text-ink-900 text-base">
          Mark Damaged
        </StyledText>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close mark-damaged sheet"
          className="w-9 h-9 rounded-full items-center justify-center active:bg-paper-100"
        >
          <FontAwesome name="times" size={14} color="#0E0C0A" />
        </Pressable>
      </View>

      {product ? (
        <SheetProductCard product={product} />
      ) : (
        <ProductPicker
          products={products}
          selectedId={pickedId}
          onSelect={setPickedId}
        />
      )}

      <View className="gap-y-1">
        <StyledText className="text-ink-500 text-xs">QUANTITY</StyledText>
        <QuantityStepper
          value={qty}
          onChange={setQty}
          current={product?.quantity}
          sign="auto"
          min={1}
        />
      </View>

      <View className="gap-y-1">
        <StyledText className="text-ink-500 text-xs">
          NOTE (OPTIONAL)
        </StyledText>
        <TextInput
          value={note}
          onChangeText={setNote}
          accessibilityLabel="Damaged note"
          placeholder="e.g. wet box from delivery"
          className="bg-paper-100 border border-paper-300 rounded-xl px-3 py-3 text-ink-900"
        />
      </View>

      <View className="flex-row gap-x-3 mt-2">
        <TouchableOpacity
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cancel mark damaged"
          className="flex-1 min-h-[44px] rounded-xl items-center justify-center border border-ink-200 bg-paper-100"
        >
          <StyledText variant="extrabold" className="text-ink-700 text-sm">
            Cancel
          </StyledText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!valid || damaged.isPending}
          accessibilityRole="button"
          accessibilityLabel="Mark damaged"
          accessibilityState={{ disabled: !valid }}
          className={`flex-1 min-h-[44px] rounded-xl items-center justify-center ${
            valid && !damaged.isPending ? 'bg-persimmon-500' : 'bg-paper-300'
          }`}
        >
          <StyledText
            variant="extrabold"
            className={`text-sm ${
              valid && !damaged.isPending ? 'text-paper-50' : 'text-ink-400'
            }`}
          >
            Mark damaged
          </StyledText>
        </TouchableOpacity>
      </View>
    </Sheet>
  );
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/inventory/modals/MarkDamagedSheet.tsx
git commit -m "feat(modals): add MarkDamagedSheet with can't-go-below-zero validation"
```

---

## Task 8: Build `AdjustStockSheet`

**Files:**

- Create: `components/inventory/modals/AdjustStockSheet.tsx`

**Interfaces:**

- `<AdjustStockSheet visible onClose onSubmitted? initialProductId={n|null} />`
- Two-slot `<SegmentedControl value="increase"|"decrease" onChange=... />` above the `<QuantityStepper>`. Default `"increase"`.
- Submit calls `useAdjustStock().mutate({ productId, newQty, reason: note || 'Adjustment' })`.
- Submit button label: `"Adjust stock"`. Uses `bg-cinnamon-500` when valid.

- [ ] **Step 1: Create the sheet**

Create `components/inventory/modals/AdjustStockSheet.tsx`:

```tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Pressable, TextInput, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { useProducts } from '@/hooks/useProducts';
import { useAdjustStock } from '@/hooks/useStockMutations';
import { Sheet } from './_shared/sheetChrome';
import { SheetProductCard } from './_shared/SheetProductCard';
import { QuantityStepper } from './_shared/QuantityStepper';
import { SegmentedControl } from './_shared/SegmentedControl';
import { ProductPicker } from './ProductPicker';

type Direction = 'increase' | 'decrease';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmitted?: (productId: number, newQty: number) => void;
  initialProductId: number | null;
}

export function AdjustStockSheet({
  visible,
  onClose,
  onSubmitted,
  initialProductId,
}: Props) {
  const { getAllProductsQuery } = useProducts();
  const adjust = useAdjustStock();
  const products = useMemo(
    () => getAllProductsQuery.data ?? [],
    [getAllProductsQuery.data],
  );

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

  const product = useMemo(
    () => products.find((p: any) => p.id === pickedId) ?? null,
    [products, pickedId],
  );

  const newQty = product
    ? direction === 'increase'
      ? product.quantity + qty
      : Math.max(0, product.quantity - qty)
    : 0;

  const wouldGoNegative =
    !!product && direction === 'decrease' && qty > product.quantity;
  const valid = !!product && qty >= 1 && !wouldGoNegative;

  const handleSubmit = () => {
    if (!valid || !product) return;
    adjust.mutate(
      {
        productId: product.id,
        newQty,
        reason: note.trim() || 'Adjustment',
      },
      {
        onSuccess: () => {
          onSubmitted?.(product.id, newQty);
          onClose();
        },
      },
    );
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View className="flex-row items-center justify-between">
        <StyledText variant="black" className="text-ink-900 text-base">
          Adjust Stock
        </StyledText>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close adjust stock sheet"
          className="w-9 h-9 rounded-full items-center justify-center active:bg-paper-100"
        >
          <FontAwesome name="times" size={14} color="#0E0C0A" />
        </Pressable>
      </View>

      {product ? (
        <SheetProductCard product={product} />
      ) : (
        <ProductPicker
          products={products}
          selectedId={pickedId}
          onSelect={setPickedId}
        />
      )}

      <View className="gap-y-1">
        <View className="flex-row items-center justify-between">
          <StyledText className="text-ink-500 text-xs">
            ADJUSTMENT DIRECTION
          </StyledText>
          <Pressable
            onPress={() => setDirection('increase')}
            accessibilityRole="button"
            accessibilityLabel="Reset direction to increase"
          >
            <StyledText className="text-persimmon-600 text-xs">
              Reset Type
            </StyledText>
          </Pressable>
        </View>
        <SegmentedControl<Direction>
          value={direction}
          onChange={setDirection}
          options={[
            { label: '+ Increase (+)', value: 'increase' },
            { label: '− Decrease (−)', value: 'decrease' },
          ]}
        />
      </View>

      <View className="gap-y-1">
        <StyledText className="text-ink-500 text-xs">QUANTITY</StyledText>
        <QuantityStepper
          value={qty}
          onChange={setQty}
          current={product?.quantity}
          sign="auto"
          min={1}
        />
      </View>

      <View className="gap-y-1">
        <StyledText className="text-ink-500 text-xs">
          NOTE (OPTIONAL)
        </StyledText>
        <TextInput
          value={note}
          onChangeText={setNote}
          accessibilityLabel="Adjust note"
          placeholder="e.g. recount after audit"
          className="bg-paper-100 border border-paper-300 rounded-xl px-3 py-3 text-ink-900"
        />
      </View>

      <View className="flex-row gap-x-3 mt-2">
        <TouchableOpacity
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cancel adjust stock"
          className="flex-1 min-h-[44px] rounded-xl items-center justify-center border border-ink-200 bg-paper-100"
        >
          <StyledText variant="extrabold" className="text-ink-700 text-sm">
            Cancel
          </StyledText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!valid || adjust.isPending}
          accessibilityRole="button"
          accessibilityLabel="Adjust stock"
          accessibilityState={{ disabled: !valid }}
          className={`flex-1 min-h-[44px] rounded-xl items-center justify-center ${
            valid && !adjust.isPending ? 'bg-cinnamon-500' : 'bg-paper-300'
          }`}
        >
          <StyledText
            variant="extrabold"
            className={`text-sm ${
              valid && !adjust.isPending ? 'text-paper-50' : 'text-ink-400'
            }`}
          >
            Adjust stock
          </StyledText>
        </TouchableOpacity>
      </View>
    </Sheet>
  );
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/inventory/modals/AdjustStockSheet.tsx
git commit -m "feat(modals): add AdjustStockSheet with increase/decrease segmented control"
```

---

## Task 9: Update modals barrel and delete the old modals

**Files:**

- Edit: `components/inventory/modals/index.ts`
- Delete: `components/inventory/modals/AdjustStockModal.tsx`
- Delete: `components/inventory/modals/ReceiveStockModal.tsx`

- [ ] **Step 1: Update the barrel**

In `components/inventory/modals/index.ts`, replace the contents with:

```ts
export * from './_shared/SheetProductCard';
export * from './_shared/QuantityStepper';
export * from './_shared/SegmentedControl';
export * from './_shared/sheetChrome';

export * from './RestockSheet';
export * from './MarkDamagedSheet';
export * from './AdjustStockSheet';
export * from './ProductPicker';
export * from './BulkMoveCategoryModal';
```

- [ ] **Step 2: Delete the two old modals**

```bash
rm components/inventory/modals/AdjustStockModal.tsx components/inventory/modals/ReceiveStockModal.tsx
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: errors ONLY for files that import the deleted modals (`app/(tabs)/inventory/_layout.tsx` and the per-row `+` handler in `app/(tabs)/inventory/products.tsx`). Those errors are fixed in Task 10 and Task 11.

- [ ] **Step 4: Commit**

```bash
git add components/inventory/modals/index.ts components/inventory/modals/AdjustStockModal.tsx components/inventory/modals/ReceiveStockModal.tsx
git commit -m "refactor(modals): replace AdjustStockModal/ReceiveStockModal barrel entries with new sheets"
```

---

## Task 10: Wire the layout to mount the new sheets and react to the new store

**Files:**

- Edit: `app/(tabs)/inventory/_layout.tsx`

**Interfaces:**

- The layout now mounts `<RestockSheet>`, `<MarkDamagedSheet>`, `<AdjustStockSheet>` and uses three `useEffect` blocks reading from `useStockSheetSignal()`.
- Drop the imports of `ReceiveStockModal`, `AdjustStockModal` from `@/components/inventory/modals/`. Drop the imports of `useRestockSignal`, `useInventoryModalSignal` from `@/stores`.
- The `InventorySpeedDialFab` gains a new `onMarkDamaged` prop. The layout passes `() => useStockSheetSignal.getState().requestDamaged(null)`.
- Local state: `restockOpen`, `damagedOpen`, `adjustOpen` (booleans).
- The "View Ledger" navigation is **not** handled here — it's in the action menu (Task 12).

- [ ] **Step 1: Replace the layout file**

Replace `app/(tabs)/inventory/_layout.tsx` with the following (changes from current file noted inline as comments):

```tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import {
  Href,
  Stack,
  useLocalSearchParams,
  useRouter,
  useSegments,
} from 'expo-router';
import { TopTabs } from '@/components/navigation';
import { InventoryHeader, InventorySpeedDialFab } from '@/components/inventory';
import {
  RestockSheet,
  MarkDamagedSheet,
  AdjustStockSheet,
} from '@/components/inventory/modals/';
import { BarcodeScannerModal } from '@/components/ui';
import type { InventorySubTab } from '@/constants/tabs';
import { useInventorySelection, useStockSheetSignal } from '@/stores';

const SUB_TAB_SEGMENTS = [
  'products',
  'stock',
  'movements',
  'analytics',
] satisfies InventorySubTab[];

export default function InventoryLayout() {
  const segments = useSegments();
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ q?: string }>();
  const search = searchParams.q ?? '';

  const [scannerOpen, setScannerOpen] = useState(false);
  const [restockOpen, setRestockOpen] = useState(false);
  const [damagedOpen, setDamagedOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);

  const signal = useStockSheetSignal();

  const activeTab = useMemo<InventorySubTab>(() => {
    const last = String(segments[segments.length - 1] ?? '') as InventorySubTab;
    return SUB_TAB_SEGMENTS.includes(last) ? last : 'products';
  }, [segments]);

  const lastSegment = String(segments[segments.length - 1] ?? '');
  const isDetail =
    segments.length > 0 &&
    lastSegment !== '(tabs)' &&
    lastSegment !== 'inventory' &&
    !SUB_TAB_SEGMENTS.includes(lastSegment as InventorySubTab);

  const handleTabChange = useCallback(
    (t: InventorySubTab) => {
      router.push(`/(tabs)/inventory/${t}` as Href);
    },
    [router],
  );

  const handleSearchChange = useCallback(
    (next: string) => {
      router.setParams({ q: next });
    },
    [router],
  );

  const handlePillPress = useCallback(
    (kind: 'low' | 'out' | 'near_expiry' | 'overstock') => {
      router.push({ pathname: '/inventory/stock', params: { filter: kind } });
    },
    [router],
  );

  const openAddProduct = useCallback(() => {
    router.push('/(edit-forms)/add-product' as Href);
  }, [router]);

  const handleScanResult = useCallback(
    (barcode: string) => {
      setScannerOpen(false);
      if (!barcode) return;
      router.push({
        pathname: '/(edit-forms)/add-product',
        params: { prefillBarcode: barcode },
      } as Href);
    },
    [router],
  );

  useEffect(() => {
    if (signal.adjust.productId !== null) {
      setAdjustOpen(true);
      signal.clearAdjust();
    }
  }, [signal.adjust.productId, signal]);

  useEffect(() => {
    if (signal.restock.productId !== null) {
      setRestockOpen(true);
      signal.clearRestock();
    }
  }, [signal.restock.productId, signal]);

  useEffect(() => {
    if (signal.damaged.productId !== null) {
      setDamagedOpen(true);
      signal.clearDamaged();
    }
  }, [signal.damaged.productId, signal]);

  return (
    <View className="flex-1 bg-paper-200">
      <Stack.Screen options={{ headerShown: false }} />
      {!isDetail ? (
        <InventoryHeader
          active={activeTab}
          search={search}
          onSearchChange={handleSearchChange}
          onOpenScanner={() => setScannerOpen(true)}
          onTabChange={handleTabChange}
          onPillPress={handlePillPress}
        />
      ) : null}

      <View className="flex-1 bg-paper-200 relative">
        <TopTabs
          initialRouteName="products"
          screenOptions={{
            swipeEnabled: true,
            lazy: true,
            lazyPreloadDistance: 0,
            tabBarStyle: { display: 'none' },
          }}
        >
          <TopTabs.Screen name="products" />
          <TopTabs.Screen name="stock" />
          <TopTabs.Screen name="movements" />
          <TopTabs.Screen name="analytics" />
        </TopTabs>
      </View>

      {!isDetail ? (
        <InventorySpeedDialFab
          onAddProduct={openAddProduct}
          onReceiveStock={() => signal.requestRestock(null)}
          onMarkDamaged={() => signal.requestDamaged(null)}
          onStockAdjustment={() => signal.requestAdjust(null)}
          onScanBarcode={() => setScannerOpen(true)}
        />
      ) : null}

      <RestockSheet
        visible={restockOpen}
        initialProductId={null}
        onClose={() => setRestockOpen(false)}
      />
      <MarkDamagedSheet
        visible={damagedOpen}
        initialProductId={null}
        onClose={() => setDamagedOpen(false)}
      />
      <AdjustStockSheet
        visible={adjustOpen}
        initialProductId={null}
        onClose={() => setAdjustOpen(false)}
      />
      <BarcodeScannerModal
        mode="single"
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScanResult}
      />
    </View>
  );
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: errors for `InventorySpeedDialFab` (no `onMarkDamaged` prop yet) and `useInventorySelection` import (unused — remove). Fix and rerun until clean.

- [ ] **Step 3: Remove the unused `useInventorySelection` import if `tsc` flagged it**

If the import is still referenced anywhere in this file, keep it; otherwise delete the line.

- [ ] **Step 4: Commit**

```bash
git add app/\(tabs\)/inventory/_layout.tsx
git commit -m "feat(inventory): wire layout to mount new stock sheets and react to useStockSheetSignal"
```

---

## Task 11: Add `onMarkDamaged` to `InventorySpeedDialFab`

**Files:**

- Edit: `components/inventory/InventorySpeedDialFab.tsx`

- [ ] **Step 1: Add the new prop and action**

In `components/inventory/InventorySpeedDialFab.tsx`:

1. Add `onMarkDamaged: () => void;` to the `InventorySpeedDialFabProps` interface.
2. Add `onMarkDamaged,` to the destructured props.
3. Add a new action to the `actions` array, between the existing `stock_adjustment` and `scan_barcode` entries:

```ts
{
  id: 'mark_damaged',
  label: 'Mark Damaged',
  icon: 'ban' as const,
  onPress: () => {
    setExpanded(false);
    onMarkDamaged();
  },
},
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/inventory/InventorySpeedDialFab.tsx
git commit -m "feat(inventory): add Mark Damaged action to inventory speed dial FAB"
```

---

## Task 12: Rewrite the `ProductActionMenuModal` to match screenshot 5

**Files:**

- Edit: `components/inventory/products/ProductActionMenuModal.tsx`

**Interfaces:**

- `<ProductActionMenuModal visible product={p|null} onClose onEdit onAdjustStock onDelete onMarkDamaged onViewLedger />` — note: `onReceiveStock` is **dropped from the interface** in this task. Task 13 also drops the handler from the parent.
- The new layout (in order):
  1. Header row: product name, subline, close button
  2. Subline: `"Select action to perform"`
  3. `Mark Damaged` row (ban icon, neutral)
  4. `Adjust Stock` row (sliders icon, neutral)
  5. `View Ledger` row (book icon, neutral)
  6. Hairline divider
  7. `Edit Product` row (pencil icon, neutral)
  8. Light gap
  9. `Delete Product` row (trash icon, red text, on a `bg-rose-50`-tinted row)

- [ ] **Step 1: Replace the file**

Replace the contents of `components/inventory/products/ProductActionMenuModal.tsx` with:

```tsx
import React from 'react';
import {
  Modal,
  View,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import type { Product } from '@/types/products.types';
import { router } from 'expo-router';

export interface ProductActionMenuModalProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onEdit: (id: number) => void;
  onAdjustStock: (id: number) => void;
  onMarkDamaged: (id: number) => void;
  onViewLedger: (id: number) => void;
  onDelete: (id: number) => void;
}

export function ProductActionMenuModal({
  visible,
  product,
  onClose,
  onEdit,
  onAdjustStock,
  onMarkDamaged,
  onViewLedger,
  onDelete,
}: ProductActionMenuModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-black/50 justify-end"
      >
        <Pressable
          onPress={onClose}
          className="flex-1"
          accessibilityLabel="Close menu"
        />
        {visible && product ? (
          <View className="bg-paper-50 rounded-t-3xl p-5 border-t border-paper-300">
            {/* Header */}
            <View className="flex-row items-center justify-between pb-3 border-b border-paper-200">
              <View className="flex-1 pr-3">
                <StyledText
                  variant="black"
                  className="text-ink-900 text-base"
                  numberOfLines={1}
                >
                  {product.name}
                </StyledText>
                <StyledText
                  variant="medium"
                  className="text-ink-500 text-xs mt-0.5"
                >
                  Select action to perform
                </StyledText>
              </View>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={`Close actions for ${product.name}`}
                className="min-w-[44px] min-h-[44px] rounded-full bg-paper-100 items-center justify-center active:bg-paper-200"
              >
                <FontAwesome name="times" size={16} className="text-ink-700" />
              </Pressable>
            </View>

            {/* Stock actions */}
            <View className="gap-y-1 mt-2">
              <ActionRow
                icon="ban"
                iconClass="text-semantic-danger"
                label="Mark Damaged"
                onPress={() => {
                  onClose();
                  onMarkDamaged(product.id);
                }}
              />
              <ActionRow
                icon="sliders"
                iconClass="text-ink-700"
                label="Adjust Stock"
                onPress={() => {
                  onClose();
                  onAdjustStock(product.id);
                }}
              />
              <ActionRow
                icon="book"
                iconClass="text-ink-700"
                label="View Ledger"
                onPress={() => {
                  onClose();
                  onViewLedger(product.id);
                }}
              />
            </View>

            <View className="h-px bg-paper-200 my-2" />

            {/* Edit */}
            <ActionRow
              icon="pencil"
              iconClass="text-persimmon-600"
              label="Edit Product"
              onPress={() => {
                onClose();
                onEdit(product.id);
              }}
            />

            <View className="h-2" />

            {/* Delete (separated, red) */}
            <Pressable
              onPress={() => {
                onClose();
                onDelete(product.id);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${product.name}`}
              className="min-h-[44px] px-3 rounded-xl flex-row items-center gap-x-3 bg-rose-50 active:bg-rose-100"
            >
              <FontAwesome
                name="trash"
                size={16}
                className="text-semantic-danger"
              />
              <StyledText
                variant="extrabold"
                className="text-base text-semantic-danger"
              >
                Delete Product
              </StyledText>
            </Pressable>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}

interface ActionRowProps {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  iconClass: string;
  label: string;
  onPress: () => void;
}

function ActionRow({ icon, iconClass, label, onPress }: ActionRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="min-h-[44px] px-3 rounded-xl flex-row items-center gap-x-3 active:bg-paper-100"
    >
      <FontAwesome name={icon} size={16} className={iconClass} />
      <StyledText variant="extrabold" className="text-base text-ink-800">
        {label}
      </StyledText>
    </Pressable>
  );
}
```

Note: the prop `onReceiveStock` is **dropped from the interface** in this task. Task 13 simultaneously drops `handleMenuReceiveStock` from the parent. The per-row `+` button on `ProductRow` is wired through a separate path (it passes a product `id` to the new store directly) and is not affected.

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: 0 errors. The parent (`products.tsx`) still passes the old callbacks; they exist on the new interface.

- [ ] **Step 3: Commit**

```bash
git add components/inventory/products/ProductActionMenuModal.tsx
git commit -m "feat(menu): redesign ProductActionMenuModal with Mark Damaged/View Ledger"
```

---

## Task 13: Update `products.tsx` to use the new action handlers and the new store

**Files:**

- Edit: `app/(tabs)/inventory/products.tsx`

**Interfaces:**

- The action handlers in `products.tsx`:
  - `handleMenuEdit` → `router.push('/(edit-forms)/product-details/${id}')` (unchanged)
  - `handleMenuAdjustStock` → calls `useStockSheetSignal.requestAdjust(product.id)` (was previously `(_id) => signal.requestAdjust()` — fix the `_id` ignore).
  - **Drop `handleMenuReceiveStock`**: the action menu no longer has a "Receive Stock" entry, so this handler becomes dead code. The per-row `+` button lives only on the `stock` tab (via `StockRow`'s `onRestock` prop), which is wired through `handleRestock` in `stock.tsx` — handled in Task 14.
  - **New: `handleMenuMarkDamaged`** → calls `useStockSheetSignal.requestDamaged(product.id)`.
  - **New: `handleMenuViewLedger`** → `router.push('/(edit-forms)/inventory-ledger/' + product.id)`.
  - `handleMenuDelete` (unchanged)
- `useInventorySelection` import stays (used for `selection.enterSelectMode`, etc.).
- Replace `useRestockSignal` and `useInventoryModalSignal` imports with `useStockSheetSignal`.
- Bulk-adjust toolbar handler: `onBulkAdjustStock={() => signal.requestAdjust(null)}` (was `() => signal.requestAdjust()`; both are equivalent, but the new store expects `number | null`).

- [ ] **Step 1: Update the file**

Edit `app/(tabs)/inventory/products.tsx`. Specifically:

1. Replace `import { useInventorySelection, useInventoryModalSignal, useRestockSignal, useToastStore } from '@/stores';` with `import { useInventorySelection, useStockSheetSignal, useToastStore } from '@/stores';`.
2. Replace `const signal = useInventoryModalSignal();` and `const restock = useRestockSignal();` with `const signal = useStockSheetSignal();`.
3. Update `handleMenuAdjustStock` to use the `id`:
   ```ts
   const handleMenuAdjustStock = useCallback(
     (id: number) => {
       setMenuProduct(null);
       signal.requestAdjust(id);
     },
     [signal],
   );
   ```
4. **Delete `handleMenuReceiveStock` entirely** (it becomes dead code; the new action menu has no Receive Stock entry).
5. Add the two new handlers:
   ```ts
   const handleMenuMarkDamaged = useCallback(
     (id: number) => {
       setMenuProduct(null);
       signal.requestDamaged(id);
     },
     [signal],
   );

   const handleMenuViewLedger = useCallback(
     (id: number) => {
       setMenuProduct(null);
       router.push(`/(edit-forms)/inventory-ledger/${id}` as Href);
     },
     [router],
   );
   ```
6. Pass the new props to `<ProductActionMenuModal>`: `onMarkDamaged={handleMenuMarkDamaged}` and `onViewLedger={handleMenuViewLedger}`. **Drop the `onReceiveStock` prop** — it no longer exists on the new menu interface.
7. Replace the bulk-adjust handler's reference: `onBulkAdjustStock={() => signal.requestAdjust(null)}`.

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: 0 errors.

- [ ] **Step 3: Run tests**

Run: `npm test`
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add app/\(tabs\)/inventory/products.tsx
git commit -m "feat(inventory): wire products screen to new action menu handlers and store"
```

---

## Task 14: Update `stock.tsx` to use the new store

**Files:**

- Edit: `app/(tabs)/inventory/stock.tsx`

- [ ] **Step 1: Replace the restock store import**

In `app/(tabs)/inventory/stock.tsx`:

1. Replace `import { useRestockSignal } from '@/stores';` with `import { useStockSheetSignal } from '@/stores';`.
2. Replace `const restock = useRestockSignal();` with `const signal = useStockSheetSignal();`.
3. Update the restock handler: `const handleRestock = useCallback((id: number) => signal.requestRestock(id), [signal]);`.

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add app/\(tabs\)/inventory/stock.tsx
git commit -m "refactor(inventory): switch stock screen restock handler to useStockSheetSignal"
```

---

## Task 15: Run the full verification suite

**Files:** none (verification only)

- [ ] **Step 1: Typecheck**

Run: `npm run typecheck`
Expected: 0 errors.

- [ ] **Step 2: Lint**

Run: `npm lint`
Expected: 0 errors. If lint flags unused imports (e.g., `useInventorySelection` in `_layout.tsx` if not used), remove them.

- [ ] **Step 3: Tests**

Run: `npm test`
Expected: all pass. If a test imports the old `AdjustStockModal` or `ReceiveStockModal`, update the import to the new sheet path (`@/components/inventory/modals/AdjustStockSheet` or `RestockSheet`).

- [ ] **Step 4: Manual smoke test (optional, dev build)**

Boot the app via `npm run:ios` or `npm run:android`. Verify:

- The inventory tab loads.
- Tapping a product's `...` shows the new action menu (Mark Damaged / Adjust Stock / View Ledger / Edit / Delete).
- Mark Damaged opens the sheet with the product pre-filled.
- Adjust Stock opens the sheet with the product pre-filled.
- View Ledger navigates to `/(edit-forms)/inventory-ledger/<id>`.
- The layout FAB's "Mark Damaged" opens the sheet with no product; the picker shows.
- The per-row `+` button on the products tab opens the Restock sheet with the product pre-filled.
- Submitting each sheet posts a transaction and closes the sheet.

- [ ] **Step 5: Final commit (if any cleanup landed in earlier steps)**

If you fixed lint warnings or test paths in step 3, commit them now. If not, this step is a no-op.

```bash
git status
# if clean, do nothing; otherwise:
git add -A
git commit -m "chore(inventory): post-merge cleanup (lint, tests)"
```

---

## Self-Review Notes

- **Spec coverage:**
  - Action menu redesign — Task 12. ✓
  - Three new sheets — Tasks 6, 7, 8. ✓
  - Shared UI primitives — Tasks 3, 4, 5. ✓
  - Unified `useStockSheetSignal` — Task 2. ✓
  - `useRecordDamaged` hook — Task 1. ✓
  - Layout wiring — Task 10. ✓
  - FAB "Mark Damaged" entry — Task 11. ✓
  - `products.tsx` handler updates — Task 13. ✓
  - `stock.tsx` restock handler — Task 14. ✓
  - Delete the two old modals — Task 9. ✓
  - "View Ledger" routes to existing per-product screen — handled in Task 13. ✓
- **Type / name consistency:** `signal.requestRestock/Damaged/Adjust(productId: number | null)` is the same signature used across tasks 2, 6, 7, 8, 10, 13, 14. `useStockSheetSignal` is the canonical store name; no other variant is referenced.
- **Risk callouts:** "View Ledger" is implemented by routing to the existing screen rather than filtering the Movements tab. The previous spec said "filter Movements tab"; this is the corrected, more user-friendly approach since the per-product screen already exists.
