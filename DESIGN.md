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
neutral-bg: '#F7F6F2'
neutral-card: '#FAFAF7'
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
summary-card:
backgroundColor: '{colors.neutral-card}'
borderColor: '{colors.ink-muted}'
borderWidth: '1px'
borderStyle: 'dashed'
rounded: '{rounded.card}'
padding: '{spacing.md}'
action-button:
backgroundColor: '{colors.primary}'
textColor: '{colors.neutral-card}'
rounded: '{rounded.md}'
padding: '12px 16px'
fontWeight: '600'
alert-badge:
backgroundColor: '{colors.secondary-bg}'
borderColor: '{colors.secondary}'
borderWidth: '1px'
borderStyle: 'solid'
rounded: '{rounded.sm}'
padding: '4px 8px'
fontSize: '12px'
color: '{colors.secondary}'
layout:
container:
paddingHorizontal: '{spacing.md}'
paddingVertical: '{spacing.md}'
grid:
columnGap: '{spacing.md}'
rowGap: '{spacing.md}'
navigation:
bottomTabs:
height: '56px'
backgroundColor: '{colors.neutral-card}'
borderTopWidth: '1px'
borderTopColor: '{colors.ink-muted}'
tabIconSize: '24px'
tabIconColor: '{colors.ink-muted}'
tabIconActiveColor: '{colors.primary}'
swipeNavigation:
swipeThreshold: '20%'
animationDuration: '250ms'
animationEasing: 'cubic-bezier(0.16, 1, 0.3, 1)'
homepageSections:
header:
height: '56px'
backgroundColor: '{colors.neutral-card}'
borderBottomWidth: '1px'
borderBottomColor: '{colors.ink-muted}'
paddingHorizontal: '{spacing.md}'
display: 'flex'
alignItems: 'center'
justifyContent: 'space-between'
summaryCards:
layout: 'grid'
columns: '2'
gap: '{spacing.md}'
marginVertical: '{spacing.md}'
primaryActions:
layout: 'grid'
columns: '3'
gap: '{spacing.md}'
marginVertical: '{spacing.md}'
todaySnapshot:
backgroundColor: '{colors.neutral-bg}'
borderRadius: '{rounded.card}'
padding: '{spacing.md}'
marginVertical: '{spacing.md}'
priorityAlerts:
backgroundColor: '{colors.neutral-card}'
borderRadius: '{rounded.card}'
padding: '{spacing.md}'
marginVertical: '{spacing.md}'
miniInsights:
backgroundColor: '{colors.neutral-bg}'
borderRadius: '{rounded.card}'
padding: '{spacing.md}'
marginVertical: '{spacing.md}'
recentActivity:
backgroundColor: '{colors.neutral-card}'
borderRadius: '{rounded.card}'
padding: '{spacing.md}'
marginVertical: '{spacing.md}'

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

- **Clean Thermal Off-White Background** (`#F7F6F2`): The base screen surface, mimicking crisp, warm thermal receipt paper.
- **Bright Off-White Card Surface** (`#FAFAF7`): Card backings and details blocks to separate content layers.
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

### Summary Card

- A container for key metrics (sales, profit, stock, credits) with a dashed border and rounded corners.

### Action Button

- Primary action button used in grids (e.g., New Sale, Scan Item) with Persimmon background and paper text.

### Alert Badge

- Small badge indicating status (low stock, expiring, overdue) using secondary green background and icon.

## 6. Layout

### Container

- Horizontal and vertical padding defined by `{spacing.md}` to ensure comfortable touch targets and readability.

### Grid

- Consistent column and row gaps for alignment of cards, action buttons, and data rows.

## 7. Navigation

### Bottom Tabs

- Fixed height of 56px with a neutral card background and a subtle top border.
- Tab icons use muted ink for inactive state and persimmon for active state.
- Icon size 24px provides ample tap target.

### Swipe Navigation

- Horizontal swipe threshold set to 20% of screen width to avoid accidental triggers.
- Animation duration 250ms with an ease-out curve for a responsive yet smooth feel.
- Used only within tabs where screens belong to the same task family (e.g., Home → Overview → Today → Alerts; Sales → POS → Cart → Checkout → Receipts).

## 8. Homepage Sections

The homepage operates as an operational dashboard, presenting vital information and quick actions at a glance.

#### Header

- Fixed height 56px, neutral card background with a bottom border.
- Displays store name, date/time, sync status, offline/online badge, and optional profile/menu button.
- Flex layout for spacing and alignment.

#### Summary Cards

- Two‑column grid of cards showing Today’s Sales, Expected Profit, Low Stock Count, Credits Due (optional: Unsynced Transactions).
- Each card uses the `summary-card` component with appropriate icons and values.

#### Primary Actions

- Three‑column grid of action buttons for common tasks: New Sale, Scan Item, Add Stock, Add Customer, View Alerts, Reports, etc.
- Buttons use the `action-button` component for consistent size and touch feedback.

#### Today Snapshot

- Card‑style container with a neutral‑bg background.
- Displays a concise timeline: latest sale, recent payment, stock update, customer payment.

#### Priority Alerts

- Card‑style container with neutral‑card background.
- Lists high‑value warnings (low stock, expiring items, overdue payments, unsynced transactions) each with a label, severity indicator, and action button.
- Alerts use the `alert-badge` for visual cue.

#### Mini Insights

- Card‑style container with neutral‑bg background.
- Shows small data highlights: best‑selling item today, fast‑moving category, most overdue customer, top low‑stock products.

#### Recent Activity

- Card‑style container with neutral‑card background.
- Displays the latest 5‑10 activities (sale created, stock added, customer credit added, payment recorded, product updated) in chronological order.

## 9. Do's and Don'ts

### Do

- Use the mascot Sari in empty states, dashboards, and alert backgrounds to provide contextual feedback.
- Design for rapid POS entry: large tap targets, minimal steps, immediate feedback.
- Maintain high contrast: body text in Soft Charcoal Ink (#0E0C0A) on Cream Page Background (#EFE6D2) or Brightest Receipt Paper (#FBF7EE).
- Use bottom tabs for primary navigation (Home, Sales, Inventory, Customers, More) with swipe gestures inside tabs for related screens.
- Keep detail screens in stack navigation to preserve context.
- Show sync status, offline/online badge, and date/time in the header for instant operational awareness.
- Present status summary cards (Today’s Sales, Expected Profit, Low Stock Count, Credits Due) as a glanceable dashboard.
- Provide a grid of primary actions (New Sale, Scan Item, Add Stock, Add Customer, View Alerts, Reports) for one‑tap access.
- Display a today snapshot of recent operations (latest sale, recent payment, stock update, customer payment).
- Highlight priority alerts (low stock, expiring items, overdue payments, unsynced transactions) with action buttons.
- Include mini‑insights (best‑selling item, fast‑moving category, most overdue customer) to turn data into action.
- Show a recent activity feed (last 5‑10 operations) for traceability and confidence.

### Don't

- Use side‑stripe borders as decoration on cards or alerts.
- Apply gradient text or decorative glassmorphism.
- Use generic warm‑neutral gradients as page backgrounds; stick to flat cream or paper tones.
- Set card rounding radii larger than 16px.
- Use display fonts or large clamp scales for regular UI buttons, inputs, or navigation labels.
- Add arbitrary loading spinners; prefer skeleton states where possible.
- Use tiny uppercase tracked eyebrow above every section.
- Number sections as default scaffolding (01 / 02 / 03) unless the sequence carries real meaning.
