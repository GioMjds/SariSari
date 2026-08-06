# Design Specification: Inventory Category & Supplier Revamp

**Date:** 2026-08-06  
**Status:** Approved  
**Target Module:** Inventory (`app/(tabs)/inventory`, `components/inventory`)

---

## 1. Overview & Objectives

The system revamp currently leaves `Category` and `Supplier` database schemas underutilized in the inventory tab, with empty callback placeholders in `InventorySpeedDialFab`.

This design introduces:

1. **Quick Add Modals** for Category and Supplier accessible directly from `InventorySpeedDialFab.tsx` and header quick actions.
2. **Category & Supplier Filter Bar Revamp** inside `app/(tabs)/inventory/products.tsx` allowing fast filtering, pill navigation, and auto-selection of newly created entities.

---

## 2. Architecture & Data Flow

```mermaid
flowchart
    FAB[InventorySpeedDialFab] -->|onAddCategory| Layout[_layout.tsx]
    FAB -->|onAddSupplier| Layout
    Layout -->|props| ModalsHost[InventoryModalsHost]

    ModalsHost --> AddCategoryModal
    ModalsHost --> AddSupplierModal

    AddCategoryModal -->|insertCategoryMutation| DB[(SQLite Database)]
    AddSupplierModal -->|insertSupplierMutation| DB

    AddCategoryModal -->|onSuccess| Router[router.setParams category]
    AddSupplierModal -->|onSuccess| Router[router.setParams supplier]

    Router --> ProductsTab[app/(tabs)/inventory/products.tsx]
    ProductsTab --> FilterBar[CategoryFilterBar & SupplierSelector]
```

### State Management Strategy

- **Modal Visibility:** Hosted centrally in `app/(tabs)/inventory/_layout.tsx` and rendered via `InventoryModalsHost` (`modals.tsx`).
- **Filter State:** Persisted in Expo Router params (`category`, `supplier`, `q`) via `useLocalSearchParams` in `products.tsx`. This enables deep linking and filter persistence when navigating tabs.
- **Auto-Select Behavior:** Upon creation, the modal triggers `router.setParams()` to immediately filter by the newly added item and display a success toast.

---

## 3. Component Details

### 3.1 `AddCategoryModal.tsx` (`components/inventory/modals/AddCategoryModal.tsx`)

- **Props:** `visible: boolean`, `onClose: () => void`, `onSuccess?: (categoryName: string) => void`.
- **Form Fields:**
  - `name`: Category Name (Required, trimmed).
- **Mutations & Hooks:** Uses `useCategories().insertCategoryMutation`.
- **UI:** Bottom-sheet / centered modal backdrop, header icon, input clear button, and Toast feedback via `useToastStore`.

### 3.2 `AddSupplierModal.tsx` (`components/inventory/modals/AddSupplierModal.tsx`)

- **Props:** `visible: boolean`, `onClose: () => void`, `onSuccess?: (supplier: Supplier) => void`.
- **Form Fields:**
  - `name`: Supplier Name (Required, trimmed).
  - `contact`: Contact Details (Optional phone, email, address).
  - `notes`: Notes (Optional schedule, instructions).
- **Mutations & Hooks:** Uses `useSuppliers().insertSupplierMutation`.
- **UI:** Bottom-sheet / centered modal backdrop, inputs for name, contact, notes, and Toast feedback.

### 3.3 `InventoryModalsHost.tsx` (`app/(tabs)/inventory/modals.tsx`)

- Updated props: `categoryOpen: boolean`, `onCloseCategory: () => void`, `supplierOpen: boolean`, `onCloseSupplier: () => void`.
- Renders `AddCategoryModal` and `AddSupplierModal`.
- On `onSuccess`:
  - Category: `router.setParams({ category: name })`.
  - Supplier: `router.setParams({ supplier: supplier.id })`.

### 3.4 `CategoryFilterBar.tsx` (`components/inventory/CategoryFilterBar.tsx`)

- Horizontal scrollable pill list positioned above product list in `products.tsx`.
- **Pills:**
  - **"All"** (Clears `category` param).
  - **Dynamic Category Chips:** List from `useCategories().getCategoriesWithCountQuery`, displaying `Category Name (Count)`.
  - **`+ Add Category` Button:** Triggers `onOpenAddCategory()`.
- Active styling: `bg-ink-900 text-paper-50`. Tapping an active chip toggles back to "All".

### 3.5 Supplier Filter Dropdown in `ProductsTab` Header

- Compact selector button next to search bar: `🏢 Supplier: All` or `🏢 Supplier: [Selected Supplier]`.
- Option in sheet/menu to select supplier or tap `+ Add Supplier`.

---

## 4. Verification & Testing Strategy

1. **Unit & Mutation Verification:**
   - Test category insertion and duplicate name handling in SQLite.
   - Test supplier creation with optional contact and notes.
2. **UI & Navigation Verification:**
   - Open SpeedDial FAB and verify "Add Category" and "Add Supplier" open the respective modals cleanly.
   - Add a new category (e.g. "Frozen Foods") -> verify modal closes, success toast shows, and Products list filters by "Frozen Foods".
   - Select "All" on pill carousel -> verify full list is restored.
