# Category & Supplier Dedicated Routes Design

## Overview

Replace the inline quick-create modals for Categories and Suppliers with dedicated full-screen edit-form stack routes under `app/(edit-forms)/`. This resolves all React Native `<Modal>` context isolation and `css-interop` Fiber stringification panics, providing a clean, responsive input experience consistent with the rest of the SariSari mobile application.

---

## Architecture & Routing

### 1. New & Updated Routes

- **`app/(edit-forms)/add-category/index.tsx`** (New)
  - Dedicated stack screen for creating a new product category.
  - Features a header with back button, single category name `TextInput`, character validation, and a prominent Save button.
- **`app/(edit-forms)/add-supplier/index.tsx`** (Update)
  - Full-screen route for creating a new supplier.
  - Form fields: Supplier Name (Required), Contact Info (Optional), Notes (Optional).
- **`app/(edit-forms)/_layout.tsx`** (Update)
  - Register `add-category` and `add-supplier` screens in the `(edit-forms)` stack configuration.

### 2. Cleanup of Inline Modals

- Remove `AddCategoryModal` and `AddSupplierModal` from `components/inventory/modals/`.
- Clean up `InventoryModalsHost` in `app/(tabs)/inventory/modals.tsx` to remove `categoryOpen` and `supplierOpen` modal hosts.
- Clean up `app/(tabs)/inventory/_layout.tsx` to remove `categoryOpen` and `supplierOpen` local state.

---

## User Flow & Auto-Selection

```mermaid
graph TD
    A[Inventory Tab / SpeedDial FAB / CategoryFilterBar] -->|Tap + Add Category| B[/(edit-forms)/add-category]
    A -->|Tap + Add Supplier| C[/(edit-forms)/add-supplier]
    B -->|Submit Form| D[SQLite insertCategory]
    C -->|Submit Form| E[SQLite insertSupplier]
    D -->|onSuccess| F[Invalidate React Query & Toast]
    E -->|onSuccess| F
    F -->|router.replace| G[/(tabs)/inventory/products?category=Name or ?supplier=ID]
    G -->|Render| H[Category Filter Bar / Product List Auto-Selected]
```

1. **Triggering Creation**:
   - Tapping **"+ Add Category"** in `CategoryFilterBar` or `InventorySpeedDialFab` executes:
     `router.push('/(edit-forms)/add-category')`
   - Tapping **"+ Add Supplier"** in `InventorySpeedDialFab` executes:
     `router.push('/(edit-forms)/add-supplier')`

2. **Form Submission & Auto-Selection**:
   - **Save Category**:
     ```ts
     insertCategoryMutation.mutate(
       { name: trimmedName },
       {
         onSuccess: () => {
           addToast({ message: 'Category created', variant: 'success' });
           router.replace({
             pathname: '/(tabs)/inventory/products',
             params: { category: trimmedName },
           });
         },
       }
     );
     ```
   - **Save Supplier**:
     ```ts
     insertSupplierMutation.mutate(
       { name, contact, notes },
       {
         onSuccess: (newSupplier) => {
           addToast({ message: 'Supplier created', variant: 'success' });
           router.replace({
             pathname: '/(tabs)/inventory/products',
             params: { supplier: newSupplier.id },
           });
         },
       }
     );
     ```

---

## UI Components & Design System

- **Header Bar**: Top bar with back arrow (`FontAwesome name="arrow-left"`), bold title, and clean background (`bg-paper-50`).
- **Form Inputs**:
  - `TextInput` styled with `bg-paper-100 border border-ink-200 rounded-xl px-4 py-3.5 text-base text-ink-900 font-stack-sans`.
  - Input clear button (`times-circle` icon) when text is non-empty.
- **Save Action**: Full-width or footer CTA button (`bg-persimmon-500` active, `bg-ink-100` disabled) with `Saving…` pending state.
- **Guards**: `ScrollView` with `keyboardShouldPersistTaps="handled"` for seamless soft-keyboard interaction on mobile devices.

---

## Data Validation & Guardrails

1. **Category Name**: Trimmed string, required, non-empty, auto-capitalized.
2. **Supplier Name**: Trimmed string, required, non-empty.
3. **Database Integrity**: All writes go through existing `useCategories()` and `useSuppliers()` hooks.
4. **Cache Invalidation**: On success, invalidates `['categories']`, `['suppliers']`, and catalog queries so all UI components update instantly.

---

## Verification Plan

1. **Unit Tests**:
   - `tests/screens/AddCategoryScreen.test.tsx` verifying screen render, input validation, mutation call, and navigation back with params.
   - `tests/screens/AddSupplierScreen.test.tsx` verifying screen render, optional field handling, and auto-select navigation.
2. **Integration Verification**:
   - Run `npm verify` (`tsc --noEmit` and `npm test`).
