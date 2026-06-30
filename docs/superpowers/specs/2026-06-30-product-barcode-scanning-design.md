# Product Barcode Scanning — Design

**Date:** 2026-06-30
**Status:** Design (approved; pending plan + implementation)
**Owners:** SariSari product / engineering
**Replaces:** Two prior design docs deleted from this folder on 2026-06-27

---

## 1. Context

### Problem

SariSari has three entry points for barcode scanning wired into production code:

1. **Inventory tab header** — barcode icon opens `BarcodeScannerModal`; on accept, routes to Add Product with `?prefillSku=<value>`.
2. **Add Product form** — single-mode scanner under the SKU field; result writes into the `sku` field and (if the bundled offline catalog matches) prefills name + category.
3. **Sales (POS)** — continuous-mode scanner attached to the search bar; resolves via `products.find(p => p.sku === barcode)` against the in-memory cache and adds to cart.

The current code works, but has three structural weaknesses worth fixing:

1. **Identifier conflation.** The scanned value is written directly into the `sku` column, but `sku` is the store's own internal identifier. There is no guarantee a sari-sari store uses `sku = barcode` for every product — many products will have an SKU like `COKE-1.5L` and a separate printed barcode `4800016112345`. Today's code cannot represent both.

2. **O(n) lookup.** POS resolves a scan with `products.find(p => p.sku === barcode)` over the entire in-memory `useProducts` cache. Fine at 200 products; painful at a few thousand.

3. **Vague "not found" UX.** The POS shows only a generic danger toast on miss. There is no first-scan registration offer, no format validation on the manual-entry path, and no inline dedupe messaging when a user enters a barcode that already belongs to another product.

### Outcome

This design rebuilds the barcode subsystem around a real `barcode` column:

- A nullable `barcode` column on `products`, plus a partial unique index (`WHERE barcode IS NOT NULL`). Existing rows continue to load with `barcode IS NULL`.
- An indexed `findProductByBarcode` SQL helper, so lookups stay O(log n) as the catalog grows.
- A precise lookup contract: **a product is identified by its `barcode` if set; otherwise by its `sku`.** The scanner writes only to `barcode`. The lookup helpers first try `barcode`; on miss they fall through to `sku`. Old rows with `barcode IS NULL` continue to resolve via their SKU, so no historical data breaks.
- A scanner UX that offers an in-modal "Not in inventory — add as new product" CTA on POS miss (replacing the today's toast-only failure mode), validates the format at the camera boundary **and** the manual text-input boundary, and shows an inline duplicate-barcode error in the Add Product form (blocking submit) when another product already owns the scanned value.
- Hard-offline-first. No online lookup, no Open Food Facts, no GS1 API calls.

### In scope (v1)

- Migration `v5_barcode_column`.
- New `findProductByBarcode(db, barcode)` SQL helper.
- New `validateBarcode` / `BARCODE_REGEX` in `lib/barcodes/format.ts`.
- New `ScanResolution` discriminated union in `lib/barcodes/types.ts`.
- Renaming the existing pure logic helpers (`applyBarcodeToPosCart` → `resolveBarcodeForCart`, `applyBarcodeToAddProductForm` → `resolveBarcodeForAddProductForm`) with updated signatures.
- New `useFindProductByBarcode` and `useBarcodeResolver` hooks.
- New CTA card on POS miss + manual-entry fallback in `BarcodeScannerModal`.
- Inline duplicate-barcode `FormError` in `AddProductForm`.
- Renaming the deep-link param `?prefillSku=` → `?prefillBarcode=` in `useAddProductForm`.

### Out of scope (v1)

- Online product database lookup (Open Food Facts, GS1).
- GS1/UPC check-digit validation (the format regex is sufficient).
- Multi-barcode-per-product support.
- Barcode printing / label generation.
- Vendor / supplier integration.

---

## 2. Data model

### Migration `v5_barcode_column`

Added to `db/migrations.ts` and run on app start (alongside `ensure*Table` calls in the existing init path):

```sql
ALTER TABLE products ADD COLUMN barcode TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_barcode
  ON products(barcode) WHERE barcode IS NOT NULL;
```

- **Idempotent.** `CREATE UNIQUE INDEX IF NOT EXISTS` is safe to re-run. The `ALTER TABLE ADD COLUMN` is the only non-idempotent statement; the migration runner guards against running v5 twice (see "Migration runner changes" below).
- **Partial unique index.** Two products with `barcode IS NULL` may coexist; two with the same `barcode` may not. This preserves every existing row's behavior (all have `barcode IS NULL`).
- **Fast.** `ALTER TABLE ADD COLUMN` in SQLite modifies schema only; no row rewrite, no index rebuild beyond the new partial index.

### `products` table — final shape

| Column       | Type    | Nullable | Notes                                           |
| ------------ | ------- | -------- | ----------------------------------------------- |
| `id`         | INTEGER | No       | PK, auto-increment                              |
| `name`       | TEXT    | No       | `NOT NULL`                                      |
| `sku`        | TEXT    | No       | `UNIQUE NOT NULL` (legacy uniqueness)           |
| `barcode`    | TEXT    | **Yes**  | **NEW.** Partial unique index:                  |
|              |         |          | `CREATE UNIQUE INDEX idx_products_barcode       |
|              |         |          | ON products(barcode) WHERE barcode IS NOT NULL` |
| `price`      | INTEGER | No       | `NOT NULL`, integer pesos                       |
| `cost_price` | INTEGER | Yes      | Nullable                                        |
| `quantity`   | INTEGER | No       | `DEFAULT 0`; index `idx_products_quantity`      |
| `category`   | TEXT    | Yes      | Joins by name to `categories`                   |
| `created_at` | TEXT    | Yes      | `DEFAULT CURRENT_TIMESTAMP`                     |
| `updated_at` | TEXT    | Yes      | `DEFAULT CURRENT_TIMESTAMP`                     |

### Types — `types/products.ts`

```ts
export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string | null; // NEW (v5)
  price: number;
  cost_price: number | null;
  quantity: number;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export interface InsertProductParams {
  name: string;
  sku: string;
  barcode?: string | null; // NEW (v5)
  price: number;
  quantity?: number;
  cost_price?: number | null;
  category?: string | null;
}

export interface UpdateProductParams extends InsertProductParams {
  id: number;
}
```

### `db/products.ts` — function surface

New function:

```ts
// NEW (v5)
// SELECT * FROM products WHERE barcode = ? LIMIT 1
export async function findProductByBarcode(
  db: SQLiteDatabase,
  barcode: string,
): Promise<Product | null>;
```

Updated function:

```ts
// EXISTING; signature extended (v5)
export async function insertProduct(
  db: SQLiteDatabase,
  input: InsertProductParams, // now accepts optional `barcode`
): Promise<Product>;

// EXISTING; signature extended (v5)
export async function updateProduct(
  db: SQLiteDatabase,
  id: number,
  input: InsertProductParams, // now accepts optional `barcode`
): Promise<void>;
```

`insertProduct` and `updateProduct` keep the same call sites; hooks compose the new `barcode` field transparently. When `barcode` is empty/whitespace, it stores `NULL`. When a non-null barcode collides with an existing row, SQLite raises `SQLITE_CONSTRAINT_UNIQUE`; the wrapper hook translates this to a thrown `BarcodeAlreadyExistsError` carrying the resolved existing `Product`. The pure resolver's `kind: 'duplicate'` return and the thrown `BarcodeAlreadyExistsError` both describe the same situation — the former is a pre-submit check inside the form, the latter is the post-submit safety net. See §4.

### Migration runner changes (`db/migrations.ts`)

Add v5 to the version gate. The runner records the highest applied version in `user_version` (existing pattern) and only runs `v5` if `user_version < 5`. This is the safety net against `ALTER TABLE ADD COLUMN` running twice on the same DB.

The migration code itself runs inside a single `db.withTransactionAsync` so a partial migration cannot leave schema in a weird state.

---

## 3. Scanner architecture

### Existing pieces — untouched

`components/ui/BarcodeScannerModal.tsx` is the single source of truth. It already provides:

- `CameraView` from `expo-camera ~17.0.10`.
- `single` and `continuous` modes, both used in production.
- 1500 ms per-modal duplicate throttle.
- Format set: `upc_a / upc_e / ean8 / ean13 / code39 / code128`.
- Permission gate: loading / requestable / blocked → `Linking.openSettings()`.
- `Haptics.impactAsync` on accept.
- Viewfinder + corner brackets.
- iOS Info.plist permission string configured in `app.json` (`expo-camera` plugin block).

**No structural changes to `BarcodeScannerModal` are required.** This spec wraps a contract around it and _adds_ a manual-entry fallback text input when the camera is unavailable.

### Contracts

**`lib/barcodes/format.ts`** (NEW):

```ts
export const BARCODE_REGEX = /^\d{8,14}$/;

export type BarcodeValidation =
  | { ok: true; barcode: string }
  | { ok: false; reason: string };

export function validateBarcode(input: string): BarcodeValidation {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, reason: 'empty' };
  if (!BARCODE_REGEX.test(trimmed)) return { ok: false, reason: 'format' };
  return { ok: true, barcode: trimmed };
}

export const DEFAULT_BARCODE_THROTTLE_MS = 1500;
```

The regex `^\d{8,14}$` covers GTIN-8, UPC-A (GTIN-12), EAN-13 (GTIN-13), GTIN-14, and 4-digit PLU codes (8–14 covers all standard retail formats).

**`lib/barcodes/types.ts`** (NEW):

```ts
export type ScanResolution =
  | { kind: 'resolved'; product: Product; source: 'barcode' | 'sku' }
  | { kind: 'missing'; barcode: string }
  | { kind: 'invalid'; reason: string };
```

`source: 'barcode' | 'sku'` is logged for telemetry so we can quantify how many legacy rows are still resolving via SKU after the migration.

**Pure logic helpers** (rename existing files; same functions, new signatures):

```ts
// RENAME: was applyBarcodeToPosCart — same body, renamed return type
// NEW return: ScanResolution
export function resolveBarcodeForCart(input: {
  barcode: string;
  products: Product[];
  nowMs?: number;
  throttleMs?: number;
}): ScanResolution;

// RENAME: was applyBarcodeToAddProductForm
// NEW return:
//   { kind: 'apply';    patch: AddProductScanPatch }
//   { kind: 'invalid';  reason: string }
//   { kind: 'duplicate'; existing: Product }
export function resolveBarcodeForAddProductForm(input: {
  barcode: string;
  existingProducts?: Product[]; // used to detect duplicates before submit
}):
  | { kind: 'apply'; patch: AddProductScanPatch }
  | { kind: 'invalid'; reason: string }
  | { kind: 'duplicate'; existing: Product };
```

Both helpers are still pure functions — no React, no `expo-camera` import — and remain unit-testable.

### Hooks

**`hooks/useFindProductByBarcode.ts`** (NEW):

```ts
export function useFindProductByBarcode(barcode: string | null): Product | null;
```

- First checks the existing `useProducts().data` cache for a hit.
- On cache miss, falls back to `findProductByBarcode(db, barcode)` from `db/products.ts`.
- Returns `null` on miss or invalid input.
- Sync within a session; SQL only the first time per barcode per session.

**`hooks/useBarcodeResolver.ts`** (NEW):

```ts
export function useBarcodeResolver(): {
  resolve(barcode: string, nowMs?: number): ScanResolution;
};
```

Composes `validateBarcode`, the per-barcode throttle (`DEFAULT_BARCODE_THROTTLE_MS`), and the lookup. The POS and Add Product routes consume this hook instead of re-implementing the chain.

### Components — entry points

The three existing entry points remain. Their _write target_ changes from `sku` to `barcode`:

| Screen / trigger                         | Modal mode   | New behavior                                                                    |
| ---------------------------------------- | ------------ | ------------------------------------------------------------------------------- |
| `app/(tabs)/inventory/index.tsx`         | `single`     | Routes to `/(edit-forms)/add-product?prefillBarcode=<value>` (was `prefillSku`) |
| `app/(edit-forms)/add-product/index.tsx` | `single`     | Scanner writes to `form.barcode` (was `form.sku`)                               |
| `app/(edit-forms)/add-sales/index.tsx`   | `continuous` | Uses `useBarcodeResolver`; new CTA card on miss                                 |

### Deep-link parameter

The Inventory-tab scan routes to Add Product via `router.push('/(edit-forms)/add-product?prefillBarcode=<value>')`. The `useAddProductForm` hook reads this param through `useLocalSearchParams()` and writes it to `form.barcode` (not `form.sku`). The `prefillAppliedRef` guard already used for `?prefillSku=` is reused verbatim. After consumption, `router.setParams({ prefillBarcode: undefined })` clears the param.

### Manual-entry fallback (NEW)

When `BarcodeScannerModal` detects camera unavailability (e.g., running in Expo Go on web, simulator without camera, user denied permission AND `Linking.openSettings` flow closed), the modal renders a `TextInput` with `accessibilityLabel="Type barcode manually"`. The input:

- Validates against `BARCODE_REGEX` on blur and on submit.
- Routes the value through the same `useBarcodeResolver.resolve()` chain as a camera accept.
- Is the only way to enter a barcode on devices without cameras.

---

## 4. Lookup flow

### Universal sequence

```
[CameraView onBarcodeScanned(raw)]              (single or continuous mode)
            │
            ▼
[BarcodeScannerModal: validateBarcode(raw)]     (lib/barcodes/format.ts)
            │
   ┌────────┴────────┐
   │                 │
 invalid             valid
   │                 │
   ▼                 ▼
toast "Not a      [BarcodeScannerModal throttle
 valid barcode"]    per-barcode, 1500ms]
                       │
                       ▼
              [useBarcodeResolver.resolve(barcode)]
                       │
              ┌────────┴────────┐
              ▼                 ▼
           resolved          missing
              │                 │
              ▼                 ▼
          POS: handleAddItem   [modal banner:
              +1                "Not in inventory.
          AddProduct: write       Add as new product →"]
            patch to form.barcode    │
              + offline catalog    ▼
            lookup (name+category)  router.push(
                                     '/(edit-forms)/add-product
                                      ?prefillBarcode=<value>'
                                    )
```

### POS — `resolved`

- `useAddSalesForm.handleScannedBarcode` receives `ScanResolution { kind: 'resolved', product, source }`.
- `source: 'barcode' | 'sku'` is logged for telemetry. UI is identical in both cases.
- `handleAddItem(product)` increments the cart line. Stock guard (existing): `if (product.quantity <= cartQty) show Alert "Not enough stock"`.
- Modal banner shows `✓ <product.name> · ₱<formatPesos(price)>` for 1.5 s.
- `Haptics.notificationAsync(Success)`.
- Modal stays open (continuous mode).

### POS — `missing`

- Modal banner (NEW) shows a card with the scanned barcode and a primary button "Add as new product."
- Modal stays open until the user taps the CTA or "Done."
- Tapping CTA → `router.push('/(edit-forms)/add-product?prefillBarcode=<value>')`.
- `useAddProductForm` consumes `?prefillBarcode=` and writes to `form.barcode`. Also runs `lookupOfflineBarcode(barcode)` from `constants/barcodes/index.ts` for name + category prefill.
- Tapping "Done" closes the modal. The missing barcode is **not** remembered.

### POS — `invalid`

- Existing modal behavior: a danger toast _"That doesn't look like a barcode. Digits only, 8–14 long."_
- Modal stays open. No state mutation.

### Add Product — first entry (new product, scan → form)

- `handleScannedBarcode(barcode)` from `useAddProductForm.ts`.
- `validateBarcode` — invalid → toast, abort.
- `findProductByBarcode(barcode)` — hit? `BarcodeAlreadyExistsError`-equivalent: surface inline `FormError` with the existing product's name. **Submit is blocked** until barcode changes.
- Miss → write `form.barcode = barcode`. Run `lookupOfflineBarcode(barcode)`:
  - Hit → also set `form.productName` + `form.category`.
  - Miss → only `form.barcode` set; user fills the rest.
- After write, focus the price input (`priceInputRef`) after 250 ms (existing behavior).

### Add Product — duplicate detected after key-in

- A `useEffect` (or `useWatch` on the form field) checks `form.barcode` against `existingProducts`:
  - If `form.barcode` matches another product's `barcode` (or that product's `sku` if no barcode), show an inline `FormError`:
    > "Barcode `<value>` is already used by _<product.name>_." with an "Edit that product" link → `/(edit-forms)/edit-product/<id>`.
  - `isSubmitDisabled` becomes `true` while this state is active.
- This is a _blocking_ state, distinct from the POS `missing` CTA.

### Throttle chain (defense-in-depth)

1. `BarcodeScannerModal`: per-modal per-barcode 1500 ms. (Existing.)
2. `useBarcodeResolver`: per-barcode 1500 ms. (Existing `applyBarcodeToPosCart` logic, kept.)
3. Cart / form handlers: **no** third throttle. The two earlier layers are sufficient.

---

## 5. UX & error handling

### Permission denied

Existing — `Linking.openSettings()` button. No change.

### Camera unavailable on device

`BarcodeScannerModal` shows: _"Camera not available. You can type the barcode instead."_ and renders the manual-entry `TextInput` described in §3. The validation, throttling, and resolve flow are identical to the camera path.

### Format validation

`BARCODE_REGEX = /^\d{8,14}$/` (digits only, 8–14 chars). Failure paths and copy:

| Path                           | Where displayed      | Copy                                                                    |
| ------------------------------ | -------------------- | ----------------------------------------------------------------------- |
| Camera scan, invalid           | Modal toast          | "That doesn't look like a barcode. Digits only, 8–14 long."             |
| Manual-entry, on blur          | Inline `<FormError>` | "Digits only, 8–14 long."                                               |
| Manual-entry, on submit        | Inline `<FormError>` | "Digits only, 8–14 long."                                               |
| Add Product, key-in duplicates | Inline `<FormError>` | "Barcode `<value>` is already used by _<product.name>_." with edit link |

### Multiple barcodes in viewfinder

`expo-camera` returns decoded barcodes in decode order. The modal uses the first and ignores the rest within the throttle window. No UI change.

### Lights / torch

`CameraView` accepts `enableTorch`. A torch toggle is **deferred to v1.1** unless product explicitly requests it for v1.

### Haptics

- `Haptics.notificationAsync(Success)` on POS resolved (existing).
- `Haptics.notificationAsync(Error)` on POS missing (existing).

### Accessibility

- Close button keeps `accessibilityLabel="Close barcode scanner"`.
- Manual-entry input gets `accessibilityLabel="Type barcode manually"`.
- "Add as new product" CTA gets `accessibilityLabel="Add as new product from scanned barcode"`.
- All copy goes through i18n (English + Tagalog already in `locales/`).

### i18n

Existing scanner copy in `locales/en/common.json` and `locales/tl/common.json` is preserved. New strings to add to both locales:

| Key                                    | English                                                       |
| -------------------------------------- | ------------------------------------------------------------- |
| `barcode.invalid`                      | "That doesn't look like a barcode. Digits only, 8–14 long."   |
| `barcode.cta.addAsNewProduct`          | "Add as new product"                                          |
| `barcode.cta.title`                    | "Not in inventory"                                            |
| `barcode.form.duplicateWithEdit`       | "Barcode `{{barcode}}` is already used by _{{productName}}_." |
| `barcode.form.editExistingProduct`     | "Edit that product"                                           |
| `barcode.modal.manualEntryPlaceholder` | "Type barcode manually"                                       |
| `barcode.modal.cameraUnavailable`      | "Camera not available. You can type the barcode instead."     |

---

## 6. Testing & verification

### Pure logic tests (Jest, no expo-camera)

- **`tests/barcodes/format.test.ts`** (NEW).
  - `validateBarcode` accepts: `4800016112345`, `4800016112`, `7622210999999`, `12345678`.
  - `validateBarcode` rejects: empty, `"abcdef12345"` (letters), `"1234567"` (7 digits), `"123456789012345"` (15 digits), `"  12345678  "` returns ok (after trim).
- **`tests/barcodes/resolveBarcodeForCart.test.ts`** (replaces `posScanLogic.test.ts`).
  - Covers `resolved (barcode)`, `resolved (sku fallback)`, `missing`, `invalid`.
  - Per-barcode throttle, custom throttle, identical-scan-within-window dropped.
- **`tests/barcodes/resolveBarcodeForAddProductForm.test.ts`** (replaces `addProductScanLogic.test.ts`).
  - Covers `apply`, `invalid`, `duplicate` (with mock existing product).
  - Asserts the write target is `barcode` (not `sku`).
- **`tests/barcodes/lookup.test.ts`** (UPDATE).
  - Keep catalog size 150–250, no duplicates, every entry matches `^\d{8,14}$`.
  - Add a test that offline-catalog hit still writes name + category to the patch.

### DB tests (Jest + `better-sqlite3`)

- **`tests/db/products.test.ts`** (NEW).
  - `findProductByBarcode` returns the row with the matching barcode.
  - `findProductByBarcode` returns `null` for a SKU-only row (verifies the lookup contract: SKU does not match barcode by default).
  - `getProductBySku` still returns the SKU-only row (the fallback path).
  - Migration v5 idempotency: re-running v5 on an existing DB with rows throws or no-ops — the migration runner guards against this; verify the guard works.
  - Inserting two rows with the same non-null `barcode` raises `BarcodeAlreadyExistsError` carrying the existing `Product`.
  - Inserting two rows with `barcode IS NULL` is allowed.

### Component tests

- **`tests/components/BarcodeScannerModal.test.tsx`** (NEW). Render with `expo-camera` mocked; verify throttle, format validation, success banner copy, manual-entry fallback when `useCameraPermissions().granted === false`.
- **`tests/forms/addProductFormDuplicateBarcode.test.ts`** (NEW). Pre-populate form state with a barcode that already exists on another product; assert `<FormError>` renders and submit is disabled. Then change the barcode → assert `<FormError>` clears.

### Manual verification checklist

Run after implementation on a real device (camera is required for full coverage):

1. `pnpm install && npx expo prebuild --clean && npx expo run:ios` (or Android).
2. Open Add Product, scan a bundled catalog barcode (e.g., `4800016112345`). Name + category auto-fill. Barcode field shows the value. Submit. Verify in SQLite: `SELECT barcode FROM products WHERE id = ?` returns the value.
3. Open POS, scan the same barcode → product lands in cart.
4. POS: scan a barcode NOT in the catalog → "Not in inventory" card with "Add as new product" CTA → routes to Add Product, barcode prefilled.
5. Add Product: enter a barcode that another product already has → inline error blocks submit. Tap "Edit that product" link → opens Edit Product for the existing row.
6. POS: type a 7-character string into the manual fallback input → "Not a valid barcode" toast, nothing added.
7. POS: block camera permission permanently (`Linking.openSettings`) → re-open scanner → manual-entry input is the only path.
8. `pnpm dev:reset` clears DB → migrate → row count zero, `barcode` column exists, idx unique on barcode where not null.
9. Existing seeded DB (with rows that have only `sku`) → migrate → rows load, `barcode IS NULL`, `findProductByBarcode('some-sku')` returns null (correct), `getProductBySku('some-sku')` returns the row.

### Acceptance criteria

- All new + updated unit tests pass: `pnpm test`.
- Type-check passes: `pnpm exec tsc --noEmit`.
- ESLint clean: `npx expo lint`.
- Manual checklist above completes without regressions in existing Add-Product-from-inventory-tab or POS-add-to-cart flows.
- A row with `barcode IS NULL` continues to be found by SKU at the POS (the legacy contract is preserved).
- SQLite carries the `barcode` column and the partial unique index from migration v5 forward; downgrading the app and re-running v5 does not corrupt the schema.

---

## 7. Risks & non-goals

### Risks

- **Forward-only migration.** `ALTER TABLE ADD COLUMN` is not reversible without manual SQL. Acceptable for v1 because we do not need to roll back; users on older code paths still see `barcode = NULL` because the column is nullable and unused.
- **Race on duplicate insert.** Two concurrent inserts of the same barcode could both pass the in-form check, then one fails at the unique index. The handler translates the SQL error to `BarcodeAlreadyExistsError`; the user sees a toast and can re-key. This is rare because the form is single-user, but documented.
- **Plain Unicode lookalikes.** `BARCODE_REGEX` is digits-only, so letter substitutions (e.g., `O` for `0`) are rejected at the boundary. Users with damaged barcodes that read as letters will need to type the digits manually. Acceptable.

### Explicit non-goals

- Online database lookup (Open Food Facts, GS1, etc.).
- UPC/EAN check-digit validation.
- Multiple barcodes per product.
- Barcode printing / label generation.
- Vendor / supplier integration.
- Torch / flashlight toggle (deferred to v1.1).

---

## 8. Files touched (summary)

### New

- `lib/barcodes/format.ts`
- `lib/barcodes/types.ts`
- `hooks/useFindProductByBarcode.ts`
- `hooks/useBarcodeResolver.ts`
- `tests/barcodes/format.test.ts`
- `tests/barcodes/resolveBarcodeForCart.test.ts`
- `tests/barcodes/resolveBarcodeForAddProductForm.test.ts`
- `tests/db/products.test.ts`
- `tests/components/BarcodeScannerModal.test.tsx`
- `tests/forms/addProductFormDuplicateBarcode.test.ts`

### Updated

- `db/products.ts` — add `findProductByBarcode`, extend insert/update signatures.
- `db/migrations.ts` — add `v5_barcode_column`, update version gate.
- `types/products.ts` — `Product.barcode`, `InsertProductParams.barcode`.
- `lib/barcodes/applyToPosCart.ts` → renamed to `resolveBarcodeForCart.ts`, signature change.
- `lib/barcodes/applyToAddProductForm.ts` → renamed to `resolveBarcodeForAddProductForm.ts`, signature change.
- `hooks/useProducts.tsx` — wire new field through query keys and mutations.
- `hooks/useAddProductForm.ts` — write target is `form.barcode`, deep-link param renamed, duplicate check.
- `hooks/useAddSalesForm.ts` — `useBarcodeResolver`, new CTA on miss.
- `app/(tabs)/inventory/index.tsx` — deep-link param renamed.
- `app/(edit-forms)/add-product/index.tsx` — passes `form.barcode` through.
- `app/(edit-forms)/add-sales/index.tsx` — uses new CTA banner.
- `components/inventory/products/add-product/BasicInfoCard.tsx` — new barcode input next to SKU.
- `components/sell/add-sales/ProductSearchCatalog.tsx` — wires modal to resolver.
- `components/ui/BarcodeScannerModal.tsx` — manual-entry input fallback.
- `locales/en/common.json`, `locales/tl/common.json` — new strings.
- `tests/barcodes/lookup.test.ts` — update for new contract.
- Existing test files renamed with their helpers.
