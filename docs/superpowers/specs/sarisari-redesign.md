# SariSari Redesign

If I were redesigning SariSari from scratch as a **mobile-first offline-first sari-sari store companion**, I would optimize for one thing above all:

> The store owner should be able to record a transaction in under 5 seconds with one hand.

Many inventory apps fail because they are designed like accounting software. A sari-sari store owner thinks in terms of:

- "May utang ba si Aling Nena?"
- "Ilan nalang Coke?"
- "Magkano benta ko ngayon?"
- "Ano dapat kong i-restock?"

Not:

- Product master data
- Inventory reconciliation
- Financial reporting

The UI should reflect the owner's mental model.

---

# 1. Onboarding

Most onboarding flows are too long.

I would reduce it to 3 screens maximum.

### Screen 1

Welcome

```
Track Sales
Manage Inventory
Monitor Utang
Works Offline
```

Button:

```
Get Started
```

---

### Screen 2

Store Setup

Fields:

```
Store Name
Owner Name (optional)
Currency (PHP)
```

Button:

```
Continue
```

---

### Screen 3

Initial Inventory

Options:

```
Add Products Now
Skip for Later
Import Sample Data
```

That's it.

No tutorials.

No feature tours.

Users learn by doing.

---

# 2. Navigation Structure

Current:

```
Inventory
Sales
Products
Credits
Reports
```

I would change it to:

```
Dashboard
Sell
Inventory
Utang
Reports
```

Bottom Navigation:

```
🏠 Dashboard
💰 Sell
📦 Inventory
📝 Utang
📈 Reports
```

Notice:

- Products disappears as a top-level route
- Products become part of Inventory

This removes redundancy.

---

# 3. Dashboard

The first screen users see.

Not reports.

Not inventory.

Dashboard.

---

Top Section

```
Today's Sales
₱1,250
```

Large.

Very visible.

---

Middle Cards

```
Items Low in Stock
8
```

```
Outstanding Utang
₱4,350
```

```
Transactions Today
32
```

---

Quick Actions

```
+ New Sale
+ Add Stock
+ Record Payment
```

Large buttons.

Thumb reachable.

---

# 4. Sell Screen

This is the most important screen.

Everything else supports this screen.

---

Layout

Search bar

```
Search products...
```

---

Product Grid

```
[Coke]
[Sprite]
[Piattos]

[Nescafe]
[Bear Brand]
[Chippy]
```

Large cards.

Big touch targets.

---

Cart Drawer

Bottom sheet.

```
2 x Coke
1 x Piattos

Total ₱67
```

---

Checkout

Buttons:

```
Cash
Utang
```

Very simple.

No complicated POS.

---

# 5. Inventory

Inventory should answer:

> What do I have right now?

---

Header

```
Total Products
134
```

```
Low Stock
12
```

---

Tabs

```
All
Low Stock
Out of Stock
Categories
```

---

Product Card

```
Coke 500ml

Stock: 12

Price: ₱25
```

Color indicator:

- Green
- Yellow
- Red

---

Floating Action Button

```
+ Product
```

---

# 6. Product Details

Separate screen.

Not separate tab.

---

Contains:

```
Name
Category
Barcode
Cost Price
Selling Price
Stock Quantity
Low Stock Threshold
```

---

Actions

```
Adjust Stock
Edit Product
Delete Product
```

---

Stock History

```
+10 Purchased
-2 Sold
-1 Damaged
```

Very useful.

---

# 7. Barcode Scanner

I would absolutely add this.

For your SariSari vision it is one of the strongest features.

Flow:

```
Scan Barcode
```

↓

Search local database

↓

If found:

```
Add to Inventory
```

↓

If not found:

```
Create Product
```

Pre-fill:

```
Name
Brand
Category
Image
```

when online.

Offline:

```
Barcode only
```

then complete later.

---

# 8. Utang Screen

Rename Credits → Utang

Because that is what store owners call it.

---

Customer List

```
Aling Nena
₱350
```

```
Mang Jun
₱125
```

---

Detail Screen

Customer profile

```
Total Balance
```

Payment history

```
Borrowed
Paid
Remaining
```

---

Quick Actions

```
Add Utang
Record Payment
```

---

# 9. Reports

Most sari-sari stores don't need 40 charts.

They need answers.

---

Sections

### Sales

```
Today
This Week
This Month
```

---

### Products

```
Top Selling
Slow Moving
```

---

### Utang

```
Outstanding
Overdue
Collected
```

---

### Inventory

```
Inventory Value
Low Stock Items
```

---

# 10. Settings

Often forgotten.

Need:

```
Backup Data
Restore Data
Export CSV
Theme
Language
About
```

---

For offline-first:

```
Export Backup
```

is mandatory.

Users will eventually lose phones.

Without backup, they lose months of sales data.

---

# Feature I Would Add That Most Competitors Miss

### "Suggested Restock"

Based on sales velocity.

Example:

```
Coke
Current Stock: 8

Average Daily Sales: 4

Estimated Days Remaining: 2
```

Then:

```
Restock Soon
```

This is significantly more valuable than another chart.

---

# Feature I Would Not Build Yet

I would postpone:

- Supplier management
- Employee accounts
- Cloud sync
- Multi-store support
- AI forecasting
- Loyalty programs
- Complex accounting

Those are attractive features, but they can easily triple development time.

For an MVP, I would focus on this hierarchy:

1. Sell
2. Inventory
3. Utang
4. Dashboard
5. Reports

If those five are frictionless and reliable offline, the app already solves a real problem for most sari-sari store owners. The biggest competitive advantage is not more features, it is being faster than writing transactions in a notebook.
