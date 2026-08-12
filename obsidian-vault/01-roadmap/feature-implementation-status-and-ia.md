# SariSari — Feature Status & Information Architecture

> Audit performed 2026-08-06 against the working tree.
> Read this before adding routes, moving screens, or planning a new feature so you don't duplicate work or scatter related screens across unrelated groups.
> For the planned release sequence, see
> [[project-roadmap|SariSari Feature Release Roadmap]].

---

## 1. The 18-Feature Backlog (current status)

Source: `docs/features/index.md` (in Tagalog) plus the matching `01..18-*.md` detail files.

Status legend:

- **Done** — every In Scope item from the feature doc has a working screen, hook, and DB function.
- **Partial** — the data layer and most hooks are present, but at least one In Scope item is missing or stubbed.
- **Not started** — no schema, no hook, no route exists for the feature.

| #   | Feature                                 | Status               | Phase |
| --- | --------------------------------------- | -------------------- | ----- |
| 1   | POS Fast Lane                           | Done                 | Now   |
| 2   | Parked Sales                            | Done                 | Now   |
| 3   | Daily Cash Close-Out                    | Done                 | Now   |
| 4   | Physical Stocktake                      | Done                 | Now   |
| 5   | Utang Guardrails at Checkout            | Done                 | Now   |
| 6   | Collection Queue                        | Done                 | Now   |
| 7   | Safe Voids / Refunds / Corrections      | Not started          | Next  |
| 8   | Supplier Delivery Receiving             | Partial              | Next  |
| 9   | Offline Reorder Suggestions             | Done                 | Next  |
| 10  | Stock Movement Timeline                 | Done                 | Next  |
| 11  | Owner PIN for Sensitive Actions         | Not started          | Next  |
| 12  | Customer Credit Statements (PDF)        | Done                 | Next  |
| 13  | Expiry & Damaged Goods Tracking         | Partial              | Later |
| 14  | Transparent Local Store Insights        | Partial              | Later |
| 15  | Smarter but Explainable Credit Profiles | Partial              | Later |
| 16  | Shift Tracking on One Device            | Not started          | Later |
| 17  | Manual Backup & Restore                 | Done (Drive variant) | Later |
| 18  | Offline Price-Label & Barcode Sheets    | Not started          | Later |

**Tally:** 10 Done · 4 Partial · 4 Not started.

---

## 2. Per-feature implementation map

For each feature: which routes, hooks, and DB files back it, and what is missing.

### 2.1 POS Fast Lane — Done

- **Routes:** `app/(tabs)/sales/pos.tsx`
- **Hooks:** `hooks/useProducts.tsx` (`useFastLaneProducts`, `useToggleFavorite`, `usePaginatedProducts`); `hooks/useBarcodeResolver.tsx`
- **DB:** `database/products.ts` (`getFastLaneProducts` CTE merging `is_favorite` + 14-day top sellers; `toggleProductFavorite`); columns `is_favorite` and `last_sold_at` are on the products table
- **Components:** `components/sales/pos/ProductSearchCatalog.tsx` (in-POS strip); `components/sales/pos/FastLaneSection.tsx` + `FastLaneCard.tsx` (common-qty chips `+1/+2/+5` and favorite toggling); `components/ui/BarcodeScannerModal.tsx`; `components/sales/pos/useCart.ts` (scan-to-add path)
- **Notes:** Fast Lane strip with `+1/+2/+5` quick quantity chips and debounced search input (250ms) are fully integrated into the live POS screen.

### 2.2 Parked Sales — Done

- **Routes:** `app/(tabs)/sales/pos.tsx` (integrated into POS screen)
- **Hooks:** `hooks/useParkedCarts.ts` (`useParkedCarts`, `validateParkedCartItems`); `hooks/useProducts.ts` (for product validation during resume)
- **DB:** `database/parkedCarts.ts` — `parked_carts` table with `parkCart`, `getParkedCarts`, `discardParkedCart`, `cleanupExpiredCarts` functions; migration v10 in `database/migrations.ts`
- **Components:** `components/sales/pos/parked/ParkCartModal.tsx`, `components/sales/pos/parked/ParkedCartsListModal.tsx`, `components/sales/pos/parked/ActiveCartConflictModal.tsx`; integrated into `app/(tabs)/sales/pos.tsx` and `components/sales/pos/ProductSearchCatalog.tsx` (parked carts count display)
- **Notes:** Complete implementation with 3-cart limit, 24-hour expiration, stock/price validation on resume, and conflict resolution for active carts. Replaces in-memory only cart persistence with durable SQLite storage.

### 2.3 Daily Cash Close-Out — Done

- **Routes:** `app/(edit-forms)/cash-session/index.tsx`, `app/(edit-forms)/cash-entry/index.tsx`, `app/gastos-kaha/index.tsx`
- **Hooks:** `hooks/useCash.tsx` — `useOpenSession`, `useCloseSession`, `useInsertCashEntry`, `useDeleteCashEntry`, `useCashSessions`, `useCashEntries`, `useCurrentSession`, `useCashSessionSummary`
- **DB:** `database/cash.ts` — `cash_sessions` (opening float / status / actual / expected / variance / closing_timestamp) and `cash_entries` (expense / owner_drawing / owner_addition) with reason codes; `getCashSessionSummary` derives `expectedCash = openingFloat + cashSales + cashPayments + ownerAdditions − expenses − ownerDrawings` inside a transaction
- **Components:** `components/cash-session/*` (`OpenSessionView`, `ActiveSessionSummaryCard`, `CloseSessionFormCard`, `CashMovementsList`, `CashSessionHeader`), `components/cash-entry/*` (`CashEntryTypeCard`, `CashEntryDetailsCard`)
- **Notes:** All spec items present. Spec used "cash_in / cash_out" but the impl uses the enum `expense / owner_addition / owner_drawing` — semantically equivalent.

### 2.4 Physical Stocktake — Done

- **Routes:** `app/(tabs)/inventory/stocktake.tsx`
- **Hooks:** `hooks/useStocktake.ts` (`useActiveStocktakeSession`, `useStocktakeHistory`, `useStartStocktake`, `useUpsertStocktakeCount`, `useCommitStocktake`, `useAbandonStocktake`)
- **DB:** `database/stocktake.ts` — `stocktake_sessions` (`id`, `started_at`, `ended_at`, `status`, `note`) and `stocktake_counts` (`id`, `session_id`, `product_id`, `expected_qty`, `counted_qty`, `reason_code`, `note`, `committed_at`) tables; migration in `database/migrations.ts`. `commitStocktake` creates `inventory_transactions` (`type = 'adjustment'`) inside a transaction via `withTransactionAsync`.
- **Components:** `components/inventory/stocktake/*` (`StocktakeBanner.tsx`, `StocktakeCategorySection.tsx`, `StocktakeHistoryList.tsx`, `StocktakeStartCard.tsx`, `StocktakeVarianceRow.tsx`); integrated into `app/(tabs)/inventory/_layout.tsx` and `components/inventory/InventoryHeader.tsx`
- **Notes:** Category-by-category guided stocktake flow with expected vs counted variance tracking, monetary impact computation, reason coding per item, atomic transaction execution on commit, active session locking banner, and full audit history.

### 2.5 Utang Guardrails at Checkout — Done

- **Spec:** `docs/superpowers/specs/2026-08-11-utang-guardrails-at-checkout-design.md` — implementation plan: `docs/superpowers/plans/2026-08-11-utang-guardrails-at-checkout.md`
- **Routes:** `app/(edit-forms)/add-credit/[id].tsx`, `app/(edit-forms)/add-sales/index.tsx`, `app/(edit-forms)/credit-details/[id].tsx`
- **Hooks:** `hooks/useCredits.ts` — `useCustomerCreditSummary(id)` (TanStack Query, 1-minute stale time, invalidated by `useInsertCredit` and `useInsertPayment`)
- **DB:** `database/migrations.ts` — v16 adds `customers.block_on_exceed`, `customers.overdue_threshold_days` (default 30), `sales.override_reason_code`, `sales.override_reason_note`, `credit_transactions.override_reason_code`, `credit_transactions.override_reason_note`. `database/credits.ts` — `getCustomerCreditSummary(customerId)` returns `{ customerId, balance, creditLimit, availableCredit, blockOnExceed, oldestUnpaidDueDate, overdueDays, overdueThresholdDays, isOverdue, isNearLimit, wouldExceedLimit }`. `isNearLimit` / `wouldExceedLimit` derived in JS (caller projects `pendingTotal`). `database/sales.ts` + `database/credits.ts` — `insertSale` and `insertCreditTransaction` thread the override fields to both `sales` and `credit_transactions` rows for audit.
- **Components:** `components/utang/credit-guardrails/SukiPanel.tsx` (compact / detailed modes, projects `pendingTotal`, renders near-limit amber chip, soft "Over limit by" warning, and hard block banner with override CTA), `OverrideReasonModal.tsx` (5 codes: `regular_customer | long_term_suki | partial_payment_promised | owner_discretion | other`; `other` reveals a free-text note input), `OverrideReasonLabel.tsx`, `index.ts`.
- **Screen integrations:**
  - `app/(edit-forms)/add-credit/[id].tsx` — `<SukiPanel>` above the ticket sheet; soft-warn modal offers "Continue without override" or "Record override reason"; override modal chooses the reason code/note and forwards to `insertCredit`.
  - `app/(edit-forms)/add-sales/index.tsx` — `<SukiPanel>` rendered only on the credit path when a real customer object is selected; same soft-warn / override flow.
  - `app/(edit-forms)/credit-details/[id].tsx` — `<SukiPanel mode="detailed">` rendered below `<CustomerHeroCard>` so the live balance/limit/overdue state is visible alongside the per-credit ticket / payments / history tabs.
- **Guardrail semantics:** warn-soft (amber/soft red, proceeds without override) when the projected available would go below zero and `block_on_exceed = 0`; block-hard (submit disabled, must record a reason) when `block_on_exceed = 1` and no override is set yet.
- **Caveat:** The plan's test files (`tests/database/migrations-v16.test.ts`, `tests/database/get-customer-credit-summary.test.ts`, `tests/database/insert-credit-with-override.test.ts`, `tests/database/insert-sale-with-override.test.ts`, `tests/components/utang/SukiPanel.test.tsx`, `tests/components/utang/OverrideReasonModal.test.tsx`) were not created. The code is shipped and consistent with the spec, but the implementation has no regression coverage added for this feature. Follow-up: port the test bodies from the plan into the `tests/` directory before the next refactor of the credits or sales write paths.

### 2.6 Collection Queue — Done

- **Routes:** `app/(tabs)/customers/collection.tsx` (renders `CollectionTab`), `app/(edit-forms)/credit-details/[id].tsx`, `app/(edit-forms)/add-payment/[id].tsx`. `app/(tabs)/customers/credit.tsx` (legacy `CreditLedgerTab`) is still mounted as a separate sub-tab and serves a different surface (all-debtors list by balance/name) — IA cleanup deferred.
- **Hooks:** `hooks/useCredits.ts` — `useCollectionQueue`, `useSetCollectionFollowUp`, `useMarkCollectionContacted`; `useCreditKPIs` for hero KPIs. Queue is invalidated by `useInsertCredit` and `useInsertPayment` (commit `f1a20ad`).
- **DB:** `database/migrations.ts` — v17 creates `collection_followups` (id, customer_id FK with unique index, follow_up_by, contacts_today, last_contact_at, status `open|closed`, timestamps); v18 collapses duplicate rows and switches the customer index to UNIQUE so one row per customer. `database/credits.ts` — `getCollectionQueue({ overdueDays, nearLimitPct })` returns `CollectionQueueRow[]` with three buckets (`overdue | near_limit | oldest_balance`) and sort within bucket; `getCollectionFollowUp`, `setCollectionFollowUp`, `markCollectionContacted` round out the follow-up surface. FIFO allocation via `payment_allocations` is unchanged and reused by the queue's "Record payment" path.
- **Components:** `components/customers/CollectionTab.tsx` (sectioned list + search), `components/customers/CollectionRow.tsx` (balance / overdue / near-limit chips + follow-up chip + mark-contacted button + record-payment button), `components/customers/CollectionErrorState.tsx`, `components/customers/CustomersSkeleton.tsx`, `components/customers/CustomersEmptyState.tsx`.
- **i18n:** `locales/en/utang.json` — 36 new keys (`collectionEyebrow`, `collectionTitle`, `collectionSearchPlaceholder`, `collectionBucketOverdue`, `collectionBucketNearLimit`, `collectionBucketOldestBalance`, `collectionRowRecordPayment`, `collectionRowOpenDetails`, `collectionRowOpenDetailsHint`, `collectionRowRecordPaymentHint`, `collectionRowMarkContacted`, `collectionRowMarkContactedHint`, `collectionFollowUpSet`, `collectionFollowUpOverdue`, `collectionFollowUpContactedToday`, `collectionFollowUpNone`, `collectionFollowUpSheetTitle`, `collectionFollowUpToday`, `collectionFollowUpTomorrow`, `collectionFollowUpIn3Days`, `collectionFollowUpInAWeek`, `collectionFollowUpPickDate`, `collectionFollowUpClear`, `collectionFollowUpCancel`, `collectionMarkContactedA11y`, `collectionEmptyTitle`, `collectionEmptyDescription`, `collectionSearchEmptyTitle`, `collectionSearchEmptyDescription`, `collectionErrorTitle`, `collectionErrorDescription`, `collectionErrorRetry`, `collectionErrorRetryHint`, `collectionOverdueChip`, `collectionNearLimitChip`, `collectionToastFollowUpUpdated`).
- **Accessibility:** accessibilityRole / accessibilityLabel / accessibilityHint on every interactive row element; "Try again" hint added in commit `e76b805`.
- **Spec reconciliation:** All five In Scope items from `obsidian-vault/02-Features/06-collection-queue.md` are wired. One semantic drift to flag: the spec's "mga araw mula huling bayad" (days since last payment) is rendered as `lastTransactionDate` (last unpaid credit transaction date), not last payment date. Query in `database/credits.ts:954` reads `MAX(ct2.date)` from `credit_transactions`, not `payments`. In practice this is usually right and a downstream polish item, not a Done-blocker.
- **Caveat — missing tests:** Following the project precedent set by Feature 5 (Utang Guardrails), no regression tests were added for `getCollectionQueue` bucket ranking, `setCollectionFollowUp` insert-or-update, `markCollectionContacted` counter logic, or the `<CollectionRow>` chip state machine. The release gate is closed by manual on-device smoke. Action: porter the planned test bodies (or write fresh ones against the current code) into `tests/` before the next refactor of the credits write paths.
- **IA follow-up:** The roadmap's §7.1 step 5 "rename `credit.tsx` → `collection.tsx`" pre-dated the merge. Post-merge, `credit` and `collection` are two separate sub-tabs with different jobs (legacy all-debtors list vs. priority queue). Rename is no longer the right move; consider deprecating the legacy `CreditLedgerTab` separately.

### 2.7 Safe Voids / Refunds / Corrections — Not started

- **Routes:** `app/(edit-forms)/sale-details/[id].tsx` (footer has only a `Delete Sale` action)
- **Hooks:** `hooks/useSales.tsx` exposes `useDeleteSale` only
- **DB:** `database/sales.ts:458-507` (`deleteSale` wraps in transaction, restores stock, deletes credit txn — accidentally compliant with the spirit of void/refund). No `sale_corrections` table, no `cancelled_at` column, no dedicated `voidSale / refundSale / correctSalePrice`
- **Components:** `components/sales/sale-details/SaleDetailsFooter.tsx` (trash button only)
- **Notes:** Repo grep for `voidSale | refundSale | cancelSale | price_correction` matches only the feature doc.

### 2.8 Supplier Delivery Receiving — Partial

- **Routes:** None (no dedicated delivery-receiving screen)
- **Hooks:** `hooks/useStockMutations.ts` — `useReceiveStock({productId, qty, unitCost, supplierId, note})` writes `inventory_transactions` with `type='restock'`
- **DB:** `database/suppliers.ts` (full CRUD + product link); `database/products.ts` (`products.supplier_id`). **No** `delivery_receipts` / `delivery_receipt_lines` tables; **no** shortage detection UI; **no** `invoice_no` or receipt-photo capture
- **Components:** `components/inventory/modals/RestockSheet.tsx` (one-product-at-a-time restock with quantity, unit cost, supplier picker, note) wired into `app/(tabs)/inventory/products.tsx`
- **Gaps:** Only per-product single-line restock exists. Missing the spec's header (supplier + invoice + photo) → lines (expected vs received + shortage) flow, shortage report, and commit-deduplication guarantee.

### 2.9 Offline Reorder Suggestions — Done

- **Routes:** `app/inventory/recommendations.tsx` (independent route, **orphaned** — not under `(tabs)/inventory/`)
- **Hooks:** `hooks/useStockIntelligence.tsx` — `useStockRecommendations`, `useSaveReorderPlan`, `useDeleteReorderPlan`
- **DB:** `database/stock-intelligence.ts` — `reorder_plans` table with statuses `adjusted | deferred | dismissed`; `listReorderRecommendations` reads 28-day sales, classifies `out_of_stock | low_stock | slow_mover | watch_item`, computes `suggestedQuantity = ceil(7 * sales28d / 28) − currentStock`, ranks by preferred supplier
- **Components:** `app/inventory/recommendations.tsx` itself (Reorder / Slow Movers / Watch List / Saved Plans tabs)
- **Notes:** Spec wanted `target_stock_level` / `velocity_drop` columns; impl uses 28-day rolling average with a slow-mover flag — semantically equivalent fulfillment, column nomenclature diverges.

### 2.10 Stock Movement Timeline — Done

- **Routes:** `app/(tabs)/inventory/movements.tsx` (global), `app/(edit-forms)/inventory-ledger/[productId].tsx` (per-product)
- **Hooks:** `hooks/useInventory.tsx` — `useInventoryTransactionsByProduct`, `useGetInventoryTransactions`, `useGetInventoryTransactionsByDateRange`, `usePaginatedInventoryTransactions`
- **DB:** `database/inventory.ts` — full `inventory_transactions` (restock / sale / damaged / adjustment with `adjustment_sign`, `note`, `unit_cost`, `supplier_id`); `getInventoryTransactionsByProductAndDateRange` powers the per-product timeline
- **Components:** `components/inventory/ledger/{LedgerList,LedgerHero,LedgerToolbar,LogTransactionForm,DayHeader,MovementChip}.tsx`
- **Notes:** No global timeline per spec ("per-product is sufficient for v1"). The "linked sale" affordance is implicit — adjustment rows carry a `note` referencing the reason.

### 2.11 Owner PIN for Sensitive Actions — Not started

- **Routes:** None
- **Hooks:** None — no `useAuth`, no `stores/auth.ts`
- **DB:** No `auth_settings` table. PRAGMA `user_version` is 14 (`database/migrations.ts:493`); no migration adds PIN storage
- **Components:** None
- **Notes:** None of the gated actions (voids, price correction, credit-limit override, large discount, dev reset) check a PIN. The `app/(tabs)/dev/reset.tsx` referenced by the spec also does not exist under `app/(tabs)/`.

### 2.12 Customer Credit Statements (PDF) — Done

- **Routes:** Entry from `app/(edit-forms)/credit-details/[id].tsx` (Statement share button)
- **Hooks:** `hooks/useCredits.tsx` (credits / payments / insights backing data)
- **DB:** Reuses `credit_transactions` / `payments`; no new table needed. Aggregation logic in `lib/creditDetails.ts:buildStatement` (line 214)
- **Components:** `components/utang/credit-details/StatementShareButton.tsx` (Text vs PDF via native Share); `lib/pdfGenerator.ts` (`shareCreditStatementPdf` / `buildStatementHtml`) renders HTML-to-PDF and shares via `expo-print` + `expo-sharing`
- **Notes:** Date range defaults to "all outstanding" (spec wanted 30d / last-statement — small drift).

### 2.13 Expiry & Damaged Goods Tracking — Partial

- **Routes:** None — no dedicated near-expiry screen
- **Hooks:** `hooks/useStockMutations.ts` — `useRecordDamaged({productId, qty, note})` writes `type='damaged'` rows
- **DB:**
  - **No** `perishable` flag column on `products`.
  - **No** `expiry_date` column on `products`. The `ProductLike` interface in `types/inventory.types.ts` mentions `expiry_date?` but the DB schema doesn't include it. The `near_expiry` filter in `database/products.ts:371` is a misnamed wholesale-unit filter.
  - **No** `damaged_goods_log` table.
  - `inventory_transactions` supports `type='damaged'` but lacks `reason_code`.
- **Components:** `components/inventory/stock/StockFilterChips.tsx` mentions `near_expiry` as a chip but it filters wholesale-units instead. `ProductStatusChip.tsx` derives `near_expiry` only when `product.expiry_date` is set (never populated today).
- **Gaps:** No near-expiry list, no perishable flag in product form (`BasicInfoCard.tsx` has none), no damaged-goods money-impact report.

### 2.14 Transparent Local Store Insights — Partial

- **Routes:** `app/(tabs)/home/today.tsx` (Insights strip), `app/(tabs)/more/reports.tsx` (full Reports), `app/(tabs)/customers/insights.tsx` (customer-side analytics)
- **Hooks:** `hooks/useReports.tsx` — `useReportInsights`, `useLowStockItems`, `useSlowMovingProducts`, `useSalesOverTime`, etc.
- **DB:** `database/reports.ts:getReportInsights` (lines 544-639) computes top performer, low-stock count, highest-credit customer, lowest-sales day. `getSlowMovingProducts`, `useProductProfitability`, `useAgingBuckets` provide supporting signals
- **Components:** `components/reports/{InsightCard,BentoKPICard,AlmanacMasthead,EditorialEyebrow,ProfitabilityRanking,TopProductsList,StockMovementDetails,AgingBucketsChart}.tsx`
- **Gaps:** Four spec signals (recurrent shelf-outs / dead stock / margin changes / suki payment patterns) map only partially — slow-movers ≈ dead stock, aging buckets ≈ payment patterns. No recurrent-shelf-out detection, no margin-change alert, no "why this tip?" drill-through modal.

### 2.15 Smarter but Explainable Credit Profiles — Partial

- **Routes:** `app/(edit-forms)/credit-details/[id].tsx`
- **Hooks:** `hooks/useCredits.tsx` — `useCustomerDetails`, `useCustomerInsights`, `useCustomerFavoriteProduct`, `useCustomerTimeline`
- **DB:** `database/credits.ts` — `getCustomerWithDetails` derives `outstanding_balance`, `days_overdue`, `last_transaction_date`; `getCustomerTimeline` provides chronological activity; `getCustomerInsights` returns top-spenders / loyalty distribution. **`computeCreditProfile`** from spec is **not present** — no formula-based suggested limit, no caps input
- **Components:** `components/utang/credit-details/{CustomerHeroCard,DebtLimitBar,TrustTagPill}.tsx`; `lib/creditDetails.ts:deriveTrustTags` produces `good_payer | frequent_suki | needs_followup`
- **Gaps:** The spec's headline — a system-suggested credit limit with explainer — is **not implemented**. The customer-set `credit_limit` is shown, not a formula-driven suggestion.

### 2.16 Shift Tracking on One Device — Not started

- **Routes:** None
- **Hooks:** None
- **DB:** `database/cash.ts` has `cash_sessions` (one per business date) but no `cashiers` table, no `shifts` table. `actor_user`, `actor_cashier_id` columns do not exist on `sales`, `inventory_transactions`, `cash_entries`, or `sale_corrections`
- **Components:** None — `components/cash-session/*` only shows the day's session
- **Notes:** Daily cash close-out session is implemented (feature 3) but shift-level attribution (which cashier held the drawer) is not.

### 2.17 Manual Encrypted Backup & Restore — Done (Drive variant)

- **Routes:** `app/(tabs)/more/settings.tsx` → `components/settings/SettingsScreen.tsx` (`CloudBackupSection`, `LocalSnapshotsSection`)
- **Hooks:** `hooks/useBackup.tsx` — `useBackupNow`, `useRestoreFromSnapshot`, `useCloudBackups`, `useDriveLinkStatus`, `useLinkGoogleDrive`, `useRestoreFromCloud`, `useCloudNewerStatus`, `useLocalSnapshots`, `useSchedulerInputs`
- **DB:** None — backup is an opaque SQLite file copy per spec
- **Components:** `components/settings/SettingsScreen.tsx`, `components/settings/backup/{CloudBackupSection,CloudNewerBanner,LocalSnapshotsSection,RestorePickerModal,RestoreConfirmDialog}.tsx`. `lib/backup/{snapshots,integrity,restore,metadata,scheduler,syncQueue,googleDrive,bundle,types}.ts`
- **Spec drift:** Spec asked for manual, passphrase-encrypted, files-shared backup with no cloud account. Impl uses Google Drive (OAuth via `expo-auth-session` PKCE) + snapshot integrity + metadata, not a passphrase-derived AES-GCM. Core promises (manual, restore, no auto-sync) are met.

### 2.18 Offline Price-Label & Barcode Sheets — Not started

- **Routes:** None
- **Hooks:** None
- **DB:** None — data is on `products` already
- **Components:** None — repo grep for `labels | barcodeSheet | price-label | renderPriceLabels | renderBarcodeSheet` returns only the feature docs. `lib/pdfGenerator.ts` only handles the credit statement. No barcode font / symbology library bundled
- **Notes:** No `lib/labels.ts`, no PDF label layout, no per-product "show wholesale bar" toggle.

---

## 3. Current routes inventory

```folder
app/
  (tabs)/
    customers/{index, credit, insights}.tsx
    home/{index, today}.tsx
    inventory/{products, movements, stock, analytics, modals}.tsx
    more/{index, reports, settings}.tsx
    sales/{pos, receipts}.tsx
  (edit-forms)/
    add-category/index.tsx
    add-credit/[id].tsx
    add-customer/index.tsx
    add-payment/[id].tsx
    add-product/index.tsx
    add-supplier/index.tsx
    cash-entry/index.tsx
    cash-session/index.tsx
    category/[id].tsx
    credit-details/[id].tsx
    edit-product/[id].tsx
    edit-supplier/[id].tsx
    inventory-ledger/[productId].tsx
    product-details/[id].txz
    sale-details/[id].tsx
  gastos-kaha/index.tsx
  inventory/recommendations.tsx
  modal/{add-customer, add-product, add-sale-note, confirm-action, scan}.tsx
  onboarding/index.tsx
  settings/index.tsx          (277-byte stub)
```

Note: there is **no `app/(tabs)/dev/reset.tsx`** referenced by features 11 and 17. Feature 17's actual setting surface lives at `app/(tabs)/more/settings.tsx`, not the `app/(tabs)/dev/...` path the docs cite.

---

## 4. Information Architecture — current problems

### 4.1 Duplicate surfaces for the same job

- **Cash management** is split across 3 screens: `(edit-forms)/cash-session/`, `(edit-forms)/cash-entry/`, `gastos-kaha/` — all do "log money in/out."
- **Customers** is split across 3: `(tabs)/customers/{index, credit, insights}` — `insights` overlaps with `more/reports`.
- **Settings** is duplicated: `(tabs)/more/settings.tsx` (real) vs `app/settings/index.tsx` (277-byte stub).
- **Add-product / add-customer** exist as both `(edit-forms)/add-product/` and `modal/add-product.tsx`.

### 4.2 Orphaned routes outside the tab tree

- `app/inventory/recommendations.tsx` is outside `(tabs)/inventory/` — it has its own route group, so users have no nav path from a tab. Reorder Suggestions (#9, **Done**) is invisible from Inventory.
- `app/modal/{add-customer, add-product, add-sale-note, confirm-action, scan}.tsx` — most are stubs (40-47 bytes), duplicates of routes already in `(edit-forms)/`.

### 4.3 Inventory is a dumping ground

`(tabs)/inventory/` has 5 sibling screens — `products`, `stock`, `analytics`, `movements`, `modals`. The `modals.tsx` (3.3 KB) is a screen that just hosts modals — that's a layout concern, not a page. `stock.tsx` and `analytics.tsx` overlap with `products.tsx` and `more/reports.tsx`.

---

## 5. Target Information Architecture — 5 tabs, each with a clear job

```folder
�┌─ Home (Today)        Status snapshot · alerts · quick jumps
├─ Sales (POS)         Checkout · cart · suki balance · park cart
├─ Inventory           Products · Movements · Recommendations · Damaged · Labels
├─ Customers (Utang)   People · Collection queue · per-suki profile
�└─ More                Reports · Cash · Backup · Settings (PIN, shifts)
```

### Tab-by-tab — what lives where, and why

**Home (Today)** — `app/(tabs)/home/today.tsx`
Already the dashboard. Add:

- Low-stock & overdue alerts (jump to Inventory / Customers)
- Quick actions: "Close day" → cash session (#3), "View collection queue" (#6), "Reorder suggestions" (#9)
- Insights strip (#14)

This becomes the **command center** — owner opens the app, sees what needs attention, taps once.

**Sales / POS** — `app/(tabs)/sales/pos.tsx`
Stays as-is. Add inline panels for:

- **Suki live balance** (#5 partial) — `CheckoutModal.tsx` should show balance/limit/overdue when a customer is attached. The data already exists in `useCustomerDetails`; only the UI wiring is missing.
- **Park cart** (#2 not started) — small "Save & switch" button in the cart toolbar.

`app/(tabs)/sales/receipts.tsx` stays as the sale history surface.

**Inventory** — `app/(tabs)/inventory/` (consolidate)
Proposed files:

- `products.tsx` — the main products list (move `stock.tsx` filter logic here, delete `stock.tsx`)
- `movements.tsx` — global ledger (#10) — keep
- `recommendations.tsx` — **MOVE** `app/inventory/recommendations.tsx` INTO this folder as a stack sibling of `products.tsx` (#9)
- `damaged.tsx` — new screen for #13 (damaged goods log + near-expiry list)
- `labels.tsx` — placeholder for #18 (price labels)
- `_layout.tsx` — stack nav: products → product-details / edit-product / inventory-ledger / restock-sheet
- **Delete** `analytics.tsx` (overlaps with Reports) and `modals.tsx` (fold its modal mounting into `products.tsx`)

**Customers / Utang** — `app/(tabs)/customers/` (trim)
Proposed files:

- `index.tsx` — customers list with filter chips (keep)
- `collection.tsx` — priority queue (Done) — keep; consider deprecating the legacy `credit.tsx` separately (see §7.1)
- **Delete** `insights.tsx` — belongs under Reports, not Customers
- `_layout.tsx` — stack nav: customers → credit-details → add-payment, add-credit, statement share

**More** — `app/(tabs)/more/` (consolidate everything that isn't daily-use)
Proposed files:

- `index.tsx` — menu of sections (Reports, Cash, Backup, Settings)
- `reports.tsx` — keep (#14)
- `cash-session.tsx` — **MOVE** from `(edit-forms)/cash-session/`
- `cash-entries.tsx` — **MERGE** `(edit-forms)/cash-entry/` + `gastos-kaha/` into one cash movement log (#3)
- `backup.tsx` — **MOVE** backup/restore UI out of `settings.tsx` (#17)
- `settings.tsx` — owner PIN (#11), shift tracking (#16), app prefs. Eventually
- **Delete** `app/settings/index.tsx` (stub)

---

## 6. Per-feature placement table

| #   | Feature                 | Status      | Where it lives now                                         | Where it **should** live                                                                                         |
| --- | ----------------------- | ----------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1   | POS Fast Lane           | Partial     | `sales/pos.tsx`                                            | Sales tab — main screen                                                                                          |
| 2   | Parked Sales            | Done        | `app/(tabs)/sales/pos.tsx` (integrated)                    | Inside POS, cart toolbar button                                                                                  |
| 3   | Daily Cash Close-Out    | Done        | split across 3 cash screens                                | More → Cash Session (consolidated)                                                                               |
| 4   | Physical Stocktake      | Done        | `app/(tabs)/inventory/stocktake.tsx`                       | Inventory → Stocktake tab/screen                                                                                 |
| 5   | Utang Guardrails        | Partial     | customer detail only                                       | **Also POS CheckoutModal** (suki live panel)                                                                     |
| 6   | Collection Queue        | Done        | `customers/collection.tsx`                                 | Customers → Collection (priority queue) — keep; legacy `customers/credit.tsx` separate, deprecate or consolidate |
| 7   | Safe Voids / Refunds    | Not started | `sale-details/[id].tsx` (delete only)                      | Sale Details → "Void / Refund" actions                                                                           |
| 8   | Supplier Delivery       | Partial     | `inventory/products.tsx` RestockSheet                      | Inventory → "Receive Delivery" (multi-line)                                                                      |
| 9   | Reorder Suggestions     | Done        | **orphaned** `app/inventory/recommendations.tsx`           | Inventory → Recommendations (move into tab stack)                                                                |
| 10  | Stock Movement Timeline | Done        | `inventory/movements.tsx` + `inventory-ledger/[productId]` | Inventory — keep as-is                                                                                           |
| 11  | Owner PIN               | Not started | —                                                          | More → Settings                                                                                                  |
| 12  | Credit Statement (PDF)  | Done        | inline on `credit-details/[id]`                            | Customers → per-suki profile → Share                                                                             |
| 13  | Expiry & Damaged        | Partial     | only `type='damaged'` ledger filter                        | Inventory → Damaged (new screen) + product `perishable` flag                                                     |
| 14  | Store Insights          | Partial     | `home/today.tsx` + `more/reports.tsx`                      | Home strip + More → Reports                                                                                      |
| 15  | Smarter Credit Profiles | Partial     | customer profile only                                      | Customers → per-suki profile (add explainer)                                                                     |
| 16  | Shift Tracking          | Not started | —                                                          | More → Settings (cashier list) + POS header chip                                                                 |
| 17  | Backup & Restore        | Done        | `more/settings.tsx` (Drive variant)                        | More → Backup (split out of Settings)                                                                            |
| 18  | Price Labels            | Not started | —                                                          | Inventory → Labels                                                                                               |

---

## 7. Refactor backlog (in suggested order)

### 7.1 Move (no behavior change) — start here

1. **Move `app/inventory/recommendations.tsx`** → `app/(tabs)/inventory/recommendations.tsx`. Makes the **Done** Reorder Suggestions feature reachable from the Inventory tab for the first time. No behavior change; just changes the file path and updates the parent `_layout.tsx` so the route is part of the Inventory stack.
2. **Move `app/(edit-forms)/cash-session/index.tsx`** → `app/(tabs)/more/cash-session.tsx`. Cash session is a daily ritual, not an edit form.
3. **Merge `app/(edit-forms)/cash-entry/index.tsx` + `app/gastos-kaha/index.tsx`** → `app/(tabs)/more/cash-entries.tsx`. One cash movement log with two tabs: cash-in / cash-out.
4. **Split `app/(tabs)/more/settings.tsx`**:
   - Move `CloudBackupSection` + `LocalSnapshotsSection` into a new `app/(tabs)/more/backup.tsx`.
   - Keep just app prefs (and PIN / shifts once those features land) in `settings.tsx`.
5. **Deprecate `app/(tabs)/customers/credit.tsx`** (legacy `CreditLedgerTab`). Post-merge, the new `collection.tsx` is the priority queue and `credit.tsx` is a redundant surface. Decide whether to consolidate the two or keep them as separate views (legacy all-debtors vs. priority queue).

### 7.2 Delete (duplicates / stubs)

6. **Delete `app/settings/index.tsx`** — 277-byte stub. The real settings screen is at `app/(tabs)/more/settings.tsx`.
7. **Delete `app/modal/{add-customer, add-product, add-sale-note, confirm-action, scan}.tsx`** — 40-47 byte stubs. Canonical routes already live under `(edit-forms)/` and `(tabs)/inventory/`.
8. **Delete `app/(tabs)/inventory/stock.tsx`** — fold its filter chips into `products.tsx`.
9. **Delete `app/(tabs)/inventory/analytics.tsx`** — overlaps with `more/reports.tsx`.
10. **Delete `app/(tabs)/inventory/modals.tsx`** — it's a layout concern; fold its modal mounting into `products.tsx`.
11. **Delete `app/(tabs)/customers/insights.tsx`** — overlaps with `more/reports.tsx`.

### 7.3 Add (new routes for done/partial features with no IA home)

12. **Add `app/(tabs)/inventory/damaged.tsx`** — feature #13 (partial) needs a screen to graduate to "done."
13. **Rewrite `app/(tabs)/more/index.tsx`** as a section menu — so the More tab is a real hub, not a parallel tab.

---

## 8. Quick wins — finishing the Partials

These features are 1-2 days of focused work away from Done, with the IA already implied by the target structure:

- **#1 POS Fast Lane** — import the existing `FastLaneCard.tsx` (built but unused) into `ProductSearchCatalog.tsx` so common-qty chips render at the live POS mount point. Add a debounce to the search input.
- **#5 Utang at Checkout** — wire `useCustomerDetails` into `CheckoutModal.tsx`. All data is already in the query cache.
- **#13 Expiry & Damaged** — add `perishable` and `expiry_date` columns to `products` (migration v15), surface in `BasicInfoCard.tsx`, add `app/(tabs)/inventory/damaged.tsx`.
- **#15 Smarter Credit Profiles** — implement `computeCreditProfile(customerId, { lookbackDays, ceiling })` in `database/credits.ts`; add an explainer card to `CustomerHeroCard.tsx`.
- **#14 Store Insights** — add the missing "recurrent shelf-out" + "margin change" signals to `database/reports.ts:getReportInsights`.
- **#6 Collection Queue** — shipped. Caveats: no regression tests added (deferred per project practice, see §2.6); one semantic drift to clean up (`lastTransactionDate` should arguably be `lastPaymentDate` in the queue row).

The IA refactor in §7.1 is a prerequisite for the next "drill in" pass — once the routes are where users expect them, the missing UI per Partial becomes obvious and self-contained.
