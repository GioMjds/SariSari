# Sales Tab UI Revamp Design Specification

Date: 2026-07-26
Status: Approved
Target Path: `app/(tabs)/sales`

---

## 1. Overview

The Sales tab is being revamped from a single sales history list view into a hybrid navigation POS workspace featuring 4 swipe sub-routes:

1. **POS**: Product selection grid, item search, category filtering, camera barcode scanner launcher, and a sticky floating cart bar.
2. **Cart**: Itemized draft cart list, quantity steppers, discount calculator, order notes, and customer attachment for credit sales.
3. **Checkout**: Payment method selector (Cash, GCash, Utang/Credit), quick cash tender buttons, live change calculator, and sale completion action.
4. **Receipts**: Preserved transaction history list, today's slip statistics hero, date/payment filter modal, and receipt drill-downs.

---

## 2. Architecture & File Structure

```txt
app/(tabs)/sales/
├── _layout.tsx       # Stack layout wrapper for detail screens
├── index.tsx         # Main entry route with horizontal sub-tab pager & segment header
├── pos.tsx           # POS item picker sub-view
├── cart.tsx          # Cart management sub-view
├── checkout.tsx      # Payment processing sub-view
├── receipts.tsx      # Transaction history & stats sub-view
└── [detail].tsx      # Receipt detail & void/refund stack route
```

### Route & Swipe Mechanics

- `index.tsx` hosts a top segmented header bar (`POS` | `Cart` | `Checkout` | `Receipts`) and horizontal pager slider.
- Swiping left/right transitions between sub-tabs fluidly.
- Default view on tab open is `POS` (index 0).
- Sticky floating cart bar appears on `POS` when items exist in the cart.

---

## 3. Sub-View Component Specifications

### 3.1 POS Sub-View (`pos.tsx`)

- **Search & Scanner**: Search input for product name/barcode with clear action, and quick launch button for camera barcode scanner.
- **Category Filter Strip**: Horizontal pill filter list (All, Beverages, Snacks, Groceries, etc.).
- **Product Grid**: Card layout showing product title, unit price (PHP), available stock badge, and `+ Add` button. Badges show active quantity in cart.
- **Floating Cart Bar**: Persistent bottom bar when cart has >= 1 item, displaying total item count, total price, and direct jump buttons for Cart and Checkout.

### 3.2 Cart Sub-View (`cart.tsx`)

- **Customer Link Header**: Action button to search & attach a customer (required for Utang / Credit sales).
- **Itemized Cart List**: List of active items with quantity steppers (`-`, `qty`, `+`), subtotal per item, and swipe-to-remove.
- **Discount & Notes**: Order-level discount selector (percentage or fixed amount) and transaction note input.
- **Summary & Proceed Action**: Clear display of Subtotal, Discount, Grand Total, and "Proceed to Checkout" primary action.

### 3.3 Checkout Sub-View (`checkout.tsx`)

- **Grand Total Hero**: Large, prominent total amount in PHP.
- **Payment Method Switcher**: Segmented selector for `Cash`, `GCash / E-Wallet`, and `Credit / Utang`.
- **Cash Tender & Change**: Quick cash buttons (Exact, ₱100, ₱500, ₱1000) and live change calculator (`Tendered - Total`).
- **Sale Completion**: Saves sale record to database and offline queue, clears cart, auto-swipes to `Receipts`, and presents a success receipt preview modal.

### 3.4 Receipts Sub-View (`receipts.tsx`)

- **Today's Slip Hero**: Displays summary metrics (Today's Total Sales, Items Sold, Unpaid Credits).
- **Filter Strip**: Date range picker, payment method chips, and search input.
- **Paginated History List**: Scrollable sale records with status badges and drill-down tap handlers to `/(tabs)/sales/[detail]`.

---

## 4. State Management (`stores/useSalesTabStore.ts`)

A lightweight Zustand store manages active sales state across all sub-views:

```typescript
export interface CartItem {
  product_id: number;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  stock_available: number;
}

export interface SalesTabState {
  activeTab: number; // 0 = POS, 1 = Cart, 2 = Checkout, 3 = Receipts
  items: CartItem[];
  selectedCustomerId: number | null;
  selectedCustomerName: string | null;
  paymentMethod: 'cash' | 'gcash' | 'credit';
  discountValue: number;
  discountType: 'percentage' | 'fixed';
  amountTendered: number;
  saleNotes: string;

  setActiveTab: (tab: number) => void;
  addItem: (product: any) => void;
  updateQuantity: (productId: number, qty: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  setCustomer: (id: number | null, name: string | null) => void;
  setPaymentMethod: (method: 'cash' | 'gcash' | 'credit') => void;
  setDiscount: (value: number, type: 'percentage' | 'fixed') => void;
  setAmountTendered: (amount: number) => void;
  setSaleNotes: (notes: string) => void;
  resetCheckout: () => void;
}
```

---

## 5. Validation Rules & Edge Cases

1. **Stock Limit**: Prevents adding item quantity higher than available inventory stock.
2. **Credit Sale Validation**: Enforces customer attachment before completing `Credit / Utang` sales.
3. **Cash Tender Validation**: Disables checkout completion until `Amount Tendered` >= `Grand Total` for cash transactions.
4. **Empty Cart Handling**: Cart sub-tab displays an empty state with a direct button back to POS when no items exist.

---

## 6. Testing & Success Criteria

- Swipe and tab segment navigation move smoothly between POS, Cart, Checkout, and Receipts.
- Adding items in POS instantly updates Floating Cart Bar and Cart sub-view.
- Completed sales correctly update local SQLite sales table and refresh the Receipts sub-view list & statistics.
