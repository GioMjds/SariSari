# Barcode Scanning & Offline Product Catalog (v1.2)

## Overview

SariSari resolves product barcodes **entirely offline** using a local SQLite
catalog. No network request is ever issued during a scan. The `product_catalog`
table is the runtime source of truth; the JSON files under
`constants/barcodes/` are build-time seed assets that populate it on every
startup.

---

## Architecture

```text
Barcode Scan
      |
      v
  Validate (8-14 digits) + Throttle duplicate events
      |
      v
  Loaded store products -> retail barcode -> wholesale barcode -> legacy SKU
      |
      +-- Match --> Add to cart (correct unit)
      |
      +-- Miss
            |
            v
        SQLite product_catalog lookup (single indexed row)
            |
            +-- Catalog match --> Open "Add as new product" (prefilled)
            |
            +-- Catalog miss  --> Open "Add as new product" (barcode only)
```

Resolution is **local-only**. There is no cloud lookup, no Open Food Facts
call, no supplier import, and no static JavaScript map fallback at runtime.

---

## Data Model

### `product_catalog` table (migration v11)

```sql
CREATE TABLE IF NOT EXISTS product_catalog (
  barcode    TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  brand      TEXT,
  category   TEXT,
  unit       TEXT NOT NULL DEFAULT 'Pc',
  image_url  TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_catalog_name ON product_catalog(name);
```

The table holds **universal product metadata** keyed by barcode. It has no
foreign key to the `products` table. A catalog record may exist before a
store carries an item, and deleting a store product must not destroy local
product knowledge.

**Fields populated by catalog:**

| Field       | Description                       | v1.2 source     |
|-------------|-----------------------------------|-----------------|
| `barcode`   | GTIN/EAN primary key              | seed / scan     |
| `name`      | Product name (may include brand)  | seed / merchant |
| `brand`     | Optional brand string             | seed            |
| `category`  | Optional category                 | seed            |
| `unit`      | Retail unit; defaults to `Pc`     | seed            |
| `image_url` | Optional URL (UI not yet exposed) | seed            |

**Fields the catalog never populates:** selling price, cost price, stock,
supplier, discount, reorder level. These belong to `products` and are always
entered by the merchant.

### `products` table (unchanged)

The store-owned inventory record. Price, cost, stock, and supplier are
store-specific and are never prefilled or overwritten from catalog metadata.

---

## Seed Assets

`constants/barcodes/` contains four JSON files (`beverages.json`,
`canned-goods.json`, `noodles.json`, `snacks.json`). They are **build-time
bundled** — compiled into the app bundle at `expo export` time. The
`BUNDLED_CATALOG_RECORDS` array re-exports all four for use by the seed
function.

These files are the versioned, human-reviewable source of bundled catalog data.
Adding a new product requires only a new JSON entry; no schema change or
migration bump is needed.

---

## Startup Seeding

After every migration completes, `seedProductCatalog()` runs in **every build
target** (production and development) to ensure the catalog is populated:

```text
App starts
  +-- runMigrations()       <- fatal on error
  +-- seedProductCatalog()
        +-- db.withTransactionAsync
              +-- INSERT OR IGNORE INTO product_catalog ... (one row per bundled record)
```

Key properties of the seed:

- Uses `db.withTransactionAsync` — all inserts are atomic.
- Uses `INSERT OR IGNORE` — existing rows (merchant-created or previously
  seeded) are never overwritten.
- Does **not** skip seeding just because the table contains another row;
  newly added bundled records are inserted on upgrade.
- On failure: logs the error and **continues** — the app starts normally
  without catalog metadata.
- Migration failure remains **fatal** — the schema cannot be trusted.

---

## Resolver Order

Implemented in `lib/barcodes/resolveBarcode.ts` via `createBarcodeResolver`:

1. **Validate** the scanned value as an 8–14 digit barcode string. Return
   `invalid` for empty or non-matching input.
2. **Throttle** duplicate camera events: if the same barcode was accepted
   within `throttleMs` (default 1 500 ms), return `duplicate`.
3. **Store-product search** (synchronous over the loaded product list):
   - Retail barcode column → returns `resolved` with `matchedUnit: 'retail'`
   - Wholesale barcode column → returns `resolved` with `matchedUnit: 'wholesale'`
   - Legacy SKU column → returns `resolved` with `source: 'sku'`
4. **Catalog lookup** (async, TanStack Query `fetchQuery` with
   `staleTime: Infinity`): a single `SELECT ... WHERE barcode = ? LIMIT 1`
   against `product_catalog` using the primary-key index.
   - Hit → returns `catalog_match` with the `CatalogProduct` payload.
   - Miss → returns `missing` with only the barcode.
   - Lookup throws → logs warning; returns `missing` (barcode-only
     registration) unless superseded.
5. **Stale-result guard**: a monotonic sequence number increments before
   the async catalog fetch. If a newer scan has resolved (or the store
   product list became unavailable) by the time the fetch returns, the
   result is discarded as `superseded`.

---

## TanStack Query Caching

`useLookupCatalogProduct` (in `hooks/useCatalog.tsx`) calls
`queryClient.fetchQuery` with `staleTime: Infinity`. This means:

- The first scan of a given barcode issues one SQLite read.
- Subsequent scans of the same barcode within the session return the cached
  result instantly with no additional I/O.
- There is no separate mutable in-memory map to keep in sync.

---

## Prefill Paths

### POS scan → unknown barcode

When `resolve()` returns `catalog_match`, the POS passes
`{ barcode, name, category, unit }` from the `CatalogProduct` into the
"Add as new product" form. When it returns `missing`, only `barcode` is
passed. Price, cost, stock, and supplier remain blank for the merchant.

### Inventory tab → `prefillBarcode` route parameter

The product form reads the `prefillBarcode` route param and calls
`useCatalogProduct(barcode)` to populate the same fields. The two paths
share identical lookup and prefill logic.

---

## Learning a New Barcode

When a merchant saves a product with a barcode that is not already in
`product_catalog`, the product-save mutation calls
`insertCatalogProductIfMissing` **inside the same `db.withTransactionAsync`**
that writes the store product. The catalog insert:

- Uses `INSERT OR IGNORE` — never overwrites an existing catalog record.
- Stores only `barcode`, `name`, `category`, and `unit` (`'Pc'`).
- Never copies price, cost, stock, or supplier into the catalog row.

---

## Failure Behaviour Summary

| Event                          | Behaviour                                      |
|--------------------------------|------------------------------------------------|
| Invalid barcode format         | `invalid` result; scan silently rejected       |
| Duplicate scan within 1.5 s    | `duplicate` result; state unchanged            |
| Store-products list not ready  | `store_products_unavailable`; scan deferred    |
| Catalog lookup throws          | `missing` result; barcode-only registration    |
| Seed `INSERT OR IGNORE` fails  | Error logged; app continues without that record|
| Migration fails                | Fatal — app cannot start safely                |
| Stale async resolution         | `superseded` result; no state change           |

---

## What v1.2 Does Not Include

- No cloud or internet product lookup
- No Open Food Facts / GS1 API calls
- No supplier catalog import
- No image picker or image URL UI in the product form
- No `brand` field on the Store Product form
- No money or stock prefill from catalog metadata
- No schema version bump beyond v11
- No static JavaScript barcode-to-product map at runtime

---

## Reference Barcode

```
4807770270017  ->  Lucky Me Instant Mami Beef, category: Noodles, unit: Pc
```

This record is bundled in `constants/barcodes/noodles.json` and is seeded into
`product_catalog` on first run. In airplane mode, scanning it in POS opens the
"Add as new product" form with name and category prefilled; the merchant enters
price, cost, stock, and supplier before saving.
