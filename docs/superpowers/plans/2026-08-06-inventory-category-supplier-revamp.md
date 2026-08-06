# Inventory Category & Supplier Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Quick-Create modals for Categories and Suppliers (triggered from `InventorySpeedDialFab` and filter quick-actions) and revamp `app/(tabs)/inventory/products.tsx` with a Category Filter Carousel and Supplier Selector.

**Architecture:** Create reusable modal components (`AddCategoryModal`, `AddSupplierModal`) hosted in `InventoryModalsHost` (`app/(tabs)/inventory/modals.tsx`), controlled by layout state from `_layout.tsx`. Use Expo Router search params (`category`, `supplier`) for sticky filter state and auto-select new items upon creation.

**Tech Stack:** React Native, Expo Router, React Hook Form, TanStack Query (`useCategories`, `useSuppliers`), NativeWind CSS, Native UI components, Jest / React Native Testing Library.

## Global Constraints

- Follow existing modal design patterns (`Modal`, `StyledText`, NativeWind styling).
- Preserve existing database schemas and hooks (`useCategories`, `useSuppliers`).
- Use `useToastStore` for user feedback toasts upon creation.
- Keep Expo Router search params (`category`, `supplier`, `q`) in sync with filters.

---

### Task 1: Create `AddCategoryModal` Component

**Files:**

- Create: `components/inventory/modals/AddCategoryModal.tsx`
- Modify: `components/inventory/modals/index.ts`
- Test: `tests/components/AddCategoryModal.test.tsx`

**Interfaces:**

- Consumes: `useCategories()` (`insertCategoryMutation`), `useToastStore` (`addToast`)
- Produces: `AddCategoryModal` component accepting `visible: boolean`, `onClose: () => void`, `onSuccess?: (name: string) => void`.

- [ ] **Step 1: Write the component test**

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AddCategoryModal } from '@/components/inventory/modals/AddCategoryModal';

jest.mock('@/hooks/useCategories', () => ({
  useCategories: () => ({
    insertCategoryMutation: {
      mutate: jest.fn((data, { onSuccess }) => onSuccess?.(1)),
      isPending: false,
    },
  }),
}));

jest.mock('@/stores/ToastStore', () => ({
  useToastStore: () => ({ addToast: jest.fn() }),
}));

describe('AddCategoryModal', () => {
  it('renders modal when visible is true', () => {
    const { getByText, getByPlaceholderText } = render(
      <AddCategoryModal visible={true} onClose={jest.fn()} />,
    );
    expect(getByText('New Category')).toBeTruthy();
    expect(getByPlaceholderText(/e\.g\. Beverages/i)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/components/AddCategoryModal.test.tsx`  
Expected: FAIL with module not found for `AddCategoryModal`.

- [ ] **Step 3: Implement `AddCategoryModal`**

```tsx
import { useCallback, useState } from 'react';
import { Modal, Pressable, TextInput, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { useCategories } from '@/hooks/useCategories';

interface AddCategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (categoryName: string) => void;
}

export function AddCategoryModal({
  visible,
  onClose,
  onSuccess,
}: AddCategoryModalProps) {
  const [name, setName] = useState('');
  const { insertCategoryMutation } = useCategories();

  const handleSave = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed) return;

    insertCategoryMutation.mutate(
      { name: trimmed },
      {
        onSuccess: () => {
          setName('');
          onClose();
          onSuccess?.(trimmed);
        },
      },
    );
  }, [name, insertCategoryMutation, onClose, onSuccess]);

  const handleClose = useCallback(() => {
    setName('');
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-ink-900/60 justify-center items-center px-5">
        <View className="w-full bg-paper-50 rounded-3xl p-5 border border-ink-100 shadow-xl">
          <View className="flex-row items-center justify-between mb-2">
            <StyledText
              variant="black"
              className="text-xl text-ink-900 font-stack-sans-bold"
            >
              New Category
            </StyledText>
            <Pressable
              onPress={handleClose}
              className="w-8 h-8 rounded-full bg-paper-100 items-center justify-center border border-ink-100"
            >
              <FontAwesome name="times" size={14} color="#564E45" />
            </Pressable>
          </View>

          <StyledText variant="regular" className="text-ink-500 text-xs mb-4">
            Create a category to group products for easier inventory tracking.
          </StyledText>

          <StyledText variant="bold" className="text-sm text-ink-900 mb-1.5">
            Category Name{' '}
            <StyledText className="text-persimmon-500">*</StyledText>
          </StyledText>
          <View className="relative justify-center mb-6">
            <TextInput
              placeholder="e.g. Beverages, Snacks, Toiletries"
              value={name}
              onChangeText={setName}
              className="bg-paper-100 border border-ink-200 rounded-xl px-4 py-3.5 text-base text-ink-900 font-stack-sans"
              placeholderTextColor="#A89F90"
              autoFocus
            />
            {name.length > 0 && (
              <Pressable
                onPress={() => setName('')}
                className="absolute right-4.5 p-1"
              >
                <FontAwesome name="times-circle" size={16} color="#A89F90" />
              </Pressable>
            )}
          </View>

          <View className="flex-row gap-x-3">
            <Pressable
              onPress={handleClose}
              className="flex-1 py-3.5 rounded-xl bg-paper-100 border border-ink-200 items-center"
            >
              <StyledText variant="bold" className="text-ink-700 text-base">
                Cancel
              </StyledText>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={!name.trim() || insertCategoryMutation.isPending}
              className={`flex-1 py-3.5 rounded-xl items-center ${
                !name.trim() || insertCategoryMutation.isPending
                  ? 'bg-ink-100'
                  : 'bg-persimmon-500 shadow-persimmon-glow'
              }`}
            >
              <StyledText
                variant="black"
                className={!name.trim() ? 'text-ink-400' : 'text-paper-50'}
              >
                {insertCategoryMutation.isPending ? 'Saving…' : 'Save Category'}
              </StyledText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
```

Export `AddCategoryModal` in `components/inventory/modals/index.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest tests/components/AddCategoryModal.test.tsx`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/inventory/modals/AddCategoryModal.tsx components/inventory/modals/index.ts tests/components/AddCategoryModal.test.tsx
git commit -m "feat: add AddCategoryModal component for inventory"
```

---

### Task 2: Create `AddSupplierModal` Component

**Files:**

- Create: `components/inventory/modals/AddSupplierModal.tsx`
- Modify: `components/inventory/modals/index.ts`
- Test: `tests/components/AddSupplierModal.test.tsx`

**Interfaces:**

- Consumes: `useSuppliers()` (`insertSupplierMutation`), `useToastStore` (`addToast`)
- Produces: `AddSupplierModal` component accepting `visible: boolean`, `onClose: () => void`, `onSuccess?: (supplier: Supplier) => void`.

- [ ] **Step 1: Write the component test**

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { AddSupplierModal } from '@/components/inventory/modals/AddSupplierModal';

jest.mock('@/hooks/useSuppliers', () => ({
  useSuppliers: () => ({
    insertSupplierMutation: {
      mutate: jest.fn((data, { onSuccess }) =>
        onSuccess?.({ id: 'sup-1', name: data.name, createdAt: Date.now() }),
      ),
      isPending: false,
    },
  }),
}));

describe('AddSupplierModal', () => {
  it('renders supplier form modal when visible is true', () => {
    const { getByText, getByPlaceholderText } = render(
      <AddSupplierModal visible={true} onClose={jest.fn()} />,
    );
    expect(getByText('New Supplier')).toBeTruthy();
    expect(getByPlaceholderText(/e\.g\. San Miguel Corp/i)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/components/AddSupplierModal.test.tsx`  
Expected: FAIL with module not found for `AddSupplierModal`.

- [ ] **Step 3: Implement `AddSupplierModal`**

```tsx
import { useCallback, useState } from 'react';
import { Modal, Pressable, TextInput, View, ScrollView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { useSuppliers } from '@/hooks/useSuppliers';
import type { Supplier } from '@/types/suppliers.types';

interface AddSupplierModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (supplier: Supplier) => void;
}

export function AddSupplierModal({
  visible,
  onClose,
  onSuccess,
}: AddSupplierModalProps) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [notes, setNotes] = useState('');
  const { insertSupplierMutation } = useSuppliers();

  const handleSave = useCallback(() => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    insertSupplierMutation.mutate(
      {
        name: trimmedName,
        contact: contact.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: (newSupplier) => {
          setName('');
          setContact('');
          setNotes('');
          onClose();
          if (newSupplier) onSuccess?.(newSupplier);
        },
      },
    );
  }, [name, contact, notes, insertSupplierMutation, onClose, onSuccess]);

  const handleClose = useCallback(() => {
    setName('');
    setContact('');
    setNotes('');
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-ink-900/60 justify-center items-center px-5">
        <View className="w-full max-h-[85%] bg-paper-50 rounded-3xl p-5 border border-ink-100 shadow-xl">
          <View className="flex-row items-center justify-between mb-2">
            <StyledText
              variant="black"
              className="text-xl text-ink-900 font-stack-sans-bold"
            >
              New Supplier
            </StyledText>
            <Pressable
              onPress={handleClose}
              className="w-8 h-8 rounded-full bg-paper-100 items-center justify-center border border-ink-100"
            >
              <FontAwesome name="times" size={14} color="#564E45" />
            </Pressable>
          </View>

          <StyledText variant="regular" className="text-ink-500 text-xs mb-4">
            Record supplier details for stock reorders and delivery notes.
          </StyledText>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <StyledText variant="bold" className="text-sm text-ink-900 mb-1.5">
              Supplier Name{' '}
              <StyledText className="text-persimmon-500">*</StyledText>
            </StyledText>
            <TextInput
              placeholder="e.g. San Miguel Corp, Local Distributor"
              value={name}
              onChangeText={setName}
              className="bg-paper-100 border border-ink-200 rounded-xl px-4 py-3.5 text-base text-ink-900 font-stack-sans mb-3"
              placeholderTextColor="#A89F90"
            />

            <StyledText variant="bold" className="text-sm text-ink-900 mb-1.5">
              Contact Info (Optional)
            </StyledText>
            <TextInput
              placeholder="Phone number, email, or agent name"
              value={contact}
              onChangeText={setContact}
              className="bg-paper-100 border border-ink-200 rounded-xl px-4 py-3.5 text-base text-ink-900 font-stack-sans mb-3"
              placeholderTextColor="#A89F90"
            />

            <StyledText variant="bold" className="text-sm text-ink-900 mb-1.5">
              Notes (Optional)
            </StyledText>
            <TextInput
              placeholder="Delivery schedule, payment terms"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              className="bg-paper-100 border border-ink-200 rounded-xl px-4 py-3.5 text-base text-ink-900 font-stack-sans mb-4 min-h-[80px]"
              placeholderTextColor="#A89F90"
              textAlignVertical="top"
            />
          </ScrollView>

          <View className="flex-row gap-x-3 pt-2 border-t border-ink-100">
            <Pressable
              onPress={handleClose}
              className="flex-1 py-3.5 rounded-xl bg-paper-100 border border-ink-200 items-center"
            >
              <StyledText variant="bold" className="text-ink-700 text-base">
                Cancel
              </StyledText>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={!name.trim() || insertSupplierMutation.isPending}
              className={`flex-1 py-3.5 rounded-xl items-center ${
                !name.trim() || insertSupplierMutation.isPending
                  ? 'bg-ink-100'
                  : 'bg-persimmon-500 shadow-persimmon-glow'
              }`}
            >
              <StyledText
                variant="black"
                className={!name.trim() ? 'text-ink-400' : 'text-paper-50'}
              >
                {insertSupplierMutation.isPending ? 'Saving…' : 'Save Supplier'}
              </StyledText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
```

Export `AddSupplierModal` in `components/inventory/modals/index.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest tests/components/AddSupplierModal.test.tsx`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/inventory/modals/AddSupplierModal.tsx components/inventory/modals/index.ts tests/components/AddSupplierModal.test.tsx
git commit -m "feat: add AddSupplierModal component for inventory"
```

---

### Task 3: Integrate Modals in `InventoryModalsHost` and `_layout.tsx`

**Files:**

- Modify: `app/(tabs)/inventory/_layout.tsx`
- Modify: `app/(tabs)/inventory/modals.tsx`

**Interfaces:**

- Updates `InventoryModalsHost` to accept `categoryModalOpen`, `onCloseCategory`, `supplierModalOpen`, `onCloseSupplier`.
- Wires `InventorySpeedDialFab` `onAddCategory` and `onAddSupplier` callbacks.

- [ ] **Step 1: Update `InventoryModalsHost` in `modals.tsx`**

Update `app/(tabs)/inventory/modals.tsx`:
Add props:

```tsx
interface Props {
  scannerOpen: boolean;
  onCloseScanner: () => void;
  categoryOpen: boolean;
  onCloseCategory: () => void;
  supplierOpen: boolean;
  onCloseSupplier: () => void;
}
```

Import `AddCategoryModal` and `AddSupplierModal`.
Render them inside return:

```tsx
<AddCategoryModal
  visible={categoryOpen}
  onClose={onCloseCategory}
  onSuccess={(categoryName) => {
    router.setParams({ category: categoryName });
  }}
/>
<AddSupplierModal
  visible={supplierOpen}
  onClose={onCloseSupplier}
  onSuccess={(supplier) => {
    router.setParams({ supplier: supplier.id });
  }}
/>
```

- [ ] **Step 2: Update `_layout.tsx` to control modal open state**

In `app/(tabs)/inventory/_layout.tsx`:
Add state:

```tsx
const [categoryOpen, setCategoryOpen] = useState(false);
const [supplierOpen, setSupplierOpen] = useState(false);
```

Pass to `InventorySpeedDialFab`:

```tsx
<InventorySpeedDialFab
  onAddProduct={openAddProduct}
  onAddCategory={() => setCategoryOpen(true)}
  onAddSupplier={() => setSupplierOpen(true)}
  onScanBarcode={() => setScannerOpen(true)}
/>
```

Pass to `InventoryModalsHost`:

```tsx
<InventoryModalsHost
  scannerOpen={scannerOpen}
  onCloseScanner={() => setScannerOpen(false)}
  categoryOpen={categoryOpen}
  onCloseCategory={() => setCategoryOpen(false)}
  supplierOpen={supplierOpen}
  onCloseSupplier={() => setSupplierOpen(false)}
/>
```

- [ ] **Step 3: Run project lint & build check**

Run: `npx expo lint` or check TypeScript compilation.
Expected: Clean compilation with no type errors.

- [ ] **Step 4: Commit**

```bash
git add app/\(tabs\)/inventory/_layout.tsx app/\(tabs\)/inventory/modals.tsx
git commit -m "feat: wire Add Category and Add Supplier speed dial actions to InventoryModalsHost"
```

---

### Task 4: Create `CategoryFilterBar` and Revamp `products.tsx` Filtering

**Files:**

- Create: `components/inventory/CategoryFilterBar.tsx`
- Modify: `components/inventory/index.ts`
- Modify: `app/(tabs)/inventory/products.tsx`

**Interfaces:**

- Produces: `CategoryFilterBar` accepting `selectedCategory?: string`, `onSelectCategory: (name: string | undefined) => void`, `onOpenAddCategory: () => void`.

- [ ] **Step 1: Implement `CategoryFilterBar.tsx`**

```tsx
import { useCallback } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { useCategories } from '@/hooks/useCategories';

interface CategoryFilterBarProps {
  selectedCategory?: string;
  onSelectCategory: (categoryName: string | undefined) => void;
  onOpenAddCategory: () => void;
}

export function CategoryFilterBar({
  selectedCategory,
  onSelectCategory,
  onOpenAddCategory,
}: CategoryFilterBarProps) {
  const { getCategoriesWithCountQuery } = useCategories();
  const categories = getCategoriesWithCountQuery.data ?? [];

  const handleSelect = useCallback(
    (name: string | undefined) => {
      if (selectedCategory === name) {
        onSelectCategory(undefined);
      } else {
        onSelectCategory(name);
      }
    },
    [selectedCategory, onSelectCategory],
  );

  return (
    <View className="py-2">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          gap: 8,
          alignItems: 'center',
        }}
      >
        {/* "All" Pill */}
        <Pressable
          onPress={() => handleSelect(undefined)}
          className={`px-3.5 py-1.5 rounded-full border ${
            !selectedCategory
              ? 'bg-ink-900 border-ink-900'
              : 'bg-paper-50 border-ink-200'
          }`}
        >
          <StyledText
            variant="bold"
            className={`text-xs ${!selectedCategory ? 'text-paper-50' : 'text-ink-700'}`}
          >
            All
          </StyledText>
        </Pressable>

        {/* Dynamic Category Chips */}
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          return (
            <Pressable
              key={cat.id}
              onPress={() => handleSelect(cat.name)}
              className={`px-3.5 py-1.5 rounded-full border flex-row items-center gap-x-1.5 ${
                isSelected
                  ? 'bg-ink-900 border-ink-900'
                  : 'bg-paper-50 border-ink-200'
              }`}
            >
              <StyledText
                variant="bold"
                className={`text-xs ${isSelected ? 'text-paper-50' : 'text-ink-700'}`}
              >
                {cat.name}
              </StyledText>
              <View
                className={`px-1.5 py-0.5 rounded-full ${
                  isSelected ? 'bg-ink-700' : 'bg-paper-200'
                }`}
              >
                <StyledText
                  variant="extrabold"
                  className={`text-[10px] ${isSelected ? 'text-paper-50' : 'text-ink-500'}`}
                >
                  {cat.product_count}
                </StyledText>
              </View>
            </Pressable>
          );
        })}

        {/* Add Category Pill */}
        <Pressable
          onPress={onOpenAddCategory}
          className="px-3 py-1.5 rounded-full border border-dashed border-persimmon-400 bg-persimmon-50/50 flex-row items-center gap-x-1 active:opacity-70"
        >
          <FontAwesome name="plus" size={10} color="#E85A1F" />
          <StyledText variant="bold" className="text-xs text-persimmon-600">
            Add Category
          </StyledText>
        </Pressable>
      </ScrollView>
    </View>
  );
}
```

Export `CategoryFilterBar` in `components/inventory/index.ts`.

- [ ] **Step 2: Integrate `CategoryFilterBar` & Filters in `products.tsx`**

In `app/(tabs)/inventory/products.tsx`:
Read search parameters:

```tsx
const { q, category, supplier } = useLocalSearchParams<{
  q?: string;
  category?: string;
  supplier?: string;
}>();
```

Filter products list by `category` and `supplier` in addition to query search `q`.
Render `CategoryFilterBar` at the top of the products tab list:

```tsx
<CategoryFilterBar
  selectedCategory={category}
  onSelectCategory={(cat) => router.setParams({ category: cat ?? '' })}
  onOpenAddCategory={() => router.setParams({ addCategory: 'true' })}
/>
```

- [ ] **Step 3: Run full verification suite**

Run: `npm test` or `npx jest` to ensure all tests pass cleanly.

- [ ] **Step 4: Commit**

```bash
git add components/inventory/CategoryFilterBar.tsx components/inventory/index.ts app/\(tabs\)/inventory/products.tsx
git commit -m "feat: add CategoryFilterBar and category/supplier filtering to products tab"
```

---

## Plan Self-Review Check

- **Spec coverage:** All spec items covered (AddCategoryModal, AddSupplierModal, SpeedDial wiring, CategoryFilterBar, router params auto-selection).
- **Placeholder scan:** No TBD or placeholders present.
- **Type consistency:** Matches existing types (`Supplier`, `Category`, Expo Router params).
