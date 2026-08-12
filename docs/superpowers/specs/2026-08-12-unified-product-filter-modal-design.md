# Design Spec: Unified Product Filter Modal in SearchBar

**Date**: 2026-08-12  
**Status**: Approved  

---

## 1. Goal & Requirements

Consolidate the three separate filter components in the Inventory Products view into a single, cohesive **Product Filter Modal** accessible via a filter button integrated into the `SearchBar`:
1. `InventoryAlertPills.tsx` (Alert kinds: Low, Out, Near Expiry, Overstock)
2. `CategoryFilterBar.tsx` (Categories selection + Add Category)
3. `ProductFilterChips.tsx` (Stock status: All, In Stock, Low, Out, New)

This cleans up the header and product list top area while giving users a powerful, centralized interface to filter inventory items.

---

## 2. Component Architecture & UI Changes

### 2.1. `SearchBar` Enhancements (`components/ui/SearchBar.tsx`)
- Add props:
  - `onFilterPress?: () => void`
  - `activeFilterCount?: number`
- Render a `TouchableOpacity` with a `FontAwesome` `sliders` or `filter` icon on the right side of `SearchBar`.
- When `activeFilterCount > 0`, render a small badge with the active filter count over or beside the icon.

### 2.2. New Component: `ProductFilterModal.tsx` (`components/inventory/products/ProductFilterModal.tsx`)
A bottom-sheet modal matching the app's paper theme and perforation styling (`SalesFilterModal`):
- **Filter State Managed**:
  - `status`: `'all' | 'in_stock' | 'low' | 'out' | 'new'`
  - `alert`: `'low' | 'out' | 'near_expiry' | 'overstock' | undefined`
  - `category`: `string | undefined`
- **Sections**:
  1. **Stock Status**: Selection buttons for All, In Stock, Low Stock, Out of Stock, New.
  2. **Inventory & Health Alerts**: Pills showing counts for Low, Out, Near Expiry, Overstock (powered by `useInventoryOverview`).
  3. **Categories**: Interactive chips for all categories (from `useCategories` with counts) + "+ Add Category" button.
- **Actions**:
  - **Reset**: Resets all selections to `'all'` / `undefined`.
  - **Apply Filters**: Invokes `onApplyFilters(newFilters)` callback and closes modal.

### 2.3. Header & Screen Clean-up
- **`InventoryHeader.tsx`**:
  - Remove inline rendering of `InventoryAlertPills`.
  - Pass `onFilterPress` and `activeFilterCount` to `SearchBar`.
- **`app/(tabs)/inventory/products.tsx`**:
  - Remove inline `CategoryFilterBar` and `ProductsFilterChips`.
  - Maintain filter state via route search parameters or screen state, passed down to `ProductFilterModal`.
  - Filter product list using active status, alert, and category filters.

---

## 3. Data Flow & Integration Details

1. User clicks the Filter button in `SearchBar`.
2. `ProductFilterModal` opens, pre-populated with current active filters.
3. User toggles or changes filters inside the modal.
4. User clicks "Apply Filters".
5. The callback updates the URL search params (`category`, `filter`, `alert`) or local React state in `products.tsx`.
6. `products.tsx` re-filters the displayed products list.
7. Active filter count calculation: `(status !== 'all' ? 1 : 0) + (category ? 1 : 0) + (alert ? 1 : 0)`.

---

## 4. Verification & Testing Strategy
- Verify opening/closing of `ProductFilterModal` from search bar icon.
- Verify filtering products by category, status, and alert independently and in combination.
- Verify reset button resets all filters.
- Verify active filter count badge reflects applied filters accurately.
- Verify existing navigation to Add Category from the modal works cleanly.
