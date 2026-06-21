# Inventory Screen Redesign — Design Spec

Brainstormed 2026-06-21.

---

## Context

The Inventory tab at `app/(tabs)/index.tsx` is functionally complete — it lists products, surfaces low-stock, opens a restock modal, links to add/edit products — but visually flat compared to the rest of the app. The Sales tab at `app/(tabs)/sales/index.tsx` was redesigned with a "resibo book" treatment: a sticky cinnamon header, a `ReceiptHero` summary card with perforated edges, animated `MotiView` rows, and a floating FAB. The Credits and Reports tabs use a related paper palette with KPI grids. Inventory is the home tab; it should match that level of craft.

The user wants a **visual polish only** redesign — no new features, no new screens, no new data flows. The screen's three existing jobs (monitor stock, restock, link to add product) stay the same. The visual language should **match the Sales tab** so the app feels coherent at the bottom-tab level.

**Why now:** Inventory is the first screen users see. A flat layout undermines confidence in the rest of the app, even when every other tab is polished.

---

## Scope

**In scope:**
- Visual redesign of `app/(tabs)/index.tsx` (Inventory tab) only.
- Extract inventory-specific view components into `components/inventory/`.
- Reuse existing design tokens, components, hooks, and utilities. Zero new dependencies.
- Add pull-to-refresh (a small regression fix; the current screen lacks it).

**Out of scope:**
- New features (no "stock value history", no "expiring soon", no bulk restock).
- New filter dimensions beyond the existing low-stock toggle.
- Refactors to sibling screens (Products, Credits, Reports, Sales). They keep their current look.
- Drag-to-reorder, multi-select, animations on stock bars.
- Dark mode toggle.
- New design tokens or constants.

---

## Architecture

The current file is 670 lines with three concerns (header, list, action modal, guide modal) jammed into the screen body. The redesign extracts the views into single-purpose units under `components/inventory/`, mirroring how the Sales tab is structured.

### New files

All under `components/inventory/`. Each file is a single React component with typed props and no hook calls beyond `React`-internal state.

| File | Responsibility |
|------|---------------|
| `InventoryHeader.tsx` | Cinnamon band: monogram dot, "Stock Ledger" eyebrow, title, subtitle, filter-button-with-badge, guide button |
| `InventoryHero.tsx` | Wraps `ReceiptHero` with "OFFICIAL LEDGER" header + Stock Overview meta rows + total value display |
| `InventoryRow.tsx` | One product card: name + SKU, price + stock mini-grid, `StatusPill`, single circular `+` restock button |
| `InventoryEmptyState.tsx` | Centered inbox icon + "No products yet" + "Add Product" CTA |
| `InventorySkeleton.tsx` | 4 stacked `Skeleton`-shaped placeholders matching the row dimensions |
| `InventoryActionModal.tsx` | Bottom-sheet restock modal — `KeyboardAwareScrollView`, quantity input, confirm/cancel |
| `GuideModal.tsx` | "Quick guide" modal extracted from the screen body (uses existing `GUIDE_TIPS`) |

### Modified files

- `app/(tabs)/index.tsx` — shrinks from ~670 lines to ~250. Holds state (`search`, `pendingAction`, `quantityInput`, `currentPage`, `showGuide`, `showFilter`, `showLowOnly`), queries (`useProducts`, `useInventory`), memos (`summary`, `filtered`, `paginatedProducts`), and orchestrates the new components. No new business logic.

### Untouched

- All files in `app/(edit-forms)/`, `db/`, `hooks/`, `stores/`, `constants/`, `configs/`, `lib/`, `types/`. No data hooks change, no SQL changes, no schema changes, no new types.

### Layering check (AGENTS.md)

- Screen calls hooks only. Never `db/`.
- New components are pure presentation. No hook calls.
- `pendingAction` state stays as `useState` in the screen — it's UI flow state, not business data.
- `useToastStore` and `useDialogStore` (Zustand UI stores) remain the only non-TanStack state sources.

---

## Data flow

```
Screen (app/(tabs)/index.tsx)
  ├─ useProducts().getAllProductsQuery()          // TanStack
  ├─ useInventory().insertInventoryMutation()     // TanStack
  ├─ useToastStore (Zustand UI)
  ├─ useDialogStore (Zustand UI)
  ├─ useState: search, pendingAction, quantityInput, currentPage, showGuide, showFilter, showLowOnly
  ├─ useMemo: summary → { totalProducts, totalItems, lowStockCount, outOfStockCount, totalValueCentavos }
  ├─ useMemo: filtered = apply search + lowStock + outOfStock
  ├─ useMemo: paginatedProducts = slice for current page
  └─ renders (in order):
       <InventoryHeader subtitle={...} onOpenGuide onOpenFilter activeFilterCount />
       <FlatList ListHeaderComponent={<InventoryHero stats={summary} />}
                 data={paginatedProducts}
                 renderItem={InventoryRow}
                 ListEmptyComponent={isLoading ? <InventorySkeleton /> : <InventoryEmptyState />}
                 refreshControl={<RefreshControl />} />
       <InventoryActionModal pendingAction quantityInput onChangeQuantity onSubmit onClose isSubmitting />
       <GuideModal visible onClose />
       <CustomModal ... /> (exit-app dialog)
```

**Mutation path** (unchanged from current behavior):
```
InventoryRow.onRestock(product)
  → Screen.openAction(product, 'restock')         // sets pendingAction state
  → InventoryActionModal renders
  → User types quantity, taps Confirm
  → Screen.submitAction:
       parse qty, validate qty > 0
       transactionMutation.mutate({ product_id, type: 'restock', quantity: qty })
       closeAction()                               // clears pendingAction
  → mutation onSuccess → useInventory invalidates query keys
  → TanStack refetch → hero + list update
```

**Reused utilities** (no new code):
- `MoneyText` with `fromPesos` flag — formats the total stock value hero number.
- `ReceiptHero`, `ReceiptHeroDivider`, `ReceiptHeroMeta` — composes the hero card.
- `StatusPill` — surfaces out-of-stock / low-stock on each row.
- `SearchBar` — wraps the search input with the app-standard styling.
- `Skeleton` — used inside `InventorySkeleton`.
- `CustomModal` — used for the exit-app dialog (unchanged).
- `MotiView` — staggered fade/translate on header, hero, rows.
- `getStockStatus` from `utils/formatters` — maps quantity → stock label/color inside the row.
- `GUIDE_TIPS` from `constants/guide.ts` — guide modal content.
- `ITEMS_PER_PAGE`, `LOW_STOCK_THRESHOLD` from `constants/stocks` — current screen redeclares `LOW_STOCK_THRESHOLD` locally; the redesign imports from constants instead.

---

## UI specification

### Z1 — Sticky cinnamon header band

- Background: `bg-cinnamon-500` (#623418). 20px top / 24px bottom / 20px horizontal padding.
- **Monogram dot**: 32×32 rounded-full, `bg-persimmon-500`, contains a `₱` glyph in `text-paper-50 text-sm font-extrabold`. Drop shadow `0 2px 6px rgba(86,78,69,0.06)`.
- **Eyebrow label**: "Stock Ledger" in `text-label text-paper-200 opacity-80` (10px, 0.14em tracking, semibold).
- **Title**: "Inventory" in `text-h1 text-paper-50` (28px, -0.01em, extrabold).
- **Subtitle**: dynamic string in `text-sm text-paper-200 opacity-90`, format: `"X products • Y low stock"`. Falls back to `"Track your stock"` when product list is empty.
- **Right-side buttons** (in order): a 44×44 circular filter button (`sliders` icon) with the persimmon badge when filters are active, then a 44×44 circular guide button (`question-circle` icon).

### Z2 — Stock Overview hero

- Uses `ReceiptHero tone="persimmon"` from the existing component.
- Visible only when `products.length > 0` (mirrors Sales tab's `showHero` rule).
- Header strip: default "OFFICIAL LEDGER" eyebrow + monogram dot from `ReceiptHero.Header`.
- `ReceiptHeroDivider label="Stock Overview" tone="persimmon"`.
- **Hero number**: total stock value, rendered via `<MoneyText value={summary.totalValueCentavos / 100} fromPesos size="display" />`. Font: 40px extrabold, -0.02em, ink-900. The integer-centavos guardrail is preserved at the data layer; the `fromPesos` flag handles the render-time conversion.
- `ReceiptHeroMeta` with three dashed-border rows:
  - `Total Products` → `summary.totalProducts`
  - `Items in Stock` → `summary.totalItems` (sum of all quantities)
  - `Low / Out of Stock` → `"X / Y"` formatted string
- Outer wrapper: `px-4 -mt-2 mb-4` to overlap the header band.

### Z2b — Filter chips strip

- Reuse `components/sales/FilterChips.tsx` with an inventory-shaped filter object: `{ lowStock: boolean; outOfStock: boolean }`. The current inline "Low Stock" header pill is removed; a `FilterChips` strip sits between the hero and the list, containing the "Low Stock" chip. The "open more filters" affordance (if added later) wires through the Z1 sliders button. For now, only the low-stock chip is wired; the `outOfStock` chip is rendered as a visual placeholder but is a no-op tap (defer).

### Z3 — Product list rows

- Outer card: `bg-paper-50 rounded-2xl border border-ink-100 shadow-paper p-4 mx-4 mb-3`.
- Layout: `flex-row justify-between items-start`.
- **Left column (flex-1)**:
  - Name: `text-base font-semibold text-ink-900 mb-1`.
  - SKU: `text-xs text-ink-500`.
  - Mini-grid (2 columns): "Price" left, "Stock" right. Each has a `text-label text-ink-500` caption + a value row. Price: `<MoneyText value={item.price} fromPesos size="lg" className="text-ink-900" />`. Stock: `text-lg font-extrabold text-ink-900` (or `text-semantic-danger` when `quantity === 0`).
- **Right column**: a vertical stack with the `StatusPill` at top and the `+` restock button below.
  - `StatusPill`: rendered only when stock is low or out (clean cards for healthy stock). Variant: `danger` when `quantity === 0`, `warning` when `quantity < LOW_STOCK_THRESHOLD`.
  - Restock button: 48×48 rounded-full `bg-persimmon-500`, `shadow-persimmon-glow`, `FontAwesome 'plus'` icon in `text-paper-50`. Pressing it calls `onRestock(item)`.
- Rows animate in via `MotiView` with stagger `delay = 200 + (index % 5) * 50`, matching `renderSaleItem` in the Sales tab.

### Z4 — Bottom action area

- No screen-level FAB. The per-row `+` button is the primary affordance. The screen's old "Add Product" header button is replaced by the empty-state CTA and the secondary `+` icon in the Z1 right side that routes to `/(edit-forms)/add-product`.
- `InventoryActionModal` is a `Modal visible={!!pendingAction}` with the existing `KeyboardAwareScrollView` shape, `extraScrollHeight={280}`, `bg-white rounded-t-2xl p-6`. Inside: product context block (name, SKU, current stock, price via `MoneyText fromPesos`), quantity `TextInput keyboardType="number-pad"`, Cancel + Confirm row. Confirm button is `bg-persimmon-500` for restock (no longer split by type — the `'sale'` arm is removed from the modal because the row only fires restock).
- `GuideModal` is a `Modal transparent animationType="fade"` with the existing `GUIDE_TIPS` map. Extracted from inline for clarity; behavior identical to current.

### Z5 — Loading and empty states

- **Loading**: `InventorySkeleton` renders 4 stacked card-shaped placeholders inside `FlatList`'s `ListEmptyComponent` branch when `isLoading || isRefetching`. Each placeholder mimics the row dimensions: `bg-paper-50 rounded-2xl p-4 mx-4 mb-3` with two `Skeleton` blocks inside (one wider for the name, one narrower for the value row).
- **Empty (no products)**: `InventoryEmptyState`. Centered layout: 78px `FontAwesome 'inbox'` in `text-persimmon-500`, "No products yet" title in `text-xl font-extrabold text-ink-900`, body line in `text-sm text-ink-500`, "Add Product" persimmon pill button routing to `/(edit-forms)/add-product`. Wrapped in `px-6 pt-24`.
- **Empty (filtered to zero)**: show the row count "0 products" in `text-sm text-ink-500` above the list; no big empty state when there *are* products but the filter excludes them.

### Motion summary

- Header: 320ms opacity fade-in.
- Hero: 480ms translateY-18 → 0 + opacity, 80ms delay.
- Filter chips strip: 360ms opacity, 160ms delay.
- List rows: 200ms base + 50ms × (index % 5) stagger, 400ms duration.
- Action modal slide-up: default RN `animationType="slide"` from `KeyboardAwareScrollView`'s wrapping — no custom Moti here.

### Pull-to-refresh

- Add `RefreshControl` to the `FlatList` with `refreshing={refreshing}`, `onRefresh={onRefresh}`, `tintColor="#E85A1F"`, `colors={["#E85A1F"]}`. Matches the Sales tab exactly. Fixes a current-scree regression: pull-to-refresh is missing today.

---

## Errors and edge cases

- `products` undefined: `useProducts()` returns `data: products = []` by default. The hero's visibility check uses `products?.length ?? 0 > 0`.
- `pendingAction` with quantity ≤ 0: existing `useToastStore.addToast({ message: 'Please enter a valid quantity', variant: 'error' })` — kept as-is.
- Mutation failure: handled inside `useInventory.insertInventoryMutation` — no new error handling in this screen.
- Pagination when fewer products than `ITEMS_PER_PAGE`: existing `Pagination` component handles the `totalPages <= 1` case (no pagination rendered). Keep this behavior.

---

## What we don't test

- No new Jest tests. The repo's existing tests live in `__tests__/` for DB-layer concerns. There is no UI test harness for React Native components. Adding one for a pure visual refresh is out of scope.
- Manual verification via the acceptance checklist below.
- `npx expo lint` passes.

---

## Acceptance checklist

1. `npx expo start`, navigate to the Inventory tab.
2. With zero products: header renders, hero is hidden, skeleton briefly appears, then empty state with "Add Product" CTA. CTA navigates correctly.
3. Add 2 products via the empty-state CTA and via the header `+` button. Return to inventory: cinnamon header + hero + 2 cards render with the correct totals.
4. Hero shows total stock value computed from `price * quantity`; meta rows show correct product / item / low-or-out counts.
5. Out-of-stock product shows `StatusPill variant="danger"` and stock number in `text-semantic-danger`. Low-stock product (qty < 5) shows `StatusPill variant="warning"`. Healthy stock shows no pill.
6. Tap a row's `+`: action modal slides up, pre-filled with product context, accepts quantity, persists, hero updates.
7. Toggle the low-stock filter chip: list narrows; Z1 sliders button shows a `1` badge.
8. Pull to refresh: hero numbers + list refresh; `tintColor` matches the Sales tab.
9. Airplane mode on: all of the above still works. No network calls introduced.
10. `npx expo lint` clean. `npm test` still green for DB-layer tests.

---

## Implementation order

1. **Move spec to canonical location**: copy this file to `docs/superpowers/specs/2026-06-21-inventory-screen-redesign-design.md` and commit.
2. **Skeleton first**: create `components/inventory/InventorySkeleton.tsx` and wire it into the screen's loading branch. No visual risk; verifies the FlatList pattern.
3. **Extract pieces**: create `InventoryEmptyState`, `GuideModal`, `InventoryActionModal`, `InventoryHeader`, `InventoryRow`, `InventoryHero` in that order. Wire each into the screen, removing inline JSX as you go.
4. **Wire data**: pass `summary` into `InventoryHero`, `subtitle` into `InventoryHeader`. Import `LOW_STOCK_THRESHOLD` from `constants/stocks` instead of redeclaring.
5. **Add pull-to-refresh**: add `RefreshControl` to the FlatList.
6. **Manual verification**: run through the acceptance checklist.
7. **Lint + tests**: `npx expo lint`, `npm test`.

Each step is a small, isolated diff. No step requires touching `db/`, `hooks/`, `stores/`, or `app/(edit-forms)/`.

---

## Risk register

- **`MotiView` stagger on a paginated list**: the staggered animation must only run on the first page; otherwise scrolling triggers re-animations. The Sales tab uses `delay = 200 + (index % 5) * 50` which limits re-animation to a 5-row window — we copy this pattern exactly.
- **`ReceiptHero` + FlatList interaction**: the hero is in `ListHeaderComponent`, not a sibling. The Sales tab already does this. No risk.
- **Pull-to-refresh on a list whose first item is the hero**: standard RN `FlatList` pattern; `RefreshControl` triggers `refetch()` on the `useProducts` query. No data flow changes.
- **Empty state under the cinnamon header**: the hero is hidden when no products exist, but the header still renders. The subtitle falls back to "Track your stock". Verified against the Sales tab's parallel empty state.

---

## Future work (not in scope)

- Refactor `app/(tabs)/products/index.tsx` to share row / hero components with the inventory tab — they currently do nearly the same job with two different visual languages.
- Add an inventory value trend chart (sparkline) inside the hero, mirroring the Reports tab's chart language.
- Per-category filter chips, jump-to-category from row context menu.
- Accessibility audit (add `accessibilityLabel` to the `+` restock button and the filter sliders button).