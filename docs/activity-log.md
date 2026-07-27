# Activity Log

## 2026-07-27

- Fixed Home Tab start routing issue where screen rendered blank after completing Home Tab UI revamp plan.
  - Added missing `<TopTabs.Screen name="home" />` route to `app/(tabs)/_layout.tsx` so `@react-navigation/material-top-tabs` recognizes nested `home` sub-tab layout route.
  - Updated `PRIMARY_TAB_PATHS` and `isPrimaryTabPath` in `constants/tabs.ts` to include `/home` routes for hardware back button exit handling.
  - Updated `isRouteFocused` in `components/layout/StyledTab.tsx` so `/home` routes keep the Dashboard bottom tab highlighted.
  - Updated `tests/components/DashboardScreen.test.tsx` to test `app/(tabs)/home/overview` and handle `Redirect` component.

## 2026-07-24

- Fixed formatting corruptions in `docs/superpowers/specs/2026-07-11-gastos-kaha-design.md`.
- Removed diff prefixes (`1 +`, `2 +`, etc.) and line numbers that were pasted into document text.
- Fixed broken code block syntax (```ts).
- Restored missing header `## Release 2: Receipt Attachments and Backup Bundles` and section `### Storage and receipt limits`.
- Ensured clean GFM markdown adhering to project AGENTS.md rules.
- Created implementation plan `docs/superpowers/plans/2026-07-24-gastos-kaha.md` covering Release 1 (Financial Ledger & Reports) and Release 2 (Receipt Attachments & ZIP Backup Bundles).
- Decomposed implementation plan into 11 sub-feature task files under `docs/superpowers/tasks/gastos-kaha/`.
- Fixed TypeScript errors in `database/financial.ts` for `updateFinancialEntry` and added `initFinancialEntriesTable`.
- Exported `financial` module in `database/index.ts`.
- Created comprehensive unit tests in `tests/database/financial.test.ts`.
- Implemented Task 4: Report KPIs & True Operating Profit Calculation Rules in `database/reports.ts` and `tests/database/reports.test.ts`.
  - Updated `getReportKPIs` to calculate `grossProfit` and `operatingProfit` (`sales - COGS - paid operating expenses`).
  - Excluded owner drawings from profit calculation.
  - Handled cost price snapshot coverage check (returns `null` when cost price is missing for sold items in the date range).
  - Evaluated `grossProfit = 0` and `operatingProfit = -paidExpenses` when there are zero sales in period.
- Updated `components/financial/RecordEntryModal.tsx` to utilize `setBusinessDate` by adding a Date (YYYY-MM-DD) text input field, date format validation, and optional `initialBusinessDate` prop.
- Added unit tests in `tests/components/RecordEntryModal.test.tsx` verifying business date editing and submission.
- Fixed TypeScript type mismatch in `app/gastos-kaha/index.tsx` by updating `NewFinancialEntry` interface in `types/financial.types.ts` (`note?: string | null`) and using `NewFinancialEntry` in `RecordEntryModal` `onSubmit` prop interface.
- Implemented Task 7: Retire Active Cash Session Creation & Mark Historical Sessions Read-Only.
  - Added unit test in `tests/database/cash.test.ts` verifying legacy cash sessions table and records remain read-only for audit protection.
  - Added `LegacyCashSessionBanner` in `components/dashboard/DashboardAlertCards.tsx` and `components/cash-session/ActiveSessionSummaryCard.tsx` pointing owners to Gastos & Kaha Ledger for expenses and drawings.
  - Updated `components/cash-session/OpenSessionView.tsx` to display legacy read-only notice instead of active drawer creation form.
- Implemented Task 08: Migration 13 & Receipt Storage Layer.
  - Extended `database/migrations.ts` with Migration 13 for `financial_entry_receipts` table with slot 0-4 constraints.
  - Created `database/receipts.ts` for receipt database CRUD (enforcing expense-only receipt restriction).
  - Created `lib/receipt-storage.ts` for local document directory file handling.
  - Added unit test in `tests/database/receipts.test.ts`.
- Implemented Task 09: ZIP Backup Bundle Packaging Service using fflate.
  - Added `fflate` dependency.
  - Created `lib/backup/bundle.ts` with `createBackupBundle` and `extractBackupBundle`.
  - Added unit test in `tests/backup/bundle.test.ts`.
- Implemented Task 10: Receipt-Aware Backup & Restore Integration with Rollback Protection.
  - Updated `lib/backup/restore.ts` with `performRestore` handling dual format detection (.zip vs .db) and atomic rollback.
  - Added unit test in `tests/backup/restore-receipts.test.ts`.
- Implemented Task 11: Receipt Photo Attachment Picker & Gallery UI.
  - Created `components/financial/ReceiptPicker.tsx` component allowing up to 5 photo slots per expense entry.
  - Integrated `ReceiptPicker` into `components/financial/RecordEntryModal.tsx`.
  - Added unit test in `tests/components/ReceiptPicker.test.tsx`.
- Integrated Gastos & Kaha Reconciliation UI navigation and screen linking.
  - Exported `FinancialResultSection` component in `components/reports/index.ts`.
  - Embedded `FinancialResultSection` in `app/(tabs)/reports/index.tsx` right below the Bento KPI grid with direct `router.push('/gastos-kaha')` navigation link.
  - Added top navigation header with back button (`router.back()`) in `app/gastos-kaha/index.tsx`.
  - Created unit tests in `tests/components/FinancialResultSection.test.tsx`.
  - Added `TextInput` override in `jest.setup.ts` and updated database setup in `tests/components/GastosKahaScreen.test.tsx`.

## 2026-07-25

- Updated implementation plan `docs/superpowers/plans/2026-07-24-landing-screen-redesign-plan.md` with explicit, fine-grained sub-tasks and step-by-step instructions.
- Created decomposed task breakdown files under `docs/superpowers/tasks/landing-screen-redesign/`:
  - `task-01-home-state-resolver.md`
  - `task-02-guided-components.md`
  - `task-03-quick-actions-pulse.md`
  - `task-04-home-route-integration.md`
  - `task-05-localization-verification.md`
- Implemented Task 01: Home State Resolver
  - Created `components/dashboard/home-state.ts` defining `resolveHomeState` and data contracts (`HomeDestination`, `HomeGoalKind`, `HomeRecommendation`, `HomeStateInput`, `HomeState`).
  - Added unit test suite `tests/components/dashboard/home-state.test.ts` verifying all 9 goal kinds and time-based suggestions (10/10 passed).
- Implemented Task 03: Companion Actions and Insights
  - Updated `components/dashboard/DashboardQuickActions.tsx` with hero "New Sale" persimmon CTA and 2-column secondary actions grid (Add Product, Add Stock, Utang / Credits, Reports).
  - Created `components/dashboard/DashboardDailyPulse.tsx` with side-by-side metric cards for Today's Revenue and Today's Sales.
  - Created `components/dashboard/DashboardRecentSales.tsx` with up to 3 recent transaction rows.
  - Updated `components/dashboard/DashboardEmptyState.tsx` and `components/dashboard/DashboardSkeleton.tsx`.
  - Added unit test suite `tests/components/dashboard/DashboardQuickActions.test.tsx`.
- Implemented Task 04: Home Route Integration
  - Created `components/dashboard/DashboardErrorState.tsx` inline error card with retry button.
  - Refactored `app/(tabs)/index.tsx` orchestrator to pass `HomeStateInput` into `resolveHomeState`, map destinations to Expo Router paths, and render Store Assistant hierarchy.
  - Deleted legacy files: `DashboardHero.tsx`, `DashboardAlertCards.tsx`, `DashboardAttentionSection.tsx`, `AlertCard.tsx`.
  - Added integration unit test suite `tests/components/DashboardScreen.test.tsx`.
- Implemented Task 05: Localization and Verification
  - Added English translations under `dashboard` in `locales/en/common.json`.
  - Added Tagalog translations under `dashboard` in `locales/tl/common.json`.
  - Validated locale JSON formatting with Node parser.
- Explained purpose of 'Mark All as Paid' button and removed it from `app/(edit-forms)/credit-details/[id].tsx` and `components/utang/credit-details/CustomerHeroCard.tsx` to prevent bypassing payment ledger logs.
- Configured full-screen `card` presentation for `product-details`, `edit-product`, `credit-details`, `sale-details`, and `inventory-ledger` in `app/(edit-forms)/_layout.tsx` so detail and edit screens push as standard cards instead of formSheet modals.
- Added a back navigation button in `app/(edit-forms)/product-details/[id].tsx` header top bar.

## 2026-07-26

- Performed architectural evaluation of React Navigation and Expo Router usage throughout `@/app`.
- Assessed 8 critical factors: Navigator hierarchy, transition mechanics & presentation modes, custom tab navigation performance (`StyledTab`), hardware back button & exit guards, form state protection (`usePreventRemove`), parameter handling & type safety, theme & background synchronization, and screen offset / safe area alignment.
- Installed `@react-navigation/material-top-tabs` and `react-native-pager-view`.
- Created Expo Router TopTabs wrapper in `components/navigation/top-tabs.tsx`.
- Updated `app/(tabs)/_layout.tsx` screen names (`inventory/index`, `sell/index`, `utang/index`, `reports/index`) to match nested child routes and removed non-existent `dev` screen.
- Removed orphan duplicate route directory `app/(swipe)`.
- Replaced `@react-native-clipboard/clipboard` (non-Expo Go native binary package) with `expo-clipboard` in `package.json` and `StatementShareButton.tsx` (`setStringAsync`), resolving TurboModule `RNCClipboard` crash and default export loading error on `(edit-forms)/credit-details/[id].tsx`.
- Updated `app/_layout.tsx` to use `NavigationBar.setButtonStyleAsync('dark')` for edge-to-edge Android compatibility.
- Started page-by-page functionality dissection for routing plan, prioritizing the Dashboard (`app/(tabs)/index.tsx`).
- Dissected Sell tab (`app/(tabs)/sell/index.tsx`) covering sales ledger history, date and payment filtering, stats slip hero, pagination, and checkout route intersections.

# Activity Log

## 2026-07-24

- Fixed formatting corruptions in `docs/superpowers/specs/2026-07-11-gastos-kaha-design.md`.
- Removed diff prefixes (`1 +`, `2 +`, etc.) and line numbers that were pasted into document text.
- Fixed broken code block syntax (```ts).
- Restored missing header `## Release 2: Receipt Attachments and Backup Bundles` and section `### Storage and receipt limits`.
- Ensured clean GFM markdown adhering to project AGENTS.md rules.
- Created implementation plan `docs/superpowers/plans/2026-07-24-gastos-kaha.md` covering Release 1 (Financial Ledger & Reports) and Release 2 (Receipt Attachments & ZIP Backup Bundles).
- Decomposed implementation plan into 11 sub-feature task files under `docs/superpowers/tasks/gastos-kaha/`.
- Fixed TypeScript errors in `database/financial.ts` for `updateFinancialEntry` and added `initFinancialEntriesTable`.
- Exported `financial` module in `database/index.ts`.
- Created comprehensive unit tests in `tests/database/financial.test.ts`.
- Implemented Task 4: Report KPIs & True Operating Profit Calculation Rules in `database/reports.ts` and `tests/database/reports.test.ts`.
  - Updated `getReportKPIs` to calculate `grossProfit` and `operatingProfit` (`sales - COGS - paid operating expenses`).
  - Excluded owner drawings from profit calculation.
  - Handled cost price snapshot coverage check (returns `null` when cost price is missing for sold items in the date range).
  - Evaluated `grossProfit = 0` and `operatingProfit = -paidExpenses` when there are zero sales in period.
- Updated `components/financial/RecordEntryModal.tsx` to utilize `setBusinessDate` by adding a Date (YYYY-MM-DD) text input field, date format validation, and optional `initialBusinessDate` prop.
- Added unit tests in `tests/components/RecordEntryModal.test.tsx` verifying business date editing and submission.
- Fixed TypeScript type mismatch in `app/gastos-kaha/index.tsx` by updating `NewFinancialEntry` interface in `types/financial.types.ts` (`note?: string | null`) and using `NewFinancialEntry` in `RecordEntryModal` `onSubmit` prop interface.
- Implemented Task 7: Retire Active Cash Session Creation & Mark Historical Sessions Read-Only.
  - Added unit test in `tests/database/cash.test.ts` verifying legacy cash sessions table and records remain read-only for audit protection.
  - Added `LegacyCashSessionBanner` in `components/dashboard/DashboardAlertCards.tsx` and `components/cash-session/ActiveSessionSummaryCard.tsx` pointing owners to Gastos & Kaha Ledger for expenses and drawings.
  - Updated `components/cash-session/OpenSessionView.tsx` to display legacy read-only notice instead of active drawer creation form.
- Implemented Task 08: Migration 13 & Receipt Storage Layer.
  - Extended `database/migrations.ts` with Migration 13 for `financial_entry_receipts` table with slot 0-4 constraints.
  - Created `database/receipts.ts` for receipt database CRUD (enforcing expense-only receipt restriction).
  - Created `lib/receipt-storage.ts` for local document directory file handling.
  - Added unit test in `tests/database/receipts.test.ts`.
- Implemented Task 09: ZIP Backup Bundle Packaging Service using fflate.
  - Added `fflate` dependency.
  - Created `lib/backup/bundle.ts` with `createBackupBundle` and `extractBackupBundle`.
  - Added unit test in `tests/backup/bundle.test.ts`.
- Implemented Task 10: Receipt-Aware Backup & Restore Integration with Rollback Protection.
  - Updated `lib/backup/restore.ts` with `performRestore` handling dual format detection (.zip vs .db) and atomic rollback.
  - Added unit test in `tests/backup/restore-receipts.test.ts`.
- Implemented Task 11: Receipt Photo Attachment Picker & Gallery UI.
  - Created `components/financial/ReceiptPicker.tsx` component allowing up to 5 photo slots per expense entry.
  - Integrated `ReceiptPicker` into `components/financial/RecordEntryModal.tsx`.
  - Added unit test in `tests/components/ReceiptPicker.test.tsx`.
- Integrated Gastos & Kaha Reconciliation UI navigation and screen linking.
  - Exported `FinancialResultSection` component in `components/reports/index.ts`.
  - Embedded `FinancialResultSection` in `app/(tabs)/reports/index.tsx` right below the Bento KPI grid with direct `router.push('/gastos-kaha')` navigation link.
  - Added top navigation header with back button (`router.back()`) in `app/gastos-kaha/index.tsx`.
  - Created unit tests in `tests/components/FinancialResultSection.test.tsx`.
  - Added `TextInput` override in `jest.setup.ts` and updated database setup in `tests/components/GastosKahaScreen.test.tsx`.

## 2026-07-25

- Updated implementation plan `docs/superpowers/plans/2026-07-24-landing-screen-redesign-plan.md` with explicit, fine-grained sub-tasks and step-by-step instructions.
- Created decomposed task breakdown files under `docs/superpowers/tasks/landing-screen-redesign/`:
  - `task-01-home-state-resolver.md`
  - `task-02-guided-components.md`
  - `task-03-quick-actions-pulse.md`
  - `task-04-home-route-integration.md`
  - `task-05-localization-verification.md`
- Implemented Task 01: Home State Resolver
  - Created `components/dashboard/home-state.ts` defining `resolveHomeState` and data contracts (`HomeDestination`, `HomeGoalKind`, `HomeRecommendation`, `HomeStateInput`, `HomeState`).
  - Added unit test suite `tests/components/dashboard/home-state.test.ts` verifying all 9 goal kinds and time-based suggestions (10/10 passed).
- Implemented Task 03: Companion Actions and Insights
  - Updated `components/dashboard/DashboardQuickActions.tsx` with hero "New Sale" persimmon CTA and 2-column secondary actions grid (Add Product, Add Stock, Utang / Credits, Reports).
  - Created `components/dashboard/DashboardDailyPulse.tsx` with side-by-side metric cards for Today's Revenue and Today's Sales.
  - Created `components/dashboard/DashboardRecentSales.tsx` with up to 3 recent transaction rows.
  - Updated `components/dashboard/DashboardEmptyState.tsx` and `components/dashboard/DashboardSkeleton.tsx`.
  - Added unit test suite `tests/components/dashboard/DashboardQuickActions.test.tsx`.
- Implemented Task 04: Home Route Integration
  - Created `components/dashboard/DashboardErrorState.tsx` inline error card with retry button.
  - Refactored `app/(tabs)/index.tsx` orchestrator to pass `HomeStateInput` into `resolveHomeState`, map destinations to Expo Router paths, and render Store Assistant hierarchy.
  - Deleted legacy files: `DashboardHero.tsx`, `DashboardAlertCards.tsx`, `DashboardAttentionSection.tsx`, `AlertCard.tsx`.
  - Added integration unit test suite `tests/components/DashboardScreen.test.tsx`.
- Implemented Task 05: Localization and Verification
  - Added English translations under `dashboard` in `locales/en/common.json`.
  - Added Tagalog translations under `dashboard` in `locales/tl/common.json`.
  - Validated locale JSON formatting with Node parser.
- Explained purpose of 'Mark All as Paid' button and removed it from `app/(edit-forms)/credit-details/[id].tsx` and `components/utang/credit-details/CustomerHeroCard.tsx` to prevent bypassing payment ledger logs.
- Configured full-screen `card` presentation for `product-details`, `edit-product`, `credit-details`, `sale-details`, and `inventory-ledger` in `app/(edit-forms)/_layout.tsx` so detail and edit screens push as standard cards instead of formSheet modals.
- Added a back navigation button in `app/(edit-forms)/product-details/[id].tsx` header top bar.

## 2026-07-26

- Performed architectural evaluation of React Navigation and Expo Router usage throughout `@/app`.
- Assessed 8 critical factors: Navigator hierarchy, transition mechanics & presentation modes, custom tab navigation performance (`StyledTab`), hardware back button & exit guards, form state protection (`usePreventRemove`), parameter handling & type safety, theme & background synchronization, and screen offset / safe area alignment.
- Installed `@react-navigation/material-top-tabs` and `react-native-pager-view`.
- Created Expo Router TopTabs wrapper in `components/navigation/top-tabs.tsx`.
- Updated `app/(tabs)/_layout.tsx` screen names (`inventory/index`, `sell/index`, `utang/index`, `reports/index`) to match nested child routes and removed non-existent `dev` screen.
- Removed orphan duplicate route directory `app/(swipe)`.
- Replaced `@react-native-clipboard/clipboard` (non-Expo Go native binary package) with `expo-clipboard` in `package.json` and `StatementShareButton.tsx` (`setStringAsync`), resolving TurboModule `RNCClipboard` crash and default export loading error on `(edit-forms)/credit-details/[id].tsx`.
- Updated `app/_layout.tsx` to use `NavigationBar.setButtonStyleAsync('dark')` for edge-to-edge Android compatibility.
- Started page-by-page functionality dissection for routing plan, prioritizing the Dashboard (`app/(tabs)/index.tsx`).
- Dissected Sell tab (`app/(tabs)/sell/index.tsx`) covering sales ledger history, date and payment filtering, stats slip hero, pagination, and checkout route intersections.
- Dissected Inventory tab (`app/(tabs)/inventory/index.tsx`) and Stock Recommendations (`app/inventory/recommendations.tsx`), covering Products/Categories/Suppliers views, barcode scanning prefill, deep-link restock triggers, sorting/view mode controls, and AI reorder planning.
- Dissected Utang tab (`app/(tabs)/utang/index.tsx`) covering customer ledger balances, overdue priority hero card, KPI metrics, customer search/filter/sort, and payment/credit form routes.
- Dissected Reports tab (`app/(tabs)/reports/index.tsx`) and Gastos & Kaha Ledger (`app/gastos-kaha/index.tsx`), covering store almanac analytics, Bento KPIs, sales trend charts, operating expenses, owner cash drawings, and receipt attachments.
- Created `SYSTEM_FLOW_AND_ROUTES.md` containing complete application flow analysis, tab and edit-form route mappings, data hooks breakdown, and architectural recommendations for future app revamp.
- Completed design brainstorming and user approval for Home Tab UI Revamp (`app/(tabs)/home`).
- Created validated design specification document `docs/superpowers/specs/2026-07-26-home-tab-ui-revamp-design.md`.
- Completed design brainstorming and user approval for Sales Tab UI Revamp (`app/(tabs)/sales`).
- Created validated design specification document `docs/superpowers/specs/2026-07-26-sales-tab-revamp-design.md`.
- Completed design brainstorming and user approval for More Tab UI Revamp (`app/(tabs)/more`).
- Created validated design specification document `docs/superpowers/specs/2026-07-26-more-tab-ui-revamp-design.md`.
- Evaluated release manager audit for major release `v2.0.0` covering Gastos & Kaha, receipt attachments, ZIP backups, Store Assistant dashboard, offline SQLite barcode search, and tab/swipe navigation architecture specs.

## 2026-07-27

- Added missing barrel re-exports (`useAppInfo`, `useFinancial`, `useHomeDashboardData`, `useReducedMotion`) to `hooks/index.ts`.
- Added missing `totalOverdueAmount` property query to `getCreditKPIs` in `database/credits.ts`.
- Fixed `CashSession` interface in `types/cash.types.ts` (`expectedCash: Pesos | null`) and added `startingFloat` mapping in `database/cash.ts` across `getCurrentSession`, `openSession`, `getCashSessionSummary`, and `listCashSessions`.
- Resolved Home tab landing and tab layout routing issue:
  - Updated `constants/tabs.ts` so Home tab `href` maps to `/home` instead of `/` (which was triggering `app/index.tsx` splash gate reload).
  - Created `app/(tabs)/index.tsx` redirecting root tab navigation (`/(tabs)`) cleanly to `/home`.
  - Updated `app/index.tsx` (EntryGate) onboarding completion route target to `/home`.
  - Registered all primary tab screens (`sales`, `inventory`, `customers`, `more`, `utang`, `reports`) alongside `home` in `app/(tabs)/_layout.tsx` `<TopTabs>`.
  - Updated `isRouteFocused` in `components/layout/StyledTab.tsx` to handle `/home` and sub-route matching.
- Resolved SQLite database locking error (`NativeStatement.finalizeAsync database is locked`):
  - Enabled WAL journal mode (`PRAGMA journal_mode = WAL;`) and 5-second busy timeout (`PRAGMA busy_timeout = 5000;`) on SQLite initial connection in `configs/sqlite.ts`.
  - Wrapped `insertCatalogProductsBatch` in `database/catalog.ts` inside `database.withTransactionAsync` to execute catalog seeding in a single atomic transaction block.
  - Added `dbReady` state tracking in `app/_layout.tsx` to ensure background startup checks and backup queues defer execution until database initialization completes.
- Fixed `CssInterop upgrade warning` in `components/dashboard/DashboardHeader.tsx`:
  - Provided explicit fallback classes (`bg-transparent shadow-none`) on non-active tab states to prevent dynamic CSS variable remount warnings during initial render.
  - Replaced boolean `&&` logic in sub-tab alert badge with ternary null check to avoid rendering boolean `false` as React internal element children.
- Replaced app-wide background color palette with Option 1 Clean Thermal Paper (crisp off-white):
  - Updated `paper` palette in `tailwind.config.js` and `global.css` (`paper-50`: `#FAFAF7`, `paper-100`: `#F2F0E8`, `paper-200`: `#F7F6F2`, `paper-300`: `#E6E3D8`, `paper-400`: `#D8D4C7`).
  - Updated fallback background colors in `app.json`, `app/_layout.tsx`, `app/(edit-forms)/_layout.tsx`, `app/onboarding/index.tsx`, and `plugins/withAndroidWindowBackground.js` to `#F7F6F2`.
  - Updated receipt perforation background constants across components (`PerforationRow`, `SalesEmptyState`, `SalesFilterModal`, `ReceiptBottomSheet`, `CategoryProductsSection`, `ProductsEmptyState`, `CreditsEmptyState`, `Perforations`, `ReceiptHero`) to match `#F7F6F2`.
- Re-wrote Home Tab UI Revamp implementation plan (`docs/superpowers/plans/2026-07-26-home-tab-ui-revamp.md`) and sub-task breakdown files (`task-2`, `task-3`, `task-4`, `task-5`, `task-6`) to incorporate exact pixel-faithful 3-screen design inspiration:
  - Header with store initials avatar (`AN`), store name (`Aling Nena's`), location/branch (`Main Branch - Calauan`), green `ONLINE` status pill badge, and bell notification icon button (`🔔`) with red alert badge dot.
  - Sub-tab pill segmented control (`Overview`, `Today`, `Alerts` with red badge `2`).
  - Overview screen hero total sales display (`TOTAL SALES TODAY`, `₱3,840`, `24 transactions`, green `+12% vs yesterday` pill badge).
  - 2x2 KPI grid with colored top accent border bars (`MARGIN` - orange bar, `CASH SESSION` - green bar, `LOW STOCK` - amber bar, `CREDITS DUE` - red bar) and top header link (`KPIS` / `Details >`).
  - Hero CTA `New Sale` persimmon orange block and 2x2 secondary quick actions grid (`Scan`, `Add stock`, `Customer`, `Reports`).
  - Recent activity feed (`RECENT ACTIVITY`, `See all >`) with transaction type sub-labels (`cash`, `credit`, `payment`) and relative timestamps.
  - Dark Espresso Brown (`#1C140E`) top seller banner (`TOP SELLER TODAY`) with orange star icon (`⭐`).
  - Added explicit Expo animation and motion specs using `react-native-reanimated` spring physics (`useSharedValue`, `withSpring` press scale), `moti` (`MotiView`) staggered entrance transitions across all sub-tabs (`Overview`, `Today`, `Alerts`), progress bar animated fill, and `expo-haptics` tactile feedback on sub-tabs, CTA buttons, and KPI cards.
- Added loading skeletons for Home tab swipe screen routes (`Overview`, `Today`, `Alerts`) using React Native Reanimated Skeleton:
  - Created `HomeOverviewSkeleton` for `app/(tabs)/home/index.tsx` matching total sales hero, 2x2 KPI grid, quick action grid, recent activity feed, and top seller mini-insights banner.
  - Created `TodaySnapshotSkeleton` for `app/(tabs)/home/today.tsx` matching sales target card, cash session summary, hourly timeline, and transaction log.
  - Created `HomeAlertsSkeleton` for `app/(tabs)/home/alerts.tsx` matching alert filter pills and alert card items.
  - Exported skeleton components in `components/home/index.ts` and integrated `isLoading` state handling across all home sub-tab routes.
  - Added unit test suite in `tests/components/HomeSkeletons.test.tsx`.
- Executed Impeccable design refactoring pipeline (`adapt`, `clarify`, `harden`, `optimize`, `polish`) on `app/(tabs)/home`:
  - **ADAPT**: Expanded touch target heights to minimum 44px on `DashboardHeader` sub-tab pills (`min-h-[44px]`), `AlertFilterPills` category buttons (`px-4 min-h-[44px]`), and `AlertCardItem` action buttons (`px-4 min-h-[44px]`).
  - **CLARIFY**: Removed static hardcoded percentage badges (`+25.7% today`, `+12% vs yesterday`) in `DashboardKPIGrid.tsx`, replaced corporate labels (`"KPIS"` → `"STORE SUMMARY"`, `"MARGIN"` → `"EST. PROFIT"`), and connected target-specific routes for each card (`/reports`, `/(edit-forms)/cash-session`, `/inventory`, `/utang`).
  - **HARDEN**: Added ARIA accessibility attributes (`accessibilityRole="tablist"`, `accessibilityRole="tab"`, `accessibilityState={{ selected }}`) and descriptive accessibility labels across header elements and alert action buttons.
  - **OPTIMIZE & DISTILL**: Added `useMemo` for category filter computations in `alerts.tsx`, boosted empty alert text contrast to `text-ink-600` for WCAG AA compliance on cream paper backgrounds, removed duplicate nested section titles in `TodayTransactionLog.tsx`, and wired `onSeeAll={() => router.push('/sales')}` on the Today snapshot log.
- Fixed Overview top-tab routing bug in `app/(tabs)/home/_layout.tsx`: changed `handleTabPress` to push `/(tabs)/home` instead of `/(tabs)/home/index` when selecting the Overview sub-tab to prevent `not-found` route errors.

