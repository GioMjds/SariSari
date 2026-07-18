# Barcode Scanning & Product Auto-fill Feature Summary

## Goal

Implement an **offline-first barcode scanning feature** for the **SariSari POS** mobile application that automatically fills product information after scanning a product barcode.

---

## Core Principle

A barcode (GTIN/EAN/UPC) **does not contain product information**.

It only contains a globally unique identifier, which must be resolved against a product database.

```text
Barcode
    ↓
Product Lookup
    ↓
Product Information
```

---

## Offline-First Architecture

The local database is the **primary source of truth**.

```text
Barcode Scan
      │
      ▼
 Local SQLite Database
      │
 ┌────┴────┐
 │         │
Found    Not Found
 │         │
 ▼         ▼
Auto-fill  Internet?
             │
      ┌──────┴──────┐
      │             │
     Yes           No
      │             │
      ▼             ▼
External Lookup   Manual Entry
      │
      ▼
Save to SQLite
      │
      ▼
Auto-fill
```

---

## Recommended Product Resolution Pipeline

Instead of relying on a single data provider, resolve products using multiple sources in priority order.

```text
Barcode Scan
      │
      ▼
Memory Cache
      │
      ▼
SQLite Catalog
      │
      ▼
SariSari Cloud Catalog
      │
      ▼
Open Food Facts
      │
      ▼
GS1 Verification
      │
      ▼
Supplier Catalogs
      │
      ▼
Manual Product Creation
```

---

## Product Data Separation

Separate universal product information from store-specific data.

### Product Catalog

Stores information shared across all stores.

```text
barcode
name
brand
category
unit
imageUrl
```

### Store Product

Stores information unique to a store.

```text
sellingPrice
costPrice
stock
supplier
discount
reorderLevel
```

This prevents cloud product information from overwriting store-specific values.

---

## Performance

SQLite is capable of handling very large catalogs efficiently.

- Indexed barcode lookup: **O(log n)**
- Typical lookup time: **<10 ms**
- 100,000 products: approximately **25 to 50 MB**
- SQLite loads only required pages into memory

Create an index:

```sql
CREATE UNIQUE INDEX idx_product_barcode
ON ProductCatalog(barcode);
```

---

## Caching Strategy

Use a simple in-memory cache before querying SQLite.

```text
Scan
 │
 ▼
Memory Cache
 │
 ├── Hit → Return Product
 │
 └── Miss
      │
      ▼
   SQLite
      │
      ▼
Store in Cache
```

Benefits:

- Eliminates repeated database lookups
- Faster repeated scans
- Minimal memory usage

---

## Build & Runtime Considerations

### Build Time

- Product database is bundled as an application asset.
- Does not significantly impact compilation time.

### Runtime

- SQLite reads only matching records.
- Database size has minimal RAM impact.
- Indexed lookups remain extremely fast.

---

## Product Catalog Population

Avoid requiring founders or merchants to scan every product manually.

Recommended approach:

### Seed Catalog

Ship the application with common products.

Examples:

- Lucky Me
- Coca-Cola
- Milo
- Oishi
- Nissin
- Century Tuna
- Alaska

Sources:

- Open Food Facts
- Supplier catalogs
- Public datasets
- GS1 data (where available)
- Imported CSV files

---

## Manual Product Creation

If no product is found:

```text
Unknown Barcode
      │
      ▼
Create Product
      │
      ▼
Save to SQLite
      │
      ▼
Future scans succeed instantly
```

---

## Cloud Synchronization

Only synchronize when internet is available.

```text
SQLite
    │
    ▼
Sync Queue
    │
Internet Available
    │
    ▼
Cloud
```

The POS should never depend on the cloud to complete a sale.

---

## Auto-fill Accuracy

Barcode lookup can accurately populate:

- Product name
- Brand
- Category
- Unit
- Image (optional)

It **cannot** determine:

- Selling price
- Cost price
- Stock quantity
- Supplier
- Shelf location
- Expiration date

These values belong to the individual store.

---

## Real-world Validation

Test barcode:

```text
4807770270017
```

Resolved product:

```text
Brand:
Lucky Me

Product:
Instant Mami Beef

Variant:
55 g
```

This information was consistently identified using:

- Supplier catalog
- Community barcode database
- GS1 prefix verification (480 = GS1 Philippines)

---

## Final Recommendation

For the SariSari POS:

- Adopt an **offline-first** architecture.
- Use **SQLite as the primary product catalog**.
- Separate **universal product metadata** from **store-specific inventory and pricing**.
- Implement a **multi-source product resolution pipeline** with local-first lookup.
- Seed the app with common products instead of starting with an empty catalog.
- Allow manual product creation as the final fallback.
- Cache frequently scanned products in memory.
- Synchronize catalog updates with the cloud when connectivity is available.

This design provides:

- Fast (<10 ms) barcode lookups
- Minimal memory usage
- Excellent offline reliability
- Scalable product catalog growth
- Clean separation of shared and store-specific data
- A smooth cashier experience
