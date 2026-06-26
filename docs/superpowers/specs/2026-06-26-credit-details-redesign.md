# Spec: Credit Details (Suki Profile) UI/UX Redesign

**Date:** 2026-06-26  
**Status:** Draft / Approved by User  
**Target Screen:** `app/(edit-forms)/credit-details/[id].tsx`  
**Components Directory:** `components/utang/credit-details/`  

---

## 1. Overview and Objective

The `credit-details` screen (commonly called the **Suki Profile** view) is where store owners track all active loans (utang), payments, and full ledger history for a specific customer. 

The current screen is a single massive file (~610 lines) holding logic for layout, modals, routing, data formatting, and actions. The objective is to redesign this screen to look professional, elegant, and highly informative, implementing **9 key Quality of Life (QoL) features** for store owners, and refactoring it to follow **Separation of Concerns (SoC)** by extracting presentation elements into modular sub-components.

---

## 2. Component-Based Architecture (SoC)

To make the codebase maintainable and testable, the UI will be decomposed into isolated presentation components.

### File Structure
```folder
components/utang/credit-details/
├── CustomerHeroCard.tsx       # Customer metadata, outstanding balance, trust metrics, contact actions
├── TabNavigation.tsx          # Reanimated/Moti-powered tab segment controls
├── TabContentSearch.tsx       # Local input search and filter bar for transactions
├── CreditCard.tsx             # Unpaid/partially paid credit item card with payoff progress bar
├── PaymentCard.tsx            # Payment record receipt card
└── HistoryTimeline.tsx        # Chronological feed showing combined transactions with a running balance
```

### Component Breakdown & Responsibilities

1. **`app/(edit-forms)/credit-details/[id].tsx` (Main Screen Controller)**
   - Acts as the orchestrator.
   - Fetches data using the hooks `useCustomerDetails(id)` and `useCreditHistory(id)` from `hooks/useCredits`.
   - Manages page-level refresh states (`RefreshControl`), page modals (e.g. deletion confirmation, "Mark All as Paid"), and layout shells.
   - Passes data down to child components. No direct layout rendering of list items.

2. **`CustomerHeroCard.tsx`**
   - Renders the suki profile summary: Name, Phone (optional), Address (optional).
   - Displays the **Outstanding Balance** in large bold text with appropriate alert colors.
   - Incorporates the **Debt-to-Limit Warning** progress bar if `credit_limit` is configured.
   - Renders **Suki Trust Score & Stats** (lifetime purchases volume, average payback days, trust tags).
   - Renders **Quick Contact Links** (Call, SMS) and the **Statement Sharing Shortcut** (launches SMS/Viber text share).

3. **`TabNavigation.tsx`**
   - Displays tabs: **Credits**, **Payments**, and **History**.
   - Employs a custom layout with a fluid sliding underbar (using Reanimated 4 / Moti) for premium micro-interactions.

4. **`TabContentSearch.tsx`**
   - Standardized filter input field.
   - Filters transaction lists locally by product name or notes, reducing cognitive load for heavy suki ledgers.

5. **`CreditCard.tsx`**
   - Formats a single `CreditTransaction` row.
   - Shows product name, quantity, transaction date, and notes preview inline.
   - Renders the **Overdue Status Pill** with proximity coloring (Red, Orange/Amber, Gray/Green).
   - Displays the **Payment Allocation Details** progress bar (e.g., `₱400 of ₱850 paid`).
   - Renders the **⚡️ Quick Settle payoff button** for single-item settlement.

6. **`PaymentCard.tsx`**
   - Formats a single `Payment` transaction.
   - Renders payment method icons (cash vs bank transfer) and payment notes preview inline.

7. **`HistoryTimeline.tsx`**
   - Chronological ledger list that combines both credits and payments.
   - Displays a vertical dotted trace (timeline) with visual icon nodes (red `+` for credit, green `check` for payments) and a bold **Running Balance** badge on each item.

---

## 3. Detailed Specifications for 9 QoL Features

### 1. Overdue & Proximity Indicators
- **Logic:** Calculate age of unpaid or partially paid transactions.
- **Visuals:** A colored status pill on the `CreditCard`:
  - **Red Alert (`#ef4444`):** Overdue (due date < current date). Displays `X Days Overdue`.
  - **Amber/Orange Warning (`#f59e0b`):** Proximity Alert (due within 3 days). Displays `Due in X Days`.
  - **Gray/Green Success (`#10b981` or `#6b7280`):** Safe status (due date far in future, or no due date). Displays `Unpaid` or `Partial`.

### 2. Statement Sharing Shortcuts
- **Logic:** Aggregates suki details into a clean text copy template.
- **Copy Template:**
  ```text
  Kumusta! Here is a statement from [Store Name]:

  Suki: [Customer Name]
  Outstanding Balance: ₱[Outstanding Balance]
  Overdue: [Days Overdue / None]

  Recent Unpaid Items:
  [List of active credits in format: - Date: Product (₱Amount - ₱Remaining unpaid)]

  Please settle at your convenience. Maraming salamat!
  ```
- **Actions:** Button triggers `Clipboard.setString()` for quick copy and uses `Share.share()` to trigger native share sheets for Messenger, Viber, or SMS.

### 3. Direct Single-Item Payoff ("⚡️ Quick Settle")
- **Logic:** Tapping "Quick Settle" on a `CreditCard` redirects the user to the `app/(edit-forms)/add-payment/[id].tsx` screen, passing the credit transaction ID and pre-filling the payment amount to the exact outstanding amount of that specific credit transaction.

### 4. Suki Notes Inline Preview
- **Logic:** Display the database `notes` field directly on the cards (`CreditCard` and `PaymentCard`).
- **Visuals:** Render inside a subtle, shaded callout box with a gray border-left, ensuring notes left during counter POS checkout are visible without tap expansion.

### 5. Debt-to-Limit Warning
- **Logic:** Compare `outstanding_balance` to `credit_limit`.
- **Visuals:** Renders a horizontal progress bar in `CustomerHeroCard`:
  - **Safe (Under 80%):** Gray/blue track.
  - **Warning (80%-99%):** Amber track with text "Approaching credit limit".
  - **Over Limit (>= 100%):** Red track with text "⚠️ Exceeded Credit Limit by ₱XX.XX".

### 6. Quick Contact Link (Call/SMS)
- **Logic:** Tapping call or SMS opens native protocol links via React Native's `Linking` library:
  - **Call:** `Linking.openURL('tel:' + phone)`
  - **SMS:** `Linking.openURL('sms:' + phone + '?body=' + prefilledMessage)`

### 7. Payment Allocation Details
- **Logic:** Show progress bar on partially paid credit transactions.
- **Visuals:** `CreditCard` displays a colored bar indicating `(amount_paid / amount) * 100%` width, and explicit text showing `₱[Paid] of ₱[Total] paid`.

### 8. Suki Trust Score & Stats
- **Logic:** Computes indicators based on database records:
  - **Lifetime Volume:** Sum of all credits ever taken.
  - **Payback Speed:** Average days elapsed between credit date and payment allocation payoff date.
  - **Trust Tags:** "Good Payer" (average payback speed < 7 days), "Frequent Suki" (>= 10 transactions), "Needs Follow-up" (overdue debt > 15 days).

### 9. Search & Filter Within Tabs
- **Logic:** Simple local text state filtering on customer transaction lists (credits, payments) by product name or notes, performed on client side for instantaneous responsiveness.

---

## 4. Data Flow & Layering Integration

This refactoring fully complies with the **SariSari layering rule**:

```
Screen (app/) ──reads──▶ Hook (hooks/) ──calls──▶ db fn (db/) ──uses──▶ SQLite
```

- Data is loaded in the main page controller via `useCustomerDetails(id)` query.
- Modals like `deleteCustomer` mutate database records and invalidate query keys:
  - Invalidate `['customer-details', id]`
  - Invalidate `['credit-history', id]`
  - Invalidate `['customers']`
- Presentation sub-components receive read-only primitives and callbacks, ensuring high isolation.

---

## 5. Testing Plan

We will write Jest tests in `tests/components/utang/credit-details/` to assert UI responsiveness and data mapping:
- **`CustomerHeroCard.test.tsx`:** Asserts overdue banner displays, statement text generator matches specifications, and credit limit warning alerts on >100% utilization.
- **`CreditCard.test.tsx`:** Verifies overdue color logic, notes rendering, and payment allocation progress bar sizing.
