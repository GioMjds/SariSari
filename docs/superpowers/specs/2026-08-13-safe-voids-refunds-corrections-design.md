---
title: Safe Voids, Refunds & Corrections — Design
status: accepted (pending user sign-off on 2026-08-13)
owner: TBD
created: 2026-08-13
source-spec: obsidian-vault/02-Features/07-safe-voids-refunds-corrections.md
---

Brainstorming output from the 2026-08-13 planning session. Decisions capture
settled questions; open questions capture what remains. This document feeds
directly into the implementation plan written by `superpowers:writing-plans`.

## 1. Locked Design Decisions

| #   | Question                                                         | Decision                                                                                                                                                |
| --- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Which screen route hosts the correction actions?                 | **Sales sub-tab + sale detail screen.** Actions live on the sale detail; the corrections report lives at `app/reports/corrections.tsx`.                 |
| 2   | Is the void window hard-coded or per-owner configurable?         | **Configurable, default 24h.** Stored in a new `app_settings` table; surfaced in `app/settings/index.tsx`.                                              |
| 3   | Beyond the owner PIN, do we capture a cashier witness?           | **PIN + cashier witness.** `sale_corrections.witness_user` is a first-class column; the correction flow includes a picker step after PIN.               |
| 4   | How does the price-correction form render for a multi-line sale? | **Per-line editor in one screen.** One `sale_corrections` row (kind='price_correction') with a child `sale_correction_lines` table for per-line deltas. |
| 5   | How does a void/refund reverse cash in `cash_entries`?           | **New `cash_entries.type = 'cash_refund'`** via migration v19. `getCashSessionSummary` subtracts it from expected cash alongside expenses.              |
| 6   | What does the Corrections report show in v1?                     | **List-only, no aggregations.** A read-only audit history surfaced from the Sales sub-tab.                                                              |

## 2. Module Map

Strict unidirectional flow: `app → hooks → database → SQLite`.

| Layer       | File                                        | Change                                                                                                                                                                                                                        | Responsibility                                             |
| ----------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `app/`      | `app/sales/[id]/correction.tsx` (NEW)       | New screen                                                                                                                                                                                                                    | Hosts Void and Refund actions for a single sale.           |
| `app/`      | `app/sales/[id]/price-correction.tsx` (NEW) | New screen                                                                                                                                                                                                                    | Hosts the per-line price editor.                           |
| `app/`      | `app/reports/corrections.tsx` (NEW)         | New screen                                                                                                                                                                                                                    | Read-only audit log.                                       |
| `app/`      | `app/settings/index.tsx` (NEW)              | New screen                                                                                                                                                                                                                    | Owner-only settings; first setting is `void_window_hours`. |
| `app/`      | `app/sales/_layout.tsx` (modified)          | Add stack screens for the three correction routes.                                                                                                                                                                            |                                                            |
| `app/`      | `app/(tabs)/sales.tsx` (modified)           | Add link/button to `app/reports/corrections.tsx`.                                                                                                                                                                             |                                                            |
| `app/`      | `app/(tabs)/_layout.tsx` (modified)         | Add Settings tab if settings becomes a top-level surface; deferred otherwise.                                                                                                                                                 |                                                            |
| `hooks/`    | `hooks/useSales.tsx`                        | Add `useVoidSale`, `useRefundSale`, `useCorrectSalePrice`, `useSaleCorrections(saleId)`.                                                                                                                                      |                                                            |
| `hooks/`    | `hooks/useCorrections.tsx` (NEW)            | Wraps `database/corrections.ts`; exports `useCorrectionsReport(...)`.                                                                                                                                                         |                                                            |
| `hooks/`    | `hooks/useAppSetting.ts` (NEW)              | Wraps `database/settings.ts`; caches via TanStack Query.                                                                                                                                                                      |                                                            |
| `database/` | `database/sales.ts`                         | Add `voidSale`, `refundSale`, `correctSalePrice`; new `SaleLockedError` and `VoidWindowExceededError` classes.                                                                                                                |                                                            |
| `database/` | `database/credits.ts`                       | Existing `status='cancelled'` write path stays; `correctSalePrice` for credit sales writes a sibling reversal credit_transaction.                                                                                             |                                                            |
| `database/` | `database/corrections.ts` (NEW)             | `recordCorrection(...)`, `getCorrectionsForSale(saleId)`, `getCorrectionsReport(...)`. All reads.                                                                                                                             |                                                            |
| `database/` | `database/settings.ts` (NEW)                | `getAppSetting(key)`, `setAppSetting(key, value)`.                                                                                                                                                                            |                                                            |
| `database/` | `database/migrations.ts`                    | Append `user_version = 19` block (see §3).                                                                                                                                                                                    |                                                            |
| `database/` | `database/cash.ts`                          | Update `getCashSessionSummary` to subtract `'cash_refund'` from expected cash (new CASE arm alongside the existing expense/drawing/addition arms). The CHECK constraint widen for `cash_entries.type` lives in migration v19. |                                                            |
| `lib/`      | `lib/pin.ts`                                | Unchanged. The flow re-uses the existing `useOwnerPin` primitive from feature 11.                                                                                                                                             |                                                            |
| `lib/`      | `lib/money.ts`                              | Unchanged. All money is integer pesos.                                                                                                                                                                                        |                                                            |
| `i18n/`     | `locales/en.json`, `locales/fil.json`       | New keys under `corrections.*` and `settings.*` namespaces.                                                                                                                                                                   |                                                            |

### Why three database files

- `database/sales.ts` already owns "sale is source of truth" (see
  `insertSale`, `deleteSale`). Putting `voidSale` / `refundSale` /
  `correctSalePrice` next to them makes the alternative write paths
  visible side-by-side.
- `database/corrections.ts` is the audit log; queries are paginated and
  time-bounded, not transactional.
- `database/settings.ts` is a distinct concern. Feature 13 (expiry
  tracking) is the next consumer — having a dedicated module means the
  expiry threshold slot in without re-shaping `database/products.ts`.

## 3. Schema — Migration v19

All inside one `db.withTransactionAsync` block. Reuses the migration
templates established in v10-v18.

### 3.1 Widen `cash_entries.type` CHECK constraint

```sql
PRAGMA foreign_keys=OFF;
CREATE TABLE cash_entries_new (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('expense', 'owner_drawing', 'owner_addition', 'cash_refund')),
  amount INTEGER NOT NULL,
  notes TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
INSERT INTO cash_entries_new SELECT * FROM cash_entries;
DROP TABLE cash_entries;
ALTER TABLE cash_entries_new RENAME TO cash_entries;
CREATE INDEX IF NOT EXISTS idx_cash_entries_session ON cash_entries(session_id);
CREATE INDEX IF NOT EXISTS idx_cash_entries_timestamp ON cash_entries(timestamp);
PRAGMA foreign_keys=ON;
```

### 3.2 `app_settings` table

```sql
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
```

Seed: `INSERT OR IGNORE INTO app_settings (key, value, updated_at) VALUES ('void_window_hours', '24', strftime('%s','now') * 1000);`

### 3.3 New columns on `sales`

```sql
ALTER TABLE sales ADD COLUMN cancelled_at TEXT;
ALTER TABLE sales ADD COLUMN cancelled_by_kind TEXT CHECK(cancelled_by_kind IN ('void','refund','price_correction') OR cancelled_by_kind IS NULL);
ALTER TABLE sales ADD COLUMN cancelled_by_correction_id INTEGER REFERENCES sale_corrections(id);
```

`cancelled_at` and `cancelled_by_kind` are read by the sale-detail screen
to show "Voided 14 minutes ago by you" beneath the header. `cancelled_by_correction_id`
is the audit back-link.

### 3.4 New columns on `credit_transactions`

```sql
ALTER TABLE credit_transactions ADD COLUMN cancelled_at TEXT;
ALTER TABLE credit_transactions ADD COLUMN cancelled_by_correction_id INTEGER REFERENCES sale_corrections(id);
```

Existing `status` column already supports `'cancelled'`. The two new
columns mirror the `sales` shape so the audit story is symmetric.

### 3.5 `sale_corrections` table

```sql
CREATE TABLE IF NOT EXISTS sale_corrections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL REFERENCES sales(id),
  kind TEXT NOT NULL CHECK(kind IN ('void','refund','price_correction')),
  actor_reason_code TEXT NOT NULL,            -- e.g. 'returned_damaged', 'misprinted_price'
  actor_note TEXT,
  actor_user TEXT NOT NULL,                   -- owner (PIN-gated authorizer)
  witness_user TEXT,                          -- cashier on shift (nullable until feature 16 lands)
  refund_payment_type TEXT CHECK(refund_payment_type IN ('cash') OR refund_payment_type IS NULL),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (kind <> 'refund' OR refund_payment_type IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_sale_corrections_sale_id ON sale_corrections(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_corrections_created_at ON sale_corrections(created_at DESC, id DESC);
```

Note: only `refund` requires a `refund_payment_type`. Void and
price_correction don't take money back beyond what `void` already reverses
through cash.

### 3.6 `sale_correction_lines` table (price corrections only)

```sql
CREATE TABLE IF NOT EXISTS sale_correction_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  correction_id INTEGER NOT NULL REFERENCES sale_corrections(id) ON DELETE CASCADE,
  sale_item_id INTEGER NOT NULL REFERENCES sale_items(id),
  old_price INTEGER NOT NULL,
  new_price INTEGER NOT NULL,
  price_delta INTEGER NOT NULL,              -- new_price - old_price, signed
  CHECK (price_delta <> 0)
);
CREATE INDEX IF NOT EXISTS idx_sale_correction_lines_correction_id ON sale_correction_lines(correction_id);
```

### 3.7 `user_version = 19`

```sql
PRAGMA user_version = 19;
```

## 4. Transaction Shapes

All three write functions (`voidSale`, `refundSale`, `correctSalePrice`)
share a structural pattern. They differ on (a) what they write to the
inventory and cash ledgers, (b) how they handle the credit_transactions
row, and (c) which sale-side columns they touch.

### 4.1 Common preconditions (inside the transaction)

```
1. SELECT sale row (FOR UPDATE-equivalent via the txn).
2. SELECT app_settings.void_window_hours (default 24).
3. If sale.cancelled_at IS NOT NULL:
     throw new SaleAlreadyCancelledError(saleId).
4. If sale.payment_type='cash' AND a closed cash session contains sale.timestamp:
     throw new SaleLockedError(saleId) — same gate as deleteSale.
5. Compute (now - sale.timestamp). If it > void_window_hours:
     throw new VoidWindowExceededError(saleId, hours).
6. For refund: SELECT current open cash session. If none or closed:
     throw new NoOpenCashSessionError() — refunds need an open cash drawer to hand cash back.
```

For `price_correction`, the time-window gate is enforced but `cancelled_at`
is not set on the sale (the sale stays "live" — only the line prices move).

### 4.2 `voidSale` write sequence

```
INSERT INTO sale_corrections (sale_id, kind='void', reason, owner, witness, created_at)
  -> captures correctionId

For each sale_item:
  UPDATE products SET quantity += pieces, updated_at = now WHERE id = product_id
  INSERT INTO inventory_transactions (product_id, type='adjustment', quantity, adjustment_sign='positive', note='void:<correctionId>')

If sale.payment_type = 'cash':
  INSERT INTO cash_entries (id=uuid, session_id=<open session>, type='cash_refund', amount=sale.total, notes='void:<saleId>:<correctionId>')

If sale.payment_type = 'credit':
  UPDATE credit_transactions SET status='cancelled', cancelled_at=now, cancelled_by_correction_id=correctionId WHERE id=sale.credit_transaction_id

UPDATE sales SET cancelled_at=now, cancelled_by_kind='void', cancelled_by_correction_id=correctionId WHERE id=saleId
```

### 4.3 `refundSale` write sequence

Identical to `voidSale` with:

- `kind='refund'`
- `actor_reason_code IN ('returned_damaged', 'returned_other')` (validated in TS, enforced by CHECK constraint not enumerating these codes since they're "open vocab")
- The `inventory_transactions.note` becomes `refund:<correctionId>:<reason>`
- `refund_payment_type='cash'` set on `sale_corrections` (CHECK constraint enforces this for refund kind)

### 4.4 `correctSalePrice` write sequence

```
INSERT INTO sale_corrections (sale_id, kind='price_correction', reason, owner, witness)
  -> captures correctionId

Load all sale_items; build a map of (sale_item_id -> old price).
For each input line in the per-line editor:
  If the new_price is unchanged, skip.
  Else:
    INSERT INTO sale_correction_lines (correction_id, sale_item_id, old_price, new_price, price_delta=new-old)
    UPDATE sale_items SET price = new_price WHERE id = sale_item_id AND sale_id = saleId

Recompute sale.total as SUM(sale_items.price * sale_items.quantity).
If sale.payment_type='cash':
  newTotalDelta = newSaleTotal - originalSaleTotal
  If newTotalDelta < 0 (sale went DOWN — owner gave change back):
    INSERT INTO cash_entries (id=uuid, session_id=<open>, type='cash_refund', amount=-newTotalDelta, notes='price_correction:<saleId>:<correctionId>')
  If newTotalDelta > 0 (sale went UP):
    INSERT INTO cash_entries (id=uuid, session_id=<open>, type='owner_addition', amount=newTotalDelta, notes='price_correction:<saleId>:<correctionId>')
If sale.payment_type='credit':
  newDebtDelta = newTotalDelta
  If negative: UPDATE credit_transactions SET amount = amount + newDebtDelta WHERE id=sale.credit_transaction_id
    (amount decreases; balance re-computed live per project convention)
  If positive and over the customer's block_on_exceed limit:
    Block + show the same override flow used by feature 05 (reuse `OverrideReasonCode` UX).

Do NOT set sale.cancelled_at. The sale stays "live" but with corrected line prices.
```

## 5. Pre-Existing Code Reuse

- `database/sales.ts:469` — `deleteSale` shows the closed-cash-session lock pattern and the inventory restock pattern. The new correction functions borrow the lock gate, switch the inventory write to `type='adjustment'`/`adjustment_sign='positive'`, and never DELETE sale rows.
- `database/cash.ts:36` — `cash_entries.type` CHECK constraint; widened in §3.1.
- `database/inventory.ts:9,32-37` — `inventory_transactions.type='adjustment'` + `adjustment_sign='positive'` for restocks; spec asks for the same shape to keep audit history consistent.
- Feature 11 — `useOwnerPin` primitive (not yet implemented per spec but referenced). When the implementation lands, the correction flow calls into it the same way.
- Feature 05 — the override reason-code UX (`OverrideReasonCode` in `database/sales.ts:10`) is reused when a price correction would push a credit sale over the block_on_exceed limit. No new UI surface for this case.
- `lib/money.ts` — `parsePesosInput` + `formatPesos` for any money fields in the per-line editor. Integer-pesos throughout, per project principle.
- TanStack Query cache keys follow `useCredits.ts` convention so the existing `useSale(saleId)` hook re-fetches the sale after a correction lands.

## 6. UI Surfaces

### 6.1 `app/sales/[id]/correction.tsx`

Three sections rendered top-to-bottom:

1. Sale summary (header bar from the parent screen).
2. Reason code dropdown — values from `corrections.reasonCodes` per kind:
   - void: `customer_changed_mind`, `misprinted_price`, `wrong_item_scanned`, `other`.
   - refund: `returned_damaged`, `returned_other`.
3. Witness cashier picker — calls into a (future) `useCashiersOnShift(...)` hook; for v1 the picker accepts a free-text name and persists into `sale_corrections.witness_user`.

Bottom action bar: **Cancel** (left) and **Confirm & PIN** (right). The
button is disabled until reason + witness are filled. Tapping the right
button:

1. Opens the existing PIN prompt (feature 11).
2. On success, runs the appropriate `voidSale` / `refundSale` call.
3. On success, invalidates the `useSale` query and the corrections report query, then pops back to the sale detail.

### 6.2 `app/sales/[id]/price-correction.tsx`

Per-line editor — one row per `sale_item`:

```
[product name      ] old ₱20  -> new [ ₱18 ]   delta ₱-2
[bundle of 3 sachets] old ₱55  -> new [ ₱55 ]  delta ₱0  (no-op, dimmed)
```

Live recompute at the bottom:

```
Subtotal: ₱183 (-₱2)
Reason:   [misprinted_price  v]
Witness:  [ Maria (cashier)  v ]
              [Cancel]  [Confirm & PIN]
```

Constraint: any non-no-op new price requires owner-PIN; the button stays
disabled until every edited line is `parsePesosInput`-valid.

### 6.3 `app/reports/corrections.tsx`

Read-only audit log. FlatList of `SaleCorrectionWithSale` rows. Each row
renders:

```
[icon] Void | Sale #1234 · ₱180 · 14 min ago
       by Aling Maria (you), witness: Pedro
       reason: customer_changed_mind
                                  [view sale →]
```

Tap-row opens the source sale (read-only — the sale detail screen
recognizes `cancelled_at IS NOT NULL` and shows a banner with the
correction metadata).

No date-range filter, no totals row in v1.

### 6.4 `app/settings/index.tsx`

Single screen for v1. Reads `void_window_hours` from `useAppSetting`. UI:

```
How many hours after a sale can it still be voided?
(24)
[Save]
```

Persisted via `setAppSetting`. Other settings slot in below as new features land.

## 7. Error Handling

| Error                                                                               | When                                                                  | UI behavior                                                                                        |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `VoidWindowExceededError`                                                           | (now - sale.timestamp) > `void_window_hours`                          | Sale detail shows "Void/refund window has passed (settings: 24h)" instead of the action button.    |
| `SaleAlreadyCancelledError`                                                         | `sale.cancelled_at IS NOT NULL`                                       | Sale detail shows a Voided/Refunded banner; the action buttons are hidden.                         |
| `SaleLockedError`                                                                   | The sale's cash session is closed                                     | Action button disabled with explanatory tooltip "Cash session is closed; contact your bookkeeper." |
| `NoOpenCashSessionError`                                                            | A refund is requested with no open session                            | Action button disabled with explanation "Open today's cash session before issuing a refund."       |
| PinRejection (feature 11)                                                           | Wrong PIN entered                                                     | Inline error on the PIN sheet; user can retry without losing the form state.                       |
| InsufficientStockError (only possible during a price correction that returns stock) | n/a here — corrections never _add_ a reason to deduct stock           | n/a                                                                                                |
| Foreign-key violation                                                               | Cancelled credit transaction has payment_allocations pointing into it | Block the action; surface "This credit ledger is mid-payment — finish collection first."           |

All errors are thrown as named classes in `database/sales.ts` (mirrors
the existing `InsufficientStockError`). The hooks catch and rethrow so the
UI can switch on `err instanceof VoidWindowExceededError` etc.

## 8. Testing Strategy

### Unit

- `tests/database/voidSale.test.ts` — kind=void, cash sale, returns inventory, writes `cash_refund`, sets `sales.cancelled_at`.
- `tests/database/refundSale.test.ts` — credit sale, sets `credit_transactions.status='cancelled'`, refuses without a reason code in the allowed set.
- `tests/database/correctSalePrice.test.ts` — multi-line edit, total recomputed, `cash_refund` row written for downward delta, `owner_addition` for upward.
- `tests/database/settings.test.ts` — get/set defaults work; missing key returns null.
- `tests/database/migrations.test.ts` — synthetic migration from v18 → v19 keeps existing data intact.

### Integration (TanStack Query)

- `tests/hooks/useVoidSale.test.ts` — invalidates `useSale(saleId)`, `useCorrectionsReport`, and the cash session summary in the right order.

### UI / smoke

- A "Void a recent sale" happy-path component test for the correction screen.
- A "Price correction recomputes total" component test.

### Migration fixture

- A seeded v18 DB committed under `tests/fixtures/` so the migration path is exercised in CI.

## 9. Out of Scope (Deferred, Captured for Future)

These match the spec's open questions and are explicitly NOT built in v1:

1. **Partial refunds** (some line items only). Per the spec — full-sale void/refund only in v1.
2. **Cross-day voids/refunds.** Hard time window is the constraint.
3. **Refund-to-utang** (refund posted as a credit to the suki's account). Cash refunds only in v1.
4. **Date-range aggregation in the Corrections report.** List-only in v1.
5. **`witness_user` becomes a typed foreign key** once feature 16 (Shift Tracking) lands. Today it's free text with a soft validation through the picker.

## 10. Open Questions (Re-Routed to Owners)

These are the spec's original Open Questions plus one new one surfaced
during design. The implementation plan should treat each as a follow-up
ticket, not a blocker.

1. **Should `void_window_hours` be per-store or per-device?** The `app_settings` table is currently a single-row-per-key design — implies per-device. If stores share devices (kiosk mode) we'll want per-store scoping. Not blocking v1; revisit when feature 17 (Backup & Restore) decides how stores share state.
2. **Should price corrections also be visible in the customer's credit statement?** Currently they only adjust the `credit_transactions.amount`. The running balance is correct, but the statement (feature 12) doesn't surface "amount changed by correction". A small enhancement to feature 12 — explicitly out of scope here.

## 11. Companion Vault Note

Per project protocol (`adrs-must-go-to-obsidian-vault.md`) the design
above is mirrored into `obsidian-vault/03-Technical/ADR-002-safe-voids-refunds-corrections.md`
as an ADR-style note. The vault is the source of truth for
architectural decisions across sessions; this docs file is the
implementation-grade companion.
