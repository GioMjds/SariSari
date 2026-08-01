# SariSari Navigation Map and Homepage Wireframe Flow

## 1) Navigation Strategy

Use a **hybrid navigation model**:

- **Bottom tabs** for major intent buckets
- **Swipe navigation** inside each tab only when screens are closely related
- **Stack navigation** for details, forms, receipts, product editing, and customer ledger pages

This keeps the app simple at the top level, while still allowing fast gesture-based movement inside workflows.

---

## 2) Core App Structure

### Bottom Tabs

1. **Home**
2. **Sales**
3. **Inventory**
4. **Customers**
5. **More**

### Purpose of Each Tab

| Tab       | Purpose                  | User mindset                        |
| --------- | ------------------------ | ----------------------------------- |
| Home      | Operational dashboard    | “What is happening now?”            |
| Sales     | Selling and checkout     | “I need to record a sale.”          |
| Inventory | Stock control            | “I need to manage items.”           |
| Customers | Credits and due tracking | “Who owes what?”                    |
| More      | Reports and settings     | “I need utilities and admin tools.” |

---

## 3) Full Navigation Map

## A. Home Tab

### Swipe routes inside Home

- **Overview**
- **Today**
- **Alerts**

### Screens

- Home Overview
- Daily Summary
- Low Stock Alerts
- Sync Status
- Quick Actions
- Recent Activity
- Notification Center

### Drill-down screens

- Sale Detail
- Product Detail
- Customer Detail
- Alert Detail

---

## B. Sales Tab

### Swipe routes inside Sales

- **POS**
- **Cart**
- **Checkout**
- **Receipts**

### Screens

- POS Screen
- Product Picker
- Barcode Scanner
- Cart Screen
- Discount / Promo Screen
- Checkout Screen
- Payment Method Screen
- Receipt Preview
- Receipt History

### Drill-down screens

- Sale Receipt Detail
- Refund / Void Sale
- Reprint Receipt
- Transaction Note

---

## C. Inventory Tab

### Swipe routes inside Inventory

- **Products**
- **Low Stock**
- **Expiry**
- **Stock In**

### Screens

- Product List
- Add Product
- Edit Product
- Category Manager
- Unit / Variant Manager
- Low Stock List
- Expiry Tracker
- Stock In Form
- Stock Adjustment Form
- Supplier Link Screen

### Drill-down screens

- Product Detail
- Stock Movement History
- Inventory Audit Log

---

## D. Customers Tab

### Swipe routes inside Customers

- **Customer List**
- **Ledger**
- **Due Today**
- **Payment History**

### Screens

- Customer List
- Add Customer
- Edit Customer
- Customer Ledger
- Credit Entry Form
- Payment Entry Form
- Due List
- Payment History

### Drill-down screens

- Customer Detail
- Debt Timeline
- Payment Receipt
- Credit Note

---

## E. More Tab

### Swipe routes inside More

- **Reports**
- **Insights**
- **Sync**
- **Settings**

### Screens

- Sales Reports
- Inventory Reports
- Customer Reports
- Profit Summary
- Fast Movers
- Slow Movers
- Sync Manager
- Offline Queue
- Backup and Restore
- Settings
- Account / Store Profile
- Device Settings
- Theme Settings

### Drill-down screens

- Report Detail
- Export Screen
- Backup Detail
- Audit / Logs Screen

---

## 4) Route Tree Concept

```txt
app/
  (auth)/
    login.tsx - for future offline-first SaaS mobile POS 
    setup-store.tsx - onboarding (to be revamped as well)
    select-mode.tsx

  (tabs)/
    _layout.tsx - includes revamped header, bottom tabs, and swipe navigations per tab
    home/ - store overview and quick actions
      _layout.tsx
      overview.tsx
      today.tsx
      alerts.tsx
      [detail].tsx
    sales/
      _layout.tsx
      pos.tsx
      cart.tsx
      checkout.tsx
      receipts.tsx
      [detail].tsx
    inventory/
      _layout.tsx
      products.tsx
      low-stock.tsx
      expiry.tsx
      stock-in.tsx
      [detail].tsx
    customers/
      _layout.tsx
      list.tsx
      ledger.tsx
      due-today.tsx
      history.tsx
      [detail].tsx
    more/
      _layout.tsx
      reports.tsx
      insights.tsx
      sync.tsx
      settings.tsx
      [detail].tsx

  modal/
    scan.tsx
    add-product.tsx
    add-customer.tsx
    add-sale-note.tsx
    confirm-action.tsx
```

---

## 5) Homepage Wireframe Flow

The homepage should behave like a **control center**, not just a landing screen.

## Homepage Goals

The user should immediately understand:

- how sales are doing
- what needs attention
- what action to do next
- whether the app is synced
- whether inventory or credits need intervention

---

## 6) Homepage Wireframe Layout

## Section 1, Header

**Contents**

- Store name
- Date and time
- Sync indicator
- Offline / online badge
- Optional profile or menu button

**Purpose**

- Establish context immediately
- Show whether the system is operational
- Keep the store state visible

---

## Section 2, Status Summary Cards

Show 3 to 4 compact cards:

- Today’s Sales
- Expected Profit or Margin
- Low Stock Count
- Credits Due

Optional extra:

- Unsynced Transactions

**Purpose**

- Give the owner instant operational awareness

---

## Section 3, Primary Actions

A 2-column or 3-column grid of quick actions:

- New Sale
- Scan Item
- Add Stock
- Add Customer
- View Alerts
- Reports

**Purpose**

- Reduce taps for common tasks
- Make the homepage directly usable

---

## Section 4, Today Snapshot

A compact timeline or list:

- Latest sale
- Recent stock update
- Recent customer payment
- Recent low-stock warning

**Purpose**

- Surface the latest operational events

---

## Section 5, Priority Alerts

Display only high-value warnings:

- Low stock items
- Expiring items
- Overdue customer payments
- Unsynced transactions
- Failed sync attempts

Each alert should have:

- label
- severity
- action button

Examples:

- View item
- Open customer
- Sync now
- Resolve

**Purpose**

- Help the owner act quickly

---

## Section 6, Mini Insights

Show small data highlights such as:

- Best-selling item today
- Fast-moving category
- Most overdue customer
- Top low-stock products

**Purpose**

- Convert raw data into actionable insight

---

## Section 7, Recent Activity Feed

Show the latest 5 to 10 activities:

- Sale created
- Stock added
- Customer credit added
- Payment recorded
- Product updated

**Purpose**

- Provide traceability and confidence

---

## 7) Homepage Wireframe in Simple Layout Form

```txt
[ Header ]
Store Name | Date | Sync Status | Menu

[ Summary Cards ]
Sales Today | Profit | Low Stock | Credits Due

[ Quick Actions ]
New Sale | Scan | Add Stock | Add Customer
Alerts | Reports | Sync | More

[ Today Snapshot ]
- Latest sale
- Recent payment
- Recent stock update

[ Priority Alerts ]
- 4 products low stock
- 2 customers due today
- 1 unsynced transaction

[ Mini Insights ]
- Best seller
- Fastest moving item
- Most overdue customer

[ Recent Activity ]
- Sold 2 rice bags
- Added 20 canned goods
- Payment received from Juan
```

---

## 8) Swipe Flow per Tab

## Home Swipe Flow

- Overview
- Today
- Alerts

## Sales Swipe Flow

- POS
- Cart
- Checkout
- Receipts

## Inventory Swipe Flow

- Products
- Low Stock
- Expiry
- Stock In

## Customers Swipe Flow

- List
- Ledger
- Due Today
- History

## More Swipe Flow

- Reports
- Insights
- Sync
- Settings

---

## 9) Screen Behavior Rules

### Use swipe when

- screens belong to the same task family
- users benefit from fast horizontal movement
- the sequence has a natural progression

### Use tap navigation when

- moving to unrelated features
- entering settings
- opening deep detail pages
- performing destructive actions

### Use stack navigation when

- opening product detail
- editing customer info
- viewing receipts
- opening reports
- confirming forms or transactions

---

## 10) Recommended UX Decisions

### Keep the homepage action-first

The home screen should always have at least one direct path to:

- selling
- stock management
- credit management
- scanning
- alert resolution

### Make the app state visible

Always show:

- offline or online state
- sync status
- unresolved alerts
- unsynced queue count

### Keep detail screens out of swipe lanes

Do not put detail pages in swipe navigation.
Keep them inside stack flows to avoid confusion.

### Make sales workflow linear

Sales should follow a clear sequence:

- POS
- Cart
- Checkout
- Receipt

That flow should feel predictable and fast.

---

## 11) Suggested Version 2 Homepage Concept

A stronger SariSari homepage should feel like this:

**Top**

- Store identity
- Sync status
- Date

**Middle**

- KPI cards
- quick actions

**Lower middle**

- alerts
- today snapshot

**Bottom**

- recent activity
- mini insights

This makes the homepage both a dashboard and an action launcher.

---

## 12) Final Recommended App Intent Model

### Bottom tabs

- **Home** for visibility
- **Sales** for transactions
- **Inventory** for stock
- **Customers** for credits
- **More** for reports and settings

### Swipe inside tabs

Use only where the workflow benefits from lateral navigation.

### Stack routes

Use for every detail, form, and review screen.

---

## 13) Practical Build Order

1. Build bottom tab shell
2. Build Home dashboard
3. Build Sales workflow
4. Build Inventory management
5. Build Customers ledger
6. Build More section
7. Add swipe routes inside each relevant tab
8. Add stack detail pages
9. Add sync, offline queue, and alert system
10. Refine visual hierarchy and spacing

---

## 14) Final Recommendation

For SariSari, the strongest architecture is:

- **Bottom tabs as intent groups**
- **Swipe routes as sub-flows**
- **Stack screens for details and forms**
- **Homepage as an operational dashboard**

That gives the app clarity, speed, and scalability.
