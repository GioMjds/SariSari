# Physical Stocktake — Design

> Phase: Kasalukuyan (Now) · Status: Not started → Done
> Source spec: `obsidian-vault/02-Features/04-physical-stocktake.md`
> Roadmap context: `obsidian-vault/01-roadmap/feature-implementation-status-and-ia.md` §2.4, §5 (Inventory tab)

---

## 1. Problem

Shrinkage, spoilage, miscounts, and freebies silently move catalog stock away
from shelf reality. Without a guided, category-by-category count, the owner
discovers the gap only when opening an empty box. By then it is too late to
attribute the loss to a specific event.

A stocktake is a manual, periodic ritual: walk the shelf, count what is
physically there, compare against what the catalog says, and explain the
variance. This feature adds a guided flow for that ritual.

---

## 2. Goals

- Give the owner a single guided surface for counting shelf stock per
  category.
- Produce a per-product variance (expected vs counted) with a money impact
  computed from a frozen cost-price snapshot.
- Persist variance as reason-coded adjustments into the existing
  `inventory_transactions` ledger so audit trails stay unified.
- Discourage conflicting manual writes during a stocktake via a banner and
  disabled UI surfaces — without locking the owner out of their store.

---

## 3. Non-goals

- Continuous or scheduled cycle counting (manual, on-demand only).
- Multi-device collaboration on one session.
- Barcode scanning during the count.
- A dedicated Stocktake history detail screen (history is a one-line summary
  per session; full per-line detail lives in the existing Stock Movements
  ledger filtered by `type='adjustment'`).
- Cost-price editing during a stocktake (counts only).
- A scheduler or local-notification reminder.

---

## 4. User-facing flow

The owner navigates to the Inventory tab and selects the new **Stocktake**
sub-tab (sibling of Products / Stock / Movements / Analytics).

### 4.1 Idle

The screen shows:

- A "Last stocktake" card summarising the most recent completed session
  (date, products counted, net variance in pesos, number of variance lines).
- A primary CTA: **Start new stocktake**.
- A list of recent completed and abandoned sessions, newest first, one row
  per session with date and signed peso total.

### 4.2 Counting

After tapping **Start new stocktake**:

1. The screen captures `expected_qty` for every product in one transaction
   (frozen baseline for the session).
2. The screen renders categories as collapsible accordion sections.
3. Each product row exposes a counted-qty input with `+1 / +2 / +5` chips,
   a numeric input, and decrement chip — mirroring the POS Fast Lane
   chips for parity.
4. A progress strip at the top shows `X / Y products counted` (X = number
   of `stocktake_counts` rows for this session, Y = total products).
5. The owner can collapse / expand categories, scroll, and resume across
   app restarts. The active session row in `stocktake_sessions` is what
   makes resume work.
6. Two footer actions: **Finish & review** (transitions to Variance) and
   **Save & quit** (opens an abandon confirmation).

### 4.3 Variance

After tapping **Finish & review**:

- The screen renders every product that was counted (including zero
  variances for transparency).
- Each non-zero row exposes a reason dropdown with the closed enum
  (shrinkage, spoilage, miscount, freebie_to_neighbor, customer_return,
  unexplained) and an optional note input.
- A summary header shows total products, number of variances, and net
  variance in pesos.
- **Commit** is disabled until every non-zero row has a reason.
- **Cancel** returns to Counting state without committing (no DB writes
  beyond the existing count upserts).
- **Commit** invokes `commitSession()` which writes one
  `inventory_transactions` row per non-zero variance and freezes the
  session.

After a successful commit the screen returns to Idle. The new session
appears at the top of the history list.

### 4.4 Banner

When an active session exists, a sticky banner appears at the top of every
Inventory sub-tab (Products, Stock, Movements, Analytics, Stocktake). It
reads: "Stocktake in progress — other stock changes are paused." Tapping
it navigates to the Stocktake sub-tab.

---

## 5. Architecture

### 5.1 New files

```folder
database/
  stocktake.ts
hooks/
  useStocktake.ts
app/(tabs)/inventory/
  stocktake.tsx
components/inventory/stocktake/
  StocktakeBanner.tsx
  StocktakeStartCard.tsx
  StocktakeHistoryList.tsx
  StocktakeCountRow.tsx
  StocktakeCategorySection.tsx
  StocktakeVarianceRow.tsx
  StocktakeVarianceSummary.tsx
config/
  stocktakeReasons.ts
```

No new top-level routes outside `app/(tabs)/inventory/`. No new tab group.

### 5.2 Modified files

```text
database/migrations.ts                    # add v15 block
app/(tabs)/inventory/_layout.tsx          # add 'stocktake' to SUB_TAB_SEGMENTS + TopTabs.Screen, mount <StocktakeBanner />
components/inventory/.../ProductActionMenuModal.tsx # useStocktakeGuard on Adjust/Mark damaged
components/inventory/.../InventorySpeedDialFab.tsx   # disabled state during active session
components/inventory/ledger/LogTransactionForm.tsx   # guard against adjustment/damaged during session
```

### 5.3 Data flow

```diagram
stocktake.tsx
   ↓ reads
useStocktake()  ──→  database/stocktake.ts  ──→  SQLite
   ↓ writes                                        ↑
components/inventory/stocktake/*   ←─────── useStocktakeGuard() read-only check
```

Strictly unidirectional, matching the project layering rule from
`AGENTS.md`. Components in `components/inventory/stocktake/` never call
SQLite directly.

---

## 6. Data model (migration v15)

```sql
CREATE TABLE IF NOT EXISTS stocktake_sessions (
  id TEXT PRIMARY KEY,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  status TEXT NOT NULL CHECK(status IN ('in_progress', 'completed', 'abandoned')),
  note TEXT,
  total_products_counted INTEGER NOT NULL DEFAULT 0,
  total_variance_pesos INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS stocktake_counts (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES stocktake_sessions(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  expected_qty INTEGER NOT NULL,
  counted_qty INTEGER NOT NULL,
  cost_price_at_count INTEGER,
  reason_code TEXT,
  note TEXT,
  committed_at TEXT,
  UNIQUE(session_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_stocktake_counts_session ON stocktake_counts(session_id);
CREATE INDEX IF NOT EXISTS idx_stocktake_counts_committed ON stocktake_counts(committed_at);
```

Notes:

- `id TEXT` uses `expo-crypto.randomUUID()` to match `cash_sessions` and
  `cash_entries` style.
- `cost_price_at_count INTEGER` is the frozen cost snapshot used for the
  variance peso impact. Nullable: set only at commit.
- `reason_code` is closed enum (see §7). Nullable: zero-variance rows do
  not require a reason.
- `committed_at` is non-null after the variance row has been materialised
  into `inventory_transactions`. Rows with `committed_at IS NULL` are
  still being counted / reviewed.
- `UNIQUE(session_id, product_id)` enforces one row per product per
  session — `upsertCount` relies on this.
- `total_products_counted` and `total_variance_pesos` are denormalised
  cache fields on the session, updated at commit. The Idle screen reads
  these directly without aggregating the counts table.

### 6.1 Helpers in `database/stocktake.ts`

```ts
initStocktakeTables()
startSession(note?): Promise<string>
getActiveSession(): Promise<StocktakeSession | null>
getSessionById(id): Promise<StocktakeSession | null>
listRecentSessions(limit = 20): Promise<StocktakeSession[]>
upsertCount({ sessionId, productId, expectedQty, countedQty }): Promise<void>
listCounts(sessionId): Promise<StocktakeCount[]>
commitSession(sessionId, reasonPerLine): Promise<void>
abandonSession(sessionId): Promise<void>
```

`startSession` runs inside `withTransactionAsync` and:

1. Inserts the session row with `status='in_progress'`.
2. Reads all products.
3. Pre-populates `stocktake_counts` with `expected_qty = products.quantity`,
   `counted_qty = 0`. (Skipped for products with `quantity = 0` to keep
   the counts table small.)

`commitSession` runs inside `withTransactionAsync` and:

1. Reads all counts for `sessionId` with `committed_at IS NULL`.
2. For each non-zero `delta = counted_qty - expected_qty`:
   - Reads `products.cost_price` for the product, writes the value into
     `stocktake_counts.cost_price_at_count`.
   - Inserts one `inventory_transactions` row with `type='adjustment'`,
     `quantity=|delta|`,
     `adjustment_sign = delta > 0 ? 'positive' : 'negative'`,
     `note = reason_code + (optional row note)`.
   - Updates `products.quantity` by `delta`.
   - Stamps `stocktake_counts.committed_at = now`.
3. Sets `stocktake_counts.reason_code` per row.
4. Writes `stocktake_sessions.total_products_counted`,
   `total_variance_pesos`.
5. Sets `stocktake_sessions.status='completed'`, `ended_at=now`.

`abandonSession` sets `status='abandoned'`, `ended_at=now`. No
`inventory_transactions` rows are written. Counts remain in the table for
history but `committed_at` stays null.

### 6.2 Failure semantics

- All multi-row writes go through `withTransactionAsync` so partial
  failure cannot leave `products.quantity` and `inventory_transactions`
  out of sync.
- Money columns are INTEGER pesos (whole units up to two decimals), per
  the project invariant in `AGENTS.md`. No floats anywhere in this
  feature.

---

## 7. Reason codes

Closed enum in `config/stocktakeReasons.ts`:

```ts
export const STOCKTAKE_REASONS = [
  'shrinkage',
  'spoilage',
  'miscount',
  'freebie_to_neighbor',
  'customer_return',
  'unexplained',
] as const;
export type StocktakeReason = (typeof STOCKTAKE_REASONS)[number];
```

These are intentionally distinct from any future damaged-goods reason set
(feature #13). If both features end up wanting the same codes, a shared
`STOCK_ADJUSTMENT_REASONS` enum can be extracted later — that refactor is
out of scope here.

---

## 8. Hooks

`hooks/useStocktake.ts` (mirrors `hooks/useInventory.ts` style):

```ts
export const stocktakeKeys = {
  all: ['stocktake'] as const,
  active: () => [...stocktakeKeys.all, 'active'] as const,
  session: (id: string) => [...stocktakeKeys.all, 'session', id] as const,
  counts: (sessionId: string) =>
    [...stocktakeKeys.all, 'counts', sessionId] as const,
  history: () => [...stocktakeKeys.all, 'history'] as const,
};

useActiveStocktakeSession();
useStocktakeSession(id);
useStocktakeCounts(sessionId);
useRecentStocktakeSessions((limit = 20));

useStartStocktake();
useUpsertStocktakeCount();
useCommitStocktake();
useAbandonStocktake();
```

### 8.1 Query invalidation

| Mutation                  | Invalidates                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------ |
| `useStartStocktake`       | `stocktakeKeys.all`, `stocktakeKeys.history()`                                                   |
| `useUpsertStocktakeCount` | `stocktakeKeys.counts(sessionId)` only — does NOT touch `['products']` (counting ≠ stock change) |
| `useCommitStocktake`      | `stocktakeKeys.all`, `stocktakeKeys.history()`, `['products']`, `inventoryKeys.all`              |
| `useAbandonStocktake`     | `stocktakeKeys.all`                                                                              |

### 8.2 Optimistic updates

- `useUpsertStocktakeCount` optimistically patches
  `stocktakeKeys.counts(sessionId)` cache and rolls back on error.
  `expected_qty` is NOT optimistically updated — it is captured at
  `startSession()` time and frozen for the lifetime of the session.
- `useCommitStocktake` does not optimistically patch products; the
  mutation either succeeds atomically or rolls back entirely.

### 8.3 Active-session subscription

`useActiveStocktakeSession()` is consumed by:

- `app/(tabs)/inventory/_layout.tsx` (renders `StocktakeBanner`).
- `components/inventory/stocktake/StocktakeBanner.tsx` (its own visibility).
- `components/inventory/stocktake/` consumers (FAB, action menu,
  `LogTransactionForm`) via `useStocktakeGuard()` exported from the
  hooks file.
- `app/(tabs)/inventory/stocktake.tsx` (state branch selection).

The hook is cheap: one indexed query (`SELECT * FROM stocktake_sessions
WHERE status='in_progress' LIMIT 1`).

---

## 9. UI components

### 9.1 `StocktakeBanner.tsx`

Sticky banner rendered inside `app/(tabs)/inventory/_layout.tsx` between
`InventoryHeader` and the `TopTabs` block. Visible only when
`useActiveStocktakeSession().data != null`. Tapping navigates to
`/(tabs)/inventory/stocktake`.

### 9.2 `StocktakeStartCard.tsx`

Idle state header card. Renders the last session summary
(date, products counted, net variance) and the "Start new stocktake" CTA.

### 9.3 `StocktakeHistoryList.tsx`

List of past sessions. One row per session: relative date, signed peso
total, status chip (Completed / Abandoned). Tapping a row is out of scope
(this PR); rows are display-only.

### 9.4 `StocktakeCategorySection.tsx`

Collapsible accordion section per category. One open at a time (matches
the Settings screen accordion pattern). Renders a flat list of
`StocktakeCountRow` children.

### 9.5 `StocktakeCountRow.tsx`

Per-product counted-qty input with `+1 / +2 / +5` quick chips, numeric
input, and decrement chip. Mirrors `components/sales/pos/FastLaneCard`
chip layout for visual parity with POS.

### 9.6 `StocktakeVarianceRow.tsx`

Per-product variance row. Shows expected / counted / delta / signed peso
impact + a reason dropdown (closed enum) + optional note input. Disabled
until a reason is selected for non-zero rows.

### 9.7 `StocktakeVarianceSummary.tsx`

Variance header: total products, number of variances, net variance in
pesos. Reads from the local `stocktake_counts` cache; updates as rows are
filled in.

---

## 10. Soft-block during an active session

The banner is informational. The actual guard lives in one hook,
`useStocktakeGuard()`, consumed by each affected write surface:

```ts
function useStocktakeGuard(): { isActive: boolean; reason: string | null };
```

| Surface                                       | When active                                                                                                        |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `InventorySpeedDialFab`                       | All quick-add buttons remain enabled (Add Product / Category / Supplier / Scan). No stock write here, so no guard. |
| `ProductActionMenuModal` (Adjust Stock)       | Disabled with tooltip "Stocktake in progress".                                                                     |
| `ProductActionMenuModal` (Mark Damaged)       | Disabled with tooltip "Stocktake in progress".                                                                     |
| `LogTransactionForm` (initialType=adjustment) | Block with full-screen warning offering Resume / Discard.                                                          |
| `LogTransactionForm` (initialType=damaged)    | Block with full-screen warning offering Resume / Discard.                                                          |
| `LogTransactionForm` (initialType=restock)    | **Allowed** — restock increases stock; the frozen `expected_qty` keeps the variance consistent.                    |
| Bulk delete / move category                   | Allowed — does not change `products.quantity`.                                                                     |
| POS sales                                     | Allowed — sales deduct stock but `expected_qty` is already snapshotted at session start.                           |

### 10.1 Why this guard set

- The variance is computed against `expected_qty` captured at
  `startSession()`. Once captured, any restock during counting enlarges
  the catalog's view of stock but does not change what was on the shelf
  when the count started — so the variance remains meaningful.
- Sales similarly do not retroactively change `expected_qty`. The owner
  sees the variance as "what I expected when I started" minus "what I
  count now."
- Manual adjustment and damaged writes during counting would corrupt
  the variance (the user would be hand-editing the very quantity being
  counted). That is what we block.

### 10.2 Database-level guarantee

Soft-block is UI-only. The `startSession()` snapshot is the actual
defence: even if a write slips through (race condition, edge case), the
`expected_qty` is already frozen. The variance will reflect the snapshot
baseline, not the post-write state.

---

## 11. i18n

New keys under a `stocktake:` namespace:

```text
stocktake:title
stocktake:lastSessionSummary
stocktake:startCta
stocktake:inProgressBanner
stocktake:progressLabel
stocktake:finishReviewCta
stocktake:saveQuitCta
stocktake:abandonTitle
stocktake:abandonConfirm
stocktake:varianceHeader
stocktake:commitCta
stocktake:commitDisabledReason
stocktake:reason.{shrinkage,spoilage,miscount,freebie_to_neighbor,customer_return,unexplained}
```

Tagalog first (the project's primary language), English fallback.
Mirrors the bilingual key convention used by feature #2 (Parked Sales).

---

## 12. Tests

Under `tests/`:

| File                                                      | Covers                                                                                                                                                                                                                                                                                                    |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/database/stocktake.test.ts`                        | `initStocktakeTables` idempotent; `startSession` captures baseline qty; `upsertCount` UNIQUE constraint; `commitSession` atomicity (force mid-loop failure, verify no products.quantity or inventory_transactions side-effects); cost snapshot freezes; reason_code defaults; abandon vs completed states |
| `tests/hooks/useStocktake.test.tsx`                       | optimistic `upsertCount` rolls back on error; `commitStocktake` invalidates the documented keys; `useActiveStocktakeSession` returns null when no row                                                                                                                                                     |
| `tests/components/StocktakeBanner.test.tsx`               | hidden when no session; visible + onPress→router.push when active                                                                                                                                                                                                                                         |
| `tests/components/LogTransactionForm.guards.test.tsx`     | adjustment/damaged blocked with active session; restock still works                                                                                                                                                                                                                                       |
| `tests/components/ProductActionMenuModal.guards.test.tsx` | Adjust / Mark damaged disabled during session; Edit / View ledger / Delete remain enabled                                                                                                                                                                                                                 |

---

## 13. Implementation order

1. **Migration v15** + `database/stocktake.ts` + `config/stocktakeReasons.ts`.
   Pure data layer; shippable without UI.
2. **Hooks** `useStocktake.ts` (with `useStocktakeGuard` exported from the
   same file). Tests against the new DB layer.
3. **Components** `stocktake/*` — pure presentational; mock-data unit
   tests.
4. **Screen** `app/(tabs)/inventory/stocktake.tsx` — wires hooks and
   components, gates the three states.
5. **Layout wiring** — register sub-tab in `_layout.tsx`, mount
   `StocktakeBanner`, apply `useStocktakeGuard()` to FAB / action menu /
   `LogTransactionForm`.
6. **i18n keys**.
7. **`npm run verify`** — typecheck + tests.

---

## 14. Risks and follow-ups

- **Long sessions on slow devices**: if a store has thousands of SKUs,
  `startSession()` pre-populates a row per product. Mitigated by
  skipping `quantity = 0` products at insert time.
- **Resuming after app crash mid-commit**: a `withTransactionAsync`
  crash rolls back fully; the session stays `in_progress` and the owner
  can re-enter and re-Commit (no `committed_at` rows were written, so
  commit re-runs cleanly). No idempotency hazard on retry.
- **Reason-code evolution**: if business needs change, adding a new value
  to `STOCKTAKE_REASONS` is a safe additive change; old sessions keep
  their stored strings.
- **Feature #13 overlap**: damaged-goods tracking (feature #13, Partial)
  will eventually want its own reason enum. The closed-enum separation
  in §7 keeps the two features decoupled for now.
- **History detail screen**: a future iteration may want a per-session
  detail screen with full per-line drill-down. Out of scope here; the
  existing `inventory_transactions` ledger with `type='adjustment'`
  filter is sufficient for v1.
