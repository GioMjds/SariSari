# Design Spec: Customer Name for Cash Transactions & Component Refactoring

- **Date:** 2026-06-27
- **Author:** Antigravity (Google DeepMind)
- **Status:** Approved

## 1. Overview & Context
SariSari is an offline-first mobile app for sari-sari store owners to track inventory, sales, and utang (credits). 

Currently, customer tracking is closely coupled with credit transactions. When recording a cash sale, there is no way in the POS UI to specify who purchased the items. However, owners often need to record a buyer's name (either a registered "Suki" or a custom text name like "Anak ni Maria") for additional proof and sales history lookup.

At the same time, we need to improve the codebase structure by applying **component-based separation of concerns** to the Sell History screen (`app/(tabs)/sell/index.tsx`) and the Sale Details screen (`app/(edit-forms)/sale-details/[id].tsx`). Currently, these screens contain inline rendering logic, complex animations, and localized formatting that should be isolated into presentational subcomponents.

This spec details both the **hybrid selector** implementation for cash buyer identification and the **modular refactoring** of these screens.

## 2. Requirements & Scope
* **Offline-First:** All features must operate purely offline without any network dependency.
* **Optional for Cash, Mandatory for Credit:** Providing a buyer name for cash sales is optional. For credit sales, selecting a registered Suki remains mandatory.
* **Hybrid Picker:** During checkout, the owner can:
  * Select a registered Suki from their existing customer list.
  * Enter a one-off name directly (without creating a full customer profile).
* **Visibility:**
  * Displays the buyer's name on each transaction row in the main Sales History list.
  * Displays the buyer's name on the Sale Details (receipt) screen.
* **Separation of Concerns:**
  * Screen files (`app/(tabs)/sell/index.tsx` and `app/(edit-forms)/sale-details/[id].tsx`) will serve strictly as orchestrators (fetching data via TanStack Query hooks, managing route params, handling navigation, and triggering platform gestures/alerts).
  * No complex UI markup, inline mapping, or formatting logic will live in the screen files. All visual rendering is delegated to dedicated presentational components in `components/sell/`.

## 3. Architecture & Data Flow

### Database Schema
No SQL migrations are required. The existing `sales` table schema already supports the required fields:
```sql
CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  total INTEGER NOT NULL,
  payment_type TEXT NOT NULL DEFAULT 'cash' CHECK(payment_type IN ('cash', 'credit')),
  customer_name TEXT,
  customer_credit_id INTEGER,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_credit_id) REFERENCES customer_credits(id)
);
```

* For a **registered Suki**: Both `customer_name` and `customer_credit_id` are saved.
* For a **one-off custom buyer**: `customer_name` is saved, and `customer_credit_id` is set to `NULL`.

### State Management (`useAddSalesForm.ts`)
* Modify `selectedCustomer` state variable in the hook to accept types: `Customer | string | null`.
* Modify `handlePaymentTypeChange` so that:
  * Switching to `credit` clears any plain string `selectedCustomer` (forces Suki selection).
  * Switching to `cash` preserves the selected customer (if any).
* Map inputs during submission (`submit` callback):
  * `customer_name`: `typeof selectedCustomer === 'string' ? selectedCustomer : selectedCustomer?.name`
  * `customer_credit_id`: `typeof selectedCustomer === 'string' ? null : selectedCustomer?.id`

## 4. UI / UX Design & Component Structure

### POS Checkout UI
1. **CartSummaryTray (`CartSummaryTray.tsx`):**
   * Render the Suki Selector component for both `cash` and `credit` transactions.
   * Customize label and visual styles:
     * `payment_type === 'credit'`: Render label `Suki (Required)`. If `selectedCustomer` is null, style with semantic warning (orange border/text).
     * `payment_type === 'cash'`: Render label `Buyer / Suki (Optional)`. If `selectedCustomer` is null, style with a neutral ink/gray border and text.

2. **CustomerPickerModal (`CustomerPickerModal.tsx`):**
   * If a search query is entered, display a special action button at the top/bottom of the search list:
     `➕ Use "[Query]" as a one-off name`
   * Clicking this action invokes `onSelect` with the typed string.
   * If the modal is opened for a cash sale, adjust any header helper text to indicate that selecting or typing a name is optional.

---

### Component Separation breakdown

#### A. Sell History Screen (`app/(tabs)/sell/index.tsx`)
This screen orchestrates sales listing, pull-to-refresh, page state, and routing. Its layout will be constructed entirely from these subcomponents:

1. **`SellHeader`** (`components/sell/SellHeader.tsx`):
   * Renders the top cinnamon hero bar.
   * Renders the monogram avatar, title, dynamic sales count subtitle, filter toggle button (with active badge count), and the "plus" new sale CTA.
2. **`TodayStatsHero`** (`components/sell/TodayStatsHero.tsx`):
   * Renders the today's statistics card (nested inside `ReceiptHero`).
   * Displays subtotal, items count, and credit sales counts using localization.
3. **`SaleRow`** (`components/sell/SaleRow.tsx`):
   * Displays the buyer tag for **all** sales with a recorded customer name:
     * If `credit`: Keep current warm orange styling.
     * If `cash`: Style the chip with a neutral grey/ink background so it does not distract from the primary cash status.

#### B. Sale Details Screen (`app/(edit-forms)/sale-details/[id].tsx`)
This screen orchestrates loading/error states, deleting transactions (alert prompts), and navigation back. Its layout will use:

1. **`SaleDetailsHeader`** (`components/sell/sale-details/SaleDetailsHeader.tsx`):
   * Renders the back button, formatted transaction code title (e.g. `Sale · 00123`), and the trash/delete action.
2. **`SaleDetailsHero`** (`components/sell/sale-details/SaleDetailsHero.tsx`):
   * Wraps the main `ReceiptHero`.
   * Shows the transaction stamp (`UTANG` or `CASH`), formatted local date/time, and transaction metadata.
   * Renders the customer card:
     * If `credit`: **"Bill to"** styling with payment terms ("Due on request").
     * If `cash`: **"Sold to"** styling (omitting due dates and payment terms).
3. **`SaleDetailsItemList`** (`components/sell/sale-details/SaleDetailsItemList.tsx`):
   * Displays the itemised list of purchased products (product name, quantity, price, line item subtotal) using receipt-style layout.
4. **`SaleDetailsFooter`** (`components/sell/sale-details/SaleDetailsFooter.tsx`):
   * Renders the footer "thank you" message and the sticky grand-total action bar at the bottom.

## 5. Verification & Testing
1. **Unit/Integration Tests:**
   * Verify that `insertSale` correctly writes `customer_name` and `customer_credit_id` for both cash Suki sales and cash custom name sales.
   * Verify that deleting a cash sale with a custom buyer cleans up correctly without throwing foreign key errors.
2. **Manual POS Verification:**
   * Perform a cash sale with no customer. Verify it saves and displays cleanly.
   * Perform a cash sale with a Suki selected. Verify it shows Suki name in Sales History.
   * Perform a cash sale with a custom typed name. Verify it shows the typed name in Sales History.
   * Perform a credit sale. Verify Suki selection is still required.
3. **Architecture Verification:**
   * Verify that the screen components contain zero nested styles, direct database calls, or inline layout logic.
