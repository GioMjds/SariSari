# Customers Tab UI Revamp Design Specification

Date: 2026-07-26
Status: Approved
Target Path: `app/(tabs)/customers`

---

## 1. Overview

The Customers tab is being revamped into a credit and debt-collection focused workspace featuring 4 horizontal swipe sub-routes:

1. **List**: Customer directory with Action-First Debt Cards, search bar, active debt metrics, and quick payment actions.
2. **Ledger**: Individual balance breakdowns, debit vs credit running timeline, and customer statement views.
3. **Due Today**: High-priority collection queue highlighting overdue balances, due today items, and direct contact launchers.
4. **History**: Payment receipts log, settlement statistics hero, date/customer filter strip, and transaction details.

---

## 2. Architecture & File Structure

```txt
app/(tabs)/customers/
├── _layout.tsx       # Stack layout wrapper for detail screens
├── index.tsx         # Main entry route with horizontal sub-tab pager & segment header
├── list.tsx          # Customer directory sub-view
├── ledger.tsx        # Customer debt/credit ledger sub-view
├── due-today.tsx     # Priority collection queue sub-view
├── history.tsx      # Payment receipts & settlement history sub-view
└── [detail].tsx      # Customer profile & debt timeline stack route
```

### Route & Swipe Mechanics

- `index.tsx` hosts a top segmented header bar (`List` | `Ledger` | `Due Today` | `History`) and horizontal pager slider.
- Swiping left/right transitions between sub-tabs fluidly.
- Default view on tab open is `List` (index 0).
- Tapping a customer card navigates to `/(tabs)/customers/[detail]` stack route.

---

## 3. Sub-View Component Specifications

### 3.1 Customer List Sub-View (`list.tsx`)

- **Search & Hero Metrics**: Search input (name/phone), total active store credit badge (PHP), total debtors count, and overdue alert count.
- **Filter Chips**: Horizontal pill filters (`All`, `Has Balance`, `Overdue`, `Paid`).
- **Action-First Debt Cards**: Card displaying customer name, contact number, overdue warning tag, unpaid balance pill, `[Record Payment]` button, and `[+ Add Utang]` button.

### 3.2 Customer Ledger Sub-View (`ledger.tsx`)

- **Customer Selector**: Dropdown/picker header to switch active customer ledger.
- **Running Summary Hero**: Total Credit Accumulated, Total Paid to Date, and Net Unpaid Balance.
- **Itemized Ledger Stream**: Chronological entry list showing transaction type (`CREDIT` in red vs `PAYMENT` in green), date, reference receipt ID, and running balance progression.

### 3.3 Due Today Collection Sub-View (`due-today.tsx`)

- **Priority Queue**: Overdue accounts sorted first by severity (e.g., `Overdue 5 Days`), followed by debts due today.
- **Quick Action Bar**: One-tap phone/SMS launcher (`Call / SMS`), and direct `[Record Payment]` trigger modal.

### 3.4 Payment History Sub-View (`history.tsx`)

- **Today's Collections Hero**: Summary metrics of cash and GCash payments collected today (PHP) and total payment receipts count.
- **Filter Strip & Log Stream**: Date range filter, search input, and chronological payment receipt list with payment method badges.

### 3.5 Customer Detail Stack Route (`[detail].tsx`)

- **Customer Profile Header**: Contact details, credit limit progress bar (`Used vs Available`), and action buttons (`Call`, `SMS`, `Edit Profile`).
- **Debt & Ledger Tabs**: Tabbed interface switching between unpaid sales tickets, complete transaction timeline, and payment receipts.

---

## 4. State Management (`stores/useCustomersTabStore.ts`)

A lightweight Zustand store manages active tab index, customer selection, filtering, and payment modal states across sub-views:

```typescript
export interface Customer {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  credit_limit: number;
  total_due: number;
  due_date?: string;
  is_overdue: boolean;
  notes?: string;
}

export interface CustomersTabState {
  activeTab: number; // 0 = List, 1 = Ledger, 2 = Due Today, 3 = History
  selectedCustomerId: number | null;
  searchQuery: string;
  statusFilter: 'all' | 'has_balance' | 'overdue' | 'paid';

  // Payment Modal State
  paymentModalOpen: boolean;
  paymentCustomerId: number | null;
  paymentAmount: number;
  paymentMethod: 'cash' | 'gcash';
  paymentNotes: string;

  setActiveTab: (tab: number) => void;
  setSelectedCustomerId: (id: number | null) => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: 'all' | 'has_balance' | 'overdue' | 'paid') => void;
  openPaymentModal: (customerId: number, defaultAmount?: number) => void;
  closePaymentModal: () => void;
  resetPaymentForm: () => void;
}
```

---

## 5. Validation Rules & Edge Cases

1. **Credit Limit Warning**: Displays a warning alert when adding new Utang if customer balance exceeds `credit_limit`.
2. **Payment Amount Guard**: Prevents entering negative payment amounts or payments exceeding total outstanding balance.
3. **Zero Debt Accounts**: Displays green "Settled" badge and disables payment actions.
4. **FIFO Debt Settlement**: Payments automatically settle oldest unpaid tickets first.
5. **Offline Queue Sync**: Payments recorded offline update local SQLite tables and are badged as "Pending Sync".

---

## 6. Testing & Success Criteria

- Swipe and tab segment navigation move smoothly between List, Ledger, Due Today, and History.
- Recording a payment instantly updates store total credit hero stats and refreshes the payment history feed.
- Customer detail page displays itemized debt timeline and contact information cleanly.
