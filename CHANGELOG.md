# Changelog

All notable changes to the **SariSari** project will be documented in this file.

---

## [1.0.0] - 2026-07-17

### Added

- **Dynamic Build Badge**: Added `BuildBadge` component (`components/BuildBadge.tsx`) to display a visual header for `Dev` (Blue) and `Preview` (Amber) builds in `app/_layout.tsx`. The badge automatically hides in production.
- **React Doctor CI Integration**: Set up `.github/workflows/react-doctor.yml` workflow pinning `millionco/react-doctor@v2.2.7` to run static analysis on UI and hook structures.
- **CI Dependency Doctor Script**: Added `doctor` script (`npx react-doctor@0.7.8`) in `package.json` for manual performance audits.

### Changed

- **EAS Build Profiles & Config Separation**:
  - Dynamic `app.config.js` variant selection via `APP_VARIANT` environment variable.
  - Distinct package/bundle identifiers for development, preview, and production builds (`com.giomjds.sarisari.dev`, `com.giomjds.sarisari.preview`, and `com.giomjds.sarisari`) allowing side-by-side installation on the same device.
  - Updated `eas.json` profiles to pass the proper `APP_VARIANT` variable during builds.
- **Nominal Money Typing (Pesos)**:
  - Refactored cash sessions, summaries, and entries database operations (`database/cash.ts`, `types/cash.types.ts`) to use the branded `Pesos` nominal type rather than raw `number` inputs, satisfying the "Money is integer pesos" rule.
  - Updated test coverages (`tests/database/cash.test.ts`) to enforce casting integers to `Pesos`.
- **Form State Reactivity**:
  - Migrated state trackers from `watch` to `useWatch` inside React Hook Form hooks to prevent unnecessary re-renders.
  - Updated form hooks across fields in:
    - Add Credit Form (`components/utang/add-credit/useAddCreditForm.ts`)
    - Add Customer Form (`components/utang/add-customer/useAddCustomerForm.ts`)
    - Add Payment Form (`components/utang/add-payment/useAddPaymentForm.ts`)
    - Add Product & Edit Product Forms (`useAddProductForm.ts`, `useEditProductForm.ts`)
    - Transaction Logging Form (`useLogTransactionForm.ts`)
    - Add Sales Form (`components/sell/add-sales/useAddSalesForm.ts`)
- **Dashboard & reports visual polish**:
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
