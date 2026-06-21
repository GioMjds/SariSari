# Inventory Screen Redesign — Design Spec

**Date:** 2026-06-21
**Status:** Approved (design phase)
**Scope:** Visual polish of the Inventory tab (`app/(tabs)/index.tsx`) to match the layered visual language established by the Sales tab (`app/(tabs)/sales/index.tsx`) after the 2026-06-19 rebrand.
**Estimated effort:** ~3–4 hours, shippable in a single focused change set.

---

## Context

The SariSari Inventory tab is the home screen — the first thing a sari-sari store owner sees after onboarding. It lists their stock, lets them restock, and links to add new products. After the 2026-06-19 rebrand, the Sales tab (`app/(tabs)/sales/index.tsx`) was elevated to a layered visual language: a sticky **cinnamon header band**, a **`ReceiptHero` "Today's Slip"** showing the headline number, a **`FilterChips` strip**, and an animated list of `MotiView`-staggered rows — with a floating persimmon FAB. The Credits and Reports tabs got `KPICard` grids. The Products tab got a search/sort/stats block.

The Inventory tab was not redesigned during the rebrand. It still uses the older flat layout: a transparent header, three text-only KPI tiles in a row, and white cards with a `+` action button. The contrast with its sibling tabs is now noticeable — the home tab feels visually behind the rest of the app.

The intended outcome: make the Inventory tab feel like a sibling of the Sales tab by adopting the same Z1/Z2/Z3 layered pattern, with a hero that surfaces the headline stock value (peso-value of goods on shelves — the most decision-relevant number for a store owner), without changing any data flow, adding any features, or touching any other file outside this tab and its new components.

This redesign is **visual and structural only**. No new features, no behavior changes, no data-layer changes, no schema changes, no new hooks, no network code, no new constants, no new screens.

---

## Brand direction

**Match the Sales tab exactly.** Cinnamon header, persimmon-tone hero receipt, paper-textured body, dashed dividers, persimmon FAB-style actions. Every existing visual token (`persimmon-*`, `cinnamon-*`, `ink-*`, `paper-*`, `shadow-paper*`, `shadow-persimmon-glow`) is reused as-is. No new tokens, no new shadow values, no new colors.

This direction was chosen over "Light & paper-only" (loses the brand band the rest of the app has) and "Data-dense dashboard" (loses the warm "tindahan" feel) because consistency with the sibling tab is the highest-value outcome for the home screen.

---

## Section 1 — Architecture & component decomposition

The current Inventory screen is a 670-line single file. Three concerns are jammed into the screen body: the header, the restock modal, and the guide modal. The redesign extracts these into single-purpose units under a new `components/inventory/` folder, mirroring how the Sales tab reuses shared primitives.

### New components

All under `components/inventory/` (per AGENTS rule: "If used by one screen only, keep it co-located" — all of these are inventory-specific).

**`components/inventory/InventoryHeader.tsx`** — Cinnamon header band.

- Props: `{ onOpenGuide: () => void; onOpenFilter: () => void; subtitle: string }`
- Layout: `bg-cinnamon-500 px-5 pt-3 pb-6`. Monogram dot (32×32 `bg-persimmon-500` rounded-full, contains `₱` glyph in `text-paper-50 text-sm`), then eyebrow label `"Stock Ledger"` in `label-caps text-paper-200 opacity-80`. Title `"Inventory"` in `text-h1 text-paper-50`. Subtitle (passed in) below. Right side: 44×44 circular button with `bg-paper-50/15` and `sliders` icon, opening the filter. When low-stock filter is on, a 20×20 persimmon dot in the top-right with the active filter count.

**`components/inventory/InventoryHero.tsx`** — Stock overview hero.

- Props: `{ stats: { totalProducts: number; totalItems: number; lowStockCount: number; outOfStockCount: number; totalValueCentavos: number } }`
- Wraps `ReceiptHero` with `tone="persimmon"`. The "OFFICIAL LEDGER" header and perforations come for free from the component. Inside: `ReceiptHeroDivider label="Stock Overview" tone="persimmon"`, then a `MoneyText` with `size="display" fromPesos` for total stock value (the headline number), then a `ReceiptHeroMeta` block with three rows: `Total Products`, `Items in Stock`, `Low / Out of Stock` (e.g. `"3 / 1"`).
- Hidden when `products.length === 0`, matching the Sales tab's `showHero` rule.

**`components/inventory/InventoryRow.tsx`** — Product card.

- Props: `{ product: Product; onRestock: (p: Product) => void }`
- White card: `bg-paper-50 mx-4 mb-3 rounded-2xl p-4 border border-ink-100 shadow-paper`. Top: name (`text-base font-semibold text-ink-900`) + SKU (`text-xs text-ink-500`). Right: stock number + `StatusPill` chosen from `getStockStatus(product.quantity)` (out of stock → `danger`, low → `warning`, healthy → no pill). Middle: 2-column mini-stats grid for Price and Stock with `label-caps` captions and bold values. Bottom-right: 48×48 circular persimmon `+` button (`bg-persimmon-500 shadow-persimmon-glow`).
- Wrapped in `MotiView` with the same staggered fade-in animation as Sales.

**`components/inventory/InventoryEmptyState.tsx`** — Empty list state.

- Props: `{ onAddProduct: () => void }`
- Centered `FontAwesome 'inbox'` at 78px in `text-persimmon-500`. Title `"No products yet"` in `text-xl font-extrabold text-ink-900`. Subtitle `"Add your first product to get started"` in `text-sm text-ink-500`. CTA: persimmon pill button routing to `/(edit-forms)/add-product`.

**`components/inventory/InventorySkeleton.tsx`** — Loading state.

- No props. Renders 4 stacked skeleton cards in the same `mx-4 mb-3 p-4` shape as the real rows, using the existing `Skeleton` component.

**`components/inventory/InventoryActionModal.tsx`** — Restock bottom sheet.

- Props: `{ pendingAction: PendingAction | null; quantityInput: string; onChangeQuantity: (s: string) => void; onSubmit: () => void; onClose: () => void; isSubmitting: boolean }`
- Re-uses the same `KeyboardAwareScrollView` + `bg-white rounded-t-2xl p-6` shape from the current screen, but extracted so the screen file stays small. The product-context lines (current stock, price) and quantity input stay as-is. `restock` button: `bg-persimmon-500`. The `PendingAction.type === 'sale'` branch is preserved in the type union for forward compatibility but no UI surface fires it — the screen only handles `restock` now (sales happen on the Sales tab).

**`components/inventory/GuideModal.tsx`** — Quick guide modal.

- Props: `{ visible: boolean; onClose: () => void }`
- Same content as the current inline `Modal` for the guide (renders `GUIDE_TIPS` from `constants/guide.ts`), just extracted.

### What stays the same (deliberately)

- All hooks (`useProducts`, `useInventory`), the `pendingAction` modal logic, the guide modal, the exit-app dialog, debounce behavior, pagination behavior.
- All routes — `app/(edit-forms)/add-product`, `app/(edit-forms)/edit-product/[id]`, etc. — untouched.
- `db/` and `hooks/` and `stores/` and `types/` — untouched. No new files anywhere outside `app/(tabs)/index.tsx` and `components/inventory/`.
- `LOW_STOCK_THRESHOLD = 5` and `ITEMS_PER_PAGE = 4` continue to come from `constants/stocks.ts` (the current screen redeclares `LOW_STOCK_THRESHOLD` locally — that local copy is removed; same change as the rebrand spec already noted in its Tier 4 bugs).
- Money invariant: `MoneyText` continues to receive integer centavos (with `fromPesos=true` for the headline value). The hero's `totalValueCentavos` is computed via integer math in the screen memo, preserving the no-decimal-money rule.

### What gets removed

- Inline `renderItem` (replaced by `InventoryRow`).
- Inline `Modal` for the guide (replaced by `GuideModal`).
- Inline restock modal (replaced by `InventoryActionModal`).
- Local `LOW_STOCK_THRESHOLD` redeclaration (imports from `constants/stocks.ts`).
- The `summary` object computed in two places collapses to one memo at the screen level, passed into `InventoryHeader` (subtitle) and `InventoryHero` (stats).
- The dual restock/sale button surface — only the restock button is rendered. The `PendingAction.type` union still contains `'sale'` for forward compatibility, but no caller in the new code passes `'sale'`. The `transactionMutation` continues to accept both `type` values (its contract is unchanged) — this is a UI-level decision, not a data-layer one.
- The inline "Low Stock" pill in the current header. The same `showLowOnly` boolean state stays at the screen level, but it's now toggled from a small filter modal opened by the Z1 sliders button. That filter modal stays inline in the screen file — it doesn't get its own component file because it's a small piece of UI (one toggle + a Done button) tightly tied to screen-level state.

### Files modified or created

**Modified:**

- `app/(tabs)/index.tsx` — shrinks from ~670 lines to ~250. Only orchestration: hooks, memo, layout composition, action handlers.

**Created (all under `components/inventory/`):**

- `InventoryHeader.tsx`
- `InventoryHero.tsx`
- `InventoryRow.tsx`
- `InventoryEmptyState.tsx`
- `InventorySkeleton.tsx`
- `InventoryActionModal.tsx`
- `GuideModal.tsx`

**Untouched (every other file in the repo):** `app/(edit-forms)/`, `db/`, `hooks/`, `stores/`, `constants/`, `configs/`, `lib/`, `types/`, all other components, all other tab screens, `tailwind.config.js`, `global.css`, `app.json`.

---

## Section 2 — Data flow & props

The screen still reads from `useProducts()` and `useInventory()` (already wired in the current file). The `pendingAction` modal is screen-local UI flow state and stays as `useState` in the screen — per AGENTS, `stores/` is for UI state that needs to survive navigation; this modal doesn't need to survive navigation.

```
Screen → useProducts() → products, isLoading, refetch
Screen → useInventory() → transactionMutation
Screen memo → summary: { total, low, outOfStock, totalQty, totalValueCentavos }
Screen memo → summary.subtitle → InventoryHeader.subtitle
Screen memo → summary.* → InventoryHero.stats
Screen → renderItem(item) → <InventoryRow product={item} onRestock={openAction} />
Screen → openAction(product, 'restock') → setPendingAction(...) → <InventoryActionModal ... />
InventoryActionModal.onSubmit → transactionMutation.mutate(...)
mutation onSuccess → query cache invalidation (handled by useInventory)
```

Props are one-way (parent → child) and pure-data. No callback returns business data. No child imports a hook.

### Reused utilities (no new code)

- `useToastStore` — for "Please enter a valid quantity" and "Not enough stock available" errors.
- `useDialogStore` + `CustomModal` — for the exit-app dialog.
- `GUIDE_TIPS` from `constants/guide.ts` — guide modal content.
- `getStockStatus` from `utils/formatters.ts` — already exists; `InventoryRow` calls it.
- `MoneyText` from `components/ui/MoneyText.tsx` — used in the hero (with `fromPesos size="display"`).
- `ReceiptHero`, `ReceiptHeroDivider`, `ReceiptHeroMeta` from `components/ui/ReceiptHero.tsx` — composed inside `InventoryHero`.
- `StatusPill` from `components/ui/StatusPill.tsx` — used in `InventoryRow`.
- `Skeleton` from `components/ui/Skeleton.tsx` — used in `InventorySkeleton`.
- `ITEMS_PER_PAGE`, `LOW_STOCK_THRESHOLD` from `constants/stocks.ts` — already correct, the screen just stops redeclaring.
- `MotiView` (already in deps via Sales tab) — staggered row animations.

---

## Section 3 — UI rules

### Z1 — Sticky cinnamon header band

- Background: `bg-cinnamon-500` (#623418). Padding: `px-5 pt-3 pb-6`.
- Monogram dot: 32×32 rounded-full, `bg-persimmon-500`, contains `₱` glyph in `text-paper-50 text-sm` (`StackSansText-Bold`). Followed by eyebrow label `"Stock Ledger"` in `label-caps text-paper-200 opacity-80` (10px, 0.14em tracking, semibold).
- Title: `"Inventory"` in `text-h1 text-paper-50` (28px extrabold).
- Subtitle: dynamic `"X products • Y low stock"` in `text-sm text-paper-200 opacity-90`.
- Right side: two 44×44 circular buttons in a row with `gap-2`. First: `question-circle` icon (paper-50/15 background), opens the guide modal via `onOpenGuide`. Second: `sliders` icon (paper-50/15 background), opens the filter modal via `onOpenFilter`. When the low-stock filter is active, a 20×20 persimmon dot in the top-right of the sliders button with count `1`.

### Z2 — Stock Overview hero (uses `ReceiptHero` with `tone="persimmon"`)

- Visible only when `products.length > 0`.
- "OFFICIAL LEDGER" header + perforations come from the component.
- `ReceiptHeroDivider label="Stock Overview" tone="persimmon"`.
- Total stock **value** as the hero number: `MoneyText` with `size="display" fromPesos`. This is the headline — peso-value of stock on the shelves. Computed as `sum(price_i * quantity_i)` in integer centavos to keep the integer-centavos guardrail.
- `ReceiptHeroMeta` block with three rows: `Total Products`, `Items in Stock` (sum of quantities), `Low / Out of Stock` (e.g. `"3 / 1"`). Right-aligned values in `text-mono text-ink-700` with dashed border-dividers between rows.
- Card sits in `px-4 -mt-2 mb-4` to overlap the header slightly (matches Sales tab).

### Z3 — Product list rows

- Each row: `bg-paper-50 mx-4 mb-3 rounded-2xl p-4 border border-ink-100 shadow-paper`.
- Top row: `flex-row justify-between items-start`. Left: name in `text-base font-semibold text-ink-900`, then SKU in `text-xs text-ink-500`. Right: stock number + `StatusPill` (`variant="danger"` for out-of-stock, `variant="warning"` for low, hidden when healthy).
- Middle: 2-column mini-stats grid for `Price` and `Stock`, each with `text-xs text-ink-500 label-caps` caption and bold value. Price uses `MoneyText fromPesos size="lg"`. Stock uses `text-ink-900` normally, `text-semantic-danger` when zero.
- Bottom-right: 48×48 circular persimmon `+` button (`bg-persimmon-500`, `shadow-persimmon-glow`), opens the restock modal.
- Rows animate in with `MotiView`: `from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400, delay: 200 + (index % 5) * 50 }}`. Exact same pattern as `renderSaleItem` in `app/(tabs)/sales/index.tsx`.

### Z4 — Bottom action area

- `InventoryActionModal` — `KeyboardAwareScrollView` + `bg-white rounded-t-2xl p-6 shadow-xl` shape, pulled out to its own file. Two product-context lines (current stock, price) and quantity input stay as-is. `Confirm` button: `bg-persimmon-500` (only the restock path is wired — no secondary "Record Sale" button).
- No screen-level FAB. The row's own `+` button is the primary action. "Add Product" stays accessible via the Z1 header's `+` button (kept from the current screen) and via the empty-state CTA.

### Empty state

- Centered `FontAwesome 'inbox'` at 78px in `text-persimmon-500`.
- Title: `"No products yet"` in `text-xl font-extrabold text-ink-900`.
- Body: `"Add your first product to get started"` in `text-sm text-ink-500`.
- CTA: persimmon pill button `Add Product` routing to `/(edit-forms)/add-product`.
- Wrapped in `px-6 pt-24` to sit visually balanced under the header.

### Loading state

- 4 stacked skeleton cards in the same `mx-4 mb-3 p-4` shape as the real rows, using the existing `Skeleton` component.
- Renders inside the `FlatList`'s `ListEmptyComponent` branch when `isLoading || isRefetching`. Replaces the single centered `ActivityIndicator`.

### Motion summary

- Header: `MotiView` 320ms opacity fade-in.
- Hero: `MotiView` 480ms translateY-18 → 0 + opacity, 80ms delay.
- Rows: 200ms base delay + 50ms × (index % 5) stagger — exact same pattern as Sales tab.

### Refresh

- `RefreshControl` with `tintColor="#E85A1F"`. The current screen doesn't have pull-to-refresh; this is a tiny UX win from the redesign — same pattern Sales already uses.

### Out of scope (per "visual polish only" + YAGNI)

- No new filter dimensions (no "expiring soon", no "by category" jump).
- No drag-to-reorder.
- No bulk actions / multi-select.
- No animated stock bar / progress visualization (nice-to-have, deferred).
- No dark mode toggle.
- No new icons, no icon-family swap.
- No refactor of sibling screens — `app/(tabs)/products/index.tsx` still uses its older layout; that's a follow-up.

---

## Section 4 — Verification

### Pre-implementation

- Snapshot the current Inventory screen on iOS and Android simulators. Save in `docs/superpowers/specs/2026-06-21-inventory-screen-redesign/before/`.

### Implementation order

A single PR, executed top-to-bottom in one session:

1. Create `components/inventory/` and the seven new component files. Each is a small focused file matching existing conventions in `components/sales/` and `components/credits/`.
2. Rewrite `app/(tabs)/index.tsx` to compose the new components. Shrink the screen to ~250 lines.
3. Manual smoke test the acceptance checklist.

### Acceptance tests

1. `npx tsc --noEmit` — zero type errors.
2. `npx expo lint` — zero new warnings.
3. `npx expo start` then walk:
   - With zero products: header visible, hero hidden, skeleton → empty state with "Add Product" CTA that routes correctly.
   - After adding 2 products: header + hero + 2 cards with correct prices, stock values, and a `StatusPill` only if any is low/out.
   - Tap a row's `+` button: action modal slides up with product context, accepts a quantity, persists.
   - Toggle the low-stock filter via the Z1 sliders button: list narrows to low items only.
   - Pull to refresh: hero numbers + list update.
   - Airplane mode on: all of the above still works (offline rule preserved — no new network calls).
4. Visual check: the Inventory tab now reads as a sibling of the Sales tab — same cinnamon band, same ReceiptHero metaphor, same paper-card list, same staggered motion.
5. Layering rule: no `app/` file imports from `db/` directly.
6. Money rule: no `number` math with decimals for money in the screen; the hero total is computed in integer centavos.

### Risks & mitigations

- **Moti re-renders on scroll.** Mitigation: the stagger is keyed on `index % 5` so re-renders don't re-animate every row from scratch — same trick Sales uses.
- **`Text` component crash from raw strings.** Mitigation: every text node in the new components is wrapped in `StyledText`, matching the `ReceiptHero` docstring warning.
- **Padding/redesign regresses tap targets.** Mitigation: the row's `+` button is 48×48 (above the iOS 44pt minimum), the Z1 sliders button is 44×44 (at the minimum), and the action modal's `Confirm` button is full-width and tall.
- **Skeletons don't match final card shape.** Mitigation: same outer container (`mx-4 mb-3 p-4`) and `Skeleton` widths chosen to mimic the real layout (full-width header, half-width stats, single short bar for the action).

### How to run / verify locally

```bash
# 1. Type-check
npx tsc --noEmit

# 2. Lint
npx expo lint

# 3. Manual smoke
npx expo start

# 4. Layering rule check
grep -rE "from '@/db|from '@/db/." app/ | wc -l   # expect 0

# 5. Money rule check
grep -rE "toFixed\(2\)" app/\(tabs\)/index.tsx | wc -l   # expect 0
```

---

## Critical files

**Modified:**

- `app/(tabs)/index.tsx` — single screen rewrite, ~670 → ~250 lines. Composes the new components. All hook logic, memo logic, and modal state stays here.

**Created (all under `components/inventory/`):**

- `components/inventory/InventoryHeader.tsx` — cinnamon header band
- `components/inventory/InventoryHero.tsx` — `ReceiptHero` composer with stock stats
- `components/inventory/InventoryRow.tsx` — product card with `StatusPill` + restock button
- `components/inventory/InventoryEmptyState.tsx` — empty list state with CTA
- `components/inventory/InventorySkeleton.tsx` — 4-card loading placeholder
- `components/inventory/InventoryActionModal.tsx` — restock bottom sheet
- `components/inventory/GuideModal.tsx` — guide modal (extracted from current inline)

**Untouched:** every other file in the repo — including `db/`, `hooks/`, `stores/`, `constants/`, `configs/`, `lib/`, `types/`, `tailwind.config.js`, `global.css`, `app.json`, all other tab screens, all edit-form screens, all other components.

---

## Reusable functions and patterns

- `ReceiptHero`, `ReceiptHeroDivider`, `ReceiptHeroMeta` in `components/ui/ReceiptHero.tsx` — directly composed inside `InventoryHero`. No new wrapper needed.
- `MoneyText` in `components/ui/MoneyText.tsx` — used in the hero with `size="display" fromPesos`.
- `StatusPill` in `components/ui/StatusPill.tsx` — `variant="danger"` and `variant="warning"` for stock alerts.
- `Skeleton` in `components/ui/Skeleton.tsx` — used by `InventorySkeleton`.
- `getStockStatus` in `utils/formatters.ts` — already maps quantity to label/color. `InventoryRow` consumes it.
- `GUIDE_TIPS` in `constants/guide.ts` — already exists; `GuideModal` consumes it.
- `ITEMS_PER_PAGE`, `LOW_STOCK_THRESHOLD` in `constants/stocks.ts` — already correct. The screen stops redeclaring `LOW_STOCK_THRESHOLD` locally (matches the rebrand spec's Tier 4 cleanup, which flagged this exact line).
- `MotiView` staggered row animation in `app/(tabs)/sales/index.tsx:163-181` — copy the pattern verbatim into the Inventory screen's `renderItem`.
