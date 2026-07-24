# Guardrails — the non-negotiables

## 1. Money is integer pesos. Always

- All monetary columns in SQLite: `INTEGER` (pesos). The user-facing value
  `₱12.50` is stored as `1250`.
- All money in app state and props: integer pesos. Never `number` with decimals for money.
- **Parse and format in one place.** Use `parsePesosInput` from `lib/money.ts`
  on user input (form fields) and `formatPesos` for display. **Do not call
  `parseFloat` on a money field** — it accepts `"12.5e1"`, `"1,234.56"` (with
  the comma treated as junk in some locales), and similar. The single-source
  parser exists; use it.
- **Why:** `0.1 + 0.2 !== 0.3`. Floating-point money loses pennies over thousands of
  sales and silently corrupts utang balances. This is a financial app — be paranoid.
- **Failure mode this prevents:** drift in a suki's running balance after a year of
  transactions, and reports that don't sum because of accumulated float error.

## 2. Hard offline-first. Zero network calls in core flows

- Inventory CRUD, sales recording, utang tracking, reports — **all must work with airplane mode on.**
- No `fetch()` to a server in core flows. No auth gating on network. No "loading…" spinners
  that wait for a remote response.
- If a feature genuinely needs the network, it lives behind a clearly named
  `onlineOnly/` subfolder and is documented as such.

## 3. Utang invariant: a customer's balance is the sum of their entries

- A suki's outstanding balance is **computed** from their credit and payment
  transactions (`SUM(amount) - SUM(amount_paid)` per customer, restricted to
  transactions that are not yet `paid` in full). There is no denormalized
  `balance` column on `customers` to keep in sync — the value is always live
  by construction.
- Every multi-statement write that touches the ledger **must** be wrapped in
  `db.withTransactionAsync` so a partial write can never leave a balance
  out of sync. The audit-safety work in `database/credits.ts` and
  `database/sales.ts` enforces this for `insertPayment`, `deletePayment`,
  `insertSale`, and `deleteSale`.
- Payments are allocated FIFO against the oldest unpaid credit for that
  suki; the allocation is recorded in `payment_allocations` so it can be
  reversed when the payment is deleted.
- **Why:** sari-sari store owners check customer balances at the counter between sales.
  A balance that's off by ₱5 destroys trust in the app permanently.

## 4. One SQLite connection. Shared everywhere

- `expo-sqlite` opens **one** database per app run. Pass that handle through.
- Never call `openDatabaseAsync` from a screen, a hook, or a `db/` file directly.
- Tests use `better-sqlite3` with the same SQL — `db/` functions should be written so
  this swap is trivial.
- **Why:** SQLite locks at the file level. Multiple connections from the same app
  cause `SQLITE_BUSY` on Android, especially during busy sales hours.

## 5. expo-router conventions, not React Navigation imports

- All navigation happens via `<Link href="...">` or the `useRouter()` hook from
  `expo-router`. Never `import { useNavigation } from '@react-navigation/native'`
  in a screen.
- Route groups are folders wrapped in parens (`(tabs)`, `(edit-forms)`) — they do not
  appear in the URL but affect layout.
- Type-safe routes: rely on the generated `SariSari` global from `expo-router` types.

## 6. Don't bypass the query layer for "just one quick read."

- The temptation: import `listProducts` directly into a screen for an "obvious" read.
- The cost: that screen misses invalidations, gets out of sync after a write, and
  becomes untestable. Every read goes through a hook, every time, including in
  onboarding and forms.
