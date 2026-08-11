# Collection Queue — Implementation Plan

## Context

The SariSari owner carries the mental load of knowing "sino ang may utang, sino ang huli na sa pagbabayad, at sino ang malapit na sa kanilang limit" every time a suki walks up to the counter. Today the data is in SQLite (`customers`, `credit_transactions`, `payments`, `payment_allocations`) but no surface shows it as a ranked list. This plan adds a **Collection** sub-tab inside the Customers tab — a read-side queue with a write-side follow-up chip — so the owner can scan who to chase and act (record payment, set a follow-up, log a contact) without doing mental math.

The repo already has every SQL building block needed (`getOutstandingBalance`, `getCustomerCreditSummary`, `getAllCustomers('overdue')`), the hook/invalidation pattern, the `add-payment` deep-link, the `TopTabs`/`SubTabControl`/`useTabProgress` sub-tab plumbing, and the i18n namespace (`utang`). The follow-up table (`collection_followups`) and its read/write helpers are genuinely new; everything else composes existing pieces. Implementation is pure-additive — no existing screen, hook, or DB function is modified beyond small `['collection-queue']` invalidation fanout additions.

## Decisions (from brainstorming)

- **Placement:** third sub-tab under Customers (after `all`, `credit`). The More-tab's existing "Collection queue" tile is re-pointed to it.
- **Ranking:** bucketed — Overdue (oldest first) → Near limit (highest % consumed first) → Oldest outstanding balance.
- **Follow-up chip:** always visible per row, tappable, opens a small action sheet (today / tomorrow / +3 days / +1 week / pick / clear).
- **Eligibility:** any customer with `outstanding_balance > 0`.
- **Mark contacted:** inline counter per row, soft-grey "Contacted today · Nx" chip. No history view.
- **Search:** text-only, case-insensitive substring against name + phone. Bucket order preserved.
- **Scope:** full spec (Approach B) — queue + follow-up table + chip + Mark contacted, in one pass.

## Architecture & layering

Strict unidirectional flow, identical to the rest of the repo:

```folder
Screen (app/(tabs)/customers/collection.tsx)
  └─ Component (components/customers/CollectionTab.tsx + CollectionRow.tsx)
        └─ Hook (hooks/useCredits.ts → useCollectionQueue, useCollectionFollowUp, useSetCollectionFollowUp, useMarkCollectionContacted)
              └─ DB fn (database/credits.ts → getCollectionQueue, getCollectionFollowUp, setCollectionFollowUp, markCollectionContacted)
                    └─ SQL on customers / credit_transactions / collection_followups
```

Money formatting goes through `formatPesos` / `parsePesosInput` in `lib/money.ts`. Money is integer pesos (existing invariant).

## Files

### New files

| File                                             | Purpose                                                                                                    |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `database/migrations.ts` (append)                | New `if (currentVersion < 17)` block creating `collection_followups` + indexes; `PRAGMA user_version = 17` |
| `database/credits.ts` (append)                   | `getCollectionQueue`, `getCollectionFollowUp`, `setCollectionFollowUp`, `markCollectionContacted`          |
| `types/credits.types.ts` (append)                | `CollectionQueueRow`, `CollectionFollowUp`, `CollectionQueueParams`                                        |
| `hooks/useCredits.ts` (append)                   | `useCollectionQueue`, `useCollectionFollowUp`, `useSetCollectionFollowUp`, `useMarkCollectionContacted`    |
| `app/(tabs)/customers/collection.tsx`            | New sub-tab route                                                                                          |
| `components/customers/CollectionTab.tsx`         | List + search + bucket headers                                                                             |
| `components/customers/CollectionRow.tsx`         | Per-row UI (avatar, name, balance, overdue chip, follow-up chip, Mark contacted, Record payment CTA)       |
| `components/customers/CollectionRowSkeleton.tsx` | Optional list-row skeleton (thin wrapper over `CustomersSkeleton`)                                         |
| `components/customers/CollectionErrorState.tsx`  | Error UI with retry (calls `query.refetch()`)                                                              |
| `tests/database/collection-queue.test.ts`        | `getCollectionQueue` coverage                                                                              |
| `tests/database/collection-followups.test.ts`    | Write-fn coverage                                                                                          |
| `hooks/__tests__/useCollectionQueue.test.ts`     | Hook query-key / staleTime / invalidation coverage                                                         |
| `hooks/__tests__/useCollectionFollowUp.test.ts`  | Hook id-parsing coverage                                                                                   |

### Modified files (small additions)

| File                                             | Change                                                                                                                                                                                                                                                                            |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `constants/tabs.ts`                              | Append `'collection'` to `CUSTOMERS_SUB_TABS` (line 54).                                                                                                                                                                                                                          |
| `app/(tabs)/customers/_layout.tsx`               | Add `<TopTabs.Screen name="collection" />`. Extend `getCurrentTab` switch (line 24–27). Extend `isDetailScreen` exclusion list (line 32–36).                                                                                                                                      |
| `components/customers/CustomersHeader.tsx`       | Append `{ key: 'collection', label: 'COLLECTION', badgeCount: overdueCount }` to the `tabs` array (line 31–34).                                                                                                                                                                   |
| `components/customers/index.ts`                  | Re-export `CollectionTab`, `CollectionRow`, `CollectionRowSkeleton`, `CollectionErrorState`.                                                                                                                                                                                      |
| `components/more/MoreHomeScreen.tsx`             | Change `routes.collection` from `/(tabs)/customers/credit` to `/(tabs)/customers/collection`.                                                                                                                                                                                     |
| `hooks/useCredits.ts`                            | Add `qc.invalidateQueries({ queryKey: ['collection-queue'] })` to `onSuccess` of `useInsertPayment`, `useDeletePayment`, `useInsertCredit`, `useDeleteCredit`, `useMarkAllCreditsAsPaid`, `useUpdateCreditStatus`, `useInsertCustomer`, `useUpdateCustomer`, `useDeleteCustomer`. |
| `locales/en/utang.json`, `locales/tl/utang.json` | Add ~22 keys (see Section 4 below).                                                                                                                                                                                                                                               |

## Data layer

### Migration v16 → v17 (`database/migrations.ts` append)

```sql
CREATE TABLE IF NOT EXISTS collection_followups (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id     INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  follow_up_by    TEXT,
  contacts_today  INTEGER NOT NULL DEFAULT 0,
  last_contact_at TEXT,
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_collection_followups_customer_id
  ON collection_followups(customer_id);
CREATE INDEX IF NOT EXISTS idx_collection_followups_status_follow_up_by
  ON collection_followups(status, follow_up_by);
```

Wrapped in `db.withTransactionAsync`, ends with `PRAGMA user_version = 17`. Pattern follows v16 (Utang Guardrails, migrations.ts:557-611).

### New types (`types/credits.types.ts`)

```ts
export interface CollectionQueueRow {
  customerId: number;
  name: string;
  phone: string | null;
  photoUri: string | null;
  creditLimit: number | null;
  balance: number;
  availableCredit: number | null;
  oldestUnpaidDueDate: string | null;
  overdueDays: number;
  overdueThresholdDays: number;
  isNearLimit: boolean;
  nearLimitPctUsed: number;
  bucket: "overdue" | "near_limit" | "oldest_balance";
  followUp: {
    followUpBy: string | null;
    contactsToday: number;
    lastContactAt: string | null;
  } | null;
}

export interface CollectionQueueParams {
  overdueDays?: number;
  nearLimitPct?: number;
}

export interface CollectionFollowUp {
  customerId: number;
  followUpBy: string | null;
  contactsToday: number;
  lastContactAt: string | null;
  status: "open" | "closed";
}
```

### New DB functions (`database/credits.ts`, appended after `getCustomerCreditSummary`)

**`getCollectionQueue({ overdueDays = 1, nearLimitPct = 0.2 }): Promise<CollectionQueueRow[]>`**

SQL strategy:

- Outer SELECT over `customers c` joined with a per-customer aggregate that mirrors `getAllCustomers` (credits.ts:216-229) for `total_credits`, `total_payments`, `outstanding_balance` (the canonical `SUM(amount - amount_paid)` over `status != 'paid'`).
- JOIN over a per-customer overdue aggregate (mirrors `getCustomerCreditSummary` credits.ts:855-866) for `MIN(due_date)` and `MAX(CAST(julianday('now') - julianday(due_date) AS INTEGER))`.
- LEFT JOIN `collection_followups` on `customer_id`.
- WHERE `outstanding_balance > 0` (per Q4).
- Compute `bucket` and `nearLimitPctUsed` in JS (so `nearLimitPct` parameter is honored):
  - `nearLimitPctUsed = creditLimit != null && creditLimit > 0 ? balance / creditLimit : 0`
  - `isNearLimit = creditLimit != null && (1 - nearLimitPctUsed) <= nearLimitPct`
  - `bucket = overdueDays >= overdueDays ? 'overdue' : isNearLimit ? 'near_limit' : 'oldest_balance'`
- Sort: `bucket` priority (overdue → near_limit → oldest_balance), then within bucket:
  - overdue: `overdueDays DESC`
  - near_limit: `nearLimitPctUsed DESC`
  - oldest_balance: `last_transaction_date ASC NULLS FIRST`

Indexes hit: `idx_credit_transactions_status_date` (composite, v6), `customers` PK, the new `idx_collection_followups_customer_id`.

**`getCollectionFollowUp(customerId): Promise<CollectionFollowUp | null>`** — simple SELECT.

**`setCollectionFollowUp({ customerId, followUpBy }): Promise<void>`** — upsert: `INSERT OR IGNORE` then `UPDATE`, wrapped in `db.withTransactionAsync`. Sets `status='open'` on create.

**`markCollectionContacted(customerId): Promise<void>`** — wrapped in `db.withTransactionAsync`:

- Read current row (or create with `INSERT OR IGNORE`).
- If `last_contact_at` matches today (local) → `contacts_today = contacts_today + 1`.
- Else → `contacts_today = 1`, `last_contact_at = CURRENT_TIMESTAMP`.
- Sets `status = 'closed'`.

## Hooks + screen

### New hooks (`hooks/useCredits.ts`, appended)

- `useCollectionQueue(params?, opts?)` — query key `['collection-queue', params]`, `staleTime: 60_000`, mirrors `useCustomerCreditSummary`.
- `useCollectionFollowUp(customerId?, opts?)` — parses int from string id, `staleTime: 30_000`, `enabled: !!parsed`.
- `useSetCollectionFollowUp()` — mutation. `onSuccess` invalidates `['collection-queue']` and `['collection-follow-up', vars.customerId]`. Success toast (`'Follow-up updated'`).
- `useMarkCollectionContacted()` — mutation. Same invalidation. No toast (owner just tapped it).

### Invalidations added to existing mutations (one line each)

Append `qc.invalidateQueries({ queryKey: ['collection-queue'] })` to `onSuccess` of:
`useInsertPayment`, `useDeletePayment`, `useInsertCredit`, `useDeleteCredit`, `useMarkAllCreditsAsPaid`, `useUpdateCreditStatus`, `useInsertCustomer`, `useUpdateCustomer`, `useDeleteCustomer`.

### Sub-tab wiring

- `constants/tabs.ts:54` — `CUSTOMERS_SUB_TABS = ['all', 'credit', 'collection'] as const`.
- `app/(tabs)/customers/_layout.tsx` — add `<TopTabs.Screen name="collection" />`, extend `getCurrentTab` switch and `isDetailScreen` exclusion.
- `components/customers/CustomersHeader.tsx` — append `{ key: 'collection', label: 'COLLECTION', badgeCount: overdueCount }` to the `tabs` array. The badge wiring is already proven on the `credit` sub-tab.
- `components/more/MoreHomeScreen.tsx` — repoint `routes.collection` to `/(tabs)/customers/collection`.

### Components

- `app/(tabs)/customers/collection.tsx` — thin wrapper, mirrors `credit.tsx`.
- `components/customers/CollectionTab.tsx` — search input + `FlatList` rendering `CollectionRow`. `useCollectionQueue()` + local `useMemo` for case-insensitive substring filter on `name`/`phone`. Bucket headers are inline section labels inside the FlatList (single scroll, preserves bucket order).
- `components/customers/CollectionRow.tsx` — left column: avatar + name + phone. Right column: balance pill (red when overdue, cinnamon otherwise), `Overdue · N days` chip (only when `overdueDays > 0`), follow-up chip (3 visual states — Set / Past-due / Contacted today), `Mark contacted` text-button, trailing `Record payment` CTA. Tapping the row opens details via `router.push('/(edit-forms)/credit-details/${id}')`. Tapping `Record payment` calls `router.push('/(edit-forms)/add-payment/${id}')` — reuses existing add-payment flow exactly.
- `components/customers/CollectionErrorState.tsx` — retry button calling `query.refetch()`.

## i18n

Add to `locales/en/utang.json` and `locales/tl/utang.json` (namespace `utang`):

`collectionEyebrow`, `collectionTitle`, `collectionSearchPlaceholder`, `collectionBucketOverdue`, `collectionBucketNearLimit`, `collectionBucketOldestBalance`, `collectionRowRecordPayment`, `collectionRowOpenDetails`, `collectionFollowUpSet` (`{{date}}`), `collectionFollowUpOverdue` (`{{date}}`, `{{days}}`), `collectionFollowUpContactedToday` (`{{count}}`), `collectionFollowUpNone`, `collectionFollowUpSheetTitle`, `collectionFollowUpToday`, `collectionFollowUpTomorrow`, `collectionFollowUpIn3Days`, `collectionFollowUpInAWeek`, `collectionFollowUpPickDate`, `collectionFollowUpClear`, `collectionMarkContactedA11y` (`{{name}}`), `collectionEmptyTitle`, `collectionEmptyDescription`, `collectionOverdueChip` (`{{days}}`), `collectionNearLimitChip`, `collectionToastFollowUpUpdated`.

Tagalog strings drafted during implementation using the same conversational register as `subtitleOverdue*` keys. No changes to `common.json` — `moreHomeTileCollection` already matches.

## Error handling

- **Read errors** — TanStack Query surfaces via `error` in `useCollectionQueue`. `CollectionErrorState` shows i18n message + retry button.
- **Write errors** — `useSetCollectionFollowUp.onError` and `useMarkCollectionContacted.onError` call `addToast({ variant: 'error' })`. No rollback needed (upserts).
- **Stale deep-link** — `useAddPaymentForm` already returns `null` if the customer no longer exists; no new code.
- **Date arithmetic** — SQL `julianday` for `overdueDays` (proven in `getCustomerCreditSummary:859-866`). JS `Date.parse` for chip comparisons. `contacts_today` reset uses `new Date().toDateString()` (same approach as `classifyOverdue` in `lib/creditDetails.ts`).

## Accessibility

- Follow-up chip is a `Pressable` with `accessibilityRole="button"` and a state-dependent `accessibilityLabel` (`collectionFollowUpSet` / `collectionFollowUpOverdue` / `collectionFollowUpContactedToday`).
- `Mark contacted` and `Record payment` CTAs are sibling `Pressable`s (not nested) — separate focus targets.
- Bucket headers use `accessibilityRole="header"` for section navigation.
- Color never the only signal: overdue and near-limit communicate via copy + chip + pill (WCAG 1.4.1).
- Hit targets use the existing `min-h-11` (44pt) wrapper from `CreditsCustomerCard` / `CustomerHeroCard`.

## Reused code & functions

| Need                                            | Reuse                                                                      | Path                                                                                                     |
| ----------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Outstanding balance SQL                         | `getOutstandingBalance` body                                               | `database/credits.ts:92`                                                                                 |
| Per-customer balance + last_transaction join    | SELECT inside `getAllCustomers`                                            | `database/credits.ts:216-229`                                                                            |
| Overdue aggregate (MIN due_date + days_overdue) | SELECT inside `getCustomerCreditSummary`                                   | `database/credits.ts:855-866`                                                                            |
| Add-payment deep-link                           | URL contract                                                               | `app/(edit-forms)/add-payment/[id].tsx`, callers at `credit-details/[id].tsx:101,109`                    |
| TopTabs + SubTabControl + page-progress wiring  | Reference pattern                                                          | `app/(tabs)/customers/_layout.tsx`, `hooks/useTabProgress.ts`, `components/navigation/SubTabControl.tsx` |
| Hook + invalidation pattern                     | Reference patterns                                                         | `hooks/useCredits.ts:416-430` (`useCustomerCreditSummary`), `:267-306` (`useInsertPayment`)              |
| Empty state                                     | `CustomersEmptyState` (props accept title/description overrides)           | `components/customers/CustomersEmptyState.tsx`                                                           |
| Skeleton                                        | `CustomersSkeleton` (reuse directly, wrap if needed)                       | `components/customers/CustomersSkeleton.tsx`                                                             |
| Customer avatar with initials fallback          | `CustomerAvatar`                                                           | `components/customers/CustomerAvatar.tsx`                                                                |
| Money formatting                                | `formatPesos`                                                              | `lib/money.ts`                                                                                           |
| Toast                                           | `useToastStore`                                                            | `stores/`                                                                                                |
| Add-payment pre-selection                       | `useAddPaymentForm` already handles `id` + optional `creditId`             | `components/utang/add-payment/useAddPaymentForm.ts:67-71`                                                |
| Customer row tap → details                      | Same `router.push` pattern used by `AllCustomersTab` and `CreditLedgerTab` | `components/customers/AllCustomersTab.tsx`, `CreditLedgerTab.tsx`                                        |

## Verification

### Automated

- `npm run typecheck` — clean.
- `npm run lint` — clean.
- `npm test -- tests/database/collection-queue.test.ts` — pass.
- `npm test -- tests/database/collection-followups.test.ts` — pass.
- `npm test -- hooks/__tests__/useCollectionQueue.test.ts` — pass.
- `npm test -- hooks/__tests__/useCollectionFollowUp.test.ts` — pass.
- `npm run verify` — typecheck + all tests, clean.

Test coverage:

**`getCollectionQueue`:** empty store; only-paid customers excluded; overdue bucket + threshold honored; near-limit + threshold honored; no `credit_limit` falls into `oldest_balance`; follow-up LEFT JOIN present and null; bucket ordering (overdue > near_limit > oldest); within-overdue sort; within-near-limit sort; within-oldest-balance sort.

**Write fns:** create on no row; update preserves other fields; clear `follow_up_by`; `markCollectionContacted` increments same-day, resets next-day; transactional integrity under forced mid-write error.

**Hooks:** query-key includes params; int parsing; `enabled` flag; `staleTime`; invalidation fires from `useInsertPayment` mock.

### Manual smoke (Expo dev client)

1. Fresh install → confirm `PRAGMA user_version = 17`.
2. Upgrade from v16 → confirm v17 migration runs cleanly.
3. Customers tab shows three sub-tabs. Tap Collection. Empty state renders when no outstanding balances.
4. Seeded data: overdue rows under **Overdue**, near-limit under **Near limit**, oldest under **Longest outstanding**. Bucket headers visible.
5. Search filters within bucket order.
6. Tap follow-up chip → action sheet → pick "Tomorrow" → chip updates to "Follow up by Aug 12" (today is 2026-08-11).
7. Tap "Mark contacted" → soft-grey chip "Contacted today · 1x". Tap again → "2x". `collection_followups.contacts_today` matches.
8. Tap "Record payment" on an overdue row → `add-payment` opens with customer pre-selected, FIFO receipt visible. Enter ₱100, submit. Queue auto-refreshes, balance reduced, row re-buckets or drops out.
9. Delete customer from details → queue refetches, row gone.
10. Toggle device language to Filipino → all Collection copy in Tagalog.
11. VoiceOver/TalkBack pass — bucket headers announce as headings, row announces name + balance + overdue, CTAs focusable independently.
12. All and Credit sub-tabs still render correctly (no regression from `_layout.tsx` change).
