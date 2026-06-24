# Implementation Plan: Sell Tab Redesign (Dual-Tab Segmented Flow)

## Overview

Decompose the implementation of the Sell Tab redesign. We will refactor `app/(tabs)/sell/index.tsx` to host a segmented top tab ("New Sale" vs "History"), merge the POS checkout and cart logic from `app/(edit-forms)/add-sales/index.tsx` into the default "New Sale" tab, remove the floating action "+" button, and add a router redirect in the deprecated `add-sales` screen.

## Architecture Decisions

- **URL Parameter Syncing**: We will support an optional `tab` query parameter on `/(tabs)/sell` (e.g., `/(tabs)/sell?tab=new-sale` or `/(tabs)/sell?tab=history`) to allow external links or onboarding flows to route the user directly to either tab.
- **Graceful Redirection**: To prevent broken references and ensure backward compatibility, the file `app/(edit-forms)/add-sales/index.tsx` will be replaced with a component that immediately performs a `router.replace('/(tabs)/sell?tab=new-sale')`.
- **Offline & Centavos Rules**: POS operations and mutations will run entirely locally through existing SQLite query invalidations (`useSales`, `useProducts`, `useCustomers`), keeping all money representations strictly in integer centavos.

---

## Task List

### Phase 1: Redesign Layout & Embed POS Logic

- [ ] **Task 1**: Refactor `app/(tabs)/sell/index.tsx` to add a segment controller at the top header and split the body display based on the `activeTab` (`new-sale` vs. `history`).
- [ ] **Task 2**: Embed product search, quick-add list, cart bubble, and checkout modal logic directly into the `new-sale` tab view in `app/(tabs)/sell/index.tsx`. Remove the floating "+" FAB.

### Checkpoint 1: Visual and Tab Navigation

- [ ] Segment switching between "New Sale" and "History" tabs works seamlessly.
- [ ] Existing history UI elements (statistics card, filter chips, transaction rows, pagination) remain intact.
- [ ] Product catalog, search bar, and cart bubble render correctly in the "New Sale" tab.

### Phase 2: Redirect & Clean Up

- [ ] **Task 3**: Refactor `app/(edit-forms)/add-sales/index.tsx` to redirect all incoming routes to `/(tabs)/sell?tab=new-sale`.
- [ ] **Task 4**: Perform linting, run Jest tests, and run manual verification of checkout actions.

### Checkpoint 2: Verification

- [ ] Compiles and runs cleanly without ESLint errors.
- [ ] Completing a sale successfully decrements product stock and instantly updates the today's slip totals in the "History" tab.
- [ ] `pnpm test` runs and passes with zero failures.

---

## Detail Breakdown of Tasks

### Task 1: Refactor `app/(tabs)/sell/index.tsx` Layout

- **Description**:
  - Add `activeTab` state (`new-sale` | `history`, defaulting to `new-sale`).
  - Sync the active tab with `useLocalSearchParams<{ tab?: string }>()`.
  - Add the Segment Switcher to the top cinnamon header (using NativeWind flex styles matching the app theme).
  - Remove the floating "+" FAB.
  - Wrap the main rendering content to conditionally render either the checkout/POS content or the history `FlatList` based on the active tab state.
- **Acceptance criteria**:
  - Tabbing "History" displays the statistics slip, filters, and list of sales.
  - Tabbing "New Sale" displays the POS container (to be implemented in Task 2).
  - The floating "+" button is gone.
- **Files likely touched**:
  - `app/(tabs)/sell/index.tsx`
- **Estimated scope**: Medium (1 file)

### Task 2: Merge Checkout Logic and Modals into Sell Tab

- **Description**:
  - Copy the checkout state (cart items, customer selection state, checkout/customer picker modal visibility states) and handlers (`handleAddItem`, `handleUpdateQuantity`, `handleCompleteSale`) from `app/(edit-forms)/add-sales/index.tsx`.
  - Set up query calls for `getAllProductsQuery`, `useCustomers`, and the `insertSaleMutation` hook.
  - Render the product search bar, the product flat list, the floating cart bubble, and the check-out modals inside the `new-sale` view block.
- **Acceptance criteria**:
  - Store owners can search and tap products to add them to the cart.
  - Quantity adjustments inside the product row work perfectly.
  - Checking out cash/credit matches standard POS requirements.
  - Completing a sale runs the mutation, resets the cart, and displays a success alert.
- **Files likely touched**:
  - `app/(tabs)/sell/index.tsx`
- **Estimated scope**: Medium (1 file)

### Task 3: Replace `app/(edit-forms)/add-sales/index.tsx` with Redirect

- **Description**:
  - Replace the entire contents of `app/(edit-forms)/add-sales/index.tsx` with a clean React component that performs a client-side navigation redirect using `router.replace('/(tabs)/sell?tab=new-sale')` inside a `useEffect`.
- **Acceptance criteria**:
  - Opening the old route immediately forwards the user to the new Sell tab checkout state.
- **Files likely touched**:
  - `app/(edit-forms)/add-sales/index.tsx`
- **Estimated scope**: Small (1 file)

### Task 4: Lint, Test, and Verify

- **Description**:
  - Run the test suite and resolve any lint warnings or type checks.
  - Perform manual verification under airplane mode.
- **Acceptance criteria**:
  - `npx expo lint` passes cleanly.
  - `pnpm test` passes.
- **Estimated scope**: XS (Config / commands)

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cart state resetting on tab switch | Medium | We can keep cart state in local react state inside the parent `Sales` component so it is preserved if the user briefly switches to "History" and back to "New Sale". |
| Heavy component sizes | Low | Keep checkout modals and product lists modular or nested inside the same file (since `add-sales` is short enough, merging keeps all code focused and clean). |
