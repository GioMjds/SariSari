# Utang Guardrails at Checkout — Design

Status: Approved (brainstorming). Source feature: `obsidian-vault/02-Features/05-utang-guardrails-at-checkout.md`.

## Problem (from the feature spec)

Utang is the social contract of the sari-sari store, but the same trust makes it easy to extend credit beyond what a suki can or wants to repay. Today the cashier sees the suki's name on a credit sale but has no live signal — current balance, credit limit (if any), oldest-overdue days, or whether the suki is in the danger zone. Decisions are made from memory. Over time, balances grow and bad debt becomes the biggest business risk.

## Goal

Give the cashier a live, accurate suki panel on the credit path with a soft warn, a hard block (per-customer toggle), and a recordable owner override — so the owner stays the final decision-maker while every credit decision leaves an audit trail.

## Decisions locked during brainstorming

- **Feature 11 (owner PIN) ships later.** This feature ships without the PIN gate. The override modal records a reason; when Feature 11 lands, the PIN prompt slots in behind the same button with no UI change.
- **Limit type: soft default with per-customer hard toggle.** `credit_limit` is nullable (= no cap). A new `block_on_exceed` boolean on `customers` opts a single customer into a hard block. When `false`, exceeding the limit warns only. Default `false`.
- **Warn threshold: fixed 20% buffer.** Near-limit = `(creditLimit - balance - pendingTotal) / creditLimit <= 0.20`. No per-customer knob for this in v1.
- **Placement: Add Credit, Add Sales (credit path), and Customer details (informational).** One shared `SukiPanel` component, three callsites.
- **Override reasons: fixed enum + free-text for "other".** Codes: `regular_customer`, `long_term_suki`, `partial_payment_promised`, `owner_discretion`, `other`. Stored as `override_reason_code` on the row, with `override_reason_note` populated when code = `other`.
- **Overdue threshold: column + default 30, no v1 edit UI.** `customers.overdue_threshold_days INTEGER NOT NULL DEFAULT 30`. Per-customer editor can come later.

## Architecture and layering

Strictly follows the AGENTS.md unidirectional flow:

```
Screen (app/) ──reads/writes──▶ Hook (hooks/) ──calls──▶ DB Fn (database/) ──uses──▶ SQLite
       │                            │                       │
       │                            │                       └─ maps snake_case rows → camelCase TS
       │                            └─ wraps in useQuery/useMutation, invalidates on success
       └─ renders components/, reads stores/ for UI-only state
```

- `app/` screens render. They never call SQLite and never compute guardrail state.
- `hooks/` wraps DB fns in TanStack Query.
- `database/credits.ts` adds one pure async fn: `getCustomerCreditSummary`.
- New folder `components/utang/credit-guardrails/` holds three presentational components.
- `stores/` is not touched. Override state is local to the form.
- `types/credits.types.ts` gains `CustomerCreditSummary` and `OverrideReasonCode`.

## Data model

### Migration v16

New columns:

```sql
ALTER TABLE customers
  ADD COLUMN block_on_exceed INTEGER NOT NULL DEFAULT 0;

ALTER TABLE customers
  ADD COLUMN overdue_threshold_days INTEGER NOT NULL DEFAULT 30;

ALTER TABLE sales
  ADD COLUMN override_reason_code TEXT;

ALTER TABLE sales
  ADD COLUMN override_reason_note TEXT;
```

`customers.credit_limit` already exists (`initCreditsTable`). No change.

Also persist the override metadata on `credit_transactions` so audit queries on the ledger work too. Two new columns:

```sql
ALTER TABLE credit_transactions
  ADD COLUMN override_reason_code TEXT;

ALTER TABLE credit_transactions
  ADD COLUMN override_reason_note TEXT;
```

`PRAGMA user_version = 16` at the end. The migration block follows the same `await db.withTransactionAsync(...)` + idempotent column-check pattern as the v8–v15 migrations.

### `CustomerCreditSummary` (camelCase, returned by the DB fn)

```ts
interface CustomerCreditSummary {
  customerId: number;
  balance: number; // outstanding pesos (integer)
  creditLimit: number | null; // null = no cap
  availableCredit: number | null; // creditLimit - balance, or null
  blockOnExceed: boolean; // per-customer hard-cap toggle
  oldestUnpaidDueDate: string | null; // YYYY-MM-DD, or null
  overdueDays: number | null; // null = not overdue
  overdueThresholdDays: number; // 30 default
  isOverdue: boolean; // overdueDays > threshold
  isNearLimit: boolean; // available/limit <= 0.20 (only when limit set)
  wouldExceedLimit: boolean; // available < 0 (only when limit set)
}
```

### `OverrideReasonCode`

```ts
type OverrideReasonCode =
  | 'regular_customer'
  | 'long_term_suki'
  | 'partial_payment_promised'
  | 'owner_discretion'
  | 'other';
```

## Database function

`getCustomerCreditSummary(customerId: number): Promise<CustomerCreditSummary | null>`

Three small queries inside one async function (no transaction — pure reads). All values are integer-pesos so no float math happens.

1. Config:
   ```sql
   SELECT id, credit_limit, block_on_exceed, overdue_threshold_days
   FROM customers WHERE id = ?;
   ```
   If the row is missing, return `null`.
2. Balance — same canonical query as the existing `getOutstandingBalance`:
   ```sql
   SELECT COALESCE(SUM(amount - amount_paid), 0) AS balance
   FROM credit_transactions
   WHERE customer_id = ? AND status != 'paid';
   ```
3. Overdue:
   ```sql
   SELECT MIN(julianday('now') - julianday(due_date)) AS days_overdue
   FROM credit_transactions
   WHERE customer_id = ? AND status != 'paid'
     AND due_date IS NOT NULL
     AND due_date < date('now');
   ```

JS derivations after the reads:

- `availableCredit = creditLimit == null ? null : creditLimit - balance`.
- `isOverdue = overdueDays != null && overdueDays > overdueThresholdDays`. Floor the SQL value (matches the existing `getCustomerWithDetails` pattern).
- `isNearLimit`, `wouldExceedLimit` are pure JS derivations of `balance`, `creditLimit`, and (caller-supplied) `pendingTotal`. They are NOT computed by the DB fn — the fn returns `availableCredit` only, and the panel / hook apply the projection.

This keeps the DB fn pure and reusable on Customer details (no `pendingTotal`).

## Hook

`hooks/useCredits.ts` gains:

```ts
export function useCustomerCreditSummary(
  customerId?: number | string,
  opts = {},
) {
  const parsedId =
    typeof customerId === 'string' ? parseInt(customerId) : customerId;
  return useQuery<CustomerCreditSummary | null>({
    queryKey: ['customer-credit-summary', parsedId],
    queryFn: () =>
      parsedId ? getCustomerCreditSummary(parsedId) : Promise.resolve(null),
    enabled: !!parsedId,
    staleTime: 60 * 1000, // 1 minute
    ...opts,
  });
}
```

Re-export from `hooks/index.ts` so screens import the same way as the rest of the credit hooks.

`useInsertCredit` and `useInsertPayment` already invalidate the relevant query keys. Add `'customer-credit-summary'` to the invalidation list so the panel updates after a sale is recorded or a payment is applied.

## Components

All three live in `components/utang/credit-guardrails/`.

### `SukiPanel`

Props-only presentational component:

```ts
interface SukiPanelProps {
  summary: CustomerCreditSummary;
  pendingTotal?: number; // projected credit (cart / ticket total)
  mode: 'compact' | 'detailed';
  onRequestOverride?: () => void; // shown only when wouldExceed && blockOnExceed
}
```

Render rules:

- Always show "Outstanding" (`formatPesos(summary.balance)`).
- If `summary.creditLimit != null`, show "Limit" and "Available". `Available` = `creditLimit - balance - (pendingTotal ?? 0)`. Use integer subtraction; no floats.
- Overdue badge: red chip "Overdue · N days" when `isOverdue`.
- Near-limit chip: amber "Almost at limit" when `isNearLimit && !wouldExceedLimit` and `creditLimit != null`.
- Exceeded warning: red chip "Over limit by ₱X" when `wouldExceedLimit && !blockOnExceed`.
- Exceeded block banner: red card "Over limit · requires owner override" with a "Record override" CTA when `wouldExceedLimit && blockOnExceed` and `onRequestOverride` is provided.
- Hide entirely (return `null`) when `summary.creditLimit == null` AND `!summary.isOverdue` AND `pendingTotal == null`. `mode = 'detailed'` on Customer details always shows the panel (balance + overdue even with no limit).
- All money uses `formatPesos` from `lib/money.ts`. No raw concatenation, no floats.

### `OverrideReasonModal`

Props:

```ts
interface OverrideReasonModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (result: { code: OverrideReasonCode; note: string | null }) => void;
}
```

- Renders a vertical list of the five codes as `Pressable` rows with label + one-line description.
- Selecting `'other'` reveals a required `TextInput` for the free-text note. Submit is disabled until the trimmed note is non-empty.
- `onSubmit` fires with `{ code, note: code === 'other' ? trimmedNote : null }`.

The `code -> label` map lives in the same file and is exported so other UI (audit lists later) can reuse it.

### `OverrideReasonLabel`

Tiny helper component: `<OverrideReasonLabel code={...} />` for displaying the reason in lists / receipts later. Not strictly required by the v1 happy path, but trivial to include and avoids string drift.

## Screen integrations

### Add Credit (`app/(edit-forms)/add-credit/[id].tsx`)

- Render `<SukiPanel>` between the header and `CreditTicketSheet`. `useAddCreditForm` already exposes `total`, which becomes `pendingTotal`.
- Add a `useState<{ code: OverrideReasonCode; note: string | null } | null>(null)` for the override.
- `SubmitButton`:
  - Disabled when `wouldExceedLimit && blockOnExceed && override == null`.
  - On press, when `wouldExceedLimit && !blockOnExceed`, open a non-blocking `Modal` (existing pattern in the codebase): "Suki is over limit. Continue?" with two actions:
    - "Continue without override" — submit with `override = null` and the warn-state persisted (the warning is just informational; the row is recorded as a normal credit).
    - "Record override reason" — open `OverrideReasonModal`; on submit, call the existing mutation with `{ ..., overrideReason: { code, note } }`.
  - When `blockOnExceed && override == null`, the button stays disabled; the panel's CTA opens `OverrideReasonModal`.
- `useAddCreditForm.submit` forwards `overrideReason` to `useInsertCredit`. The mutation:
  - Sets `override_reason_code` and `override_reason_note` on each inserted `credit_transactions` row.
  - **No** new `sales` row is created here (Add Credit is the standalone credit-record path, not the POS). Override metadata lives on the credit row.
- The form clears the override state on submit and on navigation back.

### Add Sales (credit path) — `app/(edit-forms)/add-sales/index.tsx`

- When `form.paymentType === 'credit'` and `form.selectedCustomer` is set (and `selectedCustomer` is a real `customers.id`, not a one-off name), render `<SukiPanel>` inside the `CartSummaryTray` area above the totals row. `form.total` is the `pendingTotal`.
- Hide the panel otherwise (cash sale, or no customer attached).
- `insertSale` signature gains two optional fields: `overrideReasonCode?: OverrideReasonCode` and `overrideReasonNote?: string | null`. When provided, the new `sales.override_reason_code` and `sales.override_reason_note` columns are written inside the same `BEGIN TRANSACTION` block.
- For credit sales, the linked `credit_transactions` row also receives the override metadata so audit queries on the ledger work the same way as Add Credit.
- The cashier is always the final decision-maker, matching the spec: the existing "Continue without override" pattern is reused.

### Customer details (informational) — `app/(edit-forms)/credit-details/[id].tsx`

- Render `<SukiPanel summary={data} mode="detailed" />` inside the `CustomerHeroCard`, above the existing action buttons.
- No `pendingTotal`, no `onRequestOverride`. It's a read-only informational card.
- The existing customer details query already loads balance, credits, payments, and `days_overdue` — the panel pulls from the new `useCustomerCreditSummary` query, so it stays decoupled from the detail-screen data shape.

## Error handling

- DB fn: if the customer row is missing, return `null`. The hook returns `null`. The panel renders nothing.
- Hook errors propagate to the screen as a TanStack query error. The screen surfaces them via the existing error pattern; the panel just doesn't render. No fallback copy, no `null` panic.
- All money math is integer. `formatPesos` is the only formatting path. No float drift.
- `OverrideReasonModal`: `'other'` with empty trimmed note disables submit. No silent no-op submit.
- The override modal's "Continue without override" path on `!blockOnExceed` is intentionally non-blocking — the owner is always the final decision-maker per the spec's "Hindi Kasama sa Saklaw".

## Edge cases

| Case                                                                   | Behaviour                                                                                                                                                 |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Customer with no credits ever                                          | `balance = 0`, `oldestUnpaidDueDate = null`, `overdueDays = null`, `isOverdue = false`. Panel shows "Outstanding ₱0.00".                                  |
| `credit_limit = null`                                                  | Limit / available / near-limit / exceeded all hidden. Balance + overdue still shown in detailed mode.                                                     |
| `pendingTotal = 0`                                                     | Behaves identically to no `pendingTotal`.                                                                                                                 |
| Multiple ticket items / cart lines                                     | `pendingTotal` is the sum already computed by the form.                                                                                                   |
| Cash sale with a customer attached                                     | Panel doesn't render (Add Sales only shows the panel when `paymentType === 'credit'`).                                                                    |
| One-off credit customer (`sales.customer_name` set, no `customers.id`) | The new panel requires a real `customers.id`; the Add Sales path falls back gracefully (no panel). The Add Credit path always has a real id from the URL. |
| `overdue_threshold_days = 0` (edge)                                    | Any past-due unpaid credit is overdue. Same SQL, same logic.                                                                                              |
| Just-paid credit that was overdue                                      | The balance query excludes paid credits, so the overdue row no longer counts. Panel updates after `useInsertPayment` invalidation.                        |

## Testing

All under the existing Jest + better-sqlite3 harness. `npm test -- -t "<pattern>"` for focused runs.

- `tests/database/get-customer-credit-summary.test.ts`
  - Customer missing → returns `null`.
  - Customer with `credit_limit = null` and no overdue → `isNearLimit = false`, `wouldExceedLimit = false`, `isOverdue = false`.
  - Customer with `credit_limit = 500`, `balance = 100` → `availableCredit = 400`, `isNearLimit = false`, `wouldExceedLimit = false`.
  - Customer with `credit_limit = 500`, `balance = 420` → `availableCredit = 80`, `isNearLimit = true` (16% available, <= 20%), `wouldExceedLimit = false`.
  - Customer with `credit_limit = 500`, `balance = 600` → `availableCredit = -100`, `wouldExceedLimit = true`, `isNearLimit = true`.
  - Customer with overdue 29 days, threshold 30 → `isOverdue = false`.
  - Customer with overdue 31 days, threshold 30 → `isOverdue = true`.
  - Paid credits excluded from balance and from overdue.
  - `overdue_threshold_days = 0` → any past due date is overdue.
- `tests/hooks/useCustomerCreditSummary.test.tsx`
  - Renders data on success.
  - Returns `null` when customer is missing.
  - Error on DB failure surfaces via `isError`.
- `tests/components/utang/SukiPanel.test.tsx`
  - Hidden when nothing to show (no limit, not overdue, no pending).
  - `compact` vs `detailed` mode render differences.
  - Near-limit chip, exceeded warning, exceeded block banner with CTA.
  - `pendingTotal` projects the available credit correctly.
  - All money strings go through `formatPesos` (snapshot test for one happy case + the no-limit case).
- `tests/components/utang/OverrideReasonModal.test.tsx`
  - Renders all five codes.
  - Selecting `'other'` reveals the note input; submit disabled until non-empty.
  - `onSubmit` fires with `{ code, note }` and the right shape.
- `tests/database/migrations-v16.test.ts`
  - Apply v16 against a fresh DB, assert the six new columns exist with the right defaults / nullability.
  - Re-run is idempotent.
- `tests/database/insert-credit-with-override.test.ts`
  - Insert a credit with `overrideReasonCode = 'regular_customer'`, `overrideReasonNote = null`. Read back; columns match.
  - Insert with `code = 'other'`, `note = 'Will pay Friday'`. Read back; columns match.
- `tests/database/insert-sale-with-override.test.ts`
  - Insert a credit sale with override. `sales.override_reason_code`, `sales.override_reason_note`, and the linked `credit_transactions.override_reason_code` / `override_reason_note` all match.

## Documentation

- `docs/activity-log.md` (per AGENTS.md) gets a short entry: feature shipped, schema change, rollback recipe (drop the six columns, lower `user_version` back to 15).
- `obsidian-vault/02-Features/05-utang-guardrails-at-checkout.md` status flips from `Partial` to `Shipped`, with a link to the spec.
- `obsidian-vault/01-roadmap/feature-implementation-status-and-ia.md` (already modified in the current tree) gets a one-line update: feature 5 shipped, link to spec.

## Out of scope (deferred)

- Owner PIN gate behind the override button — Feature 11. The button stays as-is; the spec was explicit that this is a hard dependency for the override flow but the rest can ship earlier.
- Per-customer overdue-threshold editor UI. Column exists, default 30. Owner-edit comes later.
- Risk scoring / auto-decisioning — Feature 15.
- SMS to suki — never in scope.
- One-off credit customers on the panel — out of scope (panel requires a real `customers.id`).

## Open questions

None remaining for v1. Future work above.
