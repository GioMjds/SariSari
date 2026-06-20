# SariSari Rebrand — Implementation Plan

**Date:** 2026-06-19
**Source spec:** `docs/superpowers/specs/2026-06-19-sarisari-rebrand-design.md`
**Estimated effort:** ~10–12 hours
**Phases:** 6 (each independently shippable and revertable)

---

## How to use this plan

- Each phase is a separate commit. Stop after any phase and the app still works.
- Run the grep audit and screenshot test at the end of every phase.
- Re-read the spec section relevant to the phase before starting.

---

## Phase 1 — Tokens (foundation) — 30 min

**Goal:** Add the new design tokens to `tailwind.config.js`, mirror them in `global.css`, update `app.json`. Verify on one screen that the new palette renders correctly.

**Step 1.1 — `tailwind.config.js`**

Replace the existing `theme.extend.colors` with the new token system per spec Section 1. Map the old names to the new ones explicitly so the diff is reviewable.

Add to `theme.extend`:

- `colors`: `primary` (50/100/500/600/700 = terracotta scale), `secondary` (50/100/500/600/700 = sage scale), `surface.warm` (#FED7AA), `background` (#FEF3C7), `surface.subtle` (#FFFBEB), `warm` (100/300/500/700/900 = warm gray scale), `semantic` (success #16A34A, danger #DC2626, warning #D97706, info #0284C7)
- `borderRadius`: `md: 6`, `lg: 12`, `xl: 16` (already native), `pill: 9999`, `card: 16`
- `boxShadow`: `card: '0 1px 2px rgba(180, 83, 9, 0.06)'`, `raised: '0 4px 12px rgba(180, 83, 9, 0.15)'`, `modal: '0 6px 20px rgba(180, 83, 9, 0.20)'`
- `fontSize`: `display: ['36px', { lineHeight: '1.1', fontWeight: '800' }]`, `h1: ['28px', ...]`, `h2: ['20px', ...]`, etc.

**Also update** the `content` glob: add `'./components/**/*.{js,jsx,ts,tsx}'`.

**Step 1.2 — `global.css`**

Add `:root` CSS custom properties mirroring every token:

```css
:root {
  --color-primary-500: #b45309;
  --color-primary-600: #c2410c;
  --color-secondary-50: #ecfccb;
  --color-secondary-600: #65a30d;
  --color-surface-warm: #fed7aa;
  --color-background: #fef3c7;
  --color-surface-subtle: #fffbeb;
  --color-warm-900: #1c1917;
  --color-warm-700: #57534e;
  --color-warm-500: #a8a29e;
  --color-success: #16a34a;
  --color-danger: #dc2626;
  --color-warning: #d97706;
  --color-info: #0284c7;
}
```

**Step 1.3 — `app.json`**

- `splash.backgroundColor`: `"#FEF3C7"`
- `androidAdaptiveIcon.backgroundColor`: `"#FEF3C7"`
- `userInterfaceStyle`: `"light"` (was `"automatic"`)
- `experiments.typedRoutes`: leave unchanged

**Step 1.4 — Verify**

Start the dev server. Take a screenshot of the Inventory screen. The background will still be lavender (the old `bg-background`) because no screen has been migrated yet, but the splash screen should now show cream. This confirms tokens are wired.

**Commit:** `chore(rebrand): add warm terracotta+sage design tokens`

---

## Phase 2 — New shared primitives — 2–3 hours

**Goal:** Build the 6 new components in `components/ui/`. Each is a small focused file with a typed prop interface. After this phase, primitives exist but are not yet used by screens.

**Order matters — build bottom-up so each can be used in the next:**

**Step 2.1 — `components/ui/MoneyText.tsx`**

```ts
type MoneyTextProps = {
  value: number; // integer centavos
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'display';
  variant?: 'default' | 'success' | 'danger';
  compact?: boolean; // delegates to formatCompactCurrency
};
```

Implementation:

- If `compact`, call `formatCompactCurrency(value)` from `utils/formatters.ts`
- Else: `₱${new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value / 100)}`
- Map `size` to className: sm → text-sm, md → text-base, lg → text-lg, xl → text-xl, display → text-display
- Map `variant` to className: default → text-warm-900, success → text-success, danger → text-danger
- Export as both default and named.

**Step 2.2 — `components/ui/StatusPill.tsx`**

```ts
type StatusPillProps = {
  variant: 'success' | 'danger' | 'warning' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  children: React.ReactNode;
};
```

Color map (per spec):

- success → bg-secondary-50, text-secondary-600, border-secondary-600
- danger → bg-red-50, text-red-700, border-red-200
- warning → bg-amber-50, text-amber-700, border-amber-200
- info → bg-sky-50, text-sky-700, border-sky-200
- neutral → bg-warm-100, text-warm-700, border-warm-300

All variants: rounded-pill, border, font-medium, padding based on size.

**Step 2.3 — `components/ui/Avatar.tsx`**

```ts
type AvatarProps = {
  name: string;
  size?: 'sm' | 'md' | 'lg';
};
```

Implementation:

- `const initials = name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();`
- Map size to dimensions: sm → 32px, md → 44px, lg → 52px
- Style: rounded-full, bg-surface-warm, text-primary-500, font-extrabold, items-center, justify-center

**Step 2.4 — `components/ui/SearchBar.tsx`**

```ts
type SearchBarProps = {
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
};
```

Implementation:

- Wrapper around TextInput with a left search icon (FontAwesome `search`) and a right clear button (only when value non-empty)
- Style: bg-surface-subtle, border border-warm-100, rounded-xl, px-4 py-3 pl-11, text-warm-900, placeholder-warm-500
- Spreads extra props to TextInput so it can be wrapped by react-hook-form's Controller

**Step 2.5 — `components/ui/EmptyState.tsx`**

```ts
type EmptyStateProps = {
  icon: string; // FontAwesome name
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
};
```

Implementation:

- Centered column: icon at 64px text-primary-500 with opacity-30, title at h2 weight-bold text-warm-900, subtitle at body text-warm-700, optional CTA at bottom (bg-primary-500 text-white rounded-xl px-4 py-2)
- Vertical offset: mt-3xl

**Step 2.6 — `components/ui/ScreenHeader.tsx`**

```ts
type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  variant?: 'default' | 'dark'; // default = light bg, dark = bg-primary-600
};
```

Implementation:

- Title: h1 extrabold, color based on variant (default → text-warm-900, dark → text-white)
- Subtitle: body, color text-warm-700 (default) or text-white opacity-80 (dark)
- Right slot: flexbox row of children
- Padding: px-4 pt-4 pb-2 for default, px-4 pt-4 pb-4 for dark
- Background: transparent for default, bg-primary-600 for dark

**Step 2.7 — Verify**

Create a temporary `__demo` screen in `app/` that imports and renders all 6 primitives. Take a screenshot. Delete the demo file.

**Commit:** `feat(ui): add MoneyText, StatusPill, Avatar, SearchBar, EmptyState, ScreenHeader primitives`

---

## Phase 3 — Restyle existing components — 2 hours

**Goal:** Restyle every existing component in `components/` to use the new tokens. **No behavior or prop interface changes.** This means `StyledTab`, `Modal`, `Pagination`, `Sonner`, `Toast`, `KPICard`, `InsightCard`, `ReportKPICard`, `SectionHeader`, `CustomerListItem`, `ProductItem`, `CategoryCard`, `FilterBar`, `SortDropdown`, `DateRangeSelector`, `SimpleBarChart`, `SalesFilterModal`, `StyledText`.

**For each component, the changes are mechanical:**

- `bg-primary` (deep purple) → `bg-primary-500` or `bg-primary-600`
- `bg-secondary` (rich purple) → `bg-secondary-600`
- `bg-accent` (bright purple) → `bg-surface-warm` (peach) for backgrounds, or `bg-secondary-600` for action CTAs
- `bg-background` (lavender) → `bg-background` (cream — same token name, new value)
- `text-text-primary` → `text-warm-900`
- `text-text-secondary` → `text-warm-700`
- `text-text-muted` → `text-warm-500`
- `border-gray-100`, `border-gray-200` → `border-surface-warm` (cards) or `border-warm-100` (inputs)
- `rounded-xl` for cards → `rounded-2xl` (per spec)
- `shadow-sm` → `shadow-card` (the warm-tinted version)
- `bg-[#F3E4FF]` (focused tab pill in `StyledTab`) → `bg-secondary-50` (light sage)
- `rounded-xl px-4 py-2` for filter pills stays the same; just retint

**Special cases:**

**`components/ui/Pagination.tsx`** — currently `bg-primary` (deep purple). Change to `bg-primary-500` terracotta.

**`components/ui/Modal.tsx`** — confirm buttons: success variant uses `bg-secondary-600` sage, warning uses `bg-primary-500` terracotta, danger uses `bg-semantic-danger` red. Header restyled.

**`components/ui/Toast.tsx` + `components/ui/Sonner.tsx`** — do NOT delete yet. Update both to use warm palette. Sonner (top): default `bg-primary-500` terracotta, success `bg-secondary-600` sage, danger `bg-semantic-danger`, warning `bg-semantic-warning`, info `bg-semantic-info`. Toast (bottom): same color map. (Both kept temporarily — actual consolidation in Phase 5.)

**`components/products/CategoryCard.tsx`** — currently hardcodes `folder` icon. Wire up the existing `CATEGORY_ICONS` and `CATEGORY_COLORS` arrays:

```ts
const iconName =
  CATEGORY_ICONS[hashCode(category.name) % CATEGORY_ICONS.length];
const color = CATEGORY_COLORS[hashCode(category.name) % CATEGORY_COLORS.length];
// render <FontAwesome name={iconName} style={{ color }} />
```

Where `hashCode` is a simple string hash. The colors are bold hex values, so they need to be paired with a soft background (use `color + '20'` for alpha 12% background).

**`components/reports/SimpleBarChart.tsx`** — bar color changes from `bg-secondary` (purple) to `bg-primary-500` (terracotta).

**`components/elements/StyledText.tsx`** — no functional change. The variant prop is already there. Document that variants map to the new type scale.

**Verify after each component class:** re-render any screen that uses it. Take a screenshot.

**Commits:** one per component folder (`components/credits`, `components/products`, `components/reports`, `components/sales`, `components/ui`, `components/layout`, `components/elements`) so each is independently revertable.

---

## Phase 4 — Per-screen migration — 3–4 hours

**Goal:** Walk every tab and edit-form screen. Replace inline headers with `ScreenHeader`, inline search with `SearchBar`, currency strings with `MoneyText`, pills with `StatusPill`, hardcoded hex with tokens.

**Screens to migrate (in this order):**

1. `app/(tabs)/index.tsx` — Inventory (the home)
2. `app/(tabs)/sales/index.tsx` — Sales list
3. `app/(tabs)/products/index.tsx` — Products shell
4. `app/(tabs)/credits/index.tsx` — Credits list
5. `app/(tabs)/reports/index.tsx` — Reports
6. `app/(edit-forms)/add-product/index.tsx` — uses dark ScreenHeader variant
7. `app/(edit-forms)/edit-product/[id].tsx`
8. `app/(edit-forms)/add-sales/index.tsx` — POS
9. `app/(edit-forms)/sale-details/[id].tsx` — uses dark ScreenHeader
10. `app/(edit-forms)/add-customer/index.tsx`
11. `app/(edit-forms)/category/[id].tsx` — **fixes the `$` bug at line 55**
12. `app/(edit-forms)/credit-details/[id].tsx` — Customer detail (the trust screen)
13. `app/(edit-forms)/add-credit/[id].tsx`
14. `app/(edit-forms)/add-payment/[id].tsx`
15. `app/onboarding/index.tsx`

**For each screen:**

1. Replace the inline title+subtitle+actions header with `<ScreenHeader ... />`
2. Replace any inline `TextInput` search bar with `<SearchBar ... />`
3. Replace every `₱${x.toFixed(2)}` with `<MoneyText value={x} />`
4. Replace every stock-status / payment / customer-tag pill with `<StatusPill variant="...">label</StatusPill>`
5. Replace every hardcoded hex color (grep that file specifically) with the appropriate token
6. Standardize `px-4` / `px-6` / `p-4` / `p-5` to `px-4` / `p-4`
7. Replace dead FontAwesome `user` icon in customer detail with `<Avatar name={customer.name} />`
8. Standardize card style: `bg-white rounded-2xl p-4 border border-surface-warm shadow-card`

**For `app/(edit-forms)/category/[id].tsx:55`** specifically: replace `$${item.price?.toFixed?.(2)}` with `<MoneyText value={item.price} />`. The `item.price` field needs verification — confirm it's stored in centavos per the integer-centavos rule before passing to MoneyText. If it's in pesos, multiply by 100 first and add a comment.

**For `app/(tabs)/index.tsx:26-27`:** remove the `LOW_STOCK_THRESHOLD = 5` and `ITEMS_PER_PAGE = 4` redeclarations. Add `import { LOW_STOCK_THRESHOLD, ITEMS_PER_PAGE } from '@/constants/stocks';` at the top.

**For `app/(tabs)/_layout.tsx`:** if it uses `presentation: 'modal'` for tab screens, change to default presentation. (The exploration noted this feels modal-like for tab switches.)

**Verify after each screen:** re-run the app, take a screenshot, compare to the mockup from the brainstorming session.

**Commits:** one per screen, named `refactor(rebrand): migrate <screen-name> to new tokens and primitives`.

---

## Phase 5 — Bug fixes & cleanup — 1–2 hours

**Goal:** Apply the named bug fixes from spec Tier 4 that weren't already done in earlier phases.

**Step 5.1 — Delete dead code**

- Delete `components/ui/Dialog.tsx` (unused; `Modal.tsx` supersedes it)
- Remove the `@fortawesome/fontawesome-svg-core` dependency from `package.json` (unused — only `@expo/vector-icons` is used)
- Remove the `expo-symbols` dependency from `package.json` (unused)

Verify nothing imports these before deleting. `grep -r 'Dialog' app/ components/` should return 0 hits. `grep -r '@fortawesome' app/ components/` should return 0 hits. `grep -r 'expo-symbols' app/ components/` should return 0 hits.

**Step 5.2 — Toast consolidation (final)**

Now that Phase 3+4 has migrated every screen to Sonner-style calls (or has flagged any that still use Toast), do a final audit:

- `grep -r 'useToastStore\|from.*ToastStore' app/ components/` — list remaining Toast usage
- If empty: delete `components/ui/Toast.tsx` and remove the `ToastContainer` mount from `app/_layout.tsx`
- If not empty: convert remaining call sites to Sonner calls

**Step 5.3 — Tailwind content glob final check**

The Phase 1 update added `./components/**`. Verify by running `npx expo start` and checking the CSS output for any utility class that was previously missing. If anything was missed, add additional globs.

**Step 5.4 — Final grep audit**

Run all five greps from the spec. Every one should return 0.

**Commit:** `chore(rebrand): cleanup dead code, consolidate toasts, final audit`

---

## Phase 6 — Final pass + screenshots — 1 hour

**Goal:** Capture after-screenshots, compare to before, hand off.

**Step 6.1 — Capture after-screenshots**

Same screens as Phase 0: Inventory, Sales, Products, Credits, Reports, Onboarding, Add-Sale, Customer Detail, Add-Credit, Add-Payment, Sale Details. Save in `docs/superpowers/specs/2026-06-19-sarisari-rebrand/after/`.

**Step 6.2 — Side-by-side comparison**

Create `docs/superpowers/specs/2026-06-19-sarisari-rebrand/COMPARISON.md` with a markdown table linking before and after screenshots for each screen. Note any visual regressions and address.

**Step 6.3 — Manual offline test**

On a real device or simulator:

1. Turn on airplane mode
2. Record a sale (add-product, set quantity, complete)
3. Add a credit to a customer
4. Take a payment
5. Verify all 3 operations persist (re-open app, see them in lists)
6. Verify all toasts fire

**Step 6.4 — Run test suite**

```bash
npm test
```

If there are no tests, document this in COMPARISON.md ("no automated tests exist for db/ — manual offline test passed").

**Step 6.5 — Lint**

```bash
npx expo lint
```

Fix any lint warnings introduced by the rebrand.

**Step 6.6 — Update CLAUDE.md / AGENTS.md if needed**

If the rebrand introduced any new conventions (e.g., "use MoneyText instead of toFixed"), add a one-line note to AGENTS.md under the appropriate section.

**Commit:** `docs(rebrand): capture after-screenshots and final comparison`

---

## Critical files

(Already in spec; repeated here for execution reference.)

- `tailwind.config.js` — token system home (Phase 1)
- `global.css` — token mirror + `@layer components` (Phase 1)
- `app.json` — splash/icon/UI style (Phase 1)
- `components/ui/MoneyText.tsx` — new (Phase 2)
- `components/ui/ScreenHeader.tsx` — new (Phase 2)
- `components/ui/SearchBar.tsx` — new (Phase 2)
- `components/ui/EmptyState.tsx` — new (Phase 2)
- `components/ui/Avatar.tsx` — new (Phase 2)
- `components/ui/StatusPill.tsx` — new (Phase 2)
- `components/ui/Toast.tsx` — delete in Phase 5
- `components/ui/Dialog.tsx` — delete in Phase 5
- All other `components/ui/*` and `components/<domain>/*` — restyle in Phase 3
- All `app/(tabs)/*` and `app/(edit-forms)/*` — migrate in Phase 4

---

## Verification commands

```bash
# Phase 0 (before any work)
grep -rE 'bg-purple-|text-purple-|bg-indigo-|text-indigo-' app/ components/ | wc -l   # baseline count
grep -rE '#[0-9a-fA-F]{6}' app/ components/ | wc -l                                       # baseline count
grep -rE 'toFixed\(2\)' app/ | wc -l                                                      # baseline count
grep -rE 'from .@/db' app/ | wc -l                                                        # baseline count (should be 0)

# Each phase end
grep -rE 'bg-purple-|text-purple-|bg-indigo-|text-indigo-' app/ components/ | wc -l   # target: 0
grep -rE '#[0-9a-fA-F]{6}' app/ components/ | wc -l                                       # target: 0
grep -rE 'toFixed\(2\)' app/ | wc -l                                                      # target: 0
grep -rE 'from .@/db' app/ | wc -l                                                        # target: 0

# Final
npx expo start
npm test
npx expo lint
```

---

## Risk register

(Inherited from spec Section 3, surfaced here for execution reference.)

1. **Token rename breaks 100+ className strings** — Phase 1 commit is isolated. Revert that one commit if anything is wrong.
2. **Color contrast fails accessibility** — already verified pre-implementation: 13.2:1 AAA on text/bg, 4.6:1 AA on sage/white. Run an automated contrast check on every new combination before merging Phase 1.
3. **MoneyText format differs from existing renderers** — every existing renderer uses `Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })`. MoneyText uses the same. Spot-check 3 random values after Phase 4.
4. **Tailwind content glob order** — Phase 1 adds `./components/**` BEFORE Phase 2 primitives exist. This is intentional: the rebuild is the same, and Tailwind will pick up Phase 2 classes when they land.
5. **Toast consolidation breaks feedback** — Phase 3 keeps both Toast and Sonner. Phase 5 does the actual delete after Phase 4 confirms all call sites work with Sonner.
6. **Category icon hash collisions** — `hashCode(name) % CATEGORY_COLORS.length` may collide for short names like "Eggs" and "Oil". The 10-color + 15-icon arrays have 150 combinations; with ~20 categories, collision rate is ~13%. Acceptable for a category indicator — not user-critical.

---

## Definition of done

- [ ] All 5 grep audits return 0
- [ ] All 11 after-screenshots captured
- [ ] Manual offline test passes
- [ ] `npm test` passes (or noted as no tests exist)
- [ ] `npx expo lint` passes
- [ ] `.superpowers/` in `.gitignore`
- [ ] COMPARISON.md created
- [ ] AGENTS.md updated if any new convention was introduced
