# Changelog

All notable changes to the **SariSari** project will be documented in this file.

---

## [1.2.0] - 2026-07-18

### Added

- **Instant Barcode Lookup**: Scanning a product barcode now resolves product name,
  brand, and category instantly (<10ms) without internet connection using local SQLite
  catalog.
  - **Pre-loaded Filipino Catalog**: Seeded common Philippine sari-sari store products
    (Lucky Me, Milo, Coca-Cola, Century Tuna) directly into the app for instant scanning on
    first install.
  - **Multi-Source Resolution**: Added fallback pipeline (Memory Cache → SQLite Catalog
    → Cloud Catalog → Manual Entry) ensuring store-specific selling prices and inventory
    counts are never overwritten.
- **Auto-Learning Catalog**: Automatically saves and learns new barcode and category entries
  when custom products are added, building a tailored local catalog over time.
- **Dynamic Tab Bar Bottom Offset**: Implemented automatic layout adjustments for the bottom
  navigation bar on Android to perfectly align with gesture and three-button device navigation.

### Fixed

- **Barcode Input Sanitization**: Trimmed leading/trailing whitespaces from scanned/entered
  barcodes to avoid lookup misses.

---

## [1.1.0-rc.1] - 2026-07-17

### Added

- **Cash Session Open/Close Flow**: Added cash session open/close flow and manual cashbook entry screens with reports integration.
- **Stock Intelligence & Planning**: Added calculations and planning operations for inventory reordering, along with query and mutation hooks.
- **Stock Recommendations Screen**: Implemented recommendations UI with urgency-based badges, and adjust/defer/dismiss actions.
- **Dynamic Build Badge**: Added `BuildBadge` component (`components/BuildBadge.tsx`) to display a visual header for `Dev` (Blue) and `Preview` (Amber) builds in `app/_layout.tsx`. The badge automatically hides in production.
- **React Doctor CI Integration**: Set up `.github/workflows/react-doctor.yml` workflow pinning `millionco/react-doctor@v2.2.7` to run static analysis on UI and hook structures.
- **CI Dependency Doctor Script**: Added `doctor` script (`npx react-doctor@0.7.8`) in `package.json` for manual performance audits.
- **Repository Governance Files**: Added issue templates, support guides, security policy, code of conduct, and contributing instructions.

### Changed

- **Code Structure Refactoring**: Reorganized form pages and hook structures under `app/(edit-forms)`, extracting subcomponents for cash entries, cash sessions, categories, and inventory ledger to improve maintainability and avoid unnecessary re-renders.
- **EAS Build Profiles & Config Separation**:
  - Dynamic `app.config.js` variant selection via `APP_VARIANT` environment variable.
  - Distinct package/bundle identifiers for development, preview, and production builds (`com.giomjds.sarisari.dev`, `com.giomjds.sarisari.preview`, and `com.giomjds.sarisari`) allowing side-by-side installation on the same device.
  - Updated `eas.json` profiles to pass the proper `APP_VARIANT` variable during builds.
- **Nominal Money Typing (Pesos)**:
  - Refactored cash sessions, summaries, and entries database operations (`database/cash.ts`, `types/cash.types.ts`) to use the branded `Pesos` nominal type rather than raw `number` inputs, satisfying the "Money is integer pesos" rule.
  - Updated test coverages (`tests/database/cash.test.ts`) to enforce casting integers to `Pesos`.
- **Form State Reactivity**:
  - Migrated state trackers from `watch` to `useWatch` inside React Hook Form hooks to prevent unnecessary re-renders.
  - Updated form hooks across fields in: Add Credit Form, Add Customer Form, Add Payment Form, Add Product & Edit Product Forms, Transaction Logging Form, and Add Sales Form.
- **Dashboard & Reports Visual Polish**:
  - Restyled variance indicator boxes in `DashboardAttentionSection.tsx` with color-coding based on the magnitude/urgency of discrepancy.
  - Updated stock alert messages and clarified "Stock Asset Value" labels in reports for better store owner tracking.
- **Active Navigation Styles**: Streamlined active selection styles for Filter Chips and Styled Tab states (`components/layout/StyledTab.tsx`, `components/sell/FilterChips.tsx`, and `components/utang/FilterBar.tsx`).
- **Default Pagination Limit**: Increased items per page limit constants for inventory search results and ledgers.

### Fixed

- **Form Accessibility Compliance**:
  - Added explicit `accessibilityRole="button"` and `accessibilityLabel` properties to helper triggers (such as clearing text inputs in `add-supplier/index.tsx`).
- **Closed-Session Deletion Safety Invariants**:
  - Added strict checks in `database/sales.ts` to throw errors when attempting to delete sales or payments associated with closed cash sessions, preventing retrospective adjustments to finalized ledgers.
  - Added test coverage verifying the deletion safety constraint in `tests/database/sales_cash_safety.test.ts`.
- **Onboarding and Tour Steps Handling**:
  - Fixed edge-case crashes when completing profile configuration steps and handled onboarding tour step transitions more gracefully.
- **Settings Screen Language Reactivity**:
  - Re-wired the `LanguagePickerDialog` to update screen locales instantly through reactive i18n triggers without needing app restarts.
- **Stock Intelligence & Plan Cleanups**:
  - Pruned stale stock reorder recommendations and plans during calculations to avoid duplicate inventory suggestions.

---

## [1.0.0] - 2026-07-17

### Added

- Initial release of SariSari offline-first POS, inventory management, and credit tracking.
- Production EAS build workflow setup.
- Styling lifecycles NativeWind components optimization.
