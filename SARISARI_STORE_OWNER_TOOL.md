# SariSari: Offline-First Store Owner Tool

The key shift is:

> **SariSari is not a POS with extra features. It is an offline-first operating system for running a sari-sari store, with POS as one core capability.**

## 1. Product Architecture

```text
                         SariSari
                            │
             ┌──────────────┼──────────────┐
             ↓              ↓              ↓
          OPERATE        UNDERSTAND       DECIDE
             │              │              │
             ↓              ↓              ↓
            POS          Analytics       Sari AI
         Inventory       Insights      Recommendations
         Customers        Trends           Actions
         Suppliers        Profit
         Staff            Alerts
             │              │              │
             └──────────────┼──────────────┘
                            ↓
                   OFFLINE-FIRST CORE
                            │
                  Local DB + Sync Engine
                            │
                            ↓
                    Cloud when available
```

---

## 2. Core Concept: "Store State"

SariSari should continuously know the current state of the store:

```text
Store State
├── Cash
│   ├── Sales
│   ├── Cash received
│   └── Estimated profit
│
├── Inventory
│   ├── Current stock
│   ├── Low stock
│   ├── Out of stock
│   └── Fast/dead stock
│
├── Customers
│   ├── Customers
│   ├── Credit balances
│   └── Payments
│
├── Suppliers
│   ├── Purchases
│   ├── Price history
│   └── Orders
│
└── Operations
    ├── Staff activity
    ├── Tasks
    └── Sync status
```

This becomes the foundation for your dashboard, analytics, alerts, and AI.

---

# 3. Features That Make It More Than POS

## Store Health

Instead of just:

> Sales: ₱4,320

Show:

```text
Today's Sales       ₱4,320
Estimated Profit      ₱870
Inventory Value     ₱38,200

Stock Alerts              7
Outstanding Credit        4

Sales vs usual          +12%
```

Then:

> **Your store is performing better than usual today.**

---

## Action Center

Tell the owner what needs attention.

```text
ATTENTION NEEDED

3 products are almost out of stock
2 customers have outstanding credit
1 supplier increased pricing
Sales are below normal
```

Actions:

```text
[Restock]
[Review Credit]
[Check Supplier]
[View Sales]
```

This turns SariSari into a **store task manager**.

---

## Smart Restocking

Don't simply use:

```text
Stock < Minimum → Alert
```

Use:

```text
Current Stock
+ Sales Velocity
+ Historical Demand
+ Supplier Lead Time
+ Safety Stock
        ↓
Recommended Reorder Quantity
```

Example:

> Coca-Cola 1.5L has approximately 1 day of stock remaining. Recommended reorder: 8 bottles.

The question changes from:

> "What inventory do I have?"

to:

> **"What should I buy?"**

---

## Product Intelligence

Each product can have a useful profile:

```text
Coca-Cola 1.5L

Sales velocity       High
Profit margin        Medium
Current stock        4
Days remaining       1.3
Sales trend          ↑
Supplier cost        ↑
```

Then:

> **Fast-selling, but margin is decreasing.**

---

## Cost and Margin Intelligence

Track supplier cost changes.

```text
Previous Cost       ₱9.00
Current Cost       ₱10.00
Selling Price      ₱12.00

Previous Margin     ₱3.00
Current Margin      ₱2.00
```

Then:

> Supplier price increased, reducing your margin by ₱1 per item.

This connects:

```text
Supplier
   ↓
Purchase
   ↓
Cost History
   ↓
Margin
   ↓
Selling Price
   ↓
Business Decision
```

---

## Dead Stock Detection

Identify products that aren't moving.

```text
Product       Stock     Days Inactive
──────────────────────────────────────
Product A       12            42
Product B        7            37
Product C        4            31
```

Possible recommendations:

- Stop restocking
- Discount
- Bundle
- Reposition
- Investigate

---

# 4. Financial Operations

## Profit Intelligence

Give the owner a simple answer:

> **"Did I actually make money?"**

```text
Revenue
- Cost of Goods Sold
= Gross Profit
```

Instead of only showing:

> Gross Margin: 19.2%

Explain:

> "For every ₱100 you sold, approximately ₱19 remained after product cost."

---

## Cash Accountability

Track:

```text
Opening Cash
+ Cash Sales
+ Customer Payments
- Expenses
- Withdrawals
= Expected Cash
```

At closing:

```text
Expected Cash    ₱8,450
Actual Cash      ₱8,320

Difference        -₱130
```

---

## Daily Store Closing

This is a strong candidate for an MVP feature.

```text
DAILY SUMMARY

Sales              ₱4,320
Estimated Profit     ₱870
Transactions            82
Items Sold             164

Low Stock                7
Credit Collected       ₱450
Expenses               ₱200

Expected Cash        ₱8,450
```

Then:

> **Tomorrow: restock Coca-Cola, review Juan's credit, check low-margin products.**

---

# 5. Customer and Supplier Intelligence

## Customer Credit / Utang

If research validates it as a major pain point, make it a first-class workflow.

```text
Juan       ₱350
Maria      ₱180
Pedro       ₱95
────────────────
Total      ₱625
```

Track:

- Credit
- Payments
- Balance
- History
- Aging
- Limits

Everything should work offline.

---

## Supplier Intelligence

A supplier should be more than a contact.

```text
Supplier
├── Products
├── Purchase History
├── Price History
├── Orders
├── Lead Time
└── Reliability
```

Eventually:

> Supplier A is currently cheaper for this product than Supplier B.

---

## Staff Accountability

For owner + staff/family operations:

```text
Ana

Sales:          ₱2,430
Transactions:       47
Voids:               2
Adjustments:         1
```

Use this for visibility and auditing, **not automatic accusations of theft**.

---

# 6. Daily Operating Workflow

Make SariSari understand the store's lifecycle.

### Opening

> "3 things need attention today."

### Operating

> "You're running low on Coca-Cola."

### Closing

> "Today's sales were ₱4,320. Estimated profit was ₱870."

This creates:

```text
OPEN
 ↓
OPERATE
 ↓
MONITOR
 ↓
CLOSE
 ↓
REVIEW
 ↓
PREPARE TOMORROW
```

That is a store operating system, not just POS.

---

# 7. Sari AI

Don't build:

> **"ChatGPT inside SariSari."**

Build:

> **"An interface for querying and acting on store state."**

### Ask

> "Ano kailangan kong bilhin?"

### Sari

> "7 products are low. Based on recent sales, I recommend prioritizing these 4."

### Action

> **[Create Purchase List]**

---

## Eventually, Sari should perform actions

```text
User
 ↓
Sari
 ↓
Intent
 ↓
Domain Tools
 ├── get_sales()
 ├── get_inventory()
 ├── get_low_stock()
 ├── get_credit()
 ├── create_purchase_list()
 └── generate_report()
```

Example:

> "Sari, add 10 Coca-Cola bottles to my purchase list."

Sari executes the application action.

That makes it an **agentic interface**, not a chatbot.

---

# 8. Offline-First Architecture

This should be a fundamental property of the system.

```text
                 SariSari App
                      │
                Local Database
                      │
          ┌───────────┴───────────┐
          ↓                       ↓
    Local Business Logic       Local UI
          │
          ↓
      Sync Queue
          │
    Internet Available?
       /          \
     No            Yes
     │              │
Keep working     Synchronize
                    │
                    ↓
                 Backend
```

The owner shouldn't need to care whether they're online.

---

## Offline Intelligence

### Offline

- Sales calculations
- Inventory calculations
- Low-stock detection
- Reorder calculations
- Profit calculations
- Customer balances
- Alerts
- Local summaries

### Online

- Advanced AI
- Natural-language analysis
- Cloud intelligence
- More complex recommendations

This gives you:

```text
              Sari
               │
       ┌───────┴───────┐
       ↓               ↓
    Offline          Online
 Intelligence      Intelligence
       │               │
    Rules/Stats       LLM
    Calculations      Analysis
```

---

# 9. Offline Sync Is Part of the Product

You should eventually handle:

- Local persistence
- Operation queues
- Retries
- Idempotency
- Conflict resolution
- Versioning
- Deleted records
- Partial synchronization
- Authentication
- Sync status

Example:

```text
Sale created offline
       ↓
Saved locally
       ↓
Added to sync queue
       ↓
Internet unavailable
       ↓
Owner keeps selling
       ↓
Internet returns
       ↓
Sync
       ↓
Server confirms
       ↓
Marked as synced
```

A **Sync Center** can show:

```text
✓ Everything is up to date

or

⟳ 4 changes waiting for connection
```

---

# 10. Store Timeline

Track important business events:

```text
10:42 AM
Sale recorded
Coca-Cola x2
₱80

11:18 AM
Inventory adjusted
Lucky Me -3

12:03 PM
Customer payment
Juan ₱100

2:14 PM
Purchase received
Supplier A ₱2,400
```

This can power:

- Auditing
- Sync
- Analytics
- Staff accountability
- Debugging
- AI context

---

# 11. "What Changed?" Analytics

Instead of making owners inspect graphs:

```text
WHAT CHANGED?

Sales          ↑ 8%
Profit         ↓ 3%
Customers      ↑ 4%
Stockouts      ↑ 2%

Important:

Coca-Cola sales       ↑ 31%
Coffee sales          ↓ 18%
Supplier cost         ↑ 6%
```

This is **decision-oriented analytics**.

---

# 12. "What Should I Do?" Is the End Goal

Your product progression should be:

```text
POS
 ↓
DATA
 ↓
INFORMATION
 ↓
INSIGHT
 ↓
RECOMMENDATION
 ↓
ACTION
```

A traditional POS is heavily focused on the first three.

**SariSari should increasingly own the last three.**

---

# 13. Recommended MVP

Do **not** build everything immediately.

Start with:

### Core

1. **POS**
2. **Inventory**
3. **Customers**
4. **Suppliers**
5. **Store Health**
6. **Action Center**
7. **Daily Opening/Closing**
8. **Offline-first + synchronization**

Then Phase 2:

- Smart Restocking
- Profit Intelligence
- Dead Stock Detection
- Cost Intelligence
- Credit Intelligence
- Store Timeline

Then Phase 3:

- **Sari AI**
- Natural-language queries
- Recommendations
- Application actions
- Advanced intelligence

---

# 14. Your Product Thesis

I would position it as:

> **SariSari is an offline-first store management tool designed around the daily operations of sari-sari store owners, combining POS, inventory, customer, supplier, financial, and business intelligence workflows into a single system.**

The underlying philosophy:

```text
Record less.
Understand more.
Act faster.
```

The critical distinction from Loyverse is **not**:

> "Loyverse can't have this feature."

Almost any mature competitor can eventually copy individual features.

Your differentiation is the **combination**:

> **Philippine sari-sari context + low cognitive load + offline-first operation + store-state model + decision-oriented intelligence + action-oriented AI.**

That is a much stronger foundation for SariSari than positioning it as simply "another POS."
