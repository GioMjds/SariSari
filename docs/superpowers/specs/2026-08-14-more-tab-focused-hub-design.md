# SariSari More Tab Focused Hub Design

**Date:** 2026-08-14

**Status:** Revised after code reconciliation; awaiting written-spec re-approval

**Scope:** `app/(tabs)/more/` information architecture, presentation, and navigation

## Summary

Replace the current More screen's app-wide tile directory with a focused,
single-column hub for secondary owner tools. More will contain only four
destinations: Cash & expenses, Reports & insights, Backup & restore, and
Settings & security.

The chosen layout is a task-prioritized hub. Cash is the featured card because
recording expenses and owner drawings is a high-priority daily owner task.
Reports, Backup, and Settings are descriptive navigation rows. POS, receipts,
products, stock movements, customers, collections, and other primary-tab
destinations will not be duplicated in More.

This design implements the target information architecture in
`obsidian-vault/01-Roadmap/feature-implementation-status-and-ia.md` and keeps
the project-wide offline-first and data-flow requirements from
`obsidian-vault/CONTEXT.md`.

### Code reconciliation decision

The roadmap note names this destination "Cash Session," but the current product
explicitly labels drawer sessions as legacy and read-only and directs users to
the Gastos & Kaha financial ledger. The product decision for this redesign is
therefore to follow current behavior: the featured destination is **Cash &
expenses** at `/(tabs)/more/cash-entries`. This redesign does not restore drawer
opening, expected-cash, or day-close behavior. The roadmap terminology should
be updated separately so it no longer conflicts with the implemented product.

## Problem

The current `MoreHomeScreen` behaves like a second copy of the entire app. It
contains more than twenty shortcuts grouped into Daily operations, Customers,
Reports, Cash, Store & data, and About & help. Many of those shortcuts lead
back to destinations already present in the Home, Sales, Inventory, or
Customers tabs. Several report tiles also deep-link to individual sections of
Home rather than one reporting destination.

This causes three usability problems:

1. More has no clear job in the five-tab navigation model.
2. Repeated destinations make users decide between multiple paths to the same
   task.
3. The dense square-tile layout has little room for explanatory text, Tagalog
   translations, or larger accessibility text.

The current More route and component are also guarded by `__DEV__`, causing
the tab to redirect to the unimplemented screen in production. The redesign
must make the approved More hub production-ready.

## Goals

- Give More one clear role: secondary owner tools that do not belong in a
  daily-use primary tab.
- Make today's expenses and owner drawings understandable before the user
  opens the cash ledger.
- Keep Reports, Backup, and Settings easy to scan through descriptive labels
  and supporting text.
- Reuse the current SariSari thermal-paper visual identity and semantic design
  tokens.
- Work offline, with status failures never blocking access to a destination.
- Support Dynamic Type, screen readers, reduced motion, small phones, tablets,
  and landscape layouts.
- Use canonical Expo Router destinations and predictable back behavior.

## Non-goals

- Redesigning the floating five-item bottom tab bar.
- Adding favorites, recents, personalization, or user-reorderable shortcuts.
- Redesigning the internal Reports, Cash, Backup, or Settings workflows beyond
  the route split required below.
- Adding new cash, report, backup, or settings business logic.
- Changing the database schema.
- Adding dark mode as part of this change.
- Moving primary Sales, Inventory, or Customers workflows into More.
- Retaining a drawer or adding sub-tabs within More.

## Information Architecture

More remains the fifth top-level tab. Its landing screen has four destinations
in this order:

| Position     | Label               | Canonical route             | Purpose                                                |
| ------------ | ------------------- | --------------------------- | ------------------------------------------------------ |
| Featured     | Cash & expenses     | `/(tabs)/more/cash-entries` | Review today's expenses and owner drawings             |
| Primary row  | Reports & insights  | `/(tabs)/more/reports`      | Open the consolidated reporting surface                |
| Store & data | Backup & restore    | `/(tabs)/more/backup`       | Manage local snapshots and Google Drive backup/restore |
| Store & data | Settings & security | `/(tabs)/more/settings`     | Store profile, language, Owner PIN, and preferences    |

Help, About, and app-version information belong inside Settings. They do not
appear as additional destinations on the More landing screen.

The screen has no More-specific tab strip. `MORE_SUB_TABS` remains empty. Each
destination is a stack route under More, and normal back navigation returns to
the More landing screen without resetting its scroll position.

## Screen Structure

The screen is a single vertical `ScrollView`, using this order:

1. Screen header
2. Cash summary feature card
3. Reports & insights row
4. "Store & data" section label
5. Backup & restore row
6. Settings & security row

The existing global `StoreHeader` remains outside this screen. The More screen
adds a local header below it:

- Eyebrow: "Store tools"
- Title: "More"
- Supporting copy: "Manage the day, understand the store, and keep your data
  safe."

All copy is translated in English and Tagalog. The final copy may be adjusted
for natural translation, but its meaning and hierarchy must remain the same.

### Layout dimensions

- Phone horizontal gutter: 16dp.
- Tablet and landscape gutter: 24dp.
- Content is centered with a maximum width of 640dp on large screens.
- Section spacing follows the existing 4/8dp rhythm.
- The last row receives bottom content inset from the existing tab-bar offset
  helper so it cannot be obscured by the floating tab bar or system gesture
  area.
- The layout remains single-column at every supported width. More has too few
  destinations to justify a tablet grid, and the single column is more robust
  for translated and scaled text.

## Component Design

### `MoreScreenHeader`

Renders the eyebrow, title, and supporting copy. It contains no button or
screen-level action. Text wraps naturally and has no fixed height.

### `CashSummaryFeatureCard`

The only strongly emphasized surface on the screen. It uses
`persimmon-600` with `paper-50` foreground text, which provides at least 4.5:1
contrast, and a single vector cash icon. The entire card is one button that
opens the canonical cash-entries route.

The card has four render states:

| State              | Title           | Supporting text                                               | Action label |
| ------------------ | --------------- | ------------------------------------------------------------- | ------------ |
| Loading            | Cash & expenses | Stable non-animated placeholder                               | Open cash    |
| No movements today | Cash & expenses | No expenses or owner drawings recorded today                  | Review cash  |
| Movements today    | Cash & expenses | Formatted totals for today's paid expenses and owner drawings | Review cash  |
| Query error        | Cash & expenses | Open to check today's expenses and owner drawings             | Check cash   |

When movements exist, both categories remain visible even when one total is
zero. The card does not present opening cash, expected drawer cash, cash-in, or
day-close state. Loading reserves the final card height and does not use
shimmer when reduced motion is enabled. Query failure does not disable the
card.

All money displayed by the card uses `formatPesos`; the component does not
format numeric values directly.

### `MoreSection`

Provides the optional uppercase section label and vertical spacing. The first
two destinations need no section label because the hierarchy is already clear.
"Store & data" groups Backup and Settings.

### `MoreDestinationRow`

A reusable navigation row with these inputs:

- vector icon
- title
- supporting text
- `onPress`
- accessibility label and optional hint

The row uses a paper surface, visible border, consistent icon container, and a
trailing chevron. It has a minimum 64dp visual height and at least a 48dp touch
target. Title and supporting text wrap rather than using one-line truncation.

The three row contents are:

| Row                 | Supporting text                                                     |
| ------------------- | ------------------------------------------------------------------- |
| Reports & insights  | Sales, stock, suki, and cash trends                                 |
| Backup & restore    | Latest local backup time, `No backup yet`, or `Check backup status` |
| Settings & security | Store, language, Owner PIN, and preferences                         |

The Backup helper uses the newest successful local snapshot from
`useLocalSnapshots`. It does not query Google Drive merely to render the More
screen, preserving offline-first behavior and avoiding a network-dependent
landing screen. Drive status remains inside Backup.

## Visual System

The redesign uses the existing tokens in `tailwind.config.js` rather than
introducing a separate page palette or font pairing.

- Background: `paper-200`.
- Elevated row surfaces: `paper-50`.
- Borders/dividers: `paper-300`.
- Primary text: `ink-700` or `ink-900`.
- Supporting text: an ink token that maintains at least 4.5:1 contrast at its
  rendered size.
- Featured card: `persimmon-600` with `paper-50` foreground. Do not use
  `persimmon-500` with white or paper text because that pairing does not meet
  4.5:1 contrast for supporting copy.
- Typography: existing Stack Sans variants.
- Heading size: existing `h1` role.
- Row title: 16sp semibold.
- Supporting copy: at least 14sp regular.
- Corner radii: 20dp feature card and 16dp destination rows.
- Icon size: one consistent 20-24dp vector size from one icon family.

No emoji, raster navigation icons, glassmorphism, decorative gradients, or new
font dependency will be introduced. Components use semantic token classes;
they do not add ad hoc hardcoded color values.

## Interaction and Motion

- Each feature card and row is a semantic `Pressable` with button role.
- Touch targets are at least 48x48dp with at least 8dp between separate
  targets.
- Press feedback appears within 100ms through opacity or a subtle scale. It
  does not change layout bounds.
- Micro-interactions use the existing 180-220ms motion rhythm.
- Reduced motion changes transitions to immediate opacity feedback without
  scale or spatial movement.
- A destination accepts one press while navigation is in progress; it must not
  stack duplicate copies of the same route.
- Standard iOS swipe-back and Android back behavior remain unobstructed.

## Navigation Behavior

The current development-only redirects and guards are removed from:

- `app/(tabs)/more/_layout.tsx`
- `app/(tabs)/more/index.tsx`
- `components/more/MoreHomeScreen.tsx`

More and all four approved destinations must be reachable in production.

The existing cash shortcut in `MoreHomeScreen` points to the retired
`/(edit-forms)/cash-session` flow; the redesign changes it to the active
`/(tabs)/more/cash-entries` route. The new Backup route hosts the backup and
restore sections currently embedded in Settings. Settings retains store,
language, Owner PIN, and preference content.

Routes use typed `Href` values. Deep-linking directly into Cash, Reports,
Backup, or Settings must work. When a destination is opened from More, Back
returns to More with its scroll state preserved. When a deep link opens a
destination without an in-app history entry, the fallback back destination is
the More landing screen rather than Home or an unimplemented route.

## Data Flow

The screen follows the mandatory unidirectional project flow:

```text
More screen -> query hooks -> database/lib layer -> local storage
```

Cash card data:

1. `getTodayDateString()` supplies today's local business date.
2. `useFinancialTotals(today, today)` returns `paidExpenses` and
   `ownerDrawings` from the existing offline financial ledger.
3. The component maps query status and the two totals to one of the four render
   states above. Two zero totals produce the valid empty state.

Backup row data:

1. `useLocalSnapshots()` loads offline snapshot metadata.
2. The screen derives the newest snapshot timestamp without storing it in
   Zustand.
3. No snapshot produces `No backup yet`; query failure produces
   `Check backup status`.

The screen never imports the SQLite handle or calls database functions
directly. Zustand is not used to cache cash or backup business data.

## Loading, Empty, and Error Behavior

- The More screen itself renders immediately; it never uses a full-screen
  spinner.
- Cash and backup metadata load independently so one slow query cannot block
  the other destinations.
- Loading placeholders reserve space and avoid content jumping.
- A failed status query degrades only its supporting copy. Navigation remains
  available.
- An empty cash or backup history is treated as a valid state, not an error.
- Errors inside destination screens remain the responsibility of those
  screens and must provide their existing recovery actions.

## Accessibility

- Reading order matches visual order: header, Cash, Reports, Store & data,
  Backup, Settings.
- Every row exposes button role, meaningful accessibility label, and a hint
  describing the destination when the title alone is insufficient.
- The cash card's accessible label includes both totals and its action, such as
  "Cash and expenses, paid expenses 500 pesos, owner drawings 200 pesos,
  review cash."
- Text may wrap at the largest supported Dynamic Type size. Fixed-height text
  containers and single-line truncation are prohibited.
- Focus moves to the destination screen's main heading after navigation.
- Primary and supporting text meet WCAG AA contrast in the supported light
  theme.
- Motion respects the platform reduced-motion preference.

## Localization

New and retained More copy lives with the existing More-related localization
keys, with English and Tagalog values added in the same change. Keys for
removed tile destinations may be deleted only after a repository search
confirms they have no other consumers.

Layout verification must use the longer of the English and Tagalog strings for
each element. Copy wraps; it is not shortened solely to fit a fixed card.

## Expected File Impact

Primary files:

- Modify `app/(tabs)/more/_layout.tsx`.
- Modify `app/(tabs)/more/index.tsx`.
- Add `app/(tabs)/more/backup.tsx`.
- Rewrite `components/more/MoreHomeScreen.tsx`.
- Add focused components under `components/more/` for the header, cash card,
  section, and destination row.
- Split backup-specific content out of the current Settings screen while
  preserving existing backup components and hooks.
- Update English and Tagalog localization resources.
- Add component and navigation tests.

The old `MoreTile`, `MoreTileGrid`, `MoreHeroStrip`, `MoreIconSection`,
`MoreGroupSection`, and `MoreLinkRow` components may be removed only if a
repository search confirms they have no consumers after the rewrite. This is
targeted cleanup, not a general component refactor.

## Verification Strategy

### Automated tests

- Cash card renders no-movement, populated, loading, and query-error states.
- Paid-expense and owner-drawing values are rendered through the money
  formatter.
- Backup row renders latest local snapshot, empty, loading, and error helper
  text.
- Each destination press targets its canonical typed route.
- Repeated fast presses do not stack duplicate destinations.
- More renders when `__DEV__` is false.
- Interactive elements expose the expected accessibility roles, labels,
  hints, and cash-state text.
- English and Tagalog localization resources contain every new key.

### Manual verification

- 375dp small phone and a large phone.
- Tablet in portrait and landscape.
- Largest supported Dynamic Type size.
- VoiceOver and TalkBack reading and focus order.
- Reduced motion enabled.
- Offline mode, with local financial and backup status still usable.
- No local snapshots, one snapshot, and multiple snapshots.
- No financial movements, expenses only, owner drawings only, and both types.
- Scroll content remains visible above the floating tab bar and gesture area.
- Direct deep links and platform back gestures for all four destinations.

## Acceptance Criteria

The design is complete when:

1. More is available in production and no longer redirects to the
   unimplemented screen.
2. The landing screen contains only Cash, Reports, Backup, and Settings.
3. No Sales, Inventory, Customers, individual report-section, Help, or About
   shortcuts remain on the landing screen.
4. Cash is the only featured card and accurately represents today's paid
   expenses and owner drawings without blocking navigation on query failure.
5. Backup status is derived from local snapshots and remains useful offline.
6. Every destination uses its canonical route and predictable back behavior.
7. The layout passes touch-target, contrast, Dynamic Type, screen-reader,
   reduced-motion, safe-area, and responsive checks.
8. The screen obeys `app -> hooks -> database/lib` data flow and introduces no
   database or business-logic changes.
