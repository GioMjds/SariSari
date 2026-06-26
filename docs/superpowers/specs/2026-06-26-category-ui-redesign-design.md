# Design Specification: Category UI/UX Redesign

**Date:** 2026-06-26  
**Status:** Approved  
**Topic:** Redesigning the Category tab and Category Details screen for SariSari.

---

## 1. Overview & Goals

The goal of this redesign is to bring the visual appeal, usability, and safety of the Category management features in line with the rest of the application (such as the renovated Products tab). 

### Key Improvements
1. **Reduce Tap Errors:** Replace small inline Edit/Delete icons on the category cards with a bottom Action Sheet modal.
2. **Standardize Layouts:** Align header elements with the Cinnamon (`#623418`) and Persimmon (`#E85A1F`) color palette.
3. **Add Navigation Safety:** Add explicit back navigation to the Category Details screen.
4. **Fix Currency Code Violation:** Correct the display of product prices in the Category details list from dollars (`$`) to Philippine Pesos (`₱`) via the standard `formatPesos` helper.
5. **Add Live Metrics:** Render the total live inventory value of stock represented by a category.
6. **Integrate Stock Level Warnings:** Highlight items that are out of stock or low on stock directly within the category list.

---

## 2. UI/UX Design Specifications

### Section A: Category List View (`CategoriesTab.tsx` & `CategoryCard.tsx`)

* **List Layout:**
  * Clean, rounded cards (`bg-white rounded-2xl border border-ink-100 shadow-sm`) with a left border accent (`border-l-4 border-persimmon-500`).
  * Circular folder icon container (`w-12 h-12 rounded-full bg-persimmon-50 items-center justify-center`) with a Persimmon folder icon.
  * Tapping on the card routes to the Category Details screen: `/(edit-forms)/category/[id]`.
  * Replace inline Edit/Delete buttons on each card with a single `⋮` (More) options button on the right.
* **Overflow Action Sheet:**
  * Displays a bottom-aligned action sheet (using a standard RN `Modal` containing options) when `⋮` is tapped:
    * **View Products:** Navigates to `/(edit-forms)/category/[id]`.
    * **Edit Category Name:** Opens the existing category rename input modal.
    * **Delete Category:** Triggers the confirmation flow.
    * **Cancel:** Closes the overlay.
  * This action sheet prevents accidental deletes and matches the overflow behavior of the Products tab.

### Section B: Category Details Screen (`app/(edit-forms)/category/[id].tsx`)

* **Header Block:**
  * Deep Cinnamon background (`bg-cinnamon-500`) with safe-area protection.
  * Explicit back navigation button `← Back to Inventory` routing to `/(tabs)/inventory` (passing tab parameter if needed, or simply calling `router.back()`).
  * Big bold heading for the category name (`text-3xl text-paper-50 font-stack-sans-bold`).
  * Subtitle showing product count (e.g., `3 products`).
  * **Total stock value badge:** A badge displaying `Total Value: ₱X,XXX.XX`, computed in the screen using `useMemo`:
    ```typescript
    const totalValue = useMemo(() => {
      return productsInCategory.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    }, [productsInCategory]);
    ```
    This value is formatted via `formatPesos(totalValue)`.
* **Products List:**
  * Uses the white rounded card style with `active:opacity-70`.
  * Displays product name and SKU.
  * **Currency Formatting:** Uses `formatPesos(item.price)` instead of `${item.price?.toFixed(2)}` with the dollar prefix.
  * **Stock Indicators:**
    * **Out of stock:** If `item.quantity === 0`, show a red tag `Out of Stock` (`bg-semantic-danger-50 text-semantic-danger border border-semantic-danger-100 rounded-lg px-2 py-0.5 text-xs`).
    * **Low stock:** If `item.quantity < LOW_STOCK_THRESHOLD` (5) and `item.quantity > 0`, show a yellow tag `Low Stock` (`bg-semantic-warning-50 text-semantic-warning border border-semantic-warning-100 rounded-lg px-2 py-0.5 text-xs`).
    * **Healthy stock:** Display the standard `quantity in stock` text.
  * Tapping a product row navigates to the edit page: `/(edit-forms)/edit-product/[id]`.

---

## 3. Data Flow & State Management

* **No SQLite Database schema changes:** The database structure for categories and products remains exactly as is.
* **Queries:** Uses `getCategoriesWithCountQuery` on the List view and `useGetCategory` / `getAllProductsQuery` on the details screen.
* **Mutations:** Existing delete/update mutations from `useCategories()` are used via the bottom sheet actions.

---

## 4. Verification & Testing

* **Offline-First Check:** Verify that all list renders, screen transitions, action sheets, and computations work seamlessly with Airplane Mode enabled (no network dependence).
* **Currency Verification:** Verify that prices are fetched from SQLite, formatted correctly as Philippine Pesos (e.g., `₱12.50`), and that the total stock value matches the mathematical sum.
* **Accidental Deletions:** Ensure the warning dialog correctly guards the deletion mutation, particularly when a category has active products.
