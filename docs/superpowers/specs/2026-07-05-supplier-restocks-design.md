# Design Specification: Supplier Directory & Purchase Costing

**Status:** Draft / Pending User Review  
**Date:** 2026-07-05  
**Author:** Antigravity (AI Pair Programmer)  
**Spec Location:** [2026-07-05-supplier-restocks-design.md](file:///C:/Users/giomj/OneDrive/Desktop/sarisari/docs/superpowers/specs/2026-07-05-supplier-restocks-design.md)

---

## 1. Overview & Goals

SariSari is an offline-first mobile app for Filipino store owners. While the app already tracks selling prices, products, sales, and suki credit (utang), it lacks a structured way to manage the **wholesale buy side**. 

This feature introduces a lightweight **Supplier Directory** and augments the **Inventory Restock workflow** to capture wholesale costs. It solves two major needs:
1. **Supplier Relationship Logging:** Store contact details for distributors/wholesalers (e.g., Coke representatives, local warehouse depots).
2. **Accurate Cost Basis (COGS):** By capturing the actual unit cost during a restock, the app keeps the product's `cost_price` accurate, which directly improves profit margin reports.

---

## 2. Architectural Invariants

- **Hard Offline-First:** No remote server calls. All supplier and transaction records reside locally in the SQLite database.
- **Money is Integer Pesos (Centavos in DB):** Costs entered in the UI as decimal pesos (e.g. `₱18.50`) are parsed and stored in the SQLite database as integer centavos (`1850`).
- **Latest Cost Policy:** When a restock is recorded, the product's default `cost_price` is overwritten with the newest restock unit cost.
- **Supplier Optionality:** Assigning a supplier during restocks is optional to minimize user friction.

---

## 3. Database Schema changes

We will create a new migration (`v6`) in `database/migrations.ts` and the associated SQL script.

### 3.1. New Table: `suppliers`
Tracks supplier business profiles.

```sql
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contact TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
```

### 3.2. Modified Table: `products`
Link each product to a default primary supplier.

```sql
ALTER TABLE products ADD COLUMN supplier_id TEXT REFERENCES suppliers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
```

### 3.3. Modified Table: `inventory_transactions`
Store the unit cost and supplier at the time of restocking for historical audit trails.

```sql
ALTER TABLE inventory_transactions ADD COLUMN unit_cost INTEGER NULL;
ALTER TABLE inventory_transactions ADD COLUMN supplier_id TEXT REFERENCES suppliers(id) ON DELETE SET NULL;
```

---

## 4. Domain Layer & Database Functions

### 4.1. Supplier Domain (`database/suppliers.ts` & `types/suppliers.ts`)
We will create `types/suppliers.ts` defining standard types and export the following functions from `database/suppliers.ts`:

- `listSuppliers(db: SQLiteDatabase): Promise<Supplier[]>`
  Fetches all suppliers ordered alphabetically by name.
- `createSupplier(db: SQLiteDatabase, input: NewSupplier): Promise<Supplier>`
  Inserts a new supplier with a generated UUID.
- `updateSupplier(db: SQLiteDatabase, id: string, patch: Partial<Supplier>): Promise<void>`
  Updates specific fields for a supplier.
- `deleteSupplier(db: SQLiteDatabase, id: string): Promise<void>`
  Deletes a supplier. FK constraints set product and transaction references to null.

### 4.2. Inventory Restock Transaction (`database/inventory.ts`)
We will add `restockProduct` to handle restocks atomically.

```typescript
export interface RestockInput {
  productId: number;
  quantity: number;      // Integer count
  unitCost: number;      // In Pesos (scaled to centavos internally)
  supplierId?: string;   // Optional
  note?: string;         // Optional
}

export async function restockProduct(
  db: SQLiteDatabase,
  input: RestockInput
): Promise<void> {
  return await db.withTransactionAsync(async () => {
    // 1. Log in inventory_transactions
    await db.runAsync(
      `INSERT INTO inventory_transactions 
       (product_id, type, quantity, note, adjustment_sign, unit_cost, supplier_id)
       VALUES (?, 'restock', ?, ?, 'positive', ?, ?)`,
      [
        input.productId,
        input.quantity,
        input.note || null,
        Math.round(input.unitCost * 100), // convert to centavos
        input.supplierId || null
      ]
    );

    // 2. Overwrite default cost_price and add quantity on products table
    await db.runAsync(
      `UPDATE products 
       SET quantity = quantity + ?, cost_price = ?
       WHERE id = ?`,
      [input.quantity, Math.round(input.unitCost * 100), input.productId]
    );
  });
}
```

---

## 5. State Management & Hooks

### 5.1. Supplier Hooks (`hooks/useSuppliers.tsx`)
Wires TanStack Query to manage the suppliers cache.

- `useSuppliers()` queries `listSuppliers`.
- `useCreateSupplier()`, `useUpdateSupplier()`, and `useDeleteSupplier()` handle mutations and invalidate the `'suppliers'` query key.

### 5.2. Restock Hook (`hooks/useInventory.tsx`)
Adds a mutation hook `useRestockProduct` that calls `restockProduct`.
- **Success invalidations:** Invalidate `['products']`, `['inventory-transactions']`, and `['sales-stats']` to ensure profit and cost coverage indicators update immediately across all dashboard widgets.

---

## 6. UI & Flow Specifications

### 6.1. Inventory Tab Additions (`app/(tabs)/inventory/index.tsx`)
- Add `'suppliers'` as a third sub-tab alongside `'products'` and `'categories'`.
- Implement a search bar and list for suppliers. Clicking a supplier opens the details or Edit Supplier form sheet.
- Add a floating action button (FAB) when the Suppliers tab is active to direct to the Add Supplier modal.

### 6.2. Add/Edit Supplier Form (`app/(edit-forms)/supplier/index.tsx`)
- Form inputs: Name (Required), Contact Info (Phone/Address/Socials), Notes.
- Uses `react-hook-form` and validation rules.

### 6.3. Modified Restock Action Modal (`components/inventory/InventoryActionModal.tsx`)
- When restocking, display two new fields:
  1. **Wholesale Unit Cost:** Numerical input, prefilled with the product's current `cost_price`. Converts text inputs using `parsePesosInput` before mutating.
  2. **Supplier Dropdown:** Fetches supplier list. Includes a "+ New Supplier" button to open the supplier creation sheet.

---

## 7. Verification & Test Plan

- **Database Unit Tests:** Create `tests/database/suppliers.test.ts` and `tests/database/restock.test.ts`. 
  - Assert that `restockProduct` adds stock, changes the product's `cost_price` to the new cost in the database (multiplied by 100), and creates an inventory transaction row.
  - Verify supplier creation, editing, and cascading deletions (making product and transaction links NULL).
- **Money Scale Checks:** Test that inputting `₱18.50` results in `1850` in the database, and retrieving it formats back to `₱18.50` using `formatPesos`.
- **Offline Integrity:** Turn off database access mocking in unit tests to ensure no remote API triggers exist.
