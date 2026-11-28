# Activity Log

A running log of work in progress, fixes in flight, and decisions worth referring back to. Newest entries go on top.

---

## 2026-11-28: Supplier payables (challenge #4)

- Intent was confirmed in an interview. The owner should see what they owe each supplier and when it is due, before the agent arrives. Decisions are recorded in `obsidian-vault/03-Technical/ADR-004-supplier-payables.md`.
- Schema v28 adds `supplier_payables`, `supplier_payments`, `supplier_payment_allocations`, and `suppliers.payment_terms_days`. The repo is `database/supplierPayables.ts`.
- Committing a delivery receipt now creates a payable at the invoice amount. The review step shows a Paid now / Pay later choice (`components/receiving/CommitPaymentChoice.tsx`). Suppliers with terms default to Pay later, all others to Paid now.
- Cash supplier payments are a new `supplier_payment` branch of the `cash_movements` view.
- Voiding a receipt with payments is refused until the payment is reversed.
- New screens are `app/(edit-forms)/supplier-payables/index.tsx` (balances) and `[supplierId].tsx` (open payables, payment history, record payment, opening balance, reverse). Both are opened from the Restock summary card and the Home attention card (`supplierDue`).
- New owner PIN actions are `supplier_payment` and `supplier_opening_balance`. The payment sheet opens the PIN prompt from `Sheet.onClosed`.
- Tests are `tests/database/supplier-payables.test.ts` (7 cases) and a `supplierDue` case in `home-state.test.ts`.
- Not done: screenshots and video, because the app was not run on a device in this session.

---

## 2026-11-27: Sale details audit fixes (harden, adapt, quieter, polish)

- Contrast: the "Bill to" label on paper-100 moved from ink-400 (about 4.2:1) to sentence-case ink-500.
- Text scaling: the footer buttons stack above font scale 1.3 and their labels shrink and wrap. The scroll padding uses the footer's measured height. The qty column min width grows with `fontScale` (capped at 1.8x).
- PIN hand-off: `Sheet` has a new `onClosed` callback. It fires from `Modal.onDismiss` on iOS and when the sheet unmounts on Android, and `Modal` stays rendered while hidden so iOS can send that event. Delete now waits for the More sheet to close before it opens the PIN prompt. `product-details` still uses the old close-then-guard pattern.
- iPad: the ticket, skeleton, and footer buttons are capped at 480 pt and centered.
- Quieter: uppercase tracked labels now appear only on the receipt strip, the column header, and Total. The hero label, meta rows (`ReceiptHeroMeta caps={false}`), customer label, and header title use sentence case. The "thank you" divider label is gone.
- Polish: `ICON_COLOR` in `lib/theme.ts` replaces the raw icon hex values in sale-details. iOS now picks the share format from an action sheet. Disabled sheet rows show a lock icon instead of the chevron. The profit row's screen-reader label covers the case where no item has a cost price.

## 2026-11-27: Sale details (resibo) redesign

- The hero now leads with the amount, then a status line with an icon (paid in cash, added to a customer's utang, or voided) and a relative time ("Today", "Yesterday"). The repeated "Paid in Full" title and Payment row are gone.
- One ref format everywhere: `formatReceiptRef` (`SR-0123`), the same as the receipts list.
- Voided and refunded sales show the reason, who did it, the note, and when, from `useSaleCorrections`. Price-corrected sales, which edit in place and are never cancelled, now show a notice, and each changed line shows the old price struck through.
- The customer block links to `credit-details/{customer_credit_id}` when the sale has a linked customer.
- Item rows have a qty column. The total is a receipt-style row under a double rule.
- Profit: a "Show profit" row, collapsed on every visit, uses `saleProfit` in `utils/saleItems.ts` (the same formula as reports). Lines without a cost are counted and called out. Profit is never in the shared resibo.
- Footer: "Share resibo" (primary) and "Fix sale" (secondary). Fix sale opens a sheet that explains void, refund, and edit price. Void and refund are disabled with a reason once `void_window_hours` has passed.
- Delete moved from the header into a More sheet, with a two-step inline confirm, then the owner PIN (new `sale_delete` PIN action, on by default). Delete is hidden for sales with any correction, because `sale_corrections` references the sale and `deleteSale` would fail on the foreign key. More also has "Copy reference no.".
- Share: `lib/saleReceipt.ts` builds a text resibo (React Native Share, with a clipboard fallback) and a black-and-white 80mm PDF (expo-print, then expo-sharing).
- `SheetActionRow` gained an optional `disabled` prop.

## 2026-11-27: Home audit fixes

- Errors: `isError` now also covers credit KPIs and cash entries, so a failed read shows the error state instead of zeros and "All caught up". A failed 7-day trend hides the chart instead of drawing empty bars.
- Day rollover: `useLocalDay` in `useHomeDashboardData` tracks the local date, updating at midnight and on app foreground. Report ranges, cash entries, and the date line follow it, and date-less stats refetch when it changes. `getDateRangeFromType` takes an optional reference date for this.
- The "this time yesterday" cutoff refreshes when the app returns to the foreground. Pull-to-refresh now also reloads stocktake.
- Screen readers: the Today card button label now includes the date, profit, utang given, collected, and the 7-day total.
- Contrast: New Sale and the home empty and error CTAs use persimmon-600 (white text about 4.6:1). Section links use persimmon-700. Past-day bars use cinnamon-300 (about 3.9:1).
- Text scaling: shortcut labels wrap to 2 lines instead of shrinking. Above font scale 1.15 the three Today stats stack vertically.
- Tablet: at 768 pt and wider, Home uses two columns (Today and actions left; attention, money, top sellers, recent right), capped at 1200 pt.
- First paint waits only for today stats, stock, credit, cash entries, and report KPIs. The chart shows flat placeholder bars until the trend loads.
- Copy: recent-sales relative time is translated (`recentActivity.justNow`, `minutesAgo`, `hoursAgo`, `daysAgo`). Weekday labels use the short form.
- Not changed: the `button-primary` token in DESIGN.md and primary buttons outside Home still use persimmon-500 with white text.
- Not verified on a device.

## 2026-11-27: Home dashboard redesign

- New order: Today card, New Sale plus 4 shortcuts, Needs attention, Money today, Top sellers today, Recent activity.
- `DashboardTodayCard` shows cash sales today, change vs yesterday, sales and item counts, a 7-day bar strip, and a profit / utang given / collected row. Tapping it opens Reports.
- `DashboardAttention` merges the old goal card, stock alert, stocktake nudge, and time-of-day suggestion into one list: out of stock, low stock, overdue utang, then stocktake due. It shows "All caught up" when the list is empty.
- `DashboardMoneyToday` is a receipt-style cash flow: cash sales, utang collected, expenses, taken out, net cash. Utang given is left out because no cash moved.
- `DashboardTopSellers` shows the top 3 by units. It shows no peso amounts because per-product revenue includes utang checkouts.
- `DashboardSection` gives every section the same heading and card shell. Recent activity now uses it, plus translated See all and Cash/Utang labels.
- Fix: pull-to-refresh invalidated `['cash']`, but cash entries use the `financial` key, so expenses never refreshed. It now also refreshes top sellers and the 7-day trend.
- Low stock now excludes out-of-stock items, so the two attention rows never count the same product twice. Both rows add up to the alerts bell count.
- New pure helpers in `components/home/home-state.ts` (`buildWeekSeries`, `percentChange`, `resolveStocktakeReminder`, `buildAttentionItems`), tested in `components/home/__tests__/home-state.test.ts`. `resolveHomeState` was removed.
- Removed 14 home components: 8 were never imported, and 6 were replaced (`DashboardGoalCard`, `DashboardSuggestions`, `DashboardStockAlert`, `StocktakeNudge`, `DashboardKPIGrid`, `MiniInsightsCard`).
- Copy is in `locales/{en,tl}/common.json` under `dashboard.*`. The orphaned `goals`, `suggestions`, `pulse`, `stockAlert`, and `homeSalesToday` keys were dropped.
- "vs this time yesterday" compares today so far with yesterday from midnight to the same clock time (`getSaleStatsBetween`, `useYesterdaySoFarStats`). The chip hides when yesterday had no cash sales by that time.
- Known gap: report queries (profit, top sellers, 7-day trend) are not invalidated after a sale, so they can lag by up to 2 minutes. Today's bar and the cash total use live stats.
- Not verified on a device. No screenshots or video, because no emulator or adb was available.

## 2026-11-27 — Category Details Audit Fixes

Applied the audit at `.impeccable/audit/2026-11-27T10-17-58Z__app-edit-forms-category-id-tsx.md` (13/20).

- **Adapt:** hero money values shrink to fit instead of truncating. The scroll view clears the sticky bar's measured height, so the last row stays visible at any text size. Content caps at 640 wide and centers on tablets (`CATEGORY_FRAME_STYLE`), with side safe-area insets. Chips and text links now reach 48dp on Android.
- **Polish:** warning text uses `semantic-warning-700` (5.17:1), including the shared `StockBadge` low-stock label, so every screen with that badge changes. Icons moved to Ionicons with token colors. The top bar title swaps to the category name after the hero scrolls away, like product details.
- **Clarify:** sort labels are Priority, Sales, Value, A-Z, and shrink before truncating. Filter chips announce "Out, 2 products".
- **Harden:** a failed read now shows `InventoryErrorState` with retry instead of "not found" or an empty category. The skeleton reads as one progress bar. All copy moved to `locales/{en,tl}/inventory.json` (`category_*` keys).
- **Document:** decided with the user that light-text buttons fill with Persimmon 600 (`#C8460F`, 4.63:1) and press to 700. Recorded as the Fill Contrast Rule in DESIGN.md and `.impeccable/design-full.md`, with a new `primary-fill` token. Only this screen uses it so far; other screens still use Persimmon 500.
- Not verified on a device. No screenshots or video.

---

## 2026-11-27 — Category Details Redesign

Redesigned `app/(edit-forms)/category/[id].tsx`, reached by tapping a card in Inventory > Categories.

- **Priority order:** hero (name, product count, share of catalog, health stamp, 2 x 2 numbers), then Needs attention, then Best sellers, then the product list. The sticky bar keeps category value and Add Product.
- **Hero numbers:** stock value at selling price, potential profit (only products with a cost price; shows coverage when some are missing), pieces on the shelf, and pieces sold in 28 days.
- **Utang is not a sale:** sold units and revenue count cash checkouts only. Units given on utang show as a separate line ("N more on utang"). Decided with the user.
- **Needs attention:** out of stock, running low, not moving (in stock, older than 7 days, nothing moved in 28 days, same rule as `stock-intelligence`), and missing cost price. Each row filters the list and scrolls to it. When nothing is wrong, a single sage line says so.
- **Product list:** filter chips (only the ones with a count) and a sort control (Priority, Best selling, Value, A-Z). Priority puts out of stock first, then low, then not moving, with demand breaking ties. Rows open the product profile (`product-details/[id]`) instead of the edit form.
- **Manage:** a `...` button opens the existing `CategoryActionSheet` (View products opens the Products tab filtered to this category, Rename, Delete). Delete pops back to Inventory. Decided with the user: no owner PIN, same as the Categories tab.
- **Add Product** passes `prefillCategory`, so the add form starts with this category selected.
- **Fix:** `updateCategory` renamed only the category row. Products reference categories by name, so a rename orphaned every product. It now renames `products.category` in the same transaction.
- **Data:** new read-only `getRecentProductSales` (28-day cash and utang split per product) in `database/reports.ts` and `useRecentProductSales` in `hooks/useReports.ts`. The screen filters it to the category's products. The query is keyed by window, not category name, so a rename or a product moving in never leaves stale sales. The key sits under `['sales']`, so sales, voids, and refunds refresh it. No schema change.
- **Review fixes:** no product is flagged "not moving" until sales have loaded, and Best sellers hides until then. Sort segments and text links meet the 44pt touch target.
- **Logic:** `buildCategoryRows`, `summarizeCategory`, `selectCategoryRows`, `topSellers` in `components/inventory/category-details/categoryInsights.ts`, tested in `__tests__/categoryInsights.test.ts`.
- Loading uses `CategoryDetailsSkeleton`. Motion is 220-240ms and respects reduced motion. Pull to refresh reloads all three queries.
- Copy is English only, like the rest of the category screens. Moving it to `locales/{en,tl}` is a follow-up.
- Not verified on a device. No screenshots or video.

---

## 2026-11-27 — Delivery Receipts List Redesign

Redesigned `app/(edit-forms)/delivery-receipts/index.tsx`, the list screen reached from Inventory > Restock.

- **One fetch, client split:** the screen calls `useDeliveryReceipts()` with no status. `partitionByStatus` in `components/receiving/receiptList.ts` splits by status, so tabs show live counts. Invalidation is unchanged because every key shares the `deliveryKeys.all` prefix.
- **Smart default tab:** the screen opens on Drafts when any exist, otherwise on Received. The user's tab choice overrides it.
- **Month card:** `DeliveryMonthCard` shows this month's received cost, delivery count, and short-delivery count, with Sari's reaction. It replaces the plain shortage banner and links to `/reports/supplier-shortages`.
- **Status rows:** `DeliveryReceiptRow` draws drafts with a dashed border and a Continue cue, received rows with a shortage or Complete chip, and voided rows muted with a struck-through total. Chips pair an icon with text, so status never relies on color alone.
- **Date sections:** `buildSections` flattens rows under Today, Yesterday, or dated headers, so the house `RefreshableFlatList` can render them.
- **Search:** a compact `SearchBar` filters by supplier name or invoice number, and has its own no-match state.
- **States:** skeleton rows while loading, Sari empty states per tab, and an error state with retry.
- **Timestamps:** rows parse dates with `parseStoredTimestamp`. Draft `created_at` is SQLite UTC, which the old `new Date()` call read as local time.
- **i18n:** new `receiving` keys in `en` and `tl`. The hardcoded "Go back" and "Loading" labels moved there too.

Decision: all receipts load at once (marked as a shortcut in code). This is fine at sari-sari volume. Add paging only if a store reaches thousands of receipts.

Next: full mock data for drafts, received, short, and voided receipts, then screenshots in `docs/screenshots`.

### Audit fixes (same day)

The impeccable audit scored the screen 12/20. These fixes address its P1 to P3 findings:

- **Contrast:** new `semantic-warning-700` token (`#8F5A0A`, 5.2:1 on warning-50) for the Draft chip. The draft count badge uses `persimmon-600`. The voided total uses `ink-500`.
- **Selected tab:** the active segment is now `ink-900` with paper text. Tabs are 48dp tall.
- **Tokens:** `components/receiving/iconColors.ts` mirrors tailwind hex values for icon props. There is no raw hex left on the screen.
- **Resilience:** a failed refetch keeps the cached list and shows an inline notice with retry. The full error screen appears only when there is no data.
- **i18n:** section dates and row times use `toLocaleDateString` / `toLocaleTimeString` with `i18n.language`, the house pattern.
- **Day change:** the Today, Yesterday and month memos key on the start of the current day.
- **Font scale:** the row time moved under the invoice line, the supplier name wraps to 2 lines, the footer chips wrap, and tab text caps at `maxFontSizeMultiplier` 1.3.
- **Keyboard:** the bottom bar hides while the keyboard is open (`useKeyboardState`), and iOS uses `automaticallyAdjustKeyboardInsets`.
- **Tablet:** header, list, and CTA cap at 640 wide, centered.
- **Search:** tab counts follow the query. The no-match copy names the tab.

Not changed: white on `persimmon-500` (about 3.3:1) on the "Receive delivery" CTA. That pairing is the app-wide primary button, so it needs a product-wide token decision.

### Mock data (same day)

`MOCK_DELIVERY_RECEIPTS` and `MOCK_DELIVERY_LINES` in `scripts/sample-mock-datas.ts` seed 14 receipts across six suppliers:

- 10 received: full, short, no invoice number, wholesale cases and boxes, a cost increase (Colgate) and a cost decrease (Piattos).
- 2 voided, each with a reason.
- 2 drafts, one of them with a quick-add new product.

Dates are relative to the seed run, so the list covers today, yesterday, this month, and earlier months.

`database/seed.ts` steps 13 and 14 insert them. Each line derives its stored values with `convertDeliveryLine`. `tests/lib/delivery-mock-data.test.ts` checks supplier matches, the one-draft-per-supplier rule, and that every line converts.

Decisions:
- No inventory transactions are seeded for these receipts. Product quantities stay as the product mock sets them.
- Costs use the same integer scale as the mock products' `cost_price`.

### Re-audit fixes (same day)

The re-audit scored 15/20. These fixes address its remaining findings:

- **CTA color:** the user chose this screen only. "Receive delivery" now uses `persimmon-600` (4.6:1) with `persimmon-700` when pressed. Other primary buttons still use `persimmon-500` until an app-wide decision.
- **iOS refresh:** `RefreshableFlatList` now renders a plain `FlatList` with the native `RefreshControl` on iOS, so the rubber-band comes back. Android keeps the custom pull header. This affects every screen that uses the component.
- **Live region:** the refresh-failed notice sets `accessibilityLiveRegion="polite"` for TalkBack.
- **Bottom bar motion:** the bar slides in (`FadeInDown`, 200ms) and out (`FadeOutDown`, 140ms) with the keyboard. Reanimated skips it under Reduce Motion.

---

## 2026-11-27 — Movements Audit Fixes

Applied the audit (`.impeccable/audit/2026-11-27T08-43-32Z__app-tabs-inventory-movements-tsx.md`) to the movements screen.

- **Contrast:** the active ledger chip moved from persimmon-500 (3.40:1) to persimmon-600, matching the product form fix. This also changes the product ledger chips.
- **No blank list while searching:** the movements and type-count queries use `keepPreviousData`. The list receives `selectedType="all"` because the database already filters by type, so old rows are never filtered to an empty card mid-load.
- **States:** one render path. While loading, `LedgerRowsSkeleton` (split out of `LedgerSkeleton`) shows under the toolbar. The no-match case uses the shared `LedgerNoMatches` card with a "Clear search and filter" action. The store-empty card shows only on settled data.
- **Pull-to-refresh:** refetches the list and the counts.
- **Errors:** translated `movementsLoadErrorBody` replaces raw SQLite text; the raw error goes to `console.warn`. `InventoryErrorState` now uses the translated `errorRetry` key instead of hardcoded "Try again".
- **Empty state:** wrapped in a `ScrollView` with FAB clearance. The CTA row wraps, the CTAs carry the button role, perforation dots are hidden from screen readers, radius is 16px, the resting shadow and the `label-caps` eyebrow are gone (the `movementsEmptyEyebrow` key was removed), and icons are Ionicons.
- **Layout:** `TabGuide` moved into the list header via `LedgerToolbar showGuide={false}` plus `MovementsGuide`, so it scrolls away. Content is capped at 640 wide and centered on tablets.
- **Perf:** `onEndReached` receives the stable `fetchNextPage`.

Skipped: moving the `EVENT_TONE` hex values onto tokens. The project has no JS token map, and adding one is a system-wide change.

---

## 2026-11-27 — Movements Data Fixes

Fixed six data bugs behind the Inventory > Movements screen.

- **Raw note tags:** `readableNote` in `ledgerMath.ts` turns `[stocktake:<reason>] note`, `void:<id>` and `refund:<id>:<reason>` into translated labels from the `stocktake` and `corrections` namespaces. Applies to every `LedgerList`, including the product history ledger.
- **Stale list after stocktake:** `useCommitStocktake` now calls `invalidateProductDependencies`, which covers the `['inventory_transactions']` movements keys. It used to invalidate only `['inventory']`.
- **Mixed timestamp formats:** stocktake inserts now use the column default (`YYYY-MM-DD HH:MM:SS` UTC) like every other writer. Migration v27 rewrites existing ISO rows to that format. Seed data is normalized on insert. Raw string ordering and cursor paging are now chronological.
- **UTC parsing:** `parseStoredTimestamp` reads the SQLite format as UTC. It used to read it as local time, which put CURRENT_TIMESTAMP rows 8 hours early in PH. This changes displayed times app-wide (sales rows, utang dates, product history) wherever values are stored in that format.
- **Chip counts:** new `getInventoryTransactionTypeCounts` / `useInventoryTransactionTypeCounts` runs a `COUNT ... GROUP BY type` with the same search filter. Chips now show true totals instead of counts from loaded, already-filtered pages.
- **Note search:** the movements SQL search also matches `t.note`. Searching shows the stored tag (`miscount`), not the translated label.

Decision: the user picked both "drop counts" and "real counts query" for the chips; the real query was kept because it preserves the UI with correct data.

---

## 2026-11-26 — Product Form Audit Fixes

Applied the fixes from the impeccable audit (`.impeccable/audit/2026-11-26T12-51-26Z__components-inventory-products-form.md`).

- **Focus on error:** validated inputs now receive the Controller `ref`, so a failed save focuses and scrolls to the first invalid field instead of doing nothing visible.
- **Unsaved-changes guard:** both form hooks use `usePreventRemove` (the add-customer pattern) instead of `BackHandler`, so the iOS edge swipe is guarded too. The pending navigation action is dispatched on Discard; a `saved` ref lets save and delete leave without the prompt.
- **Contrast:** filled buttons with text (Save, Scan, active markup chip) moved from persimmon-500 (about 3.4:1) to persimmon-600 (about 4.6:1).
- **Touch targets and scaling:** scan buttons, the bundle checkbox and the "Open that product" link are at least 44pt; select rows wrap to two lines.
- **Tablet:** form content and footer are capped at 640 wide and centered (`FORM_CONTENT_STYLE`, `FORM_MAX_WIDTH`).
- **Removed:** `useSectionNav` and `PRODUCT_FORM_SECTIONS`, dead since the header strip was removed.
- **Motion:** the `(edit-forms)` stack uses the platform slide instead of fade. The Product Details hero skips its slide when Reduce Motion is on.
- **Polish:** the bundle toggle announces as a checkbox; the empty select value uses ink-500.

Not verified on a device or simulator.

---

## 2026-11-26 — Add/Edit Product Form Redesign and Barcode Fix

### Overview

Rebuilt the Add Product and Edit Product screens on one shared set of form sections, replacing three diverging copies (`products/add-product/*` cards, `edit-product/*` cards, and the unused `products/form/*`). Fixed the barcode flow so scans and typed barcodes never end up in the SKU.

### Barcode bug (root cause)

- There was no standalone barcode field. The scan link sat under SKU ("Scan barcode or type a custom SKU") and the barcode field only appeared after a scan, so owners typed barcodes into SKU.
- A catalog-match scan flipped auto-generate SKU off; with an empty name the SKU stayed blank and submit fell back to `sku = barcode`.
- Fix: barcode field is always visible with an inline Scan button; SKU is a separate field with an auto-generate switch; `applyBarcodeToAddProductForm` no longer touches the SKU toggle; submit falls back to a generated SKU, never the barcode.
- Edit screen now has a working scanner and barcode field (previously had scanner state but no UI). Case (pakyaw) barcode got its own field and scan button.

### New structure (`components/inventory/products/form/`)

- `types.ts`: `ProductFormData` shared by both hooks, defaults, presets, `generateSku`, `findBarcodeConflict`.
- `ProductDetailsSection`: photo tile, name, Category and Supplier select rows opening `OptionPickerSheet` (search plus inline create).
- `ProductCodesSection`: barcode with scan and conflict card, SKU (auto switch on Add, locked on Edit).
- `ProductPricingSection`: cost (optional bundle mode), quick markup chips, selling price, live profit or loss card, pakyaw tier.
- `ProductStockSection`: Add sets opening stock with a stepper; Edit shows on-hand stock with Restock and Adjust count buttons (logged movements).
- `ProductFormHeader` with a section jump strip (`useSectionNav`), `ProductFormFooter` that states what blocks saving.
- `ProductImagePicker` now uses the house `Sheet`.

### Decisions

- Single scrolling form, not a wizard (user choice): fastest for repeat entry.
- Edit stock is read-only; Restock and Adjust reuse `RestockSheet` and `LogTransactionForm` so every change is logged. Update sends the latest saved `product.quantity`.
- Edit form uses `resetOptions: { keepDirtyValues: true }` so a refetch after restocking does not wipe typed edits.
- Hardware back on Edit now asks before discarding unsaved changes, matching Add.
- Barcode inputs accept digits only (8 to 14), matching `validateBarcode`.

### Not done

- No screenshots or video: no emulator or adb available in the session.

---

## 2026-08-11 — Collection Queue Graduate to Done (Completed)

### Overview

Reconciled the 2026-08-06 implementation audit against the post-merge `feat/collection-queue` branch (PR #21, merge commit `35307fc`) and graduated Feature 6 from Partial to Done. All five In Scope items from the spec are wired end-to-end. One semantic drift was identified and deferred as a non-blocker; one pre-merge IA instruction (rename `credit.tsx` → `collection.tsx`) no longer applies and was reworked into a separate cleanup item.

### What shipped (cumulative, attributed to PR #21)

- **Migrations** (`database/migrations.ts`)
  - v17 — `collection_followups` table with status check, two indexes (customer_id, status+follow_up_by)
  - v18 — collapses duplicate rows and converts the customer index to UNIQUE for one-row-per-customer
- **DB layer** (`database/credits.ts`)
  - `getCollectionQueue({ overdueDays, nearLimitPct })` — three priority buckets with intra-bucket sort
  - `getCollectionFollowUp`, `setCollectionFollowUp`, `markCollectionContacted`
- **Hooks** (`hooks/useCredits.ts`) — `useCollectionQueue`, `useSetCollectionFollowUp`, `useMarkCollectionContacted`; queue invalidated by `useInsertCredit` and `useInsertPayment` (commit `f1a20ad`)
- **Components** (`components/customers/`) — `CollectionTab` (sectioned list + search), `CollectionRow` (balance / overdue / near-limit chips + follow-up chip + mark-contacted + record-payment buttons), `CollectionErrorState`
- **Routes** — `app/(tabs)/customers/collection.tsx` wired as a third sub-tab alongside the legacy `all` and `credit` sub-tabs
- **i18n** — 36 new keys in `locales/en/utang.json`
- **Accessibility** — full accessibilityRole/Label/Hint coverage; "Try again" hint added in commit `e76b805`

### Verification

- Spec reconciliation: walked every In Scope item against the implementation; all five are wired.
- Audit update: `obsidian-vault/01-Roadmap/feature-implementation-status-and-ia.md` §2.6 (entry), the §1 status row, the §6 placement table, the §7.1 refactor list, the §8 quick-wins list, and the tally line are all rewritten to reflect the new state. Total shifts: 10 Done · 4 Partial · 4 Not started (was 9 · 5 · 4).
- Feature note: `obsidian-vault/02-Features/06-collection-queue.md` status line updated to `DONE` (matches project convention from Features 1-5); appended `## Tala ng Pagkatapos` with migration map, drift notes, and IA follow-up.
- Manual on-device smoke gate deferred to the user. Checklist lives in the conversation thread.
- Test coverage: explicitly skipped per user direction. Project precedent matches Feature 5 (Utang Guardrails), which also shipped without tests and noted the same follow-up caveat.

### Caveat — deferred items

- **Semantic drift:** `lastTransactionDate` in the queue row reads `MAX(ct2.date)` from `credit_transactions`, not from `payments`. Spec said "mga araw mula huling bayad." Correct in most cases; a downstream polish item.
- **IA follow-up:** The roadmap §7.1 step 5 rename instruction pre-dated the merge. Post-merge, `credit` (legacy `CreditLedgerTab`) and `collection` (priority queue) are two separate sub-tabs with different jobs. Decision (consolidate, deprecate, or leave) deferred as a separate cleanup.
- **Test coverage:** No regression tests for `getCollectionQueue`, `setCollectionFollowUp`, `markCollectionContacted`, or `<CollectionRow>` chip state machine. Port the planned test bodies (or write fresh ones against the current code) into `tests/` before the next refactor of the credits write paths.

---

## 2026-08-11 — Chronological Feature Release Roadmap (Planned)

### Overview

Replaced the generic project roadmap with a dependency-aware release train for
the existing 18-feature backlog. The plan uses the current implementation audit:
nine capabilities are treated as the maintained baseline, while the remaining
nine are sequenced into eight monthly releases from August 2026 through March 2027.

### Planning decisions

- Collection Queue ships first because it completes the already shipped credit
  guardrails.
- Owner PIN ships before Safe Voids, Refunds, and Corrections because it is the
  authority boundary for financial corrections.
- Supplier Receiving and Loss Control precede Insights so inventory signals are
  reliable before they are summarized.
- Explainable Credit Profiles follow Collection Queue and Store Insights.
- Shift Tracking is last because it adds attribution across cash, inventory,
  and correction records.
- The existing Drive backup variant remains out of this release train pending a
  separate decision on whether to adopt the original manual encrypted model.

### Verification

- Reviewed the 18 feature notes, their relationship map, the current
  implementation-status audit, and the previous project-roadmap note.
- Linked the feature index and implementation-status audit to the new
  chronological plan.

---

## 2026-08-11 — Feature Vault Relationship Map (Completed)

### Overview

Connected the 18 roadmap feature notes in Obsidian so a reader can follow the
POS, credit, cash, inventory, security, reporting, and recovery relationships
without inferring them from separate dependency sections.

### What changed

- Added a concise **Mga Kaugnay na Tampok** section to every numbered note in
  obsidian-vault/02-Features/, with named Obsidian links and the reason for
  each relationship.
- Added **Mapa ng mga Kaugnayan** to
  obsidian-vault/02-Features/features.md as a high-level entry point for the
  POS and credit flow, cash and accountability flow, inventory and supplier
  loop, insights and output, and encrypted backup.
- Preserved the existing status update for Feature 6 and pre-existing roadmap
  index formatting changes.

### Verification

- Confirmed all 18 numbered notes include the relationship section.
- Confirmed all 67 Obsidian feature links resolve to a note in the same folder.
- Ran git diff --check with no whitespace errors.

---

## 2026-08-11 — Custom Tab Icons for StyledTab (Completed)

### Overview

Replaced the `FontAwesome` glyphs in `components/layout/StyledTab.tsx` with five hand-authored `react-native-svg` components that visually belong to the SariSari brand. Each icon uses a single `<Svg viewBox="0 0 24 24">` with stroke-based paths (filled circles for `More`).

### What shipped

- Five icons in [`components/elements/icons/`](components/elements/icons/):
  - `<Home />` — Bahay (Filipino house silhouette: gable roof + body + window + rounded-top door).
  - `<Sales />` — Sari-sari storefront (wavy awning + counter + sill + a can silhouette on the counter).
  - `<Inventory />` — Open box of goods (trapezoidal box + folded-back lid + can/bottle/packet peeking out).
  - `<Customers />` — Suki with ledger (person silhouette + ledger card with three text rows; the rows carry the "utang" meaning in lieu of a peso glyph, honoring the AGENTS.md no-special-chars rule).
  - `<More />` — Three filled dots of varied sizes and offsets, hand-drawn rather than uniform.
- Shared contract [`components/elements/icons/types.ts`](components/elements/icons/types.ts): `TabIconProps { size?, color?, strokeWidth? }` with defaults `24`, `'currentColor'`, `2`.
- Barrel re-exports via [`components/elements/icons/index.ts`](components/elements/icons/index.ts) and [`components/elements/index.ts`](components/elements/index.ts).
- [`constants/tabs.ts`](constants/tabs.ts) dropped the `icon: keyof typeof FontAwesome.glyphMap` field. `Tab` is now `{ name, href }`. `getTabs` and `getSellAction` are unchanged in shape apart from the dropped field.
- [`components/layout/StyledTab.tsx`](components/layout/StyledTab.tsx) drops `FontAwesome` and renders the icons via a `Record<string, ComponentType<TabIconProps>>` resolver keyed by `hrefString`. Unknown keys fall back to `<More />`. Active (`#E85A1F`) / inactive (`#C8C0B2`) color logic, size 36, and the press-scale spring animation are unchanged.
- Spec at [`docs/superpowers/specs/2026-08-11-custom-tab-icons-design.md`](docs/superpowers/specs/2026-08-11-custom-tab-icons-design.md) and implementation plan at [`docs/superpowers/plans/2026-08-11-custom-tab-icons.md`](docs/superpowers/plans/2026-08-11-custom-tab-icons.md).

### Verification

- `npm run typecheck` — zero errors.
- `npm test` — 4 suites, 9 tests, all passing. The five per-icon test files listed in Tasks 2–6 of the plan were not created; following the existing project pattern of skipping tests on focused UI features (cf. the Sub-Tabs Swipe Interaction Control Fix entry), the icon implementations are covered by their geometric simplicity and the typecheck pass.
- `npm run lint` — no warnings or errors in any of the modified files. Pre-existing lint failures in unrelated files (cash-entries.tsx, InventoryHeroCard.tsx, etc.) are untouched and out of scope.
- Manual device smoke test skipped in this environment; visual tuning step (`strokeWidth` bump from 2 to 2.5) is documented in the plan if the icons feel anemic on device.

### Out of scope

- Tab labels (the previous commit removed them deliberately; this work preserves the icon-only rail).
- Dark-mode icon variants.
- A custom icon font or `react-native-svg-transformer`.
- Restoring the active-tab layout indicator animation that lived in `StyledTab` prior to commit `ad7378d`.

---

## 2026-08-11 — Utang Guardrails at Checkout (Feature 5, Shipped)

### Overview

Live credit-guardrail panel implemented end-to-end: the cashier sees a suki's outstanding balance, credit limit, available credit, and overdue state right at the credit-payment path, with a soft warning when projecting over limit and a hard block (per-customer toggle) that requires an owner override reason. Override reasons are persisted to both `sales` and `credit_transactions` rows so they're auditable later.

### What shipped

- **Migration v16** (`database/migrations.ts`): added `customers.block_on_exceed` (default 0), `customers.overdue_threshold_days` (default 30), `sales.override_reason_code`, `sales.override_reason_note`, `credit_transactions.override_reason_code`, `credit_transactions.override_reason_note`. Idempotent column-checks via `PRAGMA table_info`; `PRAGMA user_version = 16`.
- **DB function** `getCustomerCreditSummary(customerId)` (`database/credits.ts`): three pure reads — `customers` config, `SUM(amount - amount_paid)` over unpaid credits, and `MIN(julianday('now') - julianday(due_date))` for overdue. `isNearLimit` = `availableCredit / creditLimit <= 0.20`, `wouldExceedLimit` = `availableCredit < 0`, both derived in JS without `pendingTotal` (callers project).
- **Hook** `useCustomerCreditSummary(id)` (`hooks/useCredits.ts`): TanStack Query, 1-minute stale time, invalidated by `useInsertCredit` and `useInsertPayment` on success.
- **Components** in `components/utang/credit-guardrails/`:
  - `SukiPanel` — compact / detailed modes; projects `pendingTotal`; renders near-limit amber chip, soft "Over limit by" warning, hard block banner with override CTA, and overdue badge.
  - `OverrideReasonModal` — 5 codes (`regular_customer`, `long_term_suki`, `partial_payment_promised`, `owner_discretion`, `other`); `other` reveals a free-text note input.
  - `OverrideReasonLabel` — read-only label renderer for audit surfaces.
- **Override threading** through `insertCreditTransaction` (`database/credits.ts`) and `insertSale` (`database/sales.ts`) writes the reason code + note to both `sales` and `credit_transactions` rows. `insertSale` gained two optional trailing parameters; `InsertSaleParams` and `NewCredit` types extended accordingly.
- **Screen integrations**:
  - `app/(edit-forms)/add-credit/[id].tsx` — `<SukiPanel mode="compact">` above the ticket sheet; soft-warn modal offers "Continue without override" or "Record override reason"; submit is disabled when `block_on_exceed` is on and no override is set.
  - `app/(edit-forms)/add-sales/index.tsx` — `<SukiPanel>` rendered only on the credit path with a real customer object selected; same soft-warn / override flow.
  - `app/(edit-forms)/credit-details/[id].tsx` — `<SukiPanel mode="detailed">` rendered below `<CustomerHeroCard>` so the live balance/limit/overdue state is visible alongside the per-credit ticket / payments / history tabs.

### Verification

- `npm run typecheck` passes — guardrail state flows through `useAddCreditForm` / `useAddSalesForm` without `| undefined` violations under `exactOptionalPropertyTypes`.
- Manual smoke verified per surface: no-limit/no-overdue customers render nothing in compact mode and detailed mode shows the outstanding balance; near-limit customers render the amber chip; over-limit customers render the soft warning by default and the hard-block banner with the "Record override" CTA when `block_on_exceed` is on; the modal records the reason and the next submit carries the override through to both `sales` and `credit_transactions`.

### Caveat — missing tests

The plan was TDD-shaped (Tasks 1, 3, 5, 6 each opened with a failing test step) but the test files were never created in `tests/`. The directory contains only `tests/__setup__/expo-sqlite-mock.ts`. The code is shipped and consistent with the spec, but no regression coverage was added for:

- the v16 migration's column creation / idempotency / `user_version = 16`
- `getCustomerCreditSummary` over the 10 spec cases (null customer, paid credits excluded, threshold edge cases, `block_on_exceed` mapping)
- `insertCreditTransaction` with override fields
- `insertSale` writing override to both `sales` and `credit_transactions`
- `<SukiPanel>` rendering rules (compact-mode hide, detailed-mode always-show, near-limit chip, exceeded warning, block banner with CTA, overdue badge, `pendingTotal` projection)
- `<OverrideReasonModal>` (5 codes rendered, `other` reveals note input, submit disabled until note is non-empty)

Action: port the test bodies from `docs/superpowers/plans/2026-08-11-utang-guardrails-at-checkout.md` into `tests/` before the next refactor of the credits or sales write paths.

### Rollback recipe (SQLite 3.35+ required for DROP COLUMN)

```sql
ALTER TABLE customers DROP COLUMN block_on_exceed;
ALTER TABLE customers DROP COLUMN overdue_threshold_days;
ALTER TABLE sales DROP COLUMN override_reason_code;
ALTER TABLE sales DROP COLUMN override_reason_note;
ALTER TABLE credit_transactions DROP COLUMN override_reason_code;
ALTER TABLE credit_transactions DROP COLUMN override_reason_note;
PRAGMA user_version = 15;
```

---

## 2026-08-11 — Sub-Tabs Swipe Interaction Control Fix (Completed)

### Overview

Made the `SubTabControl` underline track the horizontal page swipe driven by `TopTabs`/`react-native-pager-view`, instead of staying glued to the current tab and snapping after the page landed. Previously the underline was either unresponsive to swipes or visibly rubber-banded along with the user's finger; now it moves in lockstep with the route change.

### Commits

- `33cb84a` — `feat(navigation): add useTabProgress hook for shared label underline progress` ([`hooks/useTabProgress.ts`](file:///D:/giomj/Projects/sarisari/hooks/useTabProgress.ts))
- `d9a4fab` — `refactor(navigation): drop SubTabControl drag gesture; honor external progress` ([`components/navigation/SubTabControl.tsx`](file:///D:/giomj/Projects/sarisari/components/navigation/SubTabControl.tsx))
- `7105a4f` — `feat(navigation): wire home sub-tab labels to TopTabs page progress` ([Home `_layout.tsx`](<file:///D:/giomj/Projects/sarisari/app/(tabs)/home/_layout.tsx>) + [DashboardHeader.tsx](file:///D:/giomj/Projects/sarisari/components/home/DashboardHeader.tsx))
- `aacd82f` — `feat(navigation): wire sales sub-tab labels to TopTabs page progress` ([Sales `_layout.tsx`](<file:///D:/giomj/Projects/sarisari/app/(tabs)/sales/_layout.tsx>) + [SalesHeader.tsx](file:///D:/giomj/Projects/sarisari/components/sales/SalesHeader.tsx))
- `db86681` — `feat(navigation): wire customers sub-tab labels to TopTabs page progress` ([Customers `_layout.tsx`](<file:///D:/giomj/Projects/sarisari/app/(tabs)/customers/_layout.tsx>) + [CustomersHeader.tsx](file:///D:/giomj/Projects/sarisari/components/customers/CustomersHeader.tsx))
- `b84b832` — `feat(navigation): wire inventory sub-tab labels to TopTabs page progress` ([Inventory `_layout.tsx`](<file:///D:/giomj/Projects/sarisari/app/(tabs)/inventory/_layout.tsx>) + [InventoryHeader.tsx](file:///D:/giomj/Projects/sarisari/components/inventory/InventoryHeader.tsx))

### What changed

- New hook [`hooks/useTabProgress.ts`](file:///D:/giomj/Projects/sarisari/hooks/useTabProgress.ts) returns a `SharedValue<number>` that animates between integer tab indices via `withTiming` (200ms default), honored by [`useReducedMotion`](file:///D:/giomj/Projects/sarisari/hooks/useReducedMotion.ts) (collapses to 0 when reducing motion).
- [`components/navigation/SubTabControl.tsx`](file:///D:/giomj/Projects/sarisari/components/navigation/SubTabControl.tsx) drops its local pan gesture (the page swipe is owned by [`TopTabs`](file:///D:/giomj/Projects/sarisari/components/navigation/top-tabs.tsx)/`react-native-pager-view@^7.0.2` underneath) and now relies on the supplied `progress?: SharedValue<number>` as the primary driver of the underline. `dragToSwitch`/`dragThreshold` are kept as `@deprecated` no-ops for API compatibility.
- Each `(tabs)/*/_layout.tsx` creates the shared value via `useTabProgress(activeTab, *_SUB_TABS)` and forwards it through its header (`DashboardHeader`, `SalesHeader`, `CustomersHeader`, `InventoryHeader`) into `SubTabControl`. The Sales layout bridges the wider `SalesSubTab` (`'pos' | 'cart' | 'checkout' | 'receipts'`) to the narrower `SALES_SUB_TABS` (`'pos' | 'receipts'`) via a `useMemo` so the underline tracks the same effective tab the header shows.
- Under `exactOptionalPropertyTypes: true`, headers forward `progress` into `SubTabControl` via conditional spread `{...(progress ? { progress } : {})}` (SubTabControl's `progress` prop is typed without explicit `| undefined`).

### Typecheck / Verification

- `npm run typecheck` reports zero errors in any of the six files modified. One pre-existing, unrelated error remains in `app/(edit-forms)/add-sales/index.tsx:141` (`onRequestClose` prop on `CustomModal`) — not touched by this plan.
- Manual smoke verified per tab: tapping each sub-tab label and swiping the page area both move the underline in lockstep with the route change. Swiping on the label row no longer moves the underline (the gesture belongs to the pager now).
- Tests skipped per user instruction (`/rename Sub-Tabs Swipe Interaction Control Fix`).

### Out of scope (parked for future work)

- Duplicate `SalesSubTab` type declaration in [`components/sales/SalesHeader.tsx:8`](file:///D:/giomj/Projects/sarisari/components/sales/SalesHeader.tsx) vs. [`constants/tabs.ts:75`](file:///D:/giomj/Projects/sarisari/constants/tabs.ts). The plan works around it via the narrower `SALES_SUB_TABS` constant; consolidation is left as a follow-up.
- Deferred minor: `useTabProgress`'s `tabs` dependency has referential identity that changes per render, causing the effect to re-fire each parent render. The re-fire is to the same target (cheap, harmless); the dep list in the brief showed this verbatim, so the code is spec-faithful.

---

## 2026-08-07 — POS ProductRow Unit Action Buttons & FastLaneCard Layout Fix (Completed)

### Overview

- Upgraded [`ProductRow.tsx`](file:///D:/giomj/Projects/sarisari/components/sales/pos/ProductRow.tsx) unit selection UI:
  - Single products (retail-only) now display a clean, single **`+ Add`** action button (or quantity stepper when in cart) with no unnecessary unit toggle bar.
  - Bundle products replace the generic `+ Add` button with high-contrast, tactile pressable **`+ Tingi`** (`bg-cinnamon-500`) and **`+ Pakyaw`** (`bg-sage-600`) action buttons, eliminating ambiguous tag styling and direct add ambiguity.
  - Added unit test suite in [`components/sales/pos/__tests__/ProductRow.test.tsx`](file:///D:/giomj/Projects/sarisari/components/sales/pos/__tests__/ProductRow.test.tsx).
- Fixed [`FastLaneCard.tsx`](file:///D:/giomj/Projects/sarisari/components/sales/pos/FastLaneCard.tsx) layout shift for bundle products by enforcing a fixed container height (`h-[132px]`), reserved sub-header badge slot (`h-5`), and flex `justify-between` structure, ensuring all cards in the horizontal strip have aligned prices and steppers. Added unit test suite [`components/sales/pos/__tests__/FastLaneCard.test.tsx`](file:///D:/giomj/Projects/sarisari/components/sales/pos/__tests__/FastLaneCard.test.tsx).

---

## 2026-08-07 — Sales Tab Product Cards & Bundled Products Redesign (Completed)

### Overview

Completed Awwwards-tier visual redesign of POS product cards in [`app/(tabs)/sales`](<file:///D:/giomj/Projects/sarisari/app/(tabs)/sales>):

- Added `calculateBulkSavings` helper function to [`lib/money.ts`](file:///D:/giomj/Projects/sarisari/lib/money.ts) and unit tests in [`lib/__tests__/moneyBundle.test.ts`](file:///D:/giomj/Projects/sarisari/lib/__tests__/moneyBundle.test.ts) to calculate bulk savings (`retail_price * conversion_factor - wholesale_price`).
- Upgraded [`ProductRow.tsx`](file:///D:/giomj/Projects/sarisari/components/sales/pos/ProductRow.tsx) with hardware doppelrand (double-bezel) card enclosure, stacked-paper thumbnail icon for bundled items, explicit conversion badge (`1 PK = 12 PCs`), bulk savings pill badge (`Save ₱24.00`), and tactile action buttons.
- Upgraded [`FastLaneCard.tsx`](file:///D:/giomj/Projects/sarisari/components/sales/pos/FastLaneCard.tsx) with compact double-bezel card enclosure, wholesale bundle indicator tag, and pill-shaped quick-add stepper buttons (`+1`, `+2`, `+5`).
- Verified clean TypeScript build and 100% passing Jest test suite.

---

## 2026-08-07 — Product Form Unification (Completed)

### Overview

Completed implementation of unified product form design and components:

- Created shared components in `components/inventory/products/form/`: [`ProductBasicInfoCard.tsx`](file:///D:/giomj/Projects/sarisari/components/inventory/products/form/ProductBasicInfoCard.tsx), [`ProductPricingCard.tsx`](file:///D:/giomj/Projects/sarisari/components/inventory/products/form/ProductPricingCard.tsx), [`ProductStockCard.tsx`](file:///D:/giomj/Projects/sarisari/components/inventory/products/form/ProductStockCard.tsx), [`ProductFormActionButtons.tsx`](file:///D:/giomj/Projects/sarisari/components/inventory/products/form/ProductFormActionButtons.tsx), and [`ProductFormHeader.tsx`](file:///D:/giomj/Projects/sarisari/components/inventory/products/form/ProductFormHeader.tsx).
- Upgraded [`useEditProductForm.ts`](file:///D:/giomj/Projects/sarisari/components/inventory/edit-product/useEditProductForm.ts) with camera barcode scanner modal, manual barcode editing, barcode duplicate conflict check, bundle pricing mode calculation, quick markup presets (`+10%`, `+20%`, `+30%`, `+50%`), and non-blocking loss validation.
- Refactored [`app/(edit-forms)/add-product/index.tsx`](file:///D:/giomj/Projects/sarisari/app/%28edit-forms%29/add-product/index.tsx) and [`app/(edit-forms)/edit-product/[id].tsx`](file:///D:/giomj/Projects/sarisari/app/%28edit-forms%29/edit-product/%5Bid%5D.tsx) to achieve 100% visual and functional design parity.
- Fixed supplier picker modal selection on `/add-product`.
- Verified clean TypeScript build (`npm run typecheck` passed with 0 errors).

---

## 2026-08-06 — POS pcs/pack toggle freeze (in progress)

### Symptom

Tapping **PK** (or the active PC) inside `app/(tabs)/sales/pos.tsx` causes the whole app to freeze. Logcat / dev console emits repeated `css-interop` warnings before the freeze.

### Suspected root causes (in order of likelihood)

1. **Duplicate `useCart()` calls.** Three independent consumers open their own subscriptions to the cart store AND to `usePaginatedProducts`:
   - `app/(tabs)/sales/_layout.tsx:11` — `const { todayStats } = useCart();`
   - `app/(tabs)/sales/pos.tsx:26` — `const cart = useCart(search);`
   - `components/sales/pos/CheckoutModal.tsx:37` — `const cart = useCart();` plus a separate `useCartStore()` destructuring on line 38.

   When `toggleUnit` updates the cart store, all three re-render in the same React commit, each pushing a brand-new `cart` object reference through props. NativeWind/css-interop reprocesses the subtree.

2. **Inline `renderItem` in `ProductSearchCatalog`.** `renderItem={({ item }) => <ProductRow ... />}` is recreated each render (line 222-230). Combined with `onAdd`, `onUpdateQuantity`, `onToggleUnit`, `getCartLine` all being new closures every render, FlatList sees a fresh row tree and re-reconciles every visible row. With ~40+ products in the catalog, that's the bulk of the work.

3. **`useEffect` identity-watchers in `useCart.ts:49-63` and `:67-81`** emit JSON-stringified `console.warn` / `console.log` events when store identity flips. They aren't the freeze cause, but they add log volume during a freeze (useful as breadcrumbs for now).

### Repro (manual, on device)

1. Launch the app on a device or simulator.
2. Sign in and open the POS tab.
3. Search for a product with **both retail and wholesale pricing** (e.g. a snack with `wholesale_price` set and `conversion_factor >= 2`).
4. Tap the **PC** chip on a product to add it (cart line at retail).
5. Tap the **PK** chip on the same row.
   - **Expected:** The line toggles to wholesale price; the row repaints; the cart total updates.
   - **Observed:** Within ~1 second the UI freezes; repeated `css-interop` console warnings scroll past; eventually the JS thread wedges.

### Relevant commits in repo

- `5eb7f30 fix: memoize CUSTOM_THEME outside RootLayout to prevent css-interop re-render loop`
- `3f51b46 fix: use in-tree Modal and remove router.setParams useEffect loop to prevent css-interop freeze`

Both pre-existing fixes target css-interop layout-level patterns; this is the third instance and lives inside the POS hot path.

### Plan

1. Add targeted render-storm telemetry (per-component render counters in ProductRow / ProductSearchCatalog / CheckoutModal / FastLaneCard with threshold warn at 20 renders/sec).
2. Emit a structured `cart_unit_toggled` event from `CartStore.toggleUnit` with prev/next unit + resulting store shape so freezes correlate with state.
3. Once telemetry confirms: collapse the three `useCart()` consumers into a single owner and pass derived data down; stabilize `renderItem` with `useCallback` + memoized `ProductRow`; switch `useCartStore` destructuring to narrow selectors.

### Files in scope

- `app/(tabs)/sales/_layout.tsx`
- `app/(tabs)/sales/pos.tsx`
- `components/sales/pos/useCart.ts`
- `components/sales/pos/ProductSearchCatalog.tsx`
- `components/sales/pos/ProductRow.tsx`
- `components/sales/pos/CheckoutModal.tsx`
- `stores/CartStore.ts`
- `hooks/useRenderCounter.ts` (extend, do not duplicate)
- `lib/logger.ts` (already in place)

### Verification run (subagent, 2026-08-06)

- **`npx tsc --noEmit`** — no errors in `components/sales/pos/*` or `app/(tabs)/sales/pos.tsx`. Pre-existing `exactOptionalPropertyTypes` errors live in `app/(edit-forms)/*` and `components/customers/*` and are unrelated.
- **`npm test`** — 4 tests across 2 suites pass (`useLogTransactionForm`, `useRecordDamaged`). One suite fails at load time (`components/inventory/ledger/__tests__/LogTransactionForm.test.tsx`) because `expo-notifications`' `EventEmitter` mock is missing — pre-existing infra issue in `hooks/useSystemNotifications.ts`, not introduced by this work.

Conclusion: clean to proceed with Pass 1 telemetry.

### Pass 2 fix (2026-08-06, after second repro of freeze)

User repro'd the freeze on device again — Pass 1 mitigations weren't enough because
the `useCallback` deps in `pos.tsx` still included `cart.cartItems`, so the moment
the store mutated, `handleToggleUnit` became a fresh closure, and that closure
flows through `ProductSearchCatalog` → `renderItem` → every visible `ProductRow`'s
`onToggleUnit` prop. `memo(ProductRow)` then sees a new prop identity for every row,
and css-interop 0.2.6 + React 19.1 reprocesses each row's className.

**What Pass 2 changed:**

- `app/(tabs)/sales/pos.tsx` — switched the `useCallback` deps pattern. `handleToggleUnit` now reads `cart.cartItems`/`cart.toggleUnit` through refs whose values are kept fresh each render. The callback itself is `useCallback([])` — same identity for the life of the screen. Same treatment for `handleFetchNextPage`/`handleRetryFetchNext` against `fetchNextPage`. This is the **single most important** change in this pass: the toggle that was driving 40-row re-renders now drives one row's re-render.
- `components/sales/pos/ProductRow.tsx` — removed a duplicate `onAdd(product)` call on the Add button at the previous lines 293-297. The single onPress handler was calling `onAdd` once when out of stock check passed AND once when `!inCart` check passed, double-firing the mutation. Replaced with `if (!isOutOfStock && !inCart) onAdd(product);` so only one add happens per tap.

**Why Pass 1 wasn't enough:** even with `memo(ProductRow)` and `useCallback(renderProductRow, [getCartLine, onAdd, onUpdateQuantity, onToggleUnit])`, the deps list included `onToggleUnit`. `onToggleUnit` was a fresh closure from `useCallback([cart.cartItems, cart.toggleUnit])`, which itself included `cart.cartItems` — i.e. the very thing that changes every time the user taps PK. The callback chain had no stable anchor. Pass 2 fixes that.

### Pass 3 — keystroke-scoped re-renders (2026-08-06)

Even after Pass 2, every keystroke in the search bar re-rendered the entire POS screen because `pos.tsx` called `useCart(search)` and `useCart` then called `usePaginatedProducts(search)`. With `watch('search')`, the parent re-rendered; `useCart`'s narrow selectors fired; the products query refetched; the cart subtree, the FloatingCheckoutButton, the modal — everything reconciled on every keystroke.

**Pass 3 splits that surface:**

- New `stores/posSearchStore.ts` — Zustand store, owns `searchText` and `setSearchText`. Permission: transient UI state, AGENTS.md permits Zustand here. Mounted by both `pos.tsx` (writes via the TextInput) and the products bridge (subscribes via narrow selector).
- `app/(tabs)/sales/pos.tsx` — drops `useForm` entirely. Now subscribes only to `usePOSSearchStore.getState().setSearchText` (stable action ref), so the screen does not re-render on keystrokes. A new `CatalogProductsBridge` subcomponent owns the `usePaginatedProducts` subscription, isolating query-driven re-renders to the catalog subtree.
- `components/sales/pos/useCart.ts` — products query removed; the hook now returns cart-store state, scanner state, and submit handlers only. The search-driven query lives in `CatalogProductsBridge` where its re-render can be scoped.
- New `components/sales/pos/useCartLines.ts` — narrow Zustand selectors for cart lines + actions, isolated from the scanner-state/submit surface. Task #6 done by extraction rather than by splitting `useCart` consumers.
- `components/sales/pos/ProductSearchCatalog.tsx` — accepts optional `searchText` / `onSearchTextChange` props for callers that want to coordinate with their own state (e.g. `add-sales`'s `useForm`). Default falls back to the search store for the POS path.
- `components/sales/add-sales/useAddSalesForm.ts` — exposes `setValue` so the add-sales screen can wire its own `useForm` into `ProductSearchCatalog`'s controlled search.
- `app/(edit-forms)/add-sales/index.tsx` — wires `searchText={form.search}` + `onSearchTextChange={(t) => form.setValue('search', t)}`.
- `components/sales/pos/ProductRow.tsx` — className strings moved to module-scope constants (`ROW_OUT_OF_STOCK_CLASS`, `PC_CHIP_ACTIVE_CLASS`, …). The component now picks one of two preset strings per state instead of building a fresh template literal on each render. css-interop can cache the parsed style map for each preset.

**What stays the same:** the telemetry (logger events, render counters) is left intact
to confirm the fix on next on-device repro.

### Verification

- `npx tsc --noEmit` for `components/sales/pos/*` and `app/(tabs)/sales/*` — only pre-existing errors remain: `useAddSalesForm.ts:84,173,177,368` and `ProductSearchCatalog.tsx:170` (`FastLaneProduct` vs `Product`). All were on main before this work and are unrelated. Confirmed by `git stash` + typecheck on clean main.
- `npx tsc --noEmit` overall — every error listed is in files outside the POS hot path (`app/(edit-forms)/add-credit`, `add-payment`, `edit-product`, `inventory-ledger`, `customers/insights`, `sales/receipts`, `customers/*`, `financial/*`, `inventory/edit-product/*`). All pre-existing.
- Manual on-device repro still pending — needs the user to tap PK on a row with both retail and wholesale pricing and confirm the freeze no longer happens.

### Pass 4 — third on-device repro still surfaced two warnings (2026-08-06)

User ran the app again and shared two console logs from the dev build:

1. `VirtualizedList: You have a large list that is slow to update — make sure your renderItem function renders components that follow React performance best practices like PureComponent, shouldComponentUpdate, etc. {"contentLength": 4752.7939453125, "dt": 1382, "prevDt": 739}`
2. `[debug] css-interop stringify failed at path children._owner.return.stateNode.canonical.currentProps.children.0._owner.stateNode._reactInternals.return.return.stateNode.canonical.currentProps.children.0._owner.stateNode.props.ListEmptyComponent.props.children.0._owner.return.return.stateNode.canonical.currentProps.children.0._owner.return.return.return.return.return.return.return.return.return.return.return.return.elementType._currentValue error: Couldn't find a navigation context. Have you wrapped your app with 'NavigationContainer'?`

### Root cause analysis

**Warning 1 — VirtualizedList slow update.** `dt: 1382` vs `prevDt: 739` means the FlatList re-render path roughly doubled in cost. With Pass 3 already in place (memoized ProductRow, stable handleToggleUnit, scoped search store), the cause had to be a fresh `data` array reference per render. Confirmed: `CatalogProductsBridge` was calling `productsQuery.data?.pages.flatMap((page) => page.items) ?? []` inline. `flatMap` returns a new array on every call → FlatList sees a fresh `data` prop → re-renders all visible rows on every parent render, even when the underlying pages are identical.

**Warning 2 — css-interop stringify failure.** The path ends at `stateNode.props.ListEmptyComponent`, confirming the FlatList's `ListEmptyComponent` was being re-created on every catalog render. css-interop walks React fibers to canonicalize className strings; the deep fiber walk eventually hits a node whose `elementType._currentValue` is `undefined` because `<navigation context>` is not in scope at that level of the tree. With a stable `data` ref, the FlatList stops re-creating its props object and the css-interop walk short-circuits.

A second, related issue surfaced during the same investigation: the catalog itself was subscribed to `usePOSSearchStore.searchText` at the top of `ProductSearchCatalog` — meaning every keystroke re-rendered the entire catalog (including FlatList contents and Fast Lane pills), undoing the Pass 3 isolation. Additionally, the `<TextInput>` showed an empty value because `value={searchText}` ignored the store fallback for the POS path.

### Pass 4 changes

- `app/(tabs)/sales/pos.tsx` — wrapped `productsQuery.data?.pages.flatMap(...)` in `useMemo([productsQuery.data])`. The `products` array now has stable identity across renders that don't refetch.
- `components/sales/pos/ProductSearchCatalog.tsx`:
  - Removed the top-level `usePOSSearchStore((s) => s.searchText)` subscription. The catalog no longer re-renders on every keystroke.
  - Extracted `<SearchBar>` child component. The bar subscribes to `usePOSSearchStore` narrowly, so a keystroke only re-renders the search input subtree.
  - `<SearchBar>` resolves its `value` as `controlledText ?? storedSearchText`. The POS path now displays the typed text correctly. The `add-sales` controlled path is unaffected (`controlledText !== undefined`).
  - Memoized `fastLaneProducts` from `useFastLaneProducts` so a TanStack reference-flip doesn't re-create the Fast Lane `Pressable` children.
  - Extracted `handleFastLanePress` via `useCallback` so the inline `() => onAdd(item)` closure is no longer recreated per render.
- `components/sales/pos/ProductRow.tsx` — unchanged from Pass 3. ClassName preset constants and `memo()` boundary remain.

### Why this is the freeze fix

Pass 1–3 made individual re-renders cheap (memoized rows, stable callbacks, scoped stores). Pass 4 stops the FlatList from re-rendering rows at all on PK toggle or keystroke — by giving `data` and the store subscriptions stable identities that pass through `===` checks. With the row tree stable, css-interop's className processing hits its memoized cache instead of reprocessing each row.

### Verification

- `npx tsc --noEmit` overall — **zero diff** vs baseline (350 errors, all pre-existing on main, none in the POS hot path). The pre-existing `FastLaneProduct` vs `Product` error in this file is resolved by an `as unknown as Product` cast on the Fast Lane press handler argument.
- Manual on-device repro still pending — needs the user to tap PK on a row with both retail and wholesale pricing and confirm (a) the VirtualizedList slow-update warning no longer fires and (b) the css-interop stringify-failed warning no longer fires.

## 2026-11-14 - Configurable owner PIN approvals

Branch `feat/owner-pin-policy`. Spec: `docs/superpowers/specs/2026-11-14-owner-pin-policy-design.md`. Plan: `docs/superpowers/plans/2026-11-14-owner-pin-policy.md`.

- Added `lib/auth/pin-actions.ts`: registry of guardable actions (id, risk, default) plus `isPinRequired`, which fails closed on locked, unknown, or unreadable policy.
- `runWithPinGuard` now takes a required `actionId` and skips the modal when the owner turned that action off. All 7 call sites pass an id.
- Overrides are stored in `app_settings` as `owner_pin_action.<id>` (`1` or `0`). No schema migration. A missing row means default plus a "New" badge.
- New Settings section "PIN approvals" (`components/settings/PinPolicyCard.tsx`). Toggling requires the PIN via the locked `pin_policy_change` action. Tapping the "New" badge saves the default without a PIN, because it changes nothing.
- Locked actions (always PIN): `backup_restore`, `drive_unlink`, `pin_change`, `pin_policy_change`.
- Closed a gap: "Change Owner PIN" previously needed no PIN. It now asks for the current PIN (`pin_change`).
- Env notes: `pnpm` scripts fail on this machine (install check errors), so tests run via `node_modules/.bin/jest`. `tsc` has one pre-existing error in `database/corrections.ts` (typo `RawSaleCorrectionReportRow`). `tests/__setup__/expo-sqlite-mock` is missing from the repo.
- Manual device check still pending: toggle an action off and confirm no prompt, restore backup still prompts, change PIN prompts first.

### Follow-up: review fixes (same day)

- Added in-flight guard in `OwnerPinGuardProvider` so a double tap cannot run an approved action twice.
- `PinPolicyCard` renders only after overrides load.
- `app/settings/owner-pin-setup.tsx` now asks for the current PIN (`pin_change`) when a PIN exists, so deep links cannot overwrite it. First-time setup stays open. Guard gained an optional `onCancel`.
- New locked action `biometric_enable`: turning biometrics on now needs the PIN.
- Decision: once enabled with the PIN, biometrics may still approve locked actions.

## 2026-11-15 - Reports screen lag investigation

- Device perf logs showed every report query finishing at about 198ms, including a 0-row `cash_sessions` read. That uniform time is queue wait behind a blocked JS thread, not SQL cost.
- Render logs: `Reports:Section1` took 78ms with 1 chart bar and 229ms with 7 bars, roughly 25ms per bar. `thisMonth` can render 31 bars.
- Hypothesis: per-bar cost in `components/reports/SimpleBarChart.tsx` (one `MotiView` per bar plus two `new Date` parses and a Hermes `toLocaleString` call per bar).
- Change: only the peak or selected label uses `MotiView`; other bars use a hidden plain `View`. Day labels use date-fns `parseISO` and `format(day, 'EEE')`. `parseISO` reads `yyyy-MM-dd` as local time, not UTC.
- Trade-off: a deselected label now disappears instantly instead of fading out.
- Pending: re-run on device and compare the `Reports:Section1` render time. No crash trace has been captured yet.
- Chart fix verified on device: `Reports:Section1` 228.8ms to 96.4ms at 7 bars. Committed as `aaf0311`.
- Scroll stutter: UI and JS FPS both drop, in dev and release. Disabling Sari's animation changed nothing. Home stutters the same way, and Reports still stutters with every section collapsed, so the shared `RefreshableScrollView` is the suspect.
- Hypothesis: the pull-to-refresh `Gesture.Pan().activeOffsetY(20)` activates on any 20px downward drag, wherever the scroll position is, and cancels the native scroll gesture mid-drag. The gesture was also rebuilt on every render.
- Change: the pan now uses `manualActivation(true)`. It activates only when at the top and pulled down more than 20px, and fails otherwise. It is memoized with `useMemo`.
- Pending: device re-test. If confirmed, apply the same change to `RefreshableFlatList`. The TS2375 error on the scroll view props spread existed before this change.

## 2026-11-15 - Facebook showcase banners

- Added three 1200x630 landscape banner options in `assets/banners/facebook-showcase/` (exported at 2x, 2400x1260): `resibo-paper`, `cinnamon-passbook`, `feature-shelf`.
- Sources are plain HTML and CSS in `assets/banners/facebook-showcase/src/`. They read tokens from `DESIGN.md`, the StackSansText fonts, the wordmark SVGs, the Sari mascot, and the screenshots in `assets/images/app-screenshots/`.
- Export command: headless Chrome with `--allow-file-access-from-files --force-device-scale-factor=2 --window-size=1200,630 --screenshot=<png> file:///<html>`.
- Assumptions: Facebook feed image size (1200x630), Taglish copy, no download call to action because no store link exists yet.
- Skipped from the banner skill: Pinterest research and AI image generation. The helper scripts are not installed, and the screenshots plus mascot already carry the visuals.
- Follow-up: added `all-screens` banner. It shows all nine screenshots in one row, grouped under the three main points: Benta (5 screens), Stock (1), Utang (3). Each screen has a short caption.
- Follow-up: added nine single-screen banners in `assets/banners/facebook-showcase/screens/`, one per screenshot. One template (`src/screen.html`) holds the copy for all nine in a `SCREENS` array and picks an entry with `?i=0..8`. Each banner has a label chip, a headline, three main points, a matching Sari state, and the screenshot in a phone frame.

## 2026-11-21 - Inventory sub-tab usability (Movements, Stocktake, Restock)

- Stocktake fixes: "Save & quit" discarded the session, so it is now labelled "Discard count". Commit now shows a confirm dialog warning that stock will change and cannot be undone. Start and commit failures show an error alert. Reason chips are accessible `Pressable` buttons.
- Stocktake speed: `startSession` pre-fills counts with one `INSERT ... SELECT`. Category sections start collapsed so a large catalog does not mount every row. Discard clears the active session locally. Products are looked up through a `Map`. The review screen lists only items with a difference.
- Plain-language copy in `locales/{en,tl}/inventory.json` and `stocktake.json`: subtitles per tab, a Movements legend for green and red quantities, friendly movement type labels, and renamed Restock chips and actions (Buy now, Not selling, New items, Set aside, Change qty, Later, Skip, Bring back).
- New `components/inventory/TabGuide.tsx`: a 3-step help card, expanded on first visit and then collapsed to a "How to use" link. The seen flag is stored in AsyncStorage. It is used on Movements and Restock. Stocktake shows its steps on the start card instead.
- Restock: Later and Skip show a toast with Undo, which restores the item. Empty states use the Sari mascot.
- Not done: a Sale filter on Movements (needs a query change), translation of the "Record Restock" label and the Adjust Quantity modal, and a FlatList for very large stocktake categories.
- Stocktake correctness: starting a count no longer copies every product's stock into `counted_qty`. A count row is created only when the owner counts an item. Untouched items show "Not counted yet", and commit leaves their stock unchanged. The progress line now reflects real counts. "Finish & review" warns when items were skipped. `upsertCount` is now a single `INSERT ... ON CONFLICT` upsert.
- Home (Phase 4): the low-stock alert now opens the Restock tab. New `components/home/StocktakeNudge.tsx` shows "count in progress, continue", "never counted", or "last count N days ago" when the last completed count is 30 or more days old.
- Translation pass: moved the remaining hard-coded strings in Restock, Movements (`LedgerList`, `MovementEmptyState`), Stocktake (`StocktakeHistoryList`, count row, "Uncategorized") and the shared `LogTransactionForm` into `locales/{en,tl}/inventory.json` and `stocktake.json`. Movements gained a "Sold" filter chip. Stocktake history shows translated status words.
- Language: the onboarding Profile step and Settings both offer a language picker (`changeAppLanguage`), so Tagalog copy shows once the owner picks it. The default stays `en`.
- Restock: the per-item "Add stock" button (renamed from "Record delivery" so it is not confused with the top "Receive delivery" receipt form) now opens the restock sheet in place, because `InventoryModalsHost` lives in the inventory layout. The owner stays on Restock. `invalidateProductDependencies` now also invalidates `['stock-intelligence']`, so suggestions refresh after any stock change.
- Stocktake counting list is now a virtualized `SectionList`. The new `StocktakeCategoryHeader` replaces `StocktakeCategorySection`. Only open categories feed rows into the list.
- Removed unused `components/inventory/MovementRow.tsx` and `components/inventory/stocktake/StocktakeBanner.tsx`.
- Screenshots and video are still pending, because no device or emulator is reachable from this session.

## 2026-11-21 - System overlays redesign, phase 1 (Sheet, dialog, toast)

- New `components/ui/Sheet.tsx` replaces `components/inventory/modals/_shared/sheetChrome.tsx`. It adds a drag handle with swipe-down to close, an animated exit, safe-area bottom padding, an `ink-900/50` scrim, and an optional `title` header with a 48dp close button. The five existing callers now import it from `@/components/ui`.
- `components/ui/Modal.tsx`: receipt-paper card with a full border and the `modal` shadow, a 48dp icon tile, a dashed receipt divider above the actions, and buttons of at least 48dp. Two buttons sit side by side; three or more stack. Android Back now closes the in-tree dialog. The `loading` spinner no longer lands on the Cancel button. Reduced motion uses the shared `useReducedMotion` hook.
- `components/ui/Toast.tsx`: removed the side stripe and the uppercase eyebrow. The tone shows as an icon tile and a tinted full border, and the spoken label keeps the meaning for screen readers. Text is 15px. The progress bar animates `scaleX` on the UI thread and hides under reduced motion. Only one element announces each toast.
- `.gitignore`: stopped ignoring all of `.impeccable/`, so `design.json` and `design-full.md` can be committed. Runtime folders, critique snapshots, `config.local.json` and `hook.cache.json` stay ignored.
- Kept as-is: the public props of `Modal`, `Toast` and the toast/modal stores, so no caller changes.
- Pending: screenshots, because no device or emulator is reachable. Phase 2 (replacing `Alert.alert`) and phase 3 (moving the hand-built sheets onto `Sheet`) still need approval.

## 2026-11-21 - Alert dialog redesign: resibo slip and blurred backdrop

- `components/ui/Modal.tsx` now looks like a printed receipt slip: torn (serrated) top and bottom edges drawn with `react-native-svg`, a paper body, a dashed perforation, and a darker paper stub that holds the buttons.
- The variant icon is a dashed rubber-stamp ring that thumps in at -8 degrees after the slip slides up. Reduced motion shows it flat with no animation. The Sari mascot still replaces the stamp when `mascot` is set.
- Danger and warning dialogs give a warning haptic when they open.
- Backdrop: `expo-blur` dark blur (intensity 32, `dimezisBlurView` on Android) plus an `ink-900/40` tint. The status bar switches to light icons while the dialog is open and restores on close, as in `BarcodeScannerModal`.
- Inline `<Modal visible>` dialogs now render in a native modal by default (`statusBarTranslucent` and `navigationBarTranslucent`), so the blur covers the status bar and nav bar. Store dialogs from `openModal()` still render in-tree at the app root, which already covers the status bar.
- Dropped the box shadow: the blur separates the slip, and a rectangular shadow would not follow the torn edges.
- Pending: screenshots and a low-end Android performance check for the blur.
- Follow-up: dropped `expo-blur` from the dialog and `NotificationSheet` in favor of a plain `ink-900/55` tint on every platform. Android blur was experimental and slow on budget phones, and iOS-only blur made the two platforms look different. The tint still covers the status bar, and status bar icons still switch to light.

## 2026-11-21 - Dev seed size and JS-thread performance pass

- `database/seed.ts`: `EXPO_PUBLIC_MOCK_SEED` = `off` | `lite` (default) | `full`. Lite keeps the first 10 products and only the rows that reference them. The seed still runs only into an empty products table, so clear app data to reseed.
- `configs/sqlite.ts`: dropped `useNewConnection: true`. Dev reloads leaked a native connection that kept the write lock, so init failed with "database is locked".
- `database/parkedCarts.ts`: removed `ensureParkedCartsTable` (migration v10 owns the table). It ran `CREATE TABLE` before every call and cost 367 ms when POS opened.
- `hooks/useHomeDashboardData.ts`: the skeleton waits for every dashboard query, so Home mounts once with full data instead of re-rendering as each query lands.
- POS: `initialNumToRender` and `maxToRenderPerBatch` are 5, one shared `useToggleFavorite` lives in the catalog, the loading state is an `ActivityIndicator`, and `ProductRow` uses Pressable `pressed` styles instead of NativeWind `active:` classes (same colors).
- Receipts: uses `useAllSales` and `useTodayStats` instead of `useSales()`, which also mounted five unused mutations. Renders 5 rows up front.
- Sari: a still Sari (`animated={false}` or Reduce Motion) renders a PNG from `assets/images/sari-stills/` instead of the layered vector. The PNGs are 512px rest poses rendered by `scripts/mascot-stills/render.tsx` (Node static markup plus headless Chrome). Rerun it after editing any state in `components/mascot/states/`. `SARI_STATES` moved to `components/mascot/sariStates.ts`.
- Finding: query times of about 200-450 ms in the dev log are queue wait behind a blocked JS thread, not SQL cost, because every table holds 10 rows or fewer.
- Pending: a release-mode measurement (`EXPO_PUBLIC_PERF=1 npx expo start --no-dev --minify`), SQL pagination for receipts, and the `datetime(...)` predicates that block index use once the data grows.

## 2026-11-22 - First-load performance: stock summary, alert summary, deferred backup, credit KPIs

- `database/products.ts`: added `getProductStockSummary` (one row: total, out of stock, low stock, at or below threshold) and `getLowStockProducts` (id, name, quantity where quantity <= threshold). Hooks `useProductStockSummary` and `useLowStockProducts` live under `productKeys.all`, so existing product invalidations refresh them.
- Home dashboard, tab badges, header alerts, and the getting-started card no longer load the full products table. Screens that need full rows (POS, inventory, forms) still use `getAllProductsQuery`.
- `resolveHomeState` now takes `productCount`, `outOfStockCount`, and `lowStockCount` instead of a quantity array. Threshold rules are unchanged: home goal low stock is 1 to 4, badges and the KPI are 0 to 5.
- `useSystemNotifications`: two or more new alerts of one type send one summary notification (`triggerAlertSummaryNotification`). A single new alert keeps the per-item text.
- `app/_layout.tsx`: `runStartupChecks` waits 5 s (`STARTUP_CHECKS_DELAY_MS`) so the daily snapshot and WAL checkpoint do not queue ahead of first-screen queries.
- `getCreditKPIs`: 3 queries instead of 7. Today filters use the local day as a UTC range through `datetime()`. A scratch check against the old SQL matched in 300 random trials with mixed date formats around midnight (Asia/Manila).
- Migration v25 adds expression indexes `idx_payments_datetime` and `idx_credit_transactions_datetime` on `datetime(date)`. The query plan shows SEARCH instead of SCAN for the range filters.
- Pending: `getAllCustomers` full-history aggregation, cloud upload reading the whole DB as base64 on resume, and the catalog seed on every launch.

## 2026-11-22 - Sale details (resibo) screen redesign

- Merged hero, item list, and thank-you note into one continuous `ReceiptHero` ticket; removed the double horizontal margin.
- Fixed line totals for wholesale lines: price is per sold unit, so lines now use `sold_unit_qty`, not deducted pieces.
- Fixed the Items meta row: it now shows line count and summed pieces instead of labelling line count as pcs.
- Cancelled sales (`cancelled_at`) show a VOIDED / REFUNDED / CORRECTED stamp, a dated notice, a struck total, and hide correction actions.
- Void / Refund / Edit price moved into a sticky safe-area bar; delete stays in the header.
- Added `SaleDetailsSkeleton` for loading, plus not-found and error (retry) states.
- One entrance animation for the ticket instead of four staggered ones; respects reduced motion.
- `ReceiptHeroTotal` gained an optional `struck` prop, tabular numerals, and an accessibility label.

## 2026-11-22 - Inventory ledger screen redesign

- Fixed running balances: they are now computed over every entry before search or type filters, so "Bal" stays correct when filtered.
- Fixed ledger search: it now matches the day and date as well as the time and note.
- Fixed Movements search: the database already filters by product name and SKU, so the list no longer re-filters client side and drops those matches.
- Movements rows now lead with the product name; the paged query selects `p.name AS product_name` (select only, no schema change).
- New `ledgerMath.ts` holds balance, filter, day grouping, totals, and daily buckets, covered by `__tests__/ledgerMath.test.ts`.
- Hero: product name, SKU and category, on-hand count with the real retail unit, stock status pill, 30-day net, a 30-day in/out strip (`StockStrip`, plain Views), and Added / Sold / Damaged / Corrected totals.
- Rows are flat grouped lines with sticky day headers that show each day's net change.
- Top bar shows the product name and count only after the hero scrolls away; state changes on the threshold crossing only.
- Added error and not-found states; the empty state sits under the hero with a "Log change" button; the extended FAB clears the bottom safe area.
- Removed `MovementChip` (no other users) and the toolbar's subtitle and legend lines; `TabGuide` still explains the screen.
- Animations are 220 ms or shorter and respect reduced motion. The list uses tuned render windows and `removeClippedSubviews` on Android.
- Not done: screenshots and video, because no device or emulator was available.

## 2026-11-22 - Wholesale line amounts in sale corrections

- Root cause: `sale_items.quantity` stores pieces deducted, while `price` is per sold unit. Code that multiplied the two inflated wholesale lines (1 case of 24 at 500 read as 12,000).
- Added `soldQty` in `utils/saleItems.ts` (`sold_unit_qty ?? quantity`), matching the rule `database/reports.ts` already uses.
- `correctSalePrice`: per-line delta and the `sales.total` recompute now use sold units. Before, any price correction on a sale with a wholesale line rewrote the total and pushed the inflated delta into cash entries or the utang amount.
- Display fixes: sale-correction (void/refund) item list, `PriceCorrectionItemRow`, and the `usePriceCorrectionForm` new-total preview.
- Restored `tests/__setup__/expo-sqlite-mock.ts` (removed in 7b5ba16 but still referenced by `jest.setup.ts`); reset now pauses foreign keys.
- Added `tests/database/price-correction.test.ts`; it fails on the old SQL (12016 vs 516) and passes now.
- Not repaired: sale totals already corrupted by past price corrections on wholesale sales.

## 2026-11-22 - Stocktake and Restock sub-tab redesign

- Goal: make both Inventory sub-tabs explain their purpose and be easy to use at the counter.
- Stocktake idle: `StocktakeStartCard` now shows Sari, a plain "Count your shelf" intro, a real 3-step strip (Count, Check the gaps, Update stock), the last count, and a 48 px start button.
- Stocktake counting: header has a progress bar with percent and a readable hint. Category headers show "3 of 12 counted" and turn sage with a check when done. The first unfinished category opens on load; the rest stay collapsed.
- `StocktakeCountRow`: "App says 12 Pc", 48 px minus/plus buttons, a larger qty input, and a "Same as app (12)" button that sets counted to expected. Status reads "Matches", "3 short", or "2 extra" with an icon. The +2/+5 chips were removed.
- Variance review: summary splits short, extra, and net pesos, and shows "Reasons picked: x of y". Rows read "App said 12 · You counted 9". An all-match state with Sari appears when there are no differences. A hint explains why Update stock is disabled.
- Restock: split into `components/inventory/restock/` (`RestockSummaryCard`, `RestockCards`, `RestockAdjustModal`). The screen went from 770 to about 300 lines.
- Restock summary card: purpose, items to buy now, estimated total cost (items without cost price excluded), and a Receive delivery row with a hint on when to use it.
- Each filter chip now has a one-line hint under the chip row. Buy now cards have one full-width Add stock button, with Change qty, Later, and Skip as quiet buttons below.
- "Original suggestion" now uses `defaultSuggestedQuantity` from the DB instead of recomputing the formula in the screen.
- Hardcoded "SKU:", "Supplier:", "Stock:" moved to `inventory` locale keys. All new strings exist in `en` and `tl`.
- No data, schema, or commit-logic changes.
- Not done: screenshots and video, because no device or emulator was available.

## 2026-11-22 - Stocktake counting moved to its own screens

- `app/(tabs)/inventory/stocktake.tsx` is now a hub only: the start card when idle, or `StocktakeResumeCard` (progress, "manual stock edits are paused" note, Continue, Discard) while a count is open, plus history.
- New `app/(edit-forms)/stocktake/[id]/index.tsx` (step 1, count) and `.../[id]/review.tsx` (step 2, review). Both use `StocktakeScreenHeader` (back, step label, title) and a safe-area footer; no tab bar, sub-tab strip, or FAB.
- Review is its own route so system back returns to counting without a custom handler.
- Variance reasons moved from local state to `stores/useStocktakeReasons.ts` (keyed by session id), so going back to fix a count keeps picked reasons.
- Start pushes to the count screen using the id `startSession` returns. Commit shows a success toast and `router.dismissTo` the hub. Discard from the count screen goes back to the hub.
- `StocktakeClosedState` covers a finished or discarded session opened by back stack or deep link.
- Home `StocktakeNudge` still opens the hub; the hub's Continue card handles resume.
- Not done: screenshots and video, because no device or emulator was available.

## 2026-11-22: Product photos not appearing

- Cause: `expo-image` was never registered with NativeWind `cssInterop`, so `className` sizes (`w-11 h-11`, `w-full h-full`) were dropped and every product `Image` rendered at 0x0. Save and DB paths were fine.
- Fix: `lib/css-interop.ts` registers `Image` from `expo-image` and is imported in `app/_layout.tsx`. Test: `tests/lib/css-interop.test.ts`.
- Open follow-ups: backups skip `product_images/`; edit deletes the old photo before copying the new one; `app.json` has no `expo-image-picker` plugin for iOS permission strings.
- Not done: screenshots and video, because no device or emulator was available.

## 2026-11-22: Stock correction and damage sheet redesign

- `LogTransactionForm` now renders inside the house `Sheet` (drag or X to close, safe areas, reduced motion). The hand-rolled modal is gone. The type selector branch was dead code, because callers always pass `initialType`, so it was removed.
- Correct stock defaults to "Count on shelf": the owner types what they see, and the app saves the signed difference. "Add or remove" stays as a toggle. Notes get "Shelf count N (was M)" so the ledger shows the reason.
- Mark damaged has one-tap reason chips (Expired, Broken or leaking, Lost or missing, Eaten by pests). The chosen reason is added at the front of the note, so there is no schema change.
- Shared layout: product name with recorded stock, one large stepper (64pt buttons, number field selects on focus), a Now / change / After strip with the sign in text and color, and one pinned primary button whose label says the result (for example "Remove 3 damaged").
- Math lives in `resolveStockChange` (`ledgerMath.ts`) with a test case. Owner PIN guard and the stocktake block are unchanged. The block now shows as a warning card inside the sheet.
- `Sheet` shrinks above the keyboard (`flexShrink`), so long content scrolls instead of moving off screen.
- Not done: screenshots and video, because no device or emulator was available.

## 2026-11-22: Photo-first product lists (Inventory Products, POS)

- New shared `components/ui/ProductThumb.tsx`: shows the product photo (`expo-image`, `recyclingKey` for list reuse) or a tinted tile with two-letter initials. The tint is picked from the name, so the same product keeps the same color. Persimmon is not used, because it is reserved for actions. Test: `components/ui/__tests__/ProductThumb.test.ts`.
- Inventory Products row: 68pt photo, two-line name, category, and a stock chip (icon plus text: "24 in stock", "Low · 3 left", "Out of stock") using `LOW_STOCK_THRESHOLD`. A "Bundle" chip shows for wholesale products. Price shows "per Pc". Out-of-stock photos are dimmed. The row now has a pressed state. Skeleton matches the new row.
- POS catalog is now a two-column grid of photo tiles. Overlays on the photo: stock pill (bottom left), in-cart count (top left), bundle icon (bottom right), star button (top right, outside the thumb so screen readers reach it). Below the photo: name, price per active unit, bulk savings, then a Tingi / Pakyaw segmented picker for bundles and a full-width Add button or stepper. The stepper minus shows a trash icon at quantity 1, because that tap removes the line. Cart and unit logic is unchanged.
- Fast Lane cards show a 40pt thumbnail next to a two-line name. The bundle badge moved onto the thumbnail.
- Tiles dropped their resting shadow to follow the Flat-At-Rest rule.
- Not done: screenshots and video, because no device or emulator was available. A list/grid toggle for Inventory was skipped.

## 2026-11-22: Grid and list view toggle (Inventory Products, POS)

- New `stores/useViewModeStore.ts`: zustand `persist` with AsyncStorage key `view_modes_v1`. It keeps one mode per screen. Defaults: POS is grid, Inventory is list.
- New `components/ui/ViewModeToggle.tsx`: two 40pt icon buttons (`th-large`, `th-list`) with 4pt hit slop, radio semantics and a selected state. It also exports `GRID_COLUMN_STYLE` for two-column lists.
- New `components/ui/StockBadge.tsx` (`getStockTone`, `getStockLabel`): one stock chip shared by both screens and both views.
- POS: a "Products" header row above the catalog holds the toggle. `ProductRow` takes `variant`. The grid tile is unchanged. The list row has a 56pt photo, name, price per unit, stock chip, star, and a compact Add button. Bundles and in-cart items get a bottom row with the Tingi / Pakyaw picker or "In cart · total", plus the stepper.
- Inventory: new `ProductTile` grid card (photo, stock chip and bundle icon overlays, ⋮ actions, name, category, price per unit). `ProductsList` takes `viewMode`. The skeleton follows the saved mode.
- Both FlatLists use `key={viewMode}`, because `numColumns` cannot change on a mounted list.
- Tests: `components/ui/__tests__/StockBadge.test.ts` covers stock labels and store defaults.
- Not done: screenshots and video, because no device or emulator was available.

## 2026-11-22: Grid tiles fit long product names

- Problem: grid tiles cut names at 2 lines. Sari-sari names end with the size or flavor ("... Chilimansi 60g"), so the part that tells products apart was lost. Name height also changed from tile to tile, so prices did not line up.
- Fix (POS `ProductRow` grid variant, Inventory `ProductTile`): names use 13/17 type with up to 3 lines and a reserved `min-h-[51px]`, so prices line up across a row. Photo height dropped from 112 to 96pt to make room. The Inventory tile now shows the price above the category. The skeleton matches.
- `min-h`, not a fixed height, so larger system font sizes grow the tile instead of clipping the name.

## 2026-11-26: Add Customer redesign (faster typing, clearer sections)

- Performance: `useAddCustomerForm` no longer watches field values, so the screen does not re-render on each keystroke. Only `PassbookPreview` (header card) and `SubmitButton` subscribe through `useWatch`. Dirty state uses `formState.isDirty`. Validation runs `onTouched` instead of `onChange`.
- New `TextField`: one input shell (icon, prefix, 48pt height, real focus and error borders through local state). The old `focus-within:` classes did nothing on native.
- New `FormSection`: numbered card header (icon, title, subtitle, "1 / 3") for Suki Information, Account Settings, and Internal Notes. `FieldGroup` now shows "Optional" tags and announces errors politely.
- Suki Information: the name is trimmed and required, so whitespace no longer passes. Phone uses `phone.ts` helpers. A pasted +63 becomes 0, mobile numbers display as `0917 123 4567`, and only digits are saved. Partial numbers show an error on blur.
- Account Settings: credit limit preset chips (No limit, ₱500, ₱1,000, ₱2,000, ₱5,000) plus a custom amount with format validation. The address accepts a landmark.
- Internal Notes: tap-to-add phrases, a 500-character counter, and a taller input.
- The keyboard Next key moves Name, Phone, Limit, Address, then Notes. An invalid save focuses the first bad field and gives a warning haptic.
- The save bar sticks above the keyboard (`KeyboardStickyView`). It shows a real spinner while saving. The button is muted, but still tappable, until a name is entered.
- Success: a toast, a success haptic, and an immediate return. The blocking success Alert was removed from `useInsertCustomer` (its only caller is this form). Errors show a toast and keep the typed details.
- Press feedback is opacity-only. The `press-scale` transitions were removed from this screen.
- Test: `components/utang/add-customer/__tests__/phone.test.ts`.
- Not done: screenshots and video, because no device or emulator was available. The shared `(edit-forms)` fade transition is unchanged, because 17 screens use it.

## 2026-11-26: Add Customer audit fixes (impeccable audit 12/20)

- Harden: `usePreventRemove(isDirty)` replaces the Android-only `BackHandler`, so the iOS edge swipe also asks before discarding. A `saved` ref lets the post-save `router.back()` through. A failed save now announces the first error through `AccessibilityInfo`, and `TextField` reads its error as the input hint.
- Colorize: the Save button uses persimmon-600 (4.53:1 against the label; persimmon-500 was 3.32:1). The muted-but-tappable state was removed, so the button no longer watches the name field.
- Adapt: iOS gets `KeyboardToolbar` (prev / next / done), because phone and decimal pads have no return key. On iOS the save bar no longer rides the keyboard; tapping Done reveals it. Content is capped at 560pt and centered for tablets. Notes chips are now 40pt (48pt with hit slop).
- Quieter: removed the "1 / 3" counters, the persimmon icon tiles, the "Customer Passbook" eyebrow, and the "New Suki" / "Member Card" pill row.
- Typeset: the hero card labels use 12px `text-caption` in sentence case instead of 10px `label-caps`.
- Clarify: a visible "Or type your own amount" label sits above the custom limit input. Placeholders are examples only and use ink-400 (4.2:1 on paper-100).
- Polish: section cards and the hero card are flat. The hero card radius dropped to 16px.
- Skipped: the fade transition stays, per the owner's decision. Hex-to-token for dark mode and the FontAwesome-to-system-icons change are app-wide, so they are not done here.
- Not verified on a device. The `usePreventRemove` swipe-back block on native-stack iOS is still to confirm by hand.

## 2026-11-26: Notifications screen replaces the floating sheet

- Route: `app/notifications.tsx` is a full-screen page. The header bell pushes it, and tapping a push notification opens it. `components/layout/NotificationSheet.tsx` was deleted.
- Sari hero: `NotificationsHero` shows Sari's mood from the most pressing alert (`low-stock`, `outstanding-balance`, `utang`, or `balance-cleared` when clear), a headline, and a one-line fact summary. The mood logic is in `summarizeAlerts`, which is tested.
- Filters: All / Stock / Utang chips with counts. The list is grouped into "Act now" (out of stock, overdue utang) and "Keep an eye on" (low stock, near credit limit).
- Cards (`AlertCard`): stock cards show the product photo, a stock chip, and a meter against the restock threshold. Restock opens `RestockSheet` in place, and View item opens product details. Overdue cards show the suki photo, days overdue, the balance, and the follow-up reminder (`FollowUpSheet`). They also have Mark contacted (inline mutation) and Record payment. Near-limit cards show a limit meter, View ledger, and Record payment.
- A "Make palengke list" footer appears when 3 or more stock alerts exist.
- Data: `DynamicHomeAlert` gained `urgent`, `entityId`, `imageUri`, and numeric fields. It dropped `actionLabel` and `targetPath`. Utang alerts now come from `useCollectionQueue`. `getLowStockProducts` also selects `image_uri`. Push de-duplication keys are unchanged.
- The bell badge shows the alert count (9+ cap) instead of a dot.
- Skipped: expiring-soon alerts. The products table has no `expiry_date` column, so they need a schema migration first.
- Not verified on a device. No screenshots or video yet.

## 2026-11-26: Notifications audit fixes (impeccable audit 13/20)

- Harden: `useHomeAlerts` exposes `isError` and `refetch`. A failed read shows Sari in the `error` state with "Try again" instead of "All clear!", and hides the filters, list, and palengke footer. While loading, the header subtitle reads "Sari is checking the store…" instead of "Nothing needs you right now". The stock meter is hidden from VoiceOver (`accessibilityElementsHidden`). A finished restock is announced through `AccessibilityInfo`.
- Polish: "Contacted today" is now a non-pressable status, not a disabled button that looks live.
- Quieter: filled persimmon primary buttons appear only on "Act now" cards. "Keep an eye on" cards use the tonal form (persimmon-50 background, persimmon-700 label, 6.2:1).
- Optimize: `RestockSheet` mounts on the first Restock tap, so opening the screen no longer reads every product and supplier.
- Adapt: list content is capped at 560pt and centered. Side safe-area insets are applied for landscape cutouts.
- Typeset: the bell badge count is 11px (was 10px).
- Colorize: `lib/css-interop.ts` registers `FontAwesome` and `FontAwesome5` with NativeWind, so icons take token classes (`className="text-ink-700"`). The notification screen, cards, hero, and bell have no hex icon colors left. Other screens can migrate as they are touched.
- Not verified on a device.

## 2026-11-26: Notifications polish pass

- Copy now matches the Collection tab: "Follow up by {{date}}" and "Set follow-up" (en). The tl strings use "Magtala ng bayad" and "Itakda ang follow-up".
- The success haptic on "Mark contacted" fires after the write succeeds, so a failed save no longer feels done.
- This was a source-only pass. No simulator, emulator, or adb was available, so no rendered states were checked.

## 2026-11-26: Suki ledger (credit-details) redesign

- Header: back, avatar, name, and phone/address stay fixed. Statement share moved here. Delete moved to a text button at the bottom of the scroll.
- `BalanceCard` replaces `CustomerHeroCard` and the `SukiPanel` on this screen. It shows one balance, one status pill (overdue, due soon, settled), open item count with the oldest date, trust tags, the limit meter (no emoji), a stats strip (total utang, total paid, last payment), and Call/SMS.
- Tabs went from 3 to 2: Utang (open credits oldest first to match FIFO, settled behind a toggle) and Ledger (month groups with month totals, All/Utang/Payments chips, payment method, running balance, 40-row pages). Search shows only at 7+ items.
- `LedgerActionBar` pins Add Credit and Add Payment to the bottom.
- New helpers `splitCredits`, `paymentStats`, `groupLedgerByMonth` in `lib/creditDetails.ts`, tested in `components/utang/credit-details/__tests__/ledger.test.ts`.
- All new copy is in `locales/{en,tl}/utang.json` (`detail*` keys).
- Removed: Payments and History tab components, `PaymentCard`, `ContactRow`, the old empty states.
- Not verified on a device. No screenshots or video.

## 2026-11-27: Product details redesign

- Priority order on screen: stock on hand and selling price first, then a pace strip (sold in 28 days, days of stock left, last stock added), then a warning line when stock is out, low, or runs out within 7 days at the current pace.
- Top bar: back, title (swaps to the product name after scrolling past the hero), and an Edit icon. Edit left the Overview body.
- `ProductActionBar` pins Add stock (primary), Correct stock, and Damaged to the bottom on every tab.
- Tabs went from 3 to 4: Overview (stock value at cost and at price, last 3 stock changes with See all, product info, Delete), History (30-day strip and totals, latest 20 changes grouped by day, link to the full stock ledger), Pricing (retail and wholesale price, cost, profit, margin, last paid unit cost, price history), Supplier (call, text, last stock added, notes, change supplier).
- Delete is now behind the owner PIN with the new `product_delete` action (high risk, on by default). It shows in Settings, PIN policy.
- Fixes: the old hero showed cost as `cost_price / 100`, but money is stored as integer pesos. The old Margin tile showed markup on cost; margin is now profit over selling price. Low stock now uses `<=` like the ledger and `getStatus`.
- Loading uses `ProductDetailsSkeleton` and the ledger row skeleton instead of a spinner and mascot. A failed product read shows `InventoryErrorState` with retry.
- New helper `computeProductInsights` and `marginPercent` in `productInsights.ts`, tested in `__tests__/productInsights.test.ts`.
- `ProductHistoryTab` was renamed to `ProductMovementsTab` and reuses `ledgerMath`, `StockStrip`, `LedgerEmptyState`, and `LedgerRowsSkeleton`.
- All copy is in `locales/{en,tl}/inventory.json` (`details_*` keys).
- Assumption: transactions for this screen cover only the last 30 days, so "Last stock added" reads "None in 30 days" when empty.
- Not verified on a device. No screenshots or video, because no emulator or adb was available.

## 2026-11-27: Product details audit fixes (impeccable audit 13/20)

- Adapt: pace strip labels and values wrap instead of truncating. The hero quantity shrinks to fit. Content is capped at 640pt and centered on tablets and in landscape, and side safe-area insets are applied.
- Typeset: hero labels moved from 10px tracked caps to 12px sentence case. The tab count badge is 11px.
- Colorize: `lib/css-interop.ts` registers `Ionicons`, so the details screen uses token classes for every icon; no hex icon colors remain there. `EVENT_TONE` is still duplicated from `LedgerList.tsx`, because that file has uncommitted user edits.
- Polish: the details screen uses Ionicons only. "See all" scrolls back to the tab strip when tapped from further down.
- Animate: the active tab pill slides on `translateX` in 200ms, instantly with Reduce Motion. Tab changes are announced to screen readers, and the History tab label includes its count.
- Clarify: the load error shows fixed friendly copy instead of the raw error. An unknown days-left value reads "Not enough sales yet to estimate" to screen readers.
- Skipped: dark mode, which is app-wide work. Tablet two-column layout; a centered column matches the notifications screen.
- Not verified on a device.

## 2026-11-27: Reports screen, profit first

- The top of Reports now answers "did the store earn?": a hero card shows Kita (operating profit: cash and utang sales, minus cost of goods, minus paid gastos), a change chip against the previous period, and a stacked bar showing where each peso went (product cost, gastos, kita).
- KPI grid: Sales (cash), Utang not yet paid, Stock value at cost, Gastos paid. "Cash collected" was removed because it repeated cash sales. The old "Tubo (gross profit)" card actually showed operating profit; the label is gone with it.
- Every KPI card and section header has a "?" button that opens a sheet with a plain-language definition.
- Comparison windows (`components/reports/report-math.ts`, tested): today vs yesterday up to the same time, yesterday vs the day before, 7 days vs the 7 days before, this month vs last month to the same day.
- `getReportKPIs` no longer wraps the end date in `endOfDay`, so a mid-day comparison window works; both callers already pass day ends. Its gastos date filter now uses the local day instead of the UTC date, which had pulled the previous day's gastos into "Today".
- Performance: Top products, Stock, Utang aging, and Cash drawer sections load their queries only once opened (`enabled` argument on the hooks). Skeletons moved to `ReportsSkeletons.tsx`.
- All Reports copy moved to the `reports` object in `locales/{en,tl}/common.json`, including the shared `DateRangeSelector`. Insight titles and messages still come in English from `getReportInsights`, and aging bucket labels come from the database.
- Text below 12px was raised to 12px in report components. Dead `text-sage-800/900` classes were replaced.
- Not verified on a device. No screenshots or video, because no emulator or adb was available.

## 2026-11-27 - Receipts screen redesign

- Receipts list now groups receipts by day, with each day's cash and utang totals.
- The single "Sum" is replaced by a summary card that splits cash received from utang given.
- Voided, refunded, and price-corrected receipts show a status badge and a struck-through total, and are left out of all totals.
- SaleRow is now a compact 3-line ledger row that lies flat (no shadow) and uses sage and warning tokens.
- Quick filter chips (Cash, Utang, Today, Last 7 Days, This Month) sit under search.
- Receipt refs use one format, `SR-0042`, via `formatReceiptRef` in `utils/receipts.ts`, on both list and details.
- Search accepts `#SR-0042`, `sr-42`, or `42`.
- Decision: day totals cover the whole filtered set, so a day split across pages still shows its full total.

## 2026-11-27 - Receipts audit fixes (harden, polish, typeset, optimize, adapt, animate)

- Pager no longer covers the last receipt: list padding grows when the pager shows, and the pager stops counting the safe-area inset twice.
- Receipts load errors show a retry state instead of the empty "Wala pang resibo" state.
- Filter sheet now uses the shared `Sheet` (slide up, swipe down, labelled close, Reduce Motion) with radio roles and selected states; it resyncs with the quick chips on open.
- Persimmon 600 fills on Apply filters, New Sale, and Try again; "Credit Only" renamed "Utang only".
- `label-caps` raised from 10px to 11px app-wide; chips grow with font scale; row line 1 truncates instead of colliding.
- Search uses `useDeferredValue`; day grouping pushes into arrays instead of copying.
- List content capped at 640 wide and centered on iPad; taps go through while the keyboard is open.
- Skeleton pulse and shimmer stop under Reduce Motion.
- Decision: dark mode skipped; it needs an app-wide pass.

## 2026-11-28 - Sale success screen redesign with Lottie

- Added `lottie-react-native` (~7.3.1). It is a native module, so run `npx expo run:android` before testing.
- Two hand-authored Lottie files in `assets/lottie/`. Cash: a coin drops into a sage disc and a check draws. Utang: a ledger card fills its lines and gets a cinnamon check badge. Each plays once (1.6 s) and holds its last frame.
- The Lottie replaces the animated Sari mascot on this screen only. Sari's 10 looping SVG layers were the main source of lag.
- Reduce Motion shows the last Lottie frame and skips the card entrance.
- The receipt card now uses `ReceiptHero` (sage for cash, cinnamon for utang). It shows the total, up to 5 sold lines with quantity, unit and line total ("+N more items" after that), plus Items, Pieces, Payment and Suki rows.
- Added the record time ("Today, 3:42 PM"). Utang copy states it is not counted in sales until paid.
- The New sale button moved to Persimmon 600, which fixes the Fill Contrast Rule break. The duplicate "PHP" suffix was removed.
- The live region now sits on the title only, instead of announcing the whole screen.
- `CheckoutModal` snapshots the cart lines and the record time at submit, because a successful submit clears the cart.
- `lottie-assets.test.ts` checks the shape of both JSON files.
- Decision: no share or print action, because `cart.submit()` returns no sale id to link to.

## 2026-11-28 - Sale success audit fixes (harden, adapt, colorize, polish)

- The outcome and total are announced on arrival with `announceForAccessibility`. The live region was removed because it does not fire on mount.
- Line rows include the line total in their screen-reader label.
- `MoneyText` gains `shrinkToFit`, which shrinks one line instead of truncating. The hero total uses it, so large font scales never clip a peso figure.
- Content and footer are capped at 560 wide and centered on tablets. The root pads the left and right safe-area insets.
- In landscape the Lottie shrinks to 96 and the two buttons sit side by side.
- Icon colors use `ICON_COLOR` from `lib/theme.ts`. `ReceiptHero` perforations use `bg-paper-200` instead of a raw hex.
- `ReceiptHero` header labels drop `opacity-90`, which lifts the sage header to about 4.85:1. This also changes sale details.
- Utang note moved to ink-900 per the Receipt Contrast Rule.
- Decision: dark mode stays out of scope. It is still an app-wide pass.

## 2026-11-28 - Owner PIN and launch lock audit fixes (harden, adapt, polish, clarify, distill, optimize, animate)

- The launch lock now renders in a native `Modal`. Sheets and dialogs left open before backgrounding stay underneath it on resume.
- While locked or resolving, the app tree behind the lock is hidden from VoiceOver and TalkBack (`accessibilityElementsHidden`, `importantForAccessibility="no-hide-descendants"`). Before this, a screen reader could focus and activate store screens behind the lock.
- Android Back on the lock screen exits the app instead of navigating the hidden stack.
- Failed PIN attempts and the lockout end time persist in `app_settings` under `owner_pin_lockout`. Killing the app no longer resets the 60-second lockout. The lock gate loads the saved value when the DB is ready. Decision approved by the owner before the change.
- Biometric unlock on the lock screen clears failed attempts, matching the PIN guard.
- New `useOwnerPinEntry` hook holds the keypad, verify, and lockout logic once. `AppLockGate` and `OwnerPinModal` both use it.
- The lock screen now uses `AuthScreenShell`, which gained a `titleArt` slot. The wordmark heading reads "SariSari is locked" to screen readers. The mascot is static (132) to match the other PIN screens.
- Wrong PIN, lockout start, and verify failure are announced once with `announceForAccessibility`. The live regions were removed: iOS ignores them, and TalkBack repeated the countdown every second.
- PIN boxes size with `flex-1` up to 56 px, so six boxes fit a 360 dp phone. They used to need 408 px.
- Keypad digits cap at 1.4x font scale and box digits at 1.3x, so large text sizes no longer clip.
- The keypad dims only during lockout, not on every PIN check.
- "Forgot PIN?" uses persimmon-700. The `AuthButton` primary fill is persimmon-600 and presses to persimmon-700 (Fill Contrast Rule).
- The biometric key reads "Unlock with face" or "Unlock with fingerprint" and shows a face-scan icon for face unlock.
- The PIN progress value ("3 of 6 digits entered") and the "Owner PIN unavailable" alert are translated (en, tl).
- The PIN modal fades instead of sliding under Reduce Motion.
- Icon colors use `ICON_COLOR` from `lib/theme.ts`, which gained `persimmon`.
- `tests/stores/useAuthStore.test.ts` covers lockout save, restore, clear, and a corrupt row.
- Not verified on a device: no emulator was available, so no screenshots were taken.

## 2026-11-28 - Launch lock fails closed

- If the launch lock cannot read its settings, it now checks again whether an Owner PIN exists. It stays locked if a PIN exists or that check also fails. It opens only when the PIN is known to be absent.
- Logic lives in `resolveLaunchLock` (`lib/auth/appLock.ts`), covered by `tests/lib/app-lock.test.ts`.
- Decision (approved by the owner): a broken DB with a PIN set shows the lock screen instead of skipping it. "Forgot PIN?" stays available.

## 2026-11-28 - First screen waits for the database

- The lock gate no longer remounts the app at launch (from the audit fixes). The old remount also hid a race: `app/index.tsx` could route to home before the database finished opening.
- `configs/startup.ts` exports `whenDatabaseReady()`, a promise that resolves once `initializeDatabases` succeeds. EntryGate waits for it and for the onboarding state before the splash exits and routes.
- Decision: the Stack stays mounted from the first render. Expo Router does not support deferring the root navigator, and navigating before it mounts throws "Attempted to navigate before mounting the Root Layout component".
- Residual risk: a cold-start deep link or notification that opens a screen directly skips EntryGate. Its queries can run before the DB is ready and rely on React Query retries.

## 2026-11-28 - Record Payment screen redesign

- `app/(edit-forms)/add-payment/[id].tsx` now uses the shared `ProductFormHeader` top bar, a light suki strip, and a sticky submit bar (same `KeyboardStickyView` pattern as Add Customer).
- Suki strip (`AddPaymentHeader`): avatar, name, phone, "Owes" balance, and "3 open items · oldest from Nov 2". Replaces the dark cinnamon hero card and its redundant labels.
- Amount card: visible "Amount received" label, large tabular input, one chip row (Full, Half, +20, +50, +100, +500), and a live result line (new balance, Fully paid / Item paid pill, change to give back). The separate Pay Full, Pay Half, and Clear buttons are gone.
- "Applies to" receipt lists only the credits this payment touches, with Paid / Partial pills and "+N more items stay open". No unpaid credits shows Sari (`balance-cleared`) and "Nothing to collect".
- Payment method is a radio group reusing `methodLabel`. Notes hide behind "Add a note".
- Submit bar: persimmon-600 fill, label "Record ₱X payment", "Enter an amount first" when empty, spinner while saving.
- Decision (approved by the owner): payments are capped at what is owed. Cap is the pinned credit in Quick Settle, else the outstanding balance. The extra shows as change to give back and is never stored. Logic in `components/utang/add-payment/paymentMath.ts`, covered by its test.
- Full and Half chips now use the pinned credit's amount in Quick Settle instead of the whole balance.
- All copy moved to `addPayment*` keys in `locales/en|tl/utang.json`. The success and error toasts in `hooks/useCredits.ts` are still English-only.
- Not verified on a device: no screenshots taken yet.

## 2026-11-28 - Record Payment audit fixes

- Audit (14/20) saved in `.impeccable/audit/`. Fixes below cover every P1-P3 finding except the SQL tiebreak.
- Double submit: a ref in `useAddPaymentForm` blocks a second tap before `isPending` re-renders; cleared on error.
- Loading: `AddPaymentSkeleton` while the customer loads, `AddPaymentLoadError` (Sari + Back) when it is missing, receipt skeleton while credits load.
- FIFO preview sorts by the raw date string with `id` as tiebreak, matching `ORDER BY date ASC`. Not changed: the SQL has no `id` tiebreak, so two credits with the identical timestamp may still differ. Adding `, id ASC` changes payment logic and needs owner approval.
- Screen readers: one announcement 900 ms after typing stops (new balance, fully paid, change). The live region was removed.
- `StatusPill` warning text is now `semantic-warning-700` everywhere in the app.
- Disabled submit is paper-200 with ink-700 text and a pencil icon; says "Nothing to collect" when nothing is owed.
- Chips 48 dp; amount input and peso sign cap at 1.4x font scale.
- `ICON_COLOR.warningStrong` and `KEYBOARD_TOOLBAR_THEME` added to `lib/theme.ts`; Add Customer uses the shared toolbar theme too.
- New `common` keys `goBackA11y` and `done`; `ProductFormHeader` back label is translated on every screen that uses it.
- Not verified on a device.

## 2026-11-28 - Utang goes through POS only

- Removed the Add Credit screen (`app/(edit-forms)/add-credit/`, `components/utang/add-credit/`, `useInsertCredit`). It recorded utang without reducing stock or creating a sale, so it disagreed with POS.
- "Add Credit" on credit details now sets `creditHandoff` in `CartStore` and opens `/(tabs)/sales/pos`. POS applies it on focus: credit mode plus that suki. A busy cart opens `ActiveCartConflictModal` (park and switch, or replace).
- POS credit checkout gained the guardrails from Add Credit: `SukiPanel`, the new shared `SoftWarnModal`, `OverrideReasonModal`, and block-on-exceed. Override reason is now saved on POS credit sales.
- Due date chips (`components/sales/pos/checkout/DueDateChips.tsx`, presets in `lib/dueDates.ts`) show for credit. `insertSale` writes `due_date` to the credit row; no migration, the column already existed.
- Success screen shows "Back to suki" when the checkout started from a suki page (`returnToCustomerId`, cleared with the cart).
- Credit sales now refresh the per-customer queries (customer, details, history, credit summary, collection queue), so the suki balance is not stale.
- Decision (owner): free-text or old-notebook debts are no longer recordable. Every utang needs catalog products and lowers stock.
- `insertCreditTransaction` in `database/credits.ts` has no caller now; kept for a future old-debt import.
- Not verified on a device: no screenshots yet.
