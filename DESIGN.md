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

<!-- impeccable:design-map -->
Name: SariSari
Colors: primary: primary #E85A1F; neutral: neutral-bg #EFE6D2; neutral: ink #0E0C0A
North Star: "The Garapon Countertop"
Rules:
- The Persimmon Accent Rule. Saturated Persimmon Orange (`#E85A1F`) must only carry active actions or status focus.
- The Receipt Contrast Rule. Body text must be written in Soft Charcoal Ink (`#0E0C0A`) to guarantee readability against cream paper under intense daylight.
- The Letter-Spacing Rule. Large display headers must not set letter-spacing tighter than `-0.02em` (or `-0.03em` for hero metrics) to prevent overlapping characters on low-DPI mobile devices.
- The No-Display-In-UI Rule. Never use display fonts or clamp size scales for regular UI buttons, inputs, or navigation labels.
- The Flat-At-Rest Rule. All list entries, static cards, and inputs must lie flat on their backgrounds.
Elevation:
- Resting Shadow (`paper`): 0 1px 0 rgba(86, 78, 69, 0.04), 0 2px 6px rgba(86, 78, 69, 0.06)
- Tactile Lift (`paper-lift`): 0 1px 0 rgba(86, 78, 69, 0.05), 0 6px 16px rgba(86, 78, 69, 0.10)
- Modal Lift (`modal`): 0 6px 20px rgba(86, 78, 69, 0.16)
Don't:
- Use side‑stripe borders as decoration on cards or alerts.
- Apply gradient text or decorative glassmorphism.
- Use generic warm‑neutral gradients as page backgrounds; stick to flat cream or paper tones.
- Set card rounding radii larger than 16px.
- Use display fonts or large clamp scales for regular UI buttons, inputs, or navigation labels.
- Add arbitrary loading spinners; prefer skeleton states where possible.
- Use tiny uppercase tracked eyebrow above every section.
- Number sections as default scaffolding (01 / 02 / 03) unless the sequence carries real meaning.
Do:
- Use the mascot Sari in empty states, dashboards, and alert backgrounds to provide contextual feedback.
- Design for rapid POS entry: large tap targets, minimal steps, immediate feedback.
- Maintain high contrast: body text in Soft Charcoal Ink (#0E0C0A) on Cream Page Background (#EFE6D2) or Brightest Receipt Paper (#FBF7EE).
- Use bottom tabs for primary navigation (Home, Sales, Inventory, Customers, More) with swipe gestures inside tabs for related screens.
- Keep detail screens in stack navigation to preserve context.
- (+7 more)
Full: .impeccable/design-full.md (read a section when you need its detail)
