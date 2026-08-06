# Category & Supplier Dedicated Routes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace inline modals for Category and Supplier creation with full-screen `(edit-forms)` routes that allow adding current products directly to newly created categories/suppliers for quick sorting and product identification, auto-selecting the created item upon save.

**Architecture:** Database layer is updated with transaction-backed functions `insertCategoryWithProducts` and `createSupplierWithProducts` that create the new category/supplier and bulk-assign selected product IDs in SQLite. Full-screen stack routes `app/(edit-forms)/add-category/index.tsx` and `app/(edit-forms)/add-supplier/index.tsx` integrate React Hook Form with product search and multi-select checklist components. Navigation callers in `CategoryFilterBar` and `InventorySpeedDialFab` navigate directly to these routes, and obsolete inline modal hosts are removed.

**Tech Stack:** Expo SDK 54, React Native 0.81, Expo Router v6, TanStack Query v5, SQLite (`expo-sqlite`), NativeWind v4, React Hook Form v7.

## Global Constraints

- Expo SDK 54 / React Native 0.81 / React 19.
- Strict architecture layering: `app/` (screens) -> `hooks/` -> `database/` -> `configs/sqlite.ts`. No direct SQLite queries in screens.
- Single SQLite handle imported from `@/configs/sqlite`.
- Money parsing/formatting via `@/lib/money.ts`.
- No `any` types; full TypeScript strict compliance (`noImplicitReturns`, `noUncheckedIndexedAccess`, etc.).

---

### Task 1: Extend Database Functions & Types for Category & Supplier Bulk Product Assignment

**Files:**

- Modify: `types/categories.types.ts`
- Modify: `database/categories.ts`
- Modify: `database/suppliers.ts`
- Create: `tests/database/categories-suppliers-assignment.test.ts`

**Interfaces:**

- Consumes: `@/configs/sqlite`, `@/types/categories.types`, `@/types/suppliers.types`
- Produces:
  - `insertCategoryWithProducts(name: string, productIds?: number[]): Promise<number>`
  - `createSupplierWithProducts(input: NewSupplier, productIds?: number[]): Promise<Supplier>`

- [ ] **Step 1: Write the failing database integration test**

Create `tests/database/categories-suppliers-assignment.test.ts`:

```ts
import { db } from '@/configs/sqlite';
import {
  initCategoriesTable,
  insertCategoryWithProducts,
  getCategoriesWithCount,
} from '@/database/categories';
import {
  initSuppliersTable,
  createSupplierWithProducts,
} from '@/database/suppliers';
import {
  initProductsTable,
  insertProduct,
  getProduct,
} from '@/database/products';

describe('Category & Supplier Bulk Product Assignment', () => {
  beforeEach(async () => {
    await db.execAsync(`
      DROP TABLE IF EXISTS inventory_transactions;
      DROP TABLE IF EXISTS products;
      DROP TABLE IF EXISTS categories;
      DROP TABLE IF EXISTS suppliers;
    `);
    await initCategoriesTable();
    await initSuppliersTable();
    await initProductsTable();
  });

  it('inserts category and assigns selected products in a transaction', async () => {
    const p1Id = await insertProduct({
      name: 'Product A',
      sku: 'SKU-A',
      price: 10,
      quantity: 5,
    });
    const p2Id = await insertProduct({
      name: 'Product B',
      sku: 'SKU-B',
      price: 20,
      quantity: 5,
    });

    const categoryId = await insertCategoryWithProducts('Beverages', [
      p1Id,
      p2Id,
    ]);
    expect(categoryId).toBeGreaterThan(0);

    const updatedP1 = await getProduct(p1Id);
    const updatedP2 = await getProduct(p2Id);
    expect(updatedP1?.category).toBe('Beverages');
    expect(updatedP2?.category).toBe('Beverages');

    const categoriesWithCount = await getCategoriesWithCount();
    const beveragesCat = categoriesWithCount.find(
      (c) => c.name === 'Beverages',
    );
    expect(beveragesCat?.product_count).toBe(2);
  });

  it('creates supplier and assigns selected products in a transaction', async () => {
    const p1Id = await insertProduct({
      name: 'Product C',
      sku: 'SKU-C',
      price: 15,
      quantity: 10,
    });

    const supplier = await createSupplierWithProducts(
      {
        name: 'San Miguel Corp',
        contact: '09170000000',
        notes: 'Main distributor',
      },
      [p1Id],
    );

    expect(supplier.id).toBeDefined();
    expect(supplier.name).toBe('San Miguel Corp');

    const updatedP1 = await getProduct(p1Id);
    expect(updatedP1?.supplier_id).toBe(supplier.id);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/database/categories-suppliers-assignment.test.ts`
Expected: FAIL with "insertCategoryWithProducts is not defined" or similar export error.

- [ ] **Step 3: Implement database functions and types**

Update `types/categories.types.ts`:

```ts
export interface Category {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryWithCount extends Category {
  product_count: number;
}

export interface InsertCategoryParams {
  name: string;
  productIds?: number[];
}

export interface UpdateCategoryParams {
  id: number;
  name: string;
}
```

Update `database/categories.ts`: Add `insertCategoryWithProducts`:

```ts
export const insertCategoryWithProducts = async (
  name: string,
  productIds: number[] = [],
): Promise<number> => {
  return await db.withTransactionAsync(async () => {
    const result = await db.runAsync(
      'INSERT INTO categories (name) VALUES (?)',
      [name],
    );
    const categoryId = result.lastInsertRowId;
    if (productIds.length > 0) {
      const placeholders = productIds.map(() => '?').join(',');
      await db.runAsync(
        `UPDATE products SET category = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`,
        [name, ...productIds],
      );
    }
    return categoryId;
  });
};
```

Update `database/suppliers.ts`: Add `createSupplierWithProducts`:

```ts
export const createSupplierWithProducts = async (
  input: NewSupplier,
  productIds: number[] = [],
): Promise<Supplier> => {
  return await db.withTransactionAsync(async () => {
    const id = Crypto.randomUUID();
    const createdAt = Date.now();
    await db.runAsync(
      'INSERT INTO suppliers (id, name, contact, notes, created_at) VALUES (?, ?, ?, ?, ?)',
      [id, input.name, input.contact ?? null, input.notes ?? null, createdAt],
    );
    if (productIds.length > 0) {
      const placeholders = productIds.map(() => '?').join(',');
      await db.runAsync(
        `UPDATE products SET supplier_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`,
        [id, ...productIds],
      );
    }
    return { id, createdAt, ...input };
  });
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/database/categories-suppliers-assignment.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add types/categories.types.ts database/categories.ts database/suppliers.ts tests/database/categories-suppliers-assignment.test.ts
git commit -m "feat(db): add insertCategoryWithProducts and createSupplierWithProducts"
```

---

### Task 2: Update React Query Hooks for Category & Supplier Mutations

**Files:**

- Modify: `hooks/useCategories.tsx`
- Modify: `hooks/useSuppliers.tsx`
- Create: `tests/hooks/useCategoriesAndSuppliersMutations.test.ts`

**Interfaces:**

- Consumes: `insertCategoryWithProducts`, `createSupplierWithProducts`
- Produces:
  - `useCategories().insertCategoryMutation.mutateAsync({ name: string, productIds?: number[] })`
  - `useSuppliers().insertSupplierMutation.mutateAsync({ input: NewSupplier, productIds?: number[] })`

- [ ] **Step 1: Write failing hook test**

Create `tests/hooks/useCategoriesAndSuppliersMutations.test.ts`:

```ts
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCategories } from '@/hooks/useCategories';
import { useSuppliers } from '@/hooks/useSuppliers';
import { db } from '@/configs/sqlite';
import { initCategoriesTable } from '@/database/categories';
import { initSuppliersTable } from '@/database/suppliers';
import { initProductsTable, insertProduct, getProduct } from '@/database/products';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useCategories and useSuppliers hooks with product assignment', () => {
  beforeEach(async () => {
    await db.execAsync(`
      DROP TABLE IF EXISTS inventory_transactions;
      DROP TABLE IF EXISTS products;
      DROP TABLE IF EXISTS categories;
      DROP TABLE IF EXISTS suppliers;
    `);
    await initCategoriesTable();
    await initSuppliersTable();
    await initProductsTable();
  });

  it('insertCategoryMutation assigns products and invalidates product queries', async () => {
    const pId = await insertProduct({ name: 'Snack 1', sku: 'S1', price: 5, quantity: 10 });
    const { result } = renderHook(() => useCategories(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.insertCategoryMutation.mutateAsync({
        name: 'Junk Foods',
        productIds: [pId],
      });
    });

    const updated = await getProduct(pId);
    expect(updated?.category).toBe('Junk Foods');
  });

  it('insertSupplierMutation assigns products and invalidates product queries', async () => {
    const pId = await insertProduct({ name: 'Soda 1', sku: 'SD1', price: 15, quantity: 20 });
    const { result } = renderHook(() => useSuppliers(), { wrapper: createWrapper() });

    const newSupplier = await act(async () => {
      return await result.current.insertSupplierMutation.mutateAsync({
        name: 'Coca Cola Beverages',
        productIds: [pId],
      });
    });

    expect(newSupplier.id).toBeDefined();
    const updated = await getProduct(pId);
    expect(updated?.supplier_id).toBe(newSupplier.id);
  });
});
```

- [ ] **Step 2: Run test to verify failure or missing features**

Run: `npm test -- tests/hooks/useCategoriesAndSuppliersMutations.test.ts`
Expected: FAIL due to mutation parameters mismatch or invalid signature.

- [ ] **Step 3: Update hooks implementation**

Modify `hooks/useCategories.tsx`:

```ts
// Mutation: Insert a new category (with optional product assignment)
const insertCategoryMutation = useMutation({
  mutationFn: ({ name, productIds }: InsertCategoryParams) =>
    insertCategoryWithProducts(name, productIds ?? []),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    queryClient.invalidateQueries({ queryKey: ['categories-with-count'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
    addToast({
      message: 'Category added successfully',
      variant: 'success',
      duration: 5000,
    });
  },
  onError: () => {
    addToast({
      message: "Your category couldn't be added. Please try again.",
      variant: 'danger',
      duration: 5000,
    });
  },
});
```

Modify `hooks/useSuppliers.tsx`:

```ts
export interface InsertSupplierParams {
  name: string;
  contact?: string | null;
  notes?: string | null;
  productIds?: number[];
}

// Inside useSuppliers():
const insertSupplierMutation = useMutation({
  mutationFn: ({ name, contact, notes, productIds }: InsertSupplierParams) =>
    createSupplierWithProducts(
      { name, contact: contact ?? null, notes: notes ?? null },
      productIds ?? [],
    ),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: supplierKeys.all });
    queryClient.invalidateQueries({ queryKey: ['products'] });
    addToast({
      message: 'Supplier added successfully',
      variant: 'success',
      duration: 5000,
    });
  },
  onError: (error: Error) => {
    addToast({
      message: error.message || 'Failed to add supplier',
      variant: 'danger',
      duration: 5000,
    });
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/hooks/useCategoriesAndSuppliersMutations.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add hooks/useCategories.tsx hooks/useSuppliers.tsx tests/hooks/useCategoriesAndSuppliersMutations.test.ts
git commit -m "feat(hooks): support product assignment in insertCategory and insertSupplier mutations"
```

---

### Task 3: Build Full-Screen `Add Category` Route with Product Assignment

**Files:**

- Modify: `app/(edit-forms)/add-category/index.tsx`
- Create: `tests/screens/AddCategoryScreen.test.tsx`

**Interfaces:**

- Consumes: `useCategories`, `useProducts`, `@/components/elements` (`StyledText`), `FontAwesome`, `expo-router`
- Produces: Dedicated route screen `app/(edit-forms)/add-category/index.tsx`

- [ ] **Step 1: Write failing screen unit test**

Create `tests/screens/AddCategoryScreen.test.tsx`:

```ts
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AddCategoryScreen from '@/app/(edit-forms)/add-category/index';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    replace: jest.fn(),
  },
}));

jest.mock('@/hooks/useCategories', () => ({
  useCategories: () => ({
    insertCategoryMutation: {
      mutate: jest.fn((params, options) => {
        options?.onSuccess?.(1);
      }),
      isPending: false,
    },
  }),
}));

jest.mock('@/hooks/useProducts', () => ({
  useProducts: () => ({
    getAllProductsQuery: {
      data: [
        { id: 10, name: 'Coke 1.5L', category: null, price: 65, quantity: 12 },
        { id: 11, name: 'Sprite 1.5L', category: null, price: 65, quantity: 10 },
      ],
      isLoading: false,
    },
  }),
}));

function renderScreen() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AddCategoryScreen />
    </QueryClientProvider>,
  );
}

describe('AddCategoryScreen', () => {
  it('renders title and inputs', () => {
    const { getByPlaceholderText, getByText } = renderScreen();
    expect(getByText('Add Category')).toBeTruthy();
    expect(getByPlaceholderText('Category Name (e.g. Beverages)')).toBeTruthy();
  });

  it('allows selecting products and submitting form', async () => {
    const { getByPlaceholderText, getByText } = renderScreen();
    const input = getByPlaceholderText('Category Name (e.g. Beverages)');
    fireEvent.changeText(input, 'Softdrinks');

    const cokeItem = getByText('Coke 1.5L');
    expect(cokeItem).toBeTruthy();
    fireEvent.press(cokeItem);

    const saveBtn = getByText('Save Category');
    fireEvent.press(saveBtn);

    const { useCategories } = require('@/hooks/useCategories');
    const { router } = require('expo-router');

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith({
        pathname: '/(tabs)/inventory/products',
        params: { category: 'Softdrinks' },
      });
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/screens/AddCategoryScreen.test.tsx`
Expected: FAIL because `AddCategoryScreen` does not render inputs or full screen structure yet.

- [ ] **Step 3: Implement `app/(edit-forms)/add-category/index.tsx`**

Write `app/(edit-forms)/add-category/index.tsx`:

```tsx
import { useState, useMemo } from 'react';
import {
  View,
  Platform,
  TextInput,
  Pressable,
  ScrollView,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { FontAwesome } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { useCategories } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';
import { StyledText } from '@/components/elements';
import { Modal } from '@/components/ui';
import { useTranslation } from 'react-i18next';
import { formatPesos } from '@/lib/money';

interface CategoryFormData {
  name: string;
}

export default function AddCategoryScreen() {
  const { t } = useTranslation('inventory');
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [productSearch, setProductSearch] = useState('');

  const { insertCategoryMutation } = useCategories();
  const { getAllProductsQuery } = useProducts();
  const allProducts = getAllProductsQuery.data ?? [];

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return allProducts;
    const term = productSearch.trim().toLowerCase();
    return allProducts.filter((p) => p.name.toLowerCase().includes(term));
  }, [allProducts, productSearch]);

  const {
    control,
    handleSubmit,
    formState: { isDirty, isValid },
  } = useForm<CategoryFormData>({
    mode: 'onChange',
    defaultValues: { name: '' },
  });

  const confirmDiscard = () => {
    if (isDirty || selectedProductIds.length > 0) {
      setShowDiscardDialog(true);
    } else {
      router.back();
    }
  };

  const toggleProductSelection = (productId: number) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  const onSubmit = (data: CategoryFormData) => {
    const trimmedName = data.name.trim();
    if (!trimmedName) return;

    insertCategoryMutation.mutate(
      {
        name: trimmedName,
        productIds: selectedProductIds,
      },
      {
        onSuccess: () => {
          router.replace({
            pathname: '/(tabs)/inventory/products',
            params: { category: trimmedName },
          });
        },
      },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAwareScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        enableAutomaticScroll
        enableOnAndroid
        extraScrollHeight={Platform.OS === 'ios' ? 120 : 100}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header Bar */}
        <View className="px-4 pt-3 pb-4 bg-background">
          <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 px-4 py-3 flex-row items-center justify-between">
            <Pressable
              onPress={confirmDiscard}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              className="press-scale w-10 h-10 items-center justify-center rounded-full bg-paper-100 border border-ink-100 active:opacity-70"
            >
              <FontAwesome name="arrow-left" size={16} color="#0E0C0A" />
            </Pressable>

            <View className="items-center">
              <StyledText
                variant="extrabold"
                className="text-ink-900 text-h2 font-stack-sans-bold"
              >
                Add Category
              </StyledText>
              <StyledText
                variant="medium"
                className="label-caps text-ink-400 mt-0.5"
              >
                Create Product Category
              </StyledText>
            </View>

            <View className="w-10 h-10" />
          </View>
        </View>

        {/* Category Name Section */}
        <View className="px-4 mb-6">
          <View className="bg-paper-50 rounded-2xl border border-ink-100 p-4 shadow-paper space-y-4">
            <View>
              <StyledText
                variant="semibold"
                className="text-ink-700 text-sm mb-1"
              >
                Category Name *
              </StyledText>
              <Controller
                control={control}
                rules={{ required: true, minLength: 1 }}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className="flex-row items-center bg-paper-100 border border-ink-200 rounded-xl px-4 py-3">
                    <TextInput
                      className="flex-1 text-base text-ink-900 font-stack-sans p-0"
                      placeholder="Category Name (e.g. Beverages)"
                      placeholderTextColor="#A39C96"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoCapitalize="words"
                      returnKeyType="done"
                    />
                    {value.length > 0 && (
                      <Pressable onPress={() => onChange('')}>
                        <FontAwesome
                          name="times-circle"
                          size={16}
                          color="#A39C96"
                        />
                      </Pressable>
                    )}
                  </View>
                )}
              />
            </View>
          </View>
        </View>

        {/* Add Products Directly Section */}
        <View className="px-4 mb-6">
          <View className="bg-paper-50 rounded-2xl border border-ink-100 p-4 shadow-paper space-y-3">
            <View className="flex-row items-center justify-between">
              <View>
                <StyledText
                  variant="extrabold"
                  className="text-ink-900 text-base font-stack-sans-bold"
                >
                  Assign Products Directly
                </StyledText>
                <StyledText
                  variant="medium"
                  className="text-ink-400 text-xs mt-0.5"
                >
                  Select existing products to sort into this category (
                  {selectedProductIds.length} selected)
                </StyledText>
              </View>
            </View>

            {/* Product Search Input */}
            <View className="flex-row items-center bg-paper-100 border border-ink-200 rounded-xl px-3 py-2">
              <FontAwesome
                name="search"
                size={14}
                color="#A39C96"
                className="mr-2"
              />
              <TextInput
                className="flex-1 text-sm text-ink-900 font-stack-sans p-0"
                placeholder="Search products..."
                placeholderTextColor="#A39C96"
                value={productSearch}
                onChangeText={setProductSearch}
              />
              {productSearch.length > 0 && (
                <Pressable onPress={() => setProductSearch('')}>
                  <FontAwesome name="times-circle" size={14} color="#A39C96" />
                </Pressable>
              )}
            </View>

            {/* Products List */}
            <View className="max-h-60 mt-2">
              {filteredProducts.length === 0 ? (
                <View className="py-4 items-center">
                  <StyledText variant="medium" className="text-ink-400 text-xs">
                    No products found
                  </StyledText>
                </View>
              ) : (
                filteredProducts.map((product) => {
                  const isSelected = selectedProductIds.includes(product.id);
                  return (
                    <Pressable
                      key={product.id}
                      onPress={() => toggleProductSelection(product.id)}
                      className={`flex-row items-center justify-between p-3 rounded-xl mb-1.5 border ${
                        isSelected
                          ? 'bg-persimmon-50 border-persimmon-300'
                          : 'bg-paper-100 border-ink-100'
                      }`}
                    >
                      <View className="flex-1 mr-2">
                        <StyledText
                          variant="semibold"
                          className="text-ink-900 text-sm"
                        >
                          {product.name}
                        </StyledText>
                        <StyledText
                          variant="medium"
                          className="text-ink-400 text-xs"
                        >
                          {product.category
                            ? `Current: ${product.category}`
                            : 'Uncategorized'}{' '}
                          • ₱{formatPesos(product.price)}
                        </StyledText>
                      </View>
                      <View
                        className={`w-6 h-6 rounded-md items-center justify-center border ${
                          isSelected
                            ? 'bg-persimmon-500 border-persimmon-500'
                            : 'border-ink-300 bg-paper-50'
                        }`}
                      >
                        {isSelected && (
                          <FontAwesome name="check" size={12} color="#FFFFFF" />
                        )}
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>
          </View>
        </View>

        {/* Submit Action CTA */}
        <View className="px-4">
          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid || insertCategoryMutation.isPending}
            className={`w-full py-4 rounded-xl items-center justify-center shadow-paper active:opacity-90 ${
              isValid && !insertCategoryMutation.isPending
                ? 'bg-persimmon-500'
                : 'bg-ink-100 opacity-60'
            }`}
          >
            <StyledText
              variant="extrabold"
              className="text-paper-50 text-base font-stack-sans-bold"
            >
              {insertCategoryMutation.isPending ? 'Saving…' : 'Save Category'}
            </StyledText>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>

      {/* Discard Changes Dialog */}
      <Modal
        visible={showDiscardDialog}
        title="Discard changes?"
        message="Are you sure you want to leave? Your unsaved category changes will be lost."
        confirmText="Discard"
        cancelText="Keep Editing"
        variant="danger"
        onConfirm={() => {
          setShowDiscardDialog(false);
          router.back();
        }}
        onCancel={() => setShowDiscardDialog(false)}
      />
    </SafeAreaView>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/screens/AddCategoryScreen.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/\(edit-forms\)/add-category/index.tsx tests/screens/AddCategoryScreen.test.tsx
git commit -m "feat(screens): build AddCategory full-screen route with product assignment"
```

---

### Task 4: Update Full-Screen `Add Supplier` Route with Product Assignment

**Files:**

- Modify: `app/(edit-forms)/add-supplier/index.tsx`
- Create: `tests/screens/AddSupplierScreen.test.tsx`

**Interfaces:**

- Consumes: `useSuppliers`, `useProducts`, `@/components/elements` (`StyledText`), `FontAwesome`, `expo-router`
- Produces: Updated route screen `app/(edit-forms)/add-supplier/index.tsx`

- [ ] **Step 1: Write failing screen unit test**

Create `tests/screens/AddSupplierScreen.test.tsx`:

```ts
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AddSupplierScreen from '@/app/(edit-forms)/add-supplier/index';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    replace: jest.fn(),
  },
}));

jest.mock('@/hooks/useSuppliers', () => ({
  useSuppliers: () => ({
    insertSupplierMutation: {
      mutate: jest.fn((params, options) => {
        options?.onSuccess?.({ id: 'sup-123', name: params.name });
      }),
      isPending: false,
    },
  }),
}));

jest.mock('@/hooks/useProducts', () => ({
  useProducts: () => ({
    getAllProductsQuery: {
      data: [
        { id: 20, name: 'San Miguel Beer 330ml', price: 45, quantity: 24, supplier_id: null },
      ],
      isLoading: false,
    },
  }),
}));

function renderScreen() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AddSupplierScreen />
    </QueryClientProvider>,
  );
}

describe('AddSupplierScreen', () => {
  it('renders supplier inputs and product selection', () => {
    const { getByPlaceholderText, getByText } = renderScreen();
    expect(getByPlaceholderText('Supplier Name (e.g. San Miguel Corp)')).toBeTruthy();
    expect(getByText('San Miguel Beer 330ml')).toBeTruthy();
  });

  it('submits supplier form with selected products and navigates with supplier filter param', async () => {
    const { getByPlaceholderText, getByText } = renderScreen();
    fireEvent.changeText(getByPlaceholderText('Supplier Name (e.g. San Miguel Corp)'), 'SMB Inc');
    fireEvent.press(getByText('San Miguel Beer 330ml'));

    fireEvent.press(getByText('Save Supplier'));

    const { router } = require('expo-router');
    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith({
        pathname: '/(tabs)/inventory/products',
        params: { supplier: 'sup-123' },
      });
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/screens/AddSupplierScreen.test.tsx`
Expected: FAIL because `AddSupplierScreen` does not yet feature product assignment and `router.replace` navigation.

- [ ] **Step 3: Update `app/(edit-forms)/add-supplier/index.tsx`**

Modify `app/(edit-forms)/add-supplier/index.tsx` to add product assignment section and `router.replace` on submit:

```tsx
import { useState, useMemo } from 'react';
import { View, Platform, TextInput, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { FontAwesome } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useProducts } from '@/hooks/useProducts';
import { StyledText } from '@/components/elements';
import { Modal } from '@/components/ui';
import { useTranslation } from 'react-i18next';
import { formatPesos } from '@/lib/money';

interface SupplierFormData {
  name: string;
  contact: string;
  notes: string;
}

export default function AddSupplier() {
  const { t } = useTranslation('inventory');
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [focusedField, setFocusedField] = useState<
    'name' | 'contact' | 'notes' | null
  >(null);

  const { insertSupplierMutation } = useSuppliers();
  const { getAllProductsQuery } = useProducts();
  const allProducts = getAllProductsQuery.data ?? [];

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return allProducts;
    const term = productSearch.trim().toLowerCase();
    return allProducts.filter((p) => p.name.toLowerCase().includes(term));
  }, [allProducts, productSearch]);

  const {
    control,
    handleSubmit,
    formState: { isDirty, isValid },
  } = useForm<SupplierFormData>({
    mode: 'onChange',
    defaultValues: {
      name: '',
      contact: '',
      notes: '',
    },
  });

  const confirmDiscard = () => {
    if (isDirty || selectedProductIds.length > 0) {
      setShowDiscardDialog(true);
    } else {
      router.back();
    }
  };

  const toggleProductSelection = (productId: number) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  const onSubmit = (data: SupplierFormData) => {
    insertSupplierMutation.mutate(
      {
        name: data.name.trim(),
        contact: data.contact.trim() || null,
        notes: data.notes.trim() || null,
        productIds: selectedProductIds,
      },
      {
        onSuccess: (newSupplier) => {
          router.replace({
            pathname: '/(tabs)/inventory/products',
            params: { supplier: newSupplier?.id },
          });
        },
      },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAwareScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        enableAutomaticScroll
        enableOnAndroid
        extraScrollHeight={Platform.OS === 'ios' ? 120 : 100}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header Bar */}
        <View className="px-4 pt-3 pb-4 bg-background">
          <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 px-4 py-3 flex-row items-center justify-between">
            <Pressable
              onPress={confirmDiscard}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              className="press-scale w-10 h-10 items-center justify-center rounded-full bg-paper-100 border border-ink-100 active:opacity-70"
            >
              <FontAwesome name="arrow-left" size={16} color="#0E0C0A" />
            </Pressable>

            <View className="items-center">
              <StyledText
                variant="extrabold"
                className="text-ink-900 text-h2 font-stack-sans-bold"
              >
                {t('addSupplier')}
              </StyledText>
              <StyledText
                variant="medium"
                className="label-caps text-ink-400 mt-0.5"
              >
                Create Supplier Record
              </StyledText>
            </View>

            <View className="w-10 h-10" />
          </View>
        </View>

        {/* Supplier Form Inputs */}
        <View className="px-4 mb-6">
          <View className="bg-paper-50 rounded-2xl border border-ink-100 p-4 shadow-paper space-y-4">
            <View>
              <StyledText
                variant="semibold"
                className="text-ink-700 text-sm mb-1"
              >
                Supplier Name *
              </StyledText>
              <Controller
                control={control}
                rules={{ required: true, minLength: 1 }}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    className={`flex-row items-center bg-paper-100 border rounded-xl px-4 py-3 ${
                      focusedField === 'name'
                        ? 'border-persimmon-500'
                        : 'border-ink-200'
                    }`}
                  >
                    <TextInput
                      className="flex-1 text-base text-ink-900 font-stack-sans p-0"
                      placeholder="Supplier Name (e.g. San Miguel Corp)"
                      placeholderTextColor="#A39C96"
                      value={value}
                      onChangeText={onChange}
                      onBlur={() => {
                        onBlur();
                        setFocusedField(null);
                      }}
                      onFocus={() => setFocusedField('name')}
                      autoCapitalize="words"
                    />
                    {value.length > 0 && (
                      <Pressable onPress={() => onChange('')}>
                        <FontAwesome
                          name="times-circle"
                          size={16}
                          color="#A39C96"
                        />
                      </Pressable>
                    )}
                  </View>
                )}
              />
            </View>

            <View className="mt-3">
              <StyledText
                variant="semibold"
                className="text-ink-700 text-sm mb-1"
              >
                Contact Info (Optional)
              </StyledText>
              <Controller
                control={control}
                name="contact"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    className={`flex-row items-center bg-paper-100 border rounded-xl px-4 py-3 ${
                      focusedField === 'contact'
                        ? 'border-persimmon-500'
                        : 'border-ink-200'
                    }`}
                  >
                    <TextInput
                      className="flex-1 text-base text-ink-900 font-stack-sans p-0"
                      placeholder="Phone number, email, or agent name"
                      placeholderTextColor="#A39C96"
                      value={value}
                      onChangeText={onChange}
                      onBlur={() => {
                        onBlur();
                        setFocusedField(null);
                      }}
                      onFocus={() => setFocusedField('contact')}
                    />
                  </View>
                )}
              />
            </View>

            <View className="mt-3">
              <StyledText
                variant="semibold"
                className="text-ink-700 text-sm mb-1"
              >
                Notes (Optional)
              </StyledText>
              <Controller
                control={control}
                name="notes"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    className={`flex-row items-center bg-paper-100 border rounded-xl px-4 py-3 ${
                      focusedField === 'notes'
                        ? 'border-persimmon-500'
                        : 'border-ink-200'
                    }`}
                  >
                    <TextInput
                      className="flex-1 text-base text-ink-900 font-stack-sans p-0"
                      placeholder="Delivery schedule, terms, minimum order"
                      placeholderTextColor="#A39C96"
                      value={value}
                      onChangeText={onChange}
                      onBlur={() => {
                        onBlur();
                        setFocusedField(null);
                      }}
                      onFocus={() => setFocusedField('notes')}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                )}
              />
            </View>
          </View>
        </View>

        {/* Assign Products Section */}
        <View className="px-4 mb-6">
          <View className="bg-paper-50 rounded-2xl border border-ink-100 p-4 shadow-paper space-y-3">
            <View className="flex-row items-center justify-between">
              <View>
                <StyledText
                  variant="extrabold"
                  className="text-ink-900 text-base font-stack-sans-bold"
                >
                  Assign Products Directly
                </StyledText>
                <StyledText
                  variant="medium"
                  className="text-ink-400 text-xs mt-0.5"
                >
                  Select existing products provided by this supplier (
                  {selectedProductIds.length} selected)
                </StyledText>
              </View>
            </View>

            {/* Product Search */}
            <View className="flex-row items-center bg-paper-100 border border-ink-200 rounded-xl px-3 py-2">
              <FontAwesome
                name="search"
                size={14}
                color="#A39C96"
                className="mr-2"
              />
              <TextInput
                className="flex-1 text-sm text-ink-900 font-stack-sans p-0"
                placeholder="Search products..."
                placeholderTextColor="#A39C96"
                value={productSearch}
                onChangeText={setProductSearch}
              />
              {productSearch.length > 0 && (
                <Pressable onPress={() => setProductSearch('')}>
                  <FontAwesome name="times-circle" size={14} color="#A39C96" />
                </Pressable>
              )}
            </View>

            {/* Products List */}
            <View className="max-h-60 mt-2">
              {filteredProducts.length === 0 ? (
                <View className="py-4 items-center">
                  <StyledText variant="medium" className="text-ink-400 text-xs">
                    No products found
                  </StyledText>
                </View>
              ) : (
                filteredProducts.map((product) => {
                  const isSelected = selectedProductIds.includes(product.id);
                  return (
                    <Pressable
                      key={product.id}
                      onPress={() => toggleProductSelection(product.id)}
                      className={`flex-row items-center justify-between p-3 rounded-xl mb-1.5 border ${
                        isSelected
                          ? 'bg-persimmon-50 border-persimmon-300'
                          : 'bg-paper-100 border-ink-100'
                      }`}
                    >
                      <View className="flex-1 mr-2">
                        <StyledText
                          variant="semibold"
                          className="text-ink-900 text-sm"
                        >
                          {product.name}
                        </StyledText>
                        <StyledText
                          variant="medium"
                          className="text-ink-400 text-xs"
                        >
                          ₱{formatPesos(product.price)}
                        </StyledText>
                      </View>
                      <View
                        className={`w-6 h-6 rounded-md items-center justify-center border ${
                          isSelected
                            ? 'bg-persimmon-500 border-persimmon-500'
                            : 'border-ink-300 bg-paper-50'
                        }`}
                      >
                        {isSelected && (
                          <FontAwesome name="check" size={12} color="#FFFFFF" />
                        )}
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <View className="px-4">
          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid || insertSupplierMutation.isPending}
            className={`w-full py-4 rounded-xl items-center justify-center shadow-paper active:opacity-90 ${
              isValid && !insertSupplierMutation.isPending
                ? 'bg-persimmon-500'
                : 'bg-ink-100 opacity-60'
            }`}
          >
            <StyledText
              variant="extrabold"
              className="text-paper-50 text-base font-stack-sans-bold"
            >
              {insertSupplierMutation.isPending ? 'Saving…' : 'Save Supplier'}
            </StyledText>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>

      {/* Discard Dialog */}
      <Modal
        visible={showDiscardDialog}
        title="Discard changes?"
        message="Are you sure you want to leave? Your unsaved supplier details will be lost."
        confirmText="Discard"
        cancelText="Keep Editing"
        variant="danger"
        onConfirm={() => {
          setShowDiscardDialog(false);
          router.back();
        }}
        onCancel={() => setShowDiscardDialog(false)}
      />
    </SafeAreaView>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/screens/AddSupplierScreen.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/\(edit-forms\)/add-supplier/index.tsx tests/screens/AddSupplierScreen.test.tsx
git commit -m "feat(screens): update AddSupplier full-screen route with product assignment"
```

---

### Task 5: Navigation Wire-Up & Cleanup of Obsolete Inline Modals

**Files:**

- Modify: `app/(edit-forms)/_layout.tsx`
- Modify: `components/inventory/CategoryFilterBar.tsx`
- Modify: `components/inventory/InventorySpeedDialFab.tsx`
- Modify: `app/(tabs)/inventory/_layout.tsx`
- Modify: `app/(tabs)/inventory/modals.tsx`
- Delete: `components/inventory/modals/AddCategoryModal.tsx`
- Delete: `components/inventory/modals/AddSupplierModal.tsx`
- Modify: `components/inventory/modals/index.ts`
- Create: `tests/navigation/CategorySupplierNavigation.test.tsx`

**Interfaces:**

- Consumes: `@/components/inventory`, `expo-router`
- Produces: Stack navigation for `add-category` and `add-supplier`, clean inline modal host.

- [ ] **Step 1: Write navigation wire-up test**

Create `tests/navigation/CategorySupplierNavigation.test.tsx`:

```ts
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CategoryFilterBar } from '@/components/inventory/CategoryFilterBar';
import { InventorySpeedDialFab } from '@/components/inventory/InventorySpeedDialFab';
import { router } from 'expo-router';

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

describe('Category and Supplier Navigation Triggers', () => {
  it('CategoryFilterBar Add Category pill triggers router.push to edit-forms stack', () => {
    const handleAddCat = jest.fn(() => router.push('/(edit-forms)/add-category'));
    const { getByText } = render(
      <CategoryFilterBar onSelectCategory={jest.fn()} onOpenAddCategory={handleAddCat} />,
    );

    fireEvent.press(getByText('Add Category'));
    expect(handleAddCat).toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith('/(edit-forms)/add-category');
  });

  it('InventorySpeedDialFab triggers router.push for category and supplier', () => {
    const handleCat = jest.fn(() => router.push('/(edit-forms)/add-category'));
    const handleSup = jest.fn(() => router.push('/(edit-forms)/add-supplier'));

    const { getByText } = render(
      <InventorySpeedDialFab
        onAddProduct={jest.fn()}
        onAddCategory={handleCat}
        onAddSupplier={handleSup}
        onScanBarcode={jest.fn()}
      />,
    );

    fireEvent.press(getByText('Add Category'));
    expect(handleCat).toHaveBeenCalled();

    fireEvent.press(getByText('Add Supplier'));
    expect(handleSup).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npm test -- tests/navigation/CategorySupplierNavigation.test.tsx`
Expected: PASS

- [ ] **Step 3: Update `app/(edit-forms)/_layout.tsx`**

Modify `app/(edit-forms)/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';

export default function EditFormsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="add-product/index" />
      <Stack.Screen name="edit-product/[id]" />
      <Stack.Screen name="product-details/[id]" />
      <Stack.Screen name="add-category/index" />
      <Stack.Screen name="add-supplier/index" />
      <Stack.Screen name="edit-supplier/[id]" />
    </Stack>
  );
}
```

- [ ] **Step 4: Update `app/(tabs)/inventory/_layout.tsx` and `modals.tsx`**

Modify `app/(tabs)/inventory/_layout.tsx`:
Remove `categoryOpen` and `supplierOpen` local states, and update speed dial callbacks:

```tsx
<InventorySpeedDialFab
  onAddProduct={openAddProduct}
  onAddCategory={() => router.push('/(edit-forms)/add-category' as Href)}
  onAddSupplier={() => router.push('/(edit-forms)/add-supplier' as Href)}
  onScanBarcode={() => setScannerOpen(true)}
/>
```

Modify `app/(tabs)/inventory/modals.tsx`:
Remove `categoryOpen` and `supplierOpen` props and remove `<AddCategoryModal>` and `<AddSupplierModal>` calls.

Delete `components/inventory/modals/AddCategoryModal.tsx` and `components/inventory/modals/AddSupplierModal.tsx`.

Update `components/inventory/modals/index.ts`:
Remove exports of `AddCategoryModal` and `AddSupplierModal`.

- [ ] **Step 5: Run full project verification**

Run: `npm run verify`
Expected: `tsc --noEmit` and all Jest test suites PASS with zero errors.

- [ ] **Step 6: Commit**

```bash
git rm components/inventory/modals/AddCategoryModal.tsx components/inventory/modals/AddSupplierModal.tsx
git add app/\(edit-forms\)/_layout.tsx app/\(tabs\)/inventory/_layout.tsx app/\(tabs\)/inventory/modals.tsx components/inventory/modals/index.ts tests/navigation/CategorySupplierNavigation.test.tsx
git commit -m "feat(navigation): link add-category and add-supplier to edit-forms stack and clean up inline modals"
```
