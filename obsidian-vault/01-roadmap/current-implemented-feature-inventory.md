---
title: Current Implemented Feature Inventory
created: 2026-08-14
last_updated: 2026-08-14
tags: [roadmap, feature-status, implementation-audit]
status: active
---

# Current Implemented Feature Inventory

> Code audit performed on 2026-08-14 against the working tree. This note tracks current implementation and route reachability, not only the five main tabs. When a feature note conflicts with current behavior, the code is the source of truth.
>
> This is a static code audit, not an end-to-end device test. It supersedes the status conclusions in the 2026-08-06 [[01-Roadmap/feature-implementation-status-and-ia|Feature Status and Information Architecture]] audit. Keep that older note for its historical IA analysis.

## Status Legend

| Status | Meaning |
| --- | --- |
| Live | Reachable from the current app and backed by the required data flow. |
| Partial | A useful working slice exists, but documented scope or integration is missing. |
| Legacy | Data or UI remains for historical records, but the current creation flow is retired. |
| Dormant | Components or routes exist in code but have no live navigation or mounting point. |
| Not started | No complete route, hook, and data implementation exists. |

## Executive Snapshot

- Audit scope: 51 app route files, 361 component files, and all 18 numbered feature notes.
- Numbered features that are live: 1, 2, 4, 6, 9, 10, and 12.
- Numbered features that are partial, regressed, or legacy: 3, 5, 7, 8, 11, 13, 14, and 15.
- Feature 17 is live through a materially different local-snapshot and Google Drive design.
- Features 16 and 18 are not started.
- The app also contains multiple live areas not represented by their own numbered feature note, including product catalog management, wholesale pricing, notifications, receipt history, expense tracking, onboarding, and localization.

## Implemented Feature Inventory

### App Setup and Store Experience

- First-run onboarding with owner name and store name.
- Guided tour of Home, Sales, Inventory, Customers, and More.
- Persistent onboarding-completion gate.
- English and Tagalog language switching during onboarding and in Settings.
- Offline-first local SQLite storage with migrations and initialization recovery.
- Store header with store identity and owner initials.
- In-app notification center.
- Device notifications, app badge count, and deep links for low stock and overdue utang.
- Reduced-motion handling and Android double-back-to-exit behavior.

Primary code: `app/onboarding/index.tsx`, `app/index.tsx`, `app/(tabs)/_layout.tsx`, `components/layout/StoreHeader.tsx`, `hooks/useSystemNotifications.ts`, `lib/notifications.ts`.

### Home Dashboard

- Today's total sales and transaction count.
- Operating-profit indicator.
- Low-stock and overdue-credit summaries.
- Recent receipts and quick navigation actions.
- Contextual goals and suggested actions.
- Loading, empty, refresh, and error states.
- Low-stock and overdue-customer alert generation.

Known data-quality issue: the Home mini-insight for the top product currently derives from inventory quantity and has hard-coded fallback data. Do not treat it as a reliable best-seller calculation until corrected.

Primary code: `app/(tabs)/home/overview.tsx`, `hooks/useHomeDashboardData.ts`, `components/home/`.

### Sales and POS

- Searchable and paginated product catalog.
- Fast Lane with favorites and recently sold products.
- Quick quantity additions for common amounts.
- Barcode scanning with local-product resolution and offline catalog lookup.
- Unknown-barcode handoff to a prefilled Add Product form.
- Retail and wholesale barcode support.
- Stock-limited cart quantities.
- Tingi and wholesale or pakyaw unit switching with conversion-aware stock deduction.
- Cash or utang checkout with customer selection for credit sales.
- Swipe-to-confirm checkout and post-sale receipt confirmation.
- Offline or network status display.
- Parked sales with a three-cart limit, 24-hour expiry, resume, swap, discard, and stock or price revalidation.
- Searchable receipt history with date and payment filters, totals, pagination, and sale details.
- Corrections audit report.

Primary code: `app/(tabs)/sales/pos.tsx`, `app/(tabs)/sales/receipts.tsx`, `components/sales/pos/`, `components/ui/BarcodeScannerModal.tsx`, `database/parkedCarts.ts`.

### Product Catalog and Inventory

- Product create, edit, details, and delete flows.
- Product photos from camera or photo library.
- Automatic or manual SKU.
- Retail and wholesale barcode fields with duplicate prevention.
- Cost, retail price, bundle-cost, markup, profit, and margin calculations.
- Wholesale unit name, conversion factor, price, cost, and savings.
- Initial stock and subsequent restocking.
- Product search and filters by stock state, category, and supplier.
- Bulk deletion, bulk stock adjustment, and bulk category movement.
- Restocking with supplier, unit cost, quantity, and notes.
- Manual sale, stock adjustment, and damaged-goods write-off transactions.
- Stocktake lock that pauses manual adjustments and damage entries during a count.
- Global movement history and per-product inventory ledger.
- Product supplier details and direct calling.

Primary code: `app/(tabs)/inventory/products.tsx`, `app/(edit-forms)/add-product/`, `app/(edit-forms)/edit-product/`, `app/(edit-forms)/product-details/`, `components/inventory/products/`, `components/inventory/modals/`, `database/products.ts`, `database/inventory.ts`.

### Physical Stocktake

- Start and abandon count sessions.
- Category-by-category counting.
- Expected-versus-counted variance.
- Peso-value impact of discrepancies.
- Required reason code for each variance.
- Atomic commit that records inventory adjustments.
- Previous stocktake history.

Primary code: `app/(tabs)/inventory/stocktake.tsx`, `components/inventory/stocktake/`, `hooks/useStocktake.ts`, `database/stocktake.ts`.

### Reorder Intelligence

- Sales-velocity and stock-coverage calculations.
- Suggested reorder quantities.
- Low-stock, out-of-stock, slow-mover, and watch-item groups.
- Supplier and estimated-cost information.
- Saved reorder plans.
- Adjust, defer, dismiss, restore, or invalidate recommendations.
- Direct handoff from a recommendation to the Restock sheet.

Primary code: `app/(tabs)/inventory/recommendations.tsx`, `components/inventory/recommendations/`, `hooks/useStockIntelligence.ts`, `database/stock-intelligence.ts`.

### Categories and Suppliers

- Adding categories and assigning products is live.
- Selecting uncategorized products in bulk is live.
- A full category list, statistics, editing, deletion, and drill-down component exists but is not mounted.
- Adding suppliers with contact details, notes, and product assignments is live.
- Supplier selection during product setup and restocking is live.
- Supplier editing and product reassignment exist, but the edit route has no normal navigation entry.

Primary code: `app/(edit-forms)/add-category/`, `app/(edit-forms)/add-supplier/`, `app/(edit-forms)/edit-supplier/`, `components/inventory/category/CategoriesTab.tsx`, `database/categories.ts`, `database/suppliers.ts`.

### Customers, Suki, and Utang

- Customer directory with balance filters and sorting.
- Customer creation with phone, address, notes, and optional credit limit.
- Itemized credit tickets using catalog products or free-text items.
- Quantity, price, notes, and due-date presets.
- Customer profile with balance, active credits, lifetime volume, credit-limit progress, due-soon and overdue indicators, and trust tags.
- Searchable Credits, Payments, and History tabs.
- Phone and SMS contact actions.
- Payment shortcuts, full or half payment, custom amount, multiple payment methods, and live remaining balance.
- FIFO payment-allocation preview and targeted settlement.
- Reversible payment allocations.
- Collection queue ordered by overdue status, credit-limit risk, and account age.
- Follow-up scheduling and contacted tracking.
- Shareable customer statement as text or PDF resibo.

Primary code: `app/(tabs)/customers/`, `app/(edit-forms)/credit-details/`, `app/(edit-forms)/add-credit/`, `app/(edit-forms)/add-payment/`, `components/customers/`, `components/utang/`, `database/credits.ts`.

### Reports and Analytics

- Today, yesterday, seven-day, monthly, and custom date ranges.
- Total sales, average ticket, gross profit, and operating profit.
- Cost-of-goods and cost-data coverage.
- Operating expenses deducted from profit, with owner drawings reported separately.
- Cash-versus-credit breakdown and sales-over-time charts.
- Top-selling products and product profitability.
- Inventory movement, low stock, out of stock, slow movers, and inventory value.
- Credit issued, collected, outstanding, active accounts, and aging buckets.
- Factual summaries for top performer, low stock, largest debtor, and slowest sales day.

The full Reports route exists at `app/(tabs)/more/reports.tsx`, but the More home screen does not currently show a Reports destination row. Reports remain reachable through Home -> Today.

Primary code: `app/(tabs)/home/today.tsx`, `app/(tabs)/more/reports.tsx`, `hooks/useReports.ts`, `database/reports.ts`.

### Expenses and Owner Cash Movements

- Operating-expense ledger.
- Expense categories for transport, utilities, supplies or packaging, rent, repairs, and other.
- Owner-drawing records.
- Notes, business dates, date presets, and custom date ranges.
- Period totals and entry deletion.
- Expenses deducted from operating profit while owner drawings remain separate.
- More-screen financial summary.

Primary code: `app/(tabs)/more/cash-entries.tsx`, `components/financial/`, `hooks/useFinancial.ts`, `database/financial.ts`.

### Owner PIN and Audit Controls

- Salted PIN storage.
- PIN setup, change, recovery code, and failed-attempt lockout.
- Settings status and configurable discount-threshold fields.
- PIN approval for sale correction flows, price corrections, manual stock adjustments, and utang credit-limit overrides.
- Correction reason codes, optional notes, actor, witness, and immutable audit records.

Primary code: `components/auth/`, `components/settings/OwnerPinSettingsCard.tsx`, `app/(tabs)/more/settings.tsx`, `database/auth.ts`, `database/corrections.ts`.

### Backup and Recovery

- Manual local Backup Now action.
- Rolling seven-snapshot local history.
- Automatic snapshot when the previous backup is older than 24 hours.
- Automatic snapshot after every 20 sales.
- SQLite WAL checkpointing and integrity validation.
- Pre-restore safety copy and rollback on validation failure.
- Local and cloud restore picker with confirmation.
- Optional Google Drive linking, upload queue, retry, and unlinking.
- Wi-Fi-only cloud upload by default with cellular opt-in.
- Cloud-newer-than-device warning banner.

This is the current implementation of feature 17, but it does not match the documented manual passphrase-encrypted exported-file design.

Primary code: `app/(tabs)/more/backup.tsx`, `components/settings/backup/`, `hooks/useBackup.ts`, `lib/backup/`.

## Numbered Feature Reconciliation

| # | Feature | Current status | Current behavior or missing scope | Next action |
| --- | --- | --- | --- | --- |
| 1 | POS Fast Lane | Live | Favorites, recent sellers, quick quantities, search, and barcode scanning are mounted in POS. | Keep maintained. |
| 2 | Parked Sales | Live | Three-cart limit, expiry, resume, swap, discard, and revalidation are live. | Keep maintained. |
| 3 | Daily Cash Close-Out | Legacy | Historical session data and closing UI remain, but new active drawer creation is retired. | Decide whether to restore sessions or formally replace the feature with the financial ledger. |
| 4 | Physical Stocktake | Live | Guided counts, reasons, variance value, commit, abandon, locking, and history are live. | Keep maintained. |
| 5 | Utang Guardrails | Partial | Guardrails work in Add Credit and the alternate Add Sales route, but not in the primary POS Checkout modal. Hard-block customer configuration is not exposed in the customer form. | Integrate into primary POS and expose owner configuration. |
| 6 | Collection Queue | Live | Priority buckets, search, contact tracking, follow-ups, payments, and detail navigation are live. | Keep maintained. |
| 7 | Safe Voids, Refunds, and Corrections | Partial or regressed | Audit data and UI exist. Cash corrections still require an open cash session, but new sessions cannot be opened. A legacy hard Delete Sale action also remains. | Decouple cash corrections from retired sessions and remove or PIN-gate hard deletion. |
| 8 | Supplier Delivery Receiving | Partial | Single-product restocking with supplier, cost, and notes is live. Multi-line delivery, shortages, and delivery receipt handling are absent. | Build the dedicated receiving workflow. |
| 9 | Offline Reorder Suggestions | Live | The recommendation screen is now mounted under Inventory and hands off to Restock. | Update older IA notes that call it orphaned. |
| 10 | Stock Movement Timeline | Live | Global and per-product timelines, filters, search, details, and pagination are live. | Keep maintained. |
| 11 | Owner PIN | Partial coverage | PIN setup, recovery, lockout, correction approval, stock adjustment approval, and utang override approval are live. Discount thresholds are not connected to checkout, and damaged write-off is not PIN-gated. | Reconcile protected actions with the feature spec. |
| 12 | Customer Credit Statements | Live | Text sharing and generated PDF resibo are live on the customer profile. | Keep maintained. |
| 13 | Expiry and Damaged Goods | Partial | Damaged write-off is live. Dedicated Damaged is a placeholder, expiry is not captured, and near-expiry filtering is incorrect. | Add expiry schema and forms, then finish the dedicated screen. |
| 14 | Transparent Store Insights | Partial | General reports and factual summaries exist, but the documented explainable Tips surface and its repeated-stockout, dead-stock, margin-change, and payment-pattern signals do not. | Build `getStoreTips()` and an explainable Tips surface. |
| 15 | Explainable Credit Profiles | Partial | Balance history and heuristic trust tags exist. Suggested credit limits and supporting calculations are absent. | Add suggestion math and a visible explanation. |
| 16 | Shift Tracking | Not started | No cashier or shift schema, attribution, handover flow, or POS shift control. | Plan and implement after the cash model is settled. |
| 17 | Backup and Restore | Live variant | Rolling local snapshots and optional Google Drive backup are live, including automatic triggers. This contradicts the manual encrypted-export spec. | Rewrite the feature note or replace the implementation after an explicit product decision. |
| 18 | Price Labels and Barcode Sheets | Not started | No label layout, PDF generation, or printable barcode sheet flow. | Plan and implement when prioritized. |

## Implemented Areas Missing a Clear Feature Note

These capabilities are live or materially implemented but are not represented by their own numbered note in `02-Features/`.

| Area | Status | Suggested future note |
| --- | --- | --- |
| Product catalog, photos, SKU, and pricing | Live | `product-catalog-management.md` |
| Barcode-assisted selling and offline lookup | Live | `barcode-assisted-selling.md` |
| Retail, wholesale, and pakyaw units | Live | `retail-wholesale-unit-pricing.md` |
| Category management and bulk inventory actions | Partial | `category-and-bulk-inventory-management.md` |
| Supplier directory and product linking | Partial | `supplier-directory-and-product-linking.md` |
| Receipt history, search, and sale details | Live | `sales-receipt-history.md` |
| Customer directory and payment allocation | Live | `customer-directory-and-payment-allocation.md` |
| Store dashboard, alert center, and device notifications | Live | `store-dashboard-and-alerts.md` |
| Business reports, profitability, and credit aging | Live | `business-reports-and-profitability.md` |
| Operating expenses and owner drawings | Live with gaps | `expenses-and-owner-drawings-ledger.md` |
| First-run onboarding and store profile | Live | `store-onboarding-and-profile.md` |
| English and Tagalog localization | Live | `app-localization.md` |
| Offline-first database and recovery behavior | Live | Better suited to `03-Technical/` than `02-Features/`. |

Do not create all of these notes automatically. Prioritize notes when the area is about to change or needs product decisions. This inventory remains the single status source until then.

## Open Integration and Documentation Tasks

- [ ] Decide the replacement or restoration path for daily cash sessions.
- [ ] Make cash void, refund, and price-correction behavior compatible with the current cash model.
- [ ] Integrate utang guardrails into the primary POS checkout.
- [ ] Remove or protect the legacy hard Delete Sale action.
- [ ] Add owner-addition support to Cash In, or remove the empty tab.
- [ ] Persist selected expense receipt images after a financial entry is created.
- [ ] Add a Reports destination to the More home screen.
- [ ] Replace the Home top-product fallback with a real sales query.
- [ ] Add expiry data capture and correct the `near_expiry` filter.
- [ ] Finish or remove the dormant full Categories tab.
- [ ] Decide whether to mount or remove the dormant customer-insights components.
- [ ] Add normal navigation for supplier editing, or remove the orphaned route.
- [ ] Add customer editing if it remains part of the intended customer-management scope.
- [ ] Decide whether report export to CSV or Excel remains planned.
- [ ] Rewrite feature 17 to describe the actual snapshot and Google Drive model, or record a decision to return to encrypted file export.
- [ ] Update the older feature-status and IA audit when its historical route claims cause confusion.

## Dormant or Orphaned Code Not Counted as Shipped

- `components/inventory/category/CategoriesTab.tsx`: complete category-management surface, not mounted in the live Inventory tabs.
- `components/customers/CustomerInsightsTab.tsx` and related timeline or quick-action components: exported but not mounted by the live Customer tabs.
- `app/(edit-forms)/add-sales/index.tsx`: alternate guardrail-aware sale form with no normal navigation reference from the primary POS.
- `app/(edit-forms)/edit-supplier/[id].tsx`: implementation exists without a normal entry point.
- `app/(tabs)/more/reports.tsx`: route exists, but `MoreHomeScreen` does not render the Reports destination.
- `app/(tabs)/inventory/damaged.tsx`: development placeholder rather than a complete damaged or expiry workflow.
- Legacy cash-session, cash-entry, and `gastos-kaha` surfaces overlap with the newer financial ledger.

## Representative Code Evidence

- Main tabs and shared header: `app/(tabs)/_layout.tsx`
- Sales POS: `app/(tabs)/sales/pos.tsx`
- Inventory sub-tabs: `app/(tabs)/inventory/_layout.tsx`
- Customer sub-tabs: `app/(tabs)/customers/_layout.tsx`
- More destinations: `components/more/MoreHomeScreen.tsx`, `components/more/moreNavigation.ts`
- Reports: `app/(tabs)/home/today.tsx`, `app/(tabs)/more/reports.tsx`, `database/reports.ts`
- Financial ledger: `app/(tabs)/more/cash-entries.tsx`, `database/financial.ts`
- Cash-session retirement: `components/cash-session/OpenSessionView.tsx`
- Owner PIN: `components/auth/OwnerPinGuardProvider.tsx`, `database/auth.ts`
- Backup scheduler and snapshots: `lib/backup/scheduler.ts`, `lib/backup/snapshots.ts`
- Notification mounting: `components/layout/StoreHeader.tsx`, `hooks/useSystemNotifications.ts`

## Related Notes

- [[02-Features/features|Numbered Feature Backlog]]
- [[01-Roadmap/project-roadmap|Feature Release Roadmap]]
- [[01-Roadmap/feature-implementation-status-and-ia|Historical Feature Status and IA Audit]]
- [[02-Features/17-manual-encrypted-backup-and-restore|Manual Encrypted Backup and Restore Spec]]
- [[02-Features/14-transparent-local-store-insights|Transparent Local Store Insights Spec]]
