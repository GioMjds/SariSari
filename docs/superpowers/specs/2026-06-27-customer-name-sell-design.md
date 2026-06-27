# Design Spec: Customer Name for Cash Transactions

- **Date:** 2026-06-27
- **Author:** Antigravity (Google DeepMind)
- **Status:** Approved

## 1. Overview & Context
SariSari is an offline-first mobile app for sari-sari store owners to track inventory, sales, and utang (credits). 

Currently, customer tracking is closely coupled with credit transactions. When recording a cash sale, there is no way in the POS UI to specify who purchased the items. However, owners often need to record a buyer's name (either a registered "Suki" or a custom text name like "Anak ni Maria") for additional proof and sales history lookup.

This spec introduces a **hybrid selector** during the cash checkout flow that allows the owner to optionally associate a buyer's name with any cash sale.

## 2. Requirements & Scope
* **Offline-First:** All changes must operate purely offline without any network dependency.
* **Optional for Cash, Mandatory for Credit:** Providing a buyer name for cash sales is optional. For credit sales, selecting a registered Suki remains mandatory.
* **Hybrid Picker:** During checkout, the owner can:
  * Select a registered Suki from their existing customer list.
  * Enter a one-off name directly (without creating a full customer profile).
* **Visibility:**
  * Displays the buyer's name on each transaction row in the main Sales History list.
  * Displays the buyer's name on the Sale Details (receipt) screen.

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

## 4. UI / UX Design

### Checkout Form
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

### Sales History (`SaleRow.tsx`)
* Show the user icon and customer name tag for both Cash and Credit sales when `sale.customer_name` exists.
* Differentiate visually:
  * For `credit`: Keep the current styling.
  * For `cash`: Style the chip with a neutral grey/ink background so it does not distract from the primary cash status.

### Sale Details (`sale-details/[id].tsx`)
* If `sale.customer_name` is present:
  * If `credit`: Display under the **"Bill to"** card with payment terms ("Due on request").
  * If `cash`: Display under a **"Sold to"** card (omitting due dates and payment terms).

## 5. Verification & Testing
1. **Unit/Integration Tests:**
   * Verify that `insertSale` correctly writes `customer_name` and `customer_credit_id` for both cash suki sales and cash custom name sales.
   * Verify that deleting a cash sale with a custom buyer cleans up correctly without throwing foreign key errors.
2. **Manual POS Verification:**
   * Perform a cash sale with no customer. Verify it saves and displays cleanly.
   * Perform a cash sale with a Suki selected. Verify it shows Suki name in Sales History.
   * Perform a cash sale with a custom typed name. Verify it shows the typed name in Sales History.
   * Perform a credit sale. Verify Suki selection is still required.
   
