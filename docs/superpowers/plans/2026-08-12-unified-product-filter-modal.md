# Unified Product Filter Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate `InventoryAlertPills`, `CategoryFilterBar`, and `ProductsFilterChips` into a single SearchBar-triggered `ProductFilterModal`.

**Architecture:** Extend `SearchBar` with filter icon button & active badge, build `ProductFilterModal` as a paper-themed bottom sheet, update `InventoryHeader` and `ProductsScreen` to remove redundant inline filter components and integrate the filter modal.

**Tech Stack:** React Native, Expo Router, FontAwesome, Moti (animations), NativeWind / Tailwind CSS.

## Global Constraints

- Follow existing codebase paper-theme aesthetics (`bg-paper-50`, `bg-paper-200`, `persimmon-500`, `cinnamon-500`, `ink-900`).
- Retain existing navigation endpoints (e.g. `add-category`).
- Ensure no breaking changes to shared hooks (`useCategories`, `useInventoryOverview`).

---

### Task 1: Extend SearchBar Component with Filter Button & Badge

**Files:**

- Modify: `components/ui/SearchBar.tsx`

**Interfaces:**

- Consumes: `SearchBarProps`
- Produces: `SearchBarProps` updated with `onFilterPress?: () => void` and `activeFilterCount?: number`

- [ ] **Step 1: Update SearchBarProps interface & implementation in `SearchBar.tsx`**

Add `onFilterPress` and `activeFilterCount` to `SearchBarProps`:

```tsx
type SearchBarProps = {
  value?: string;
  onChange: (s: string) => void;
  placeholder?: string;
  accessibilityLabel?: string;
  debounceMs?: number;
  onFilterPress?: () => void;
  activeFilterCount?: number;
} & Omit<TextInputProps, 'onChange' | 'onChangeText'>;
```

In `SearchBar.tsx`, adjust right padding of `TextInput` when `onFilterPress` is present, and add the filter button right next to/beside the clear icon:

```tsx
{
  onFilterPress && (
    <TouchableOpacity
      onPress={onFilterPress}
      accessibilityLabel="Filter items"
      accessibilityRole="button"
      hitSlop={8}
      className="press-scale active:opacity-70 w-8 h-8 items-center justify-center rounded-full bg-paper-200 ml-1 relative"
    >
      <FontAwesome name="sliders" size={13} color="#564E45" />
      {Boolean(activeFilterCount && activeFilterCount > 0) && (
        <View className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-persimmon-500 items-center justify-center border border-paper-50">
          <Text className="text-[9px] font-extrabold text-paper-50">
            {activeFilterCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
```

- [ ] **Step 2: Verify SearchBar syntax & typescript types**

Run: `npx tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit SearchBar updates**

```bash
git add components/ui/SearchBar.tsx
git commit -m "feat(ui): add filter button and active count badge to SearchBar"
```

---

### Task 2: Build ProductFilterModal Component

**Files:**

- Create: `components/inventory/products/ProductFilterModal.tsx`
- Modify: `components/inventory/products/index.ts`

**Interfaces:**

- Consumes: `ProductsFilter` from `@/components/inventory/products`, `AlertKind` from `@/components/inventory/InventoryAlertPills`
- Produces: `ProductFilterModal` component

- [ ] **Step 1: Create `components/inventory/products/ProductFilterModal.tsx`**

```tsx
import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { StyledText } from '@/components/elements';
import { FontAwesome } from '@expo/vector-icons';
import { useCategories } from '@/hooks/useCategories';
import { useInventoryOverview } from '@/hooks/useInventoryOverview';
import type { ProductsFilter } from './ProductFilterChips';
import type { AlertKind } from '../InventoryAlertPills';

export interface ProductFiltersState {
  status: ProductsFilter;
  alert?: AlertKind;
  category?: string;
}

interface ProductFilterModalProps {
  visible: boolean;
  onClose: () => void;
  currentFilters: ProductFiltersState;
  onApplyFilters: (filters: ProductFiltersState) => void;
  onOpenAddCategory: () => void;
}

const STATUS_OPTIONS: { key: ProductsFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'in_stock', label: 'In Stock' },
  { key: 'low', label: 'Low Stock' },
  { key: 'out', label: 'Out of Stock' },
  { key: 'new', label: 'New' },
];

const ALERT_OPTIONS: {
  kind: AlertKind;
  label: string;
  icon: keyof typeof FontAwesome.glyphMap;
  color: string;
}[] = [
  {
    kind: 'low',
    label: 'Low Stock',
    icon: 'exclamation-triangle',
    color: '#B45309',
  },
  {
    kind: 'out',
    label: 'Out of Stock',
    icon: 'times-circle',
    color: '#BE123C',
  },
  {
    kind: 'near_expiry',
    label: 'Near Expiry',
    icon: 'clock-o',
    color: '#C2410C',
  },
  { kind: 'overstock', label: 'Overstock', icon: 'arrow-up', color: '#78350F' },
];

const PERFORATION_COUNT = 24;
const PERFORATION_BG = '#F7F6F2';

export function ProductFilterModal({
  visible,
  onClose,
  currentFilters,
  onApplyFilters,
  onOpenAddCategory,
}: ProductFilterModalProps) {
  const [tempFilters, setTempFilters] =
    useState<ProductFiltersState>(currentFilters);
  const { getCategoriesWithCountQuery } = useCategories();
  const overview = useInventoryOverview();

  const categories = getCategoriesWithCountQuery.data ?? [];

  useEffect(() => {
    if (visible) {
      setTempFilters(currentFilters);
    }
  }, [visible, currentFilters]);

  const handleApply = () => {
    onApplyFilters(tempFilters);
    onClose();
  };

  const handleReset = () => {
    const reset: ProductFiltersState = {
      status: 'all',
      alert: undefined,
      category: undefined,
    };
    setTempFilters(reset);
    onApplyFilters(reset);
    onClose();
  };

  const getAlertCount = (kind: AlertKind) => {
    switch (kind) {
      case 'low':
        return overview.counts.low;
      case 'out':
        return overview.counts.out;
      case 'near_expiry':
        return overview.counts.nearExpiry;
      case 'overstock':
        return overview.counts.overstock;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          className="w-full bg-paper-50 rounded-t-3xl overflow-hidden"
          style={{
            shadowColor: '#564E45',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.16,
            shadowRadius: 20,
            elevation: 10,
          }}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 pt-4 pb-4">
            <View className="flex-1">
              <StyledText
                variant="extrabold"
                className="label-caps text-ink-400 mb-0.5"
              >
                Refine inventory list
              </StyledText>
              <StyledText
                variant="black"
                className="text-persimmon-600 text-2xl"
              >
                Filter Products
              </StyledText>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={12}
              className="w-9 h-9 justify-center items-center rounded-full bg-paper-200"
            >
              <FontAwesome name="times" size={16} color="#28231D" />
            </TouchableOpacity>
          </View>

          <ScrollView
            className="max-h-[32rem]"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 12 }}
          >
            {/* Section 1: Stock Status */}
            <View className="px-6 mb-5">
              <View className="flex-row items-center mb-2.5">
                <View className="w-1 h-4 bg-persimmon-500 rounded-full mr-2" />
                <StyledText
                  variant="extrabold"
                  className="label-caps text-ink-700"
                >
                  Stock Status
                </StyledText>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {STATUS_OPTIONS.map((opt) => {
                  const isSelected = tempFilters.status === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      activeOpacity={0.8}
                      onPress={() =>
                        setTempFilters((prev) => ({ ...prev, status: opt.key }))
                      }
                      className={`px-3.5 py-2 rounded-pill border ${
                        isSelected
                          ? 'bg-cinnamon-500 border-cinnamon-500'
                          : 'bg-paper-100 border-ink-200'
                      }`}
                    >
                      <StyledText
                        variant={isSelected ? 'extrabold' : 'medium'}
                        className={`text-xs ${isSelected ? 'text-paper-50' : 'text-ink-700'}`}
                      >
                        {opt.label}
                      </StyledText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View className="mx-6 divider-dotted-thin" />

            {/* Section 2: Inventory Health & Alerts */}
            <View className="px-6 my-5">
              <View className="flex-row items-center mb-2.5">
                <View className="w-1 h-4 bg-amber-500 rounded-full mr-2" />
                <StyledText
                  variant="extrabold"
                  className="label-caps text-ink-700"
                >
                  Inventory Alerts
                </StyledText>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {ALERT_OPTIONS.map((alertOpt) => {
                  const isSelected = tempFilters.alert === alertOpt.kind;
                  const count = getAlertCount(alertOpt.kind);
                  return (
                    <TouchableOpacity
                      key={alertOpt.kind}
                      activeOpacity={0.8}
                      onPress={() =>
                        setTempFilters((prev) => ({
                          ...prev,
                          alert: isSelected ? undefined : alertOpt.kind,
                        }))
                      }
                      className={`px-3 py-2 rounded-pill border flex-row items-center gap-1.5 ${
                        isSelected
                          ? 'bg-ink-900 border-ink-900'
                          : 'bg-paper-100 border-ink-200'
                      }`}
                    >
                      <FontAwesome
                        name={alertOpt.icon}
                        size={12}
                        color={isSelected ? '#FBF7EE' : alertOpt.color}
                      />
                      <StyledText
                        variant={isSelected ? 'extrabold' : 'medium'}
                        className={`text-xs ${isSelected ? 'text-paper-50' : 'text-ink-700'}`}
                      >
                        {alertOpt.label}
                      </StyledText>
                      <View
                        className={`px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-ink-700' : 'bg-paper-200'}`}
                      >
                        <StyledText
                          variant="extrabold"
                          className={`text-[10px] ${isSelected ? 'text-paper-50' : 'text-ink-600'}`}
                        >
                          {count}
                        </StyledText>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View className="mx-6 divider-dotted-thin" />

            {/* Section 3: Categories */}
            <View className="px-6 mt-5">
              <View className="flex-row items-center mb-2.5">
                <View className="w-1 h-4 bg-persimmon-400 rounded-full mr-2" />
                <StyledText
                  variant="extrabold"
                  className="label-caps text-ink-700"
                >
                  Category
                </StyledText>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {/* All Categories */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    setTempFilters((prev) => ({ ...prev, category: undefined }))
                  }
                  className={`px-3.5 py-2 rounded-pill border ${
                    !tempFilters.category
                      ? 'bg-ink-900 border-ink-900'
                      : 'bg-paper-100 border-ink-200'
                  }`}
                >
                  <StyledText
                    variant={!tempFilters.category ? 'extrabold' : 'medium'}
                    className={`text-xs ${!tempFilters.category ? 'text-paper-50' : 'text-ink-700'}`}
                  >
                    All Categories
                  </StyledText>
                </TouchableOpacity>

                {categories.map((cat) => {
                  const isSelected =
                    tempFilters.category?.toLowerCase() ===
                    cat.name.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      activeOpacity={0.8}
                      onPress={() =>
                        setTempFilters((prev) => ({
                          ...prev,
                          category: isSelected ? undefined : cat.name,
                        }))
                      }
                      className={`px-3.5 py-2 rounded-pill border flex-row items-center gap-1.5 ${
                        isSelected
                          ? 'bg-ink-900 border-ink-900'
                          : 'bg-paper-100 border-ink-200'
                      }`}
                    >
                      <StyledText
                        variant={isSelected ? 'extrabold' : 'medium'}
                        className={`text-xs ${isSelected ? 'text-paper-50' : 'text-ink-700'}`}
                      >
                        {cat.name}
                      </StyledText>
                      <View
                        className={`px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-ink-700' : 'bg-paper-200'}`}
                      >
                        <StyledText
                          variant="extrabold"
                          className={`text-[10px] ${isSelected ? 'text-paper-50' : 'text-ink-600'}`}
                        >
                          {cat.product_count}
                        </StyledText>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {/* Add Category Pill */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    onClose();
                    onOpenAddCategory();
                  }}
                  className="px-3.5 py-2 rounded-pill border border-dashed border-persimmon-400 bg-persimmon-50/50 flex-row items-center gap-1.5"
                >
                  <FontAwesome name="plus" size={10} color="#E85A1F" />
                  <StyledText
                    variant="extrabold"
                    className="text-xs text-persimmon-600"
                  >
                    Add Category
                  </StyledText>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Perforation edge */}
          <View className="relative h-0">
            <View
              className="absolute left-0 right-0 h-3 flex-row justify-between"
              style={{ top: -6 }}
            >
              {Array.from({ length: PERFORATION_COUNT }).map((_, i) => (
                <View
                  key={`mp-${i}`}
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: PERFORATION_BG }}
                />
              ))}
            </View>
          </View>
          <View className="h-3" />

          {/* Actions */}
          <View className="flex-row gap-3 px-6 pt-4 pb-6 bg-paper-100 border-t border-dashed border-ink-200">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleReset}
              className="flex-1 bg-paper-50 border border-ink-200 rounded-2xl py-3.5 items-center"
            >
              <StyledText variant="semibold" className="text-ink-700 text-base">
                Reset
              </StyledText>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleApply}
              className="flex-1 bg-persimmon-500 rounded-2xl py-3.5 items-center"
              style={{
                shadowColor: '#E85A1F',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.18,
                shadowRadius: 24,
                elevation: 8,
              }}
            >
              <StyledText
                variant="extrabold"
                className="text-paper-50 text-base"
              >
                Apply Filters
              </StyledText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
```

- [ ] **Step 2: Export `ProductFilterModal` in `components/inventory/products/index.ts`**

Export `ProductFilterModal` and `ProductFiltersState` from `components/inventory/products/index.ts`.

- [ ] **Step 3: Commit ProductFilterModal**

```bash
git add components/inventory/products/ProductFilterModal.tsx components/inventory/products/index.ts
git commit -m "feat(inventory): add ProductFilterModal bottom sheet component"
```

---

### Task 3: Update InventoryHeader and Layout for Filter Modal Integration

**Files:**

- Modify: `components/inventory/InventoryHeader.tsx`
- Modify: `app/(tabs)/inventory/_layout.tsx`

**Interfaces:**

- Consumes: `InventoryHeaderProps`
- Produces: Updated `InventoryHeader` without inline `InventoryAlertPills`, with `onFilterPress` and `activeFilterCount` props.

- [ ] **Step 1: Update `InventoryHeader.tsx`**

Remove `InventoryAlertPills` from `InventoryHeader`. Add `onFilterPress?: () => void` and `activeFilterCount?: number` to `InventoryHeaderProps`.
Pass these to `SearchBar`:

```tsx
export interface InventoryHeaderProps {
  active: InventorySubTab;
  search: string;
  onSearchChange: (s: string) => void;
  onOpenScanner: () => void;
  onTabChange: (t: InventorySubTab) => void;
  onPillPress: (kind: 'low' | 'out' | 'near_expiry' | 'overstock') => void;
  progress?: SharedValue<number>;
  onFilterPress?: () => void;
  activeFilterCount?: number;
}
```

In JSX:

```tsx
<SearchBar
  value={props.search}
  onChange={props.onSearchChange}
  placeholder="Search products..."
  onFilterPress={props.active === 'products' ? props.onFilterPress : undefined}
  activeFilterCount={props.active === 'products' ? props.activeFilterCount : 0}
/>
```

- [ ] **Step 2: Update `_layout.tsx` in `app/(tabs)/inventory/_layout.tsx`**

In `InventoryLayout`:
Accept or derive `filterModalOpen` state or search params, or manage filter params via `useLocalSearchParams`.
Pass `onFilterPress` and `activeFilterCount` to `InventoryHeader`.

- [ ] **Step 3: Commit InventoryHeader and Layout updates**

```bash
git add components/inventory/InventoryHeader.tsx app/\(tabs\)/inventory/_layout.tsx
git commit -m "feat(inventory): update header and layout for filter modal trigger"
```

---

### Task 4: Update Products Screen (`app/(tabs)/inventory/products.tsx`)

**Files:**

- Modify: `app/(tabs)/inventory/products.tsx`

**Interfaces:**

- Consumes: `ProductFilterModal`, search params (`q`, `category`, `supplier`, `filter`, `alert`)
- Produces: Cleaned `ProductsScreen` with unified filtering logic

- [ ] **Step 1: Update state and filter logic in `products.tsx`**

Remove `CategoryFilterBar` and `ProductsFilterChips` JSX elements.
Add state for `filterModalOpen`.
Retrieve `alert` from search params or local state.
Filter products list according to `filter` (status), `category`, `supplier`, and `alert` (e.g. low stock, out of stock, near expiry, overstock).

Render `ProductFilterModal`:

```tsx
<ProductFilterModal
  visible={filterModalOpen}
  onClose={() => setFilterModalOpen(false)}
  currentFilters={{ status: filter, alert, category }}
  onApplyFilters={(newFilters) => {
    setFilter(newFilters.status);
    router.setParams({
      category: newFilters.category ?? '',
      alert: newFilters.alert ?? '',
    });
  }}
  onOpenAddCategory={() => router.push('/(edit-forms)/add-category' as Href)}
/>
```

- [ ] **Step 2: Verify TypeScript and compilation**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit products.tsx updates**

```bash
git add app/\(tabs\)/inventory/products.tsx
git commit -m "feat(inventory): replace inline filter chips/bar with ProductFilterModal in products tab"
```

---

### Task 5: Final Verification & Quality Assurance

- [ ] **Step 1: Run TypeScript compiler check**

Run: `npx tsc --noEmit`
Expected: Clean pass with no errors.

- [ ] **Step 2: Verify Git status and commit log**

Run: `git status`
Expected: Working tree clean.

---

Plan complete and saved to `docs/superpowers/plans/2026-08-12-unified-product-filter-modal.md`. Two execution options:

1. **Subagent-Driven (recommended)** - Dispatch a fresh subagent per task with review checkpoints.
2. **Inline Execution** - Execute tasks in this session using `executing-plans`.

Which approach would you like to take?
