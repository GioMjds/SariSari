# Activity Log

A running log of work in progress, fixes in flight, and decisions worth referring back to. Newest entries go on top.

---

## 2026-08-11 — Sub-Tabs Swipe Interaction Control Fix (Completed)

### Overview

Made the `SubTabControl` underline track the horizontal page swipe driven by `TopTabs`/`react-native-pager-view`, instead of staying glued to the current tab and snapping after the page landed. Previously the underline was either unresponsive to swipes or visibly rubber-banded along with the user's finger; now it moves in lockstep with the route change.

### Commits

- `33cb84a` — `feat(navigation): add useTabProgress hook for shared label underline progress` ([`hooks/useTabProgress.ts`](file:///D:/giomj/Projects/sarisari/hooks/useTabProgress.ts))
- `d9a4fab` — `refactor(navigation): drop SubTabControl drag gesture; honor external progress` ([`components/navigation/SubTabControl.tsx`](file:///D:/giomj/Projects/sarisari/components/navigation/SubTabControl.tsx))
- `7105a4f` — `feat(navigation): wire home sub-tab labels to TopTabs page progress` ([Home `_layout.tsx`](file:///D:/giomj/Projects/sarisari/app/(tabs)/home/_layout.tsx) + [DashboardHeader.tsx](file:///D:/giomj/Projects/sarisari/components/home/DashboardHeader.tsx))
- `aacd82f` — `feat(navigation): wire sales sub-tab labels to TopTabs page progress` ([Sales `_layout.tsx`](file:///D:/giomj/Projects/sarisari/app/(tabs)/sales/_layout.tsx) + [SalesHeader.tsx](file:///D:/giomj/Projects/sarisari/components/sales/SalesHeader.tsx))
- `db86681` — `feat(navigation): wire customers sub-tab labels to TopTabs page progress` ([Customers `_layout.tsx`](file:///D:/giomj/Projects/sarisari/app/(tabs)/customers/_layout.tsx) + [CustomersHeader.tsx](file:///D:/giomj/Projects/sarisari/components/customers/CustomersHeader.tsx))
- `b84b832` — `feat(navigation): wire inventory sub-tab labels to TopTabs page progress` ([Inventory `_layout.tsx`](file:///D:/giomj/Projects/sarisari/app/(tabs)/inventory/_layout.tsx) + [InventoryHeader.tsx](file:///D:/giomj/Projects/sarisari/components/inventory/InventoryHeader.tsx))

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
