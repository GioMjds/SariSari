# Barcode Product Catalog Design

**Status:** Approved

**Target:** v1.2 experimental

## Goal

Make barcode product resolution reliable without an internet connection by using
SQLite as the durable, local product catalog. A barcode scan must resolve a
store product immediately when one exists, otherwise use universal catalog
metadata to prefill registration. It must never depend on a cloud service to
complete a sale.

## Scope

The v1.2 release will:

- migrate the bundled Filipino barcode records into a persistent SQLite catalog;
- preserve every existing store product and catalog record;
- add only bundled records that are missing from the catalog;
- resolve scans locally, with a database query for a single catalog barcode;
- keep the existing POS path that opens **Add as new product** for catalog-only
  and unknown barcodes;
- prefill barcode, name, category, and retail unit when catalog metadata is
  available;
- learn a minimal catalog record when a merchant manually registers a barcode;
- retain the current seed files as the versioned source of bundled catalog data.

This release will not perform online product lookup, cloud synchronization,
supplier imports, image UI, or add a separate brand field to the Store Product
form.

## Data ownership

`products` remains the store-owned inventory record. Its selling price, cost,
stock level, supplier, and packaging choices are specific to one store and must
never be populated or overwritten from catalog data.

`product_catalog` is the universal local metadata record, keyed by barcode. It
contains:

- `barcode` (primary key);
- `name`;
- optional `brand`;
- optional `category`;
- `unit`, defaulting to `Pc`;
- optional `image_url` for a future visual release;
- `created_at`.

Brand remains catalog-only in v1.2. The product name carries the visible brand
information when appropriate. A catalog record has no foreign key to a store
product: catalog metadata may be known before a store carries an item, and
deleting a store product must not delete local product knowledge.

## Persistence and seeding

The database migration creates `product_catalog` for existing installations.
After migrations, the app seeds bundled catalog data in production as well as
development. The seed uses a transaction and `INSERT OR IGNORE` for each
barcode. It does not skip seeding because the table contains another row, and
it never overwrites a merchant-created or previously seeded record.

The existing JSON files under `constants/barcodes/` remain build-time seed
assets. Runtime resolution no longer falls back to the static JavaScript map.
This makes SQLite the durable source of truth while retaining a simple,
reviewable way to add verified bundled records.

When a merchant saves a previously unknown barcode, the app writes the store
product, initial inventory transaction when applicable, and a minimal catalog
record in one SQLite transaction. The catalog write is non-destructive: it
inserts only when no record exists for that barcode.

## Scan resolution

Barcode resolution is local-only and follows this order:

1. Normalize and validate the scanned value as an 8–14 digit barcode, then
   reject duplicate camera events with the existing throttle.
2. Search loaded store products for retail barcode, wholesale barcode, then
   legacy SKU. A match adds the product to the cart immediately using the
   matched unit.
3. On a store miss, query exactly one `product_catalog` row by barcode through
   the catalog query hook. The primary key provides indexed lookup.
4. A catalog-only match follows the existing **Add as new product** flow. The
   form receives barcode, name, category, and retail unit as defaults; the
   merchant still enters price, cost, stock, supplier, and any other
   store-specific values.
5. A catalog miss follows the same registration flow with only the barcode
   prefilled.

The barcode resolver becomes asynchronous only for the catalog fallback. It
must discard stale or superseded resolution results so rapid scans cannot add
or prefill the wrong item. TanStack Query caches individual catalog lookups in
memory, avoiding a separate mutable in-memory catalog cache and avoiding a
full-catalog read as the seed set grows.

## Layer boundaries

The catalog database module owns row mapping, normalized indexed reads, and
idempotent writes. Catalog hooks own query keys, single-barcode queries, and
root invalidation after mutations. The barcode resolver composes validation,
throttling, store-product precedence, and catalog lookup. POS and product-form
screens consume the resolver and hooks; they do not call SQLite directly.

The product form reuses the same catalog lookup path for a camera scan and the
inventory-tab `prefillBarcode` route parameter. The existing static
`lookupOfflineBarcode` runtime fallback is retired.

## Integrity and failure behaviour

Existing unique constraints for retail and wholesale store-product barcodes
remain authoritative. Attempting to register a barcode already used by a store
product shows the existing conflict state and links to that product rather than
creating a duplicate.

Catalog writes use insert-only semantics, never replacement semantics. A
catalog lookup or seed failure must not prevent store-product scans, a sale, or
manual registration. A lookup failure behaves like a catalog miss and permits
barcode-only registration; seed failures are recorded for diagnosis while the
app continues. Migration failures remain fatal because the database schema
cannot be trusted.

No money or stock value is ever supplied by catalog metadata. All monetary
values remain integer pesos and are entered through the established money
parser. This feature issues no network request.

## Verification

Tests will establish that:

- migration from a pre-catalog database preserves store data and creates the
  catalog table;
- partial catalogs receive only missing bundled seed records, without changing
  existing catalog metadata;
- store products take precedence over catalog records;
- catalog-only and total-miss scans route into the correct prefilled product
  registration states;
- a manually registered new barcode is learned transactionally;
- invalid barcodes, duplicate scans, stale async completions, uniqueness
  conflicts, and catalog lookup failures are safe;
- resolver code makes no network request.

Validation also includes `pnpm test`, lint, and a device or simulator scan of
`4807770270017` (Lucky Me Instant Mami Beef) through both POS and Inventory
registration flows.

## Acceptance criteria

- A fresh production installation can resolve bundled catalog barcodes offline.
- Updating an existing installation keeps all product, inventory, sale, and
  catalog data intact while adding new bundled catalog records.
- A known store product scans directly into POS; a known catalog-only barcode
  opens a correctly prefilled registration form; an unknown barcode opens a
  barcode-only registration form.
- Catalog metadata never alters store price, cost, stock, supplier, or existing
  catalog values.
- The runtime scan path uses SQLite and TanStack Query caching, not the static
  JSON map or the network.
