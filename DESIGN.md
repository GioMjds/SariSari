---
name: SariSari
description: Cozy, offline-first mobile POS system for Filipino store owners
colors:
  primary: '#E85A1F'
  primary-pressed: '#A1370C'
  primary-bg: '#FFF1EA'
  secondary: '#4F7A24'
  secondary-bg: '#EEF4E5'
  cinnamon: '#623418'
  neutral-bg: '#EFE6D2'
  neutral-card: '#FBF7EE'
  ink: '#0E0C0A'
  ink-muted: '#564E45'
typography:
  display:
    fontFamily: 'StackSansText-Bold'
    fontSize: '40px'
    fontWeight: '800'
    lineHeight: 1.05
    letterSpacing: '-0.02em'
  body:
    fontFamily: 'StackSansText-Regular'
    fontSize: '14px'
    fontWeight: '400'
    lineHeight: 1.5
  label:
    fontFamily: 'StackSansText-Bold'
    fontSize: '10px'
    fontWeight: '700'
    lineHeight: 1.3
    letterSpacing: '0.14em'
rounded:
  sm: '6px'
  md: '12px'
  lg: '16px'
  card: '16px'
spacing:
  sm: '8px'
  md: '16px'
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.neutral-card}'
    rounded: '{rounded.sm}'
    padding: '12px 24px'
  button-primary-active:
    backgroundColor: '{colors.primary-pressed}'
  input-field:
    backgroundColor: '{colors.neutral-card}'
    textColor: '{colors.ink}'
    rounded: '{rounded.sm}'
    padding: '12px'
---

# Design System: SariSari

## 1. Overview

**Creative North Star: "The Garapon Countertop"**

SariSari is styled with a cozy, tactile countertop feel, evoking the presence of the traditional Filipino _garapon_ candy jars and paper receipts. The interface relies on warm-neutral backgrounds, crisp charcoal ink typography, and the interactive mascot Sari who guides the store owner through tasks and states.

The system rejects cold, over-decorated modern SaaS landing pages. Layouts prioritize rapid data entry at a physical counter, readability under direct ambient sunlight, and offline responsiveness.

**Key Characteristics:**

- **Warm & Cozy Tactility**: Flat surfaces resembling cream-toned ledger paper and physical receipts.
- **Mascot-Led Context**: Sari (the garapon) is integrated directly into main views to signal store states (readiness, alerts, sales success).
- **High-Density Utility**: Optimized for single-column mobile viewports with fast POS checkouts and transaction ledger audit trails.

## 2. Colors

The color palette is Restrained, utilizing warm-neutral background layers with single saturated accents to steer user interaction.

### Primary

- **Vivid Persimmon Orange** (`#E85A1F`): Core brand action color. Used for active buttons, current selection indicators, and primary checkout routes.
- **Deep Cinnamon Brown** (`#623418`): Used for header bars, total summary cards, and rich text contrast.

### Secondary

- **Organic Countertop Sage Green** (`#4F7A24`): Used to represent positive transactions, completed cash payments, and success screens.

### Neutral

- **Cream Page Background** (`#EFE6D2`): The base screen surface, mimicking warm ledger paper.
- **Brightest Receipt Paper** (`#FBF7EE`): Card backings and details blocks to separate content layers.
- **Soft Charcoal Ink** (`#0E0C0A`): Primary text color ensuring a high contrast ratio.
- **Muted Ink** (`#564E45`): Supporting labels, timestamps, and borders.

### Named Rules

**The Persimmon Accent Rule.** Saturated Persimmon Orange (`#E85A1F`) must only carry active actions or status focus. Never use it decoratively for large header panels, borders, or container backdrops.
**The Receipt Contrast Rule.** Body text must be written in Soft Charcoal Ink (`#0E0C0A`) to guarantee readability against cream paper under intense daylight.

## 3. Typography

**Display Font:** `StackSansText-Bold`
**Body Font:** `StackSansText-Regular`

A unified sans-serif font stack is used to maintain structural density on mobile viewports. Hierarchy scaling is tight to prevent typographic elements from competing for attention.

### Hierarchy

- **Display** (800, `40px`, line-height `1.05`, letter-spacing `-0.02em`): Used for hero totals and checkout summaries.
- **Headline** (800, `28px`, line-height `1.2`): Used for primary screen headings.
- **Title** (700, `20px`, line-height `1.3`): Used for card titles.
- **Body** (400, `14px`, line-height `1.5`): Default body text. Cap line lengths at 65ch.
- **Label** (700, `10px`, letter-spacing `0.14em`): Used for uppercase eyebrow labels and receipt metadata fields.

### Named Rules

**The Letter-Spacing Rule.** Large display headers must not set letter-spacing tighter than `-0.02em` (or `-0.03em` for hero metrics) to prevent overlapping characters on low-DPI mobile devices.
**The No-Display-In-UI Rule.** Never use display fonts or clamp size scales for regular UI buttons, inputs, or navigation labels. Keep them strictly mapped to body and title tokens.

## 4. Elevation

The design system is flat-by-default to preserve the receipt paper aesthetic. Depth is achieved via container borders and parchment-color cards.

### Shadow Vocabulary

- **Resting Shadow (`paper`)** (`0 1px 0 rgba(86, 78, 69, 0.04), 0 2px 6px rgba(86, 78, 69, 0.06)`): Used to separate content blocks.
- **Tactile Lift (`paper-lift`)** (`0 1px 0 rgba(86, 78, 69, 0.05), 0 6px 16px rgba(86, 78, 69, 0.10)`): Applied only on pressed states and sheets.
- **Modal Lift (`modal`)** (`0 6px 20px rgba(86, 78, 69, 0.16)`): Applied to floating modals.

### Named Rules

**The Flat-At-Rest Rule.** All list entries, static cards, and inputs must lie flat on their backgrounds. Shadows are strictly active state changes or modal indicators.

## 5. Components

### Buttons

- **Shape:** Softly curved corners (6px, `md` token).
- **Primary:** Saturated Persimmon background, brightest paper text, padding 12px vertical.
- **Hover/Active:** cinnamon-500 or dark pressed orange, with active press-scaling (`transform: scale(0.97)`).

### Cards

- **Corner Style:** Rounded (16px, `card` token).
- **Background:** Brightest paper (`#FBF7EE`) on cream screen bg.
- **Border:** Thin dashed or dotted border (`#D2CCC1`) mimicking paper receipts.

### Inputs

- **Style:** Flat brightest paper, thin border (`#D2CCC1`), rounded 6px.
- **Focus:** 2px outline in persimmon-300 (`#FF9E76`) to match focus ring spec.

### Navigation

- **Tabs:** Bottom-tab layout, utilizing Soft Charcoal Ink icons with a persimmon indicator for active focus.

## 6. Do's and Don'ts

### Do

- **Do** wrap every ledger state mutation inside database transactions to maintain FIFO utang records.
- **Do** display the mascot Sari in empty states and main dashboards to visually orient the user.
- **Do** use `formatPesos` and `parsePesosInput` to guarantee all currency transactions are integer-accurate.
- **Do** use responsive press-scaling (0.97 scale on active press) to provide tactile UI feedback.

### Don't

- **Don't** use border-left or border-right colored stripes as decoration on cards or alerts.
- **Don't** use text gradients or decorative glassmorphism.
- **Don't** add arbitrary loading spinners; prefer skeleton states where possible.
- **Don't** use generic warm-neutral gradients as page background; stick to flat cream page backgrounds.
- **Don't** set card rounding radii larger than 16px.
