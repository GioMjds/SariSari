# Sales Tab Product Cards & Bundled Products Redesign Spec

## Overview

This specification details the visual and UI/UX upgrade for product cards in the SariSari POS screen (`app/(tabs)/sales`), specifically focusing on `ProductRow.tsx` and `FastLaneCard.tsx`. The goal is to provide an agency-grade, double-bezel visual experience that clearly highlights bundled/wholesale products and bulk savings for sari-sari store owners while maintaining fast 60fps scrolling performance.

## Design Architecture

### 1. Visual System & Doppelrand (Double-Bezel) Layout

- **Outer Shell:** Soft ambient backdrop enclosure (`rounded-2xl bg-paper-100/90 border border-paper-300/80 p-3 mb-3 shadow-sm`) with touch active feedback (`active:bg-paper-200/60`).
- **Inner Core Thumbnail:** Surface thumbnail frame (`w-14 h-14 rounded-xl bg-paper-200 border border-paper-300/60 overflow-hidden items-center justify-center`). For bundled/wholesale items, a subtle stacked paper badge icon is displayed.
- **Color Palette & Contrast Tokens:**
  - `bg-cinnamon-500` / `text-cinnamon-600` for primary action CTAs and active retail toggles.
  - `bg-sage-50` / `text-sage-700` / `border-sage-200` for wholesale savings highlights and stock badges.
  - `text-ink-900` for titles and prices, `text-ink-600` for category labels, and `text-ink-500` for SKUs and unit conversion details.

### 2. Bundled & Wholesale Product Row (`ProductRow.tsx`)

- **Bundle Indicator Badge:** When `conversion_factor >= 2` and `wholesale_price` exist:
  - Display unit conversion badge: `1 [Wholesale Unit] = [Conversion Factor] [Retail Units]` (e.g., `1 Pack = 12 Pcs`).
- **Bulk Savings Visualizer:**
  - Calculate bulk savings: `retailEquivalent = retail_price * conversion_factor`.
  - Display savings pill: `Save ₱[retailEquivalent - wholesale_price]` (e.g., `Save ₱24.00`).
- **Segmented Unit Switcher Pill:**
  - Nested container (`bg-paper-200/80 border border-paper-300/60 p-1 rounded-xl flex-row items-center`).
  - Active chip uses high-contrast surface fill with clear label: `Retail (PC)` vs `Wholesale (PK/Box/Bundle)`.
- **Tactile Action Control:**
  - In-cart state: Stepper control (`-`, quantity counter, `+`) with distinct touch-target buttons (min 44x44px).
  - Add state: `+ Add` button with smooth active press state.

### 3. Fast Lane Card Upgrade (`FastLaneCard.tsx`)

- **Compact Hardware Enclosure:** `w-36 p-3 rounded-2xl bg-paper-100 border border-paper-300 shadow-sm mr-2.5`.
- **Wholesale Indicator Tag:** Displays micro badge `Bundle Available` when product has wholesale pricing.
- **Quick Stepper Buttons:** `+1`, `+2`, `+5` quick-add action chips with touch press effect.

### 4. Performance & React Native Constraints

- Preserve static class style maps outside component render functions to prevent `css-interop` class re-parsing overhead.
- React.memo isolation for both `ProductRow` and `FastLaneCard` to ensure 60fps list virtual rendering on low-end Android hardware.

## Verification & Testing Strategy

1. **Typecheck & Linting:** Run `npm run verify` (`npm run typecheck` + `npm test`).
2. **Visual & Behavior Check:** Ensure products with dual units (retail + wholesale/bundle) correctly compute and display savings badges, unit toggles, and stock counts without layout shift.
