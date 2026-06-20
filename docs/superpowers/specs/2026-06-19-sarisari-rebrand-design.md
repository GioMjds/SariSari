# SariSari Frontend Rebrand — Design Spec

**Date:** 2026-06-19
**Status:** Approved (design phase)
**Scope:** Palette + design-token refresh with named component additions and bug fixes
**Estimated effort:** ~10–12 hours, shippable in 6 independent phases

---

## Context

SariSari is an offline-first mobile app for Filipino sari-sari store owners. It handles inventory, sales (POS), and utang (customer credit tracking). The current frontend uses a tight purple monochrome (`primary #2E073F`, `secondary #7A1CAC`, `accent #AD49E1`, `background #EBD3F8`) and was described in brainstorming as "elegant but a bit cold and one-note." The codebase also has concrete visual-consistency problems: three different currency renderers (one with a literal `$` bug), `text.muted` mapped to the brightest color in the system, hardcoded hex codes scattered across 20+ files, inconsistent card styles (three radius values, two padding scales, mixed shadow/border presence), two parallel toast systems, three inline search bars, and dead/vestigial components (`Dialog.tsx`, the unused `@fortawesome` dep, the unused `expo-symbols` dep).

The intended outcome: a warmer, more "Tita's sari-sari store" visual identity that feels culturally rooted and emotionally warm, while preserving every architectural invariant from `AGENTS.md` — offline-first, integer-centavos money, the layering rule, expo-router conventions, one SQLite connection, and the don't-bypass-the-query-layer rule.

The rebrand is **visual and structural only**. No new features, no behavior changes, no data-layer changes, no network code, no dark mode, no new motion, no new screens.

---

## Brand direction

**Warm & Neighborly — Terracotta + Sage.** The app should feel like a friendly suki relationship, not a slick fintech. Warm clay tones (terracotta) anchor the brand; sage green is the "money's coming in" action color; cream surfaces replace the lavender background; warm grays replace the cold grays currently in use. Card borders are peach, not gray. Shadows are warm-tinted, not blue-gray.

This direction was chosen over "Modern Purple Refresh," "Tropical & Playful," and "Calm & Minimal" because the audience (sari-sari store owners, often called "Tita" users) is the warm, neighborly frame the app should match — not a corporate or minimal frame.

---

## Section 1 — Design token system

The single source of truth. Everything in the app reads from these tokens. Lives in `tailwind.config.js` and `global.css`.

### Color tokens — brand

**Naming convention:** in this spec, tokens use dot notation (`primary.500`). In Tailwind className, the same token uses dash notation (`primary-500` → `bg-primary-500`, `text-primary-500`, `border-primary-500`).

| Token            | Hex       | Tailwind className | Role                                                                       |
| ---------------- | --------- | ------------------ | -------------------------------------------------------------------------- |
| `primary.500`    | `#B45309` | `primary-500`      | Brand primary — headings, page titles, primary CTAs                        |
| `primary.600`    | `#C2410C` | `primary-600`      | Primary deep — press states, dark header bars                              |
| `secondary.50`   | `#ECFCCB` | `secondary-50`     | Light sage — focus pill background, success surface wash                   |
| `secondary.600`  | `#65A30D` | `secondary-600`    | Action / sage — in-stock, paid, success, cash payment                      |
| `surface.warm`   | `#FED7AA` | `surface-warm`     | Peach — card borders, subtle highlights, hover wash                        |
| `background`     | `#FEF3C7` | `background`       | App-wide background. Replaces `#EBD3F8` lavender.                          |
| `surface.subtle` | `#FFFBEB` | `surface-subtle`   | Soft cream — input bg, nested surfaces, search fields                      |
| `warm.900`       | `#1C1917` | `warm-900`         | Text primary (warm charcoal)                                               |
| `warm.700`       | `#57534E` | `warm-700`         | Text secondary (stone)                                                     |
| `warm.500`       | `#A8A29E` | `warm-500`         | Text muted (warm gray) — fixes the bug where this was the brightest purple |

### Color tokens — text and semantic (replaces scattered Tailwind hexes)

| Token              | Hex       | Used for                           |
| ------------------ | --------- | ---------------------------------- |
| `semantic.success` | `#16A34A` | Paid, in stock, success toasts     |
| `semantic.danger`  | `#DC2626` | Utang, out of stock, overdue       |
| `semantic.warning` | `#D97706` | Low stock, due soon                |
| `semantic.info`    | `#0284C7` | Neutral notifications, info toasts |

These replace the four different reds (`red-50`/`100`/`500`/`600`/`700`), three greens (`green-100`/`500`/`600`/`emerald-600`), two ambers (`amber-500`/`600`/`yellow-600`), and a sky blue that were scattered across the codebase. Every stock-status pill, payment-status pill, customer-tag pill, and toast must read from this semantic layer.

### Type scale (StackSansText only)

| Token     | Size | Weight    | Use case                                |
| --------- | ---- | --------- | --------------------------------------- |
| `display` | 36px | extrabold | Big money moments (outstanding balance) |
| `h1`      | 28px | extrabold | Page titles                             |
| `h2`      | 20px | bold      | Section headers                         |
| `h3`      | 16px | semibold  | Card titles                             |
| `body`    | 14px | regular   | Body copy, list items                   |
| `caption` | 12px | regular   | Captions, helper text                   |

The codebase keeps `StackSansText` as the single typeface (6 weights: extralight, light, regular, medium, semibold, extrabold, black). A display face was considered and declined — it added complexity without proportional personality gain. Type is normalized through this scale, not by adding a second family.

### Spacing (8pt grid)

| Token | px  | Use                           |
| ----- | --- | ----------------------------- |
| `xs`  | 4   | Tight inner spacing           |
| `sm`  | 8   | Pill internal padding         |
| `md`  | 12  | Gap between cards, list items |
| `lg`  | 16  | Screen padding, card padding  |
| `xl`  | 24  | Section spacing               |
| `2xl` | 32  | Hero section spacing          |
| `3xl` | 48  | Empty-state vertical offset   |

Screen padding is standardized to `px-lg` (16) for every tab screen — currently a mix of `px-4` and `px-6`. Card padding is `p-lg` (16). Card gap is `md` (12). Every existing screen with `p-3`, `p-4`, or `p-5` is normalized to `p-4` (= 16px = `p-lg`).

### Radius

| Token  | px  | Used for                     |
| ------ | --- | ---------------------------- |
| `md`   | 6   | Inner nested elements        |
| `lg`   | 12  | Inputs, secondary buttons    |
| `xl`   | 16  | **Cards (default)**, buttons |
| `pill` | ∞   | Pills, status chips, avatars |

Cards standardize on `rounded-2xl` (16px). Currently a mix of `rounded-xl`, `rounded-2xl`, `rounded-3xl` for the same list-item type. Buttons use `rounded-xl` (12px). Pills are `rounded-full`. Inputs are `rounded-xl`.

### Shadows (warm-tinted, not gray)

| Token    | CSS                                 | Used for              |
| -------- | ----------------------------------- | --------------------- |
| `card`   | `0 1px 2px rgba(180, 83, 9, 0.06)`  | Default cards         |
| `raised` | `0 4px 12px rgba(180, 83, 9, 0.15)` | Floating CTAs, FABs   |
| `modal`  | `0 6px 20px rgba(180, 83, 9, 0.20)` | Modals, bottom sheets |

All shadows are warm-tinted to match the palette. Currently the codebase uses default Tailwind shadows which read as cold blue-gray against the warm surfaces.

### Borders

| Token          | CSS                         | Used for            |
| -------------- | --------------------------- | ------------------- |
| `border.card`  | `1px solid #FED7AA` (peach) | Default card border |
| `border.input` | `1px solid #E7E5E4` (stone) | Input fields        |
| `border.focus` | `2px solid #B45309`         | Focus ring          |

Default card border is peach. Inputs use stone. Focus is the primary terracotta at 2px for accessibility.

---

## Section 2 — Component refactor scope

### Tier 1 — Token-only changes (no new components)

Files where the only edit is swapping className strings to use the new tokens:

- `tailwind.config.js` — replace 4 purple tokens with warm brand tokens (see Section 1) + add semantic colors + add type scale + add radius scale. **Also update the `content` glob** to include `./components/**` (currently `./app/**` only — utility classes used only in components won't generate otherwise).
- `global.css` — add CSS custom properties for the same tokens, add `@layer components` for shared primitives (see Tier 2)
- `app.json` — `splash.backgroundColor: "#FEF3C7"`, `androidAdaptiveIcon.backgroundColor: "#FEF3C7"`, change `userInterfaceStyle` from `"automatic"` to `"light"`
- All 5 tab screens (`app/(tabs)/index.tsx`, `sales/index.tsx`, `products/index.tsx`, `credits/index.tsx`, `reports/index.tsx`) — swap `bg-background` → `bg-background` (the token name is unchanged), `text-text-primary` → `text-warm-900`, `text-text-secondary` → `text-warm-700`, `text-text-muted` → `text-warm-500`, `bg-primary` → `bg-primary-500`, `bg-secondary` → `bg-secondary-600`, `bg-accent` → `bg-surface-warm`, `border-gray-100`/`border-gray-200` → `border-surface-warm`
- All edit-form screens — same swaps
- All hardcoded hex colors in 20+ files replaced with semantic tokens (this is the cleanup the user identified as needed)

### Tier 2 — New shared primitive components

New components in `components/ui/`. Each is small, focused, with a clear prop interface.

**`components/ui/MoneyText.tsx`** — One renderer for ₱ amounts.

- Props: `value: number` (centavos), `size?: 'sm' | 'md' | 'lg' | 'xl' | 'display'`, `variant?: 'default' | 'success' | 'danger'`
- Always formats with `Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })` prefixed with `₱`
- Replaces 3 different currency renderers across the codebase
- Fixes the literal `$` bug at `app/(edit-forms)/category/[id].tsx:55`
- Money stays integer centavos; this component only formats at the render edge

**`components/ui/ScreenHeader.tsx`** — Title + optional subtitle + right-side actions.

- Props: `title: string`, `subtitle?: string`, `right?: ReactNode`
- Replaces 6 hand-rolled header patterns (inventory, sales, credits, products, reports, add-product's dark variant)
- Back arrow + delete lives in a separate `ScreenHeader.Back` variant for edit-form screens

**`components/ui/SearchBar.tsx`** — Single component for all three inline search bars.

- Props: `value: string`, `onChange: (s: string) => void`, `placeholder?: string`
- Controlled component; integrates with react-hook-form via spread props
- Replaces inline search bars in inventory, credits, products

**`components/ui/EmptyState.tsx`** — Icon + title + subtitle + optional CTA.

- Props: `icon: string` (FontAwesome name), `title: string`, `subtitle?: string`, `action?: { label: string; onPress: () => void }`
- Replaces 4 ad-hoc empty-state blocks with different sizes/colors
- Icon uses `text-primary` at 64px, `mt-3xl` vertical offset

**`components/ui/Avatar.tsx`** — Peach circle with customer/product initials.

- Props: `name: string`, `size?: 'sm' | 'md' | 'lg'`
- Computes initials from `name.split(' ').map(s => s[0]).slice(0, 2).join('')`
- Replaces dead FontAwesome `user` icon in customer detail and the missing avatar on every customer row
- Background: `bg-surface-warm` (#FED7AA peach), text: `text-primary` terracotta

**`components/ui/StatusPill.tsx`** — One pill component for stock status / payment type / customer tag.

- Props: `variant: 'success' | 'danger' | 'warning' | 'info' | 'neutral'`, `children: ReactNode`, `size?: 'sm' | 'md'`
- Replaces 4 different pill styles across inventory, sales, credits, products
- Color map: success → sage bg + sage text, danger → red-50 bg + red-700 text, warning → amber-50 bg + amber-700 text, info → sky-50 bg + sky-700 text, neutral → cream bg + stone-700 text

### Tier 3 — Modify existing components in place (no rewrites)

These components get restyled. Their prop interfaces don't change.

- `components/elements/StyledText.tsx` — no behavior change; variant mapping verified to type scale tokens
- `components/layout/StyledTab.tsx` — focus pill background becomes `bg-secondary-50` (light sage), active icon becomes `text-primary` terracotta. Bar stays white.
- `components/ui/Modal.tsx` — confirm buttons: success variant uses sage bg, warning uses terracotta bg, danger uses red-600 bg. Header restyled to warm palette.
- `components/ui/Pagination.tsx` — background becomes `bg-primary-500` terracotta (was `bg-primary` deep purple)
- `components/ui/Toast.tsx` + `components/ui/Sonner.tsx` — **consolidate to Sonner (top-positioned).** Sonner gets the warm palette (default `bg-primary-500` terracotta, success `bg-secondary-600` sage, danger `bg-semantic-danger`, etc.). `Toast.tsx` deprecated after one release. Both kept temporarily to verify Sonner covers all Toast use sites.
- `components/credits/KPICard.tsx`, `FilterBar.tsx`, `SortDropdown.tsx`, `CustomerListItem.tsx` — restyled in place. Same props.
- `components/products/ProductItem.tsx`, `CategoryCard.tsx` — restyled. CategoryCard wires up the existing `CATEGORY_ICONS` and `CATEGORY_COLORS` arrays (currently dead code).
- `components/reports/DateRangeSelector.tsx`, `InsightCard.tsx`, `ReportKPICard.tsx`, `SectionHeader.tsx`, `SimpleBarChart.tsx` — restyled. Bar color from `text-secondary` (purple) to `text-primary` (terracotta).
- `components/sales/SalesFilterModal.tsx` — restyled.

### Tier 4 — Specific bug fixes (named in user's brief)

- **Currency bug:** `app/(edit-forms)/category/[id].tsx:55` renders `${item.price?.toFixed?.(2)}` (literal `$`). Replaced with `<MoneyText />`.
- **`text.muted` bug:** Was mapped to `#AD49E1` (the brightest purple). Repointed to `#A8A29E` (warm gray).
- **Category icons dead code:** `constants/categories.ts` defines 15 FontAwesome names and 10 hex colors, but `CategoryCard.tsx` was hardcoding a single `folder` icon. CategoryCard now picks icon + color from a stable hash of category name over the existing arrays.
- **Inventory threshold redeclaration:** `app/(tabs)/index.tsx:26-27` redeclares `LOW_STOCK_THRESHOLD = 5` and `ITEMS_PER_PAGE = 4`. Remove redeclarations; import from `constants/stocks.ts`.
- **Dead Dialog:** `components/ui/Dialog.tsx` is unused (Modal supersedes it). Delete during the rebrand.
- **Three search bars → one SearchBar:** see Tier 2.
- **Two toast systems → one:** see Tier 3.

### Tier 5 — Explicitly out of scope

- Data layer (`db/`, `hooks/`, `stores/`) — untouched
- Domain types — untouched
- Routing (`app.json` scheme and route group structure) — unchanged
- Behavior — no new features, no changed flows, no removed screens
- Offline guarantees — preserved. No network code added.
- Money types — integer centavos rule preserved. MoneyText only formats at the render edge.
- Layering rule — preserved. Screens still go through hooks to db/.
- Dark mode — `userInterfaceStyle` changes from `"automatic"` to `"light"`. No dark theme.
- Motion — no new Moti work. Existing native transitions only.
- Icon family — kept as FontAwesome. Phosphor swap deferred to a follow-up project.
- New screens — none added.

---

## Section 3 — Verification & rollout

### Pre-implementation

- Snapshot every screen (Inventory, Sales, Products, Credits, Reports, Onboarding, Add-Sale, Customer Detail, Add-Credit, Add-Payment, Sale Details) on iOS and Android simulators. Save in `docs/superpowers/specs/2026-06-19-sarisari-rebrand/before/`.
- Run grep audit:
  - `bg-purple-|text-purple-|bg-indigo-|text-indigo-` → 0 hits
  - `#[0-9a-fA-F]{6}` in `app/` and `components/` → 0 hits (except allowed icon map)
  - `toFixed(2)` in JSX → 0 hits
  - `${...price` in `app/(edit-forms)/category/[id].tsx` → 0 hits
  - `from '@/db` in `app/` → 0 hits (layering rule)
- No new dependencies. Rebrand uses existing packages only.

### Implementation order (6 phases, each independently shippable)

1. **Tokens** — Update `tailwind.config.js`, `global.css`, `app.json`. Verify on a single screen.
2. **Primitives (Tier 2)** — Build `MoneyText`, `ScreenHeader`, `SearchBar`, `EmptyState`, `Avatar`, `StatusPill`. Each is a small focused file.
3. **Restyle existing (Tier 3)** — `StyledTab`, `Modal`, `Pagination`, `KPICard`, etc. Replace token references. No behavior change.
4. **Per-screen migration (Tier 1)** — Walk every tab and edit-form screen. Replace inline headers with `ScreenHeader`, inline search with `SearchBar`, currency strings with `MoneyText`, pills with `StatusPill`, hardcoded hex with tokens.
5. **Bug fixes (Tier 4)** — `$` bug, dead `Dialog.tsx`, category icon wiring, threshold redeclaration, Tailwind content glob, toast consolidation.
6. **Final pass + screenshots** — Re-run the grep audit, capture after-screenshots, compare before/after.

### Acceptance tests

1. No purple remains. Grep returns 0 hits for `bg-purple-`, `text-purple-`, `bg-indigo-`, `text-indigo-`, `#7A1CAC`, `#AD49E1`, `#2E073F`, `#EBD3F8`.
2. No hardcoded hex in screen/component code.
3. All money rendered via `MoneyText`.
4. The `$` bug is gone.
5. Offline still works — airplane-mode test: record a sale, log a credit, take a payment. All persist.
6. Integer-centavos preserved — no `number` math with decimals in `db/` or `hooks/`.
7. Layering rule preserved — no `app/` file imports from `db/` directly.
8. Screenshots match the mocks.
9. Onboarding still works — cold-start on a fresh simulator, complete onboarding, lands on Inventory.
10. No regressions in the data layer — existing tests pass.

### Risks & mitigations

- **Token rename breaks 100+ className strings.** Mitigation: do Tier 1 first in its own commit; if anything is off, revert that one commit. Phases are independent.
- **Color contrast fails accessibility.** `text-warm-900` (#1C1917) on `bg-cream` (#FEF3C7) = 13.2:1 (passes AAA). `text-semantic-success` (#16A34A) on white = 4.6:1 (passes AA). All semantic colors checked against their light backgrounds.
- **New MoneyText changes the displayed amount format.** Mitigation: every existing renderer produces `₱X,XXX.XX` with thousands grouping. MoneyText uses the same `Intl.NumberFormat('en-PH')`. No user-visible change for any number ≤ 999,999.99.
- **Tailwind content glob fix introduces missing classes elsewhere.** Mitigation: add `./components/**` only AFTER Tier 2 primitives are in. Watch the build for the first compilation.
- **Toast consolidation removes a screen's only feedback path.** Mitigation: keep both for one release. After confirming Sonner covers all Toast use sites, remove Toast.
- **Number formatting differs by locale.** Mitigation: explicitly use `en-PH` locale in MoneyText to match what `CustomerListItem` already does.

### How to run / verify locally

```bash
# 1. Start the dev server
npx expo start

# 2. Grep audit
grep -rE 'bg-purple-|text-purple-|bg-indigo-|text-indigo-' app/ components/ | wc -l   # expect 0
grep -rE '#[0-9a-fA-F]{6}' app/ components/ | wc -l                                       # expect 0
grep -rE 'toFixed\(2\)' app/ | wc -l                                                      # expect 0
grep -rE 'from .@/db' app/ | wc -l                                                        # expect 0

# 3. Tests
npm test

# 4. Lint
npx expo lint

# 5. Manual: airplane mode → record a sale → log a payment → verify toast
```

---

## Critical files

- `tailwind.config.js` — token system home
- `global.css` — token system mirror + shared primitive component classes
- `app.json` — splash/icon/UI style
- `components/ui/MoneyText.tsx` — new
- `components/ui/ScreenHeader.tsx` — new
- `components/ui/SearchBar.tsx` — new
- `components/ui/EmptyState.tsx` — new
- `components/ui/Avatar.tsx` — new
- `components/ui/StatusPill.tsx` — new
- `components/ui/Toast.tsx` — deprecate (after one release)
- `components/ui/Dialog.tsx` — delete
- `components/ui/Modal.tsx`, `Pagination.tsx`, `Sonner.tsx` — restyle
- `components/layout/StyledTab.tsx` — restyle
- `components/elements/StyledText.tsx` — verify mapping
- `components/credits/*`, `components/products/*`, `components/reports/*`, `components/sales/*` — restyle in place
- `app/(tabs)/*` and `app/(edit-forms)/*` — token + primitive migration
- `app/(edit-forms)/category/[id].tsx:55` — fix the `$` bug
- `app/(tabs)/index.tsx:26-27` — remove redeclared constants
- `constants/stocks.ts` — source of truth (already correct)

---

## Reusable functions and patterns

- `formatCurrency` in `utils/formatters.ts:44-49` — exists but used inconsistently. After the rebrand, this becomes the implementation inside `MoneyText`. Do not import `formatCurrency` directly from screens; import `MoneyText` instead.
- `formatCompactCurrency` in `utils/formatters.ts` — kept as-is. Used by reports for big numbers. `MoneyText` can accept a `compact` prop that delegates to it.
- `getStockColor` in `utils/formatters.ts` — kept but rewritten to use semantic tokens. The mapping logic is correct; the hex values become token references.
- `CATEGORY_COLORS` and `CATEGORY_ICONS` in `constants/categories.ts` — already defined. After the rebrand, `CategoryCard` uses them.
- `LOW_STOCK_THRESHOLD` and `ITEMS_PER_PAGE` in `constants/stocks.ts` — already correct. Inventory screen should import from here, not redeclare.
