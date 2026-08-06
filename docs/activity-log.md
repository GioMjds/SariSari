# Activity Log

A running log of work in progress, fixes in flight, and decisions worth referring back to. Newest entries go on top.

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


