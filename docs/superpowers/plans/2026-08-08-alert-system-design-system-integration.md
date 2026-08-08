# Design System Token Audit for Alert System Integration

This document outlines the available design system tokens from Tailwind CSS and global CSS that can be utilized for alert system improvements.

## Tailwind Configuration Tokens (`tailwind.config.js`)

### Color Palette

#### Brand Colors
- **Persimmon** (Primary): 
  - 50: `#FFF1EA`
  - 100: `#FFE0D1`
  - 200: `#FFC4A8`
  - 300: `#FF9E76`
  - 400: `#FA7A4B`
  - 500: `#E85A1F` (Brand Persimmon)
  - 600: `#C8460F`
  - 700: `#A1370C`
  - 800: `#7A2909`
  - 900: `#4F1B06`

- **Cinnamon** (Brand, ink-strong):
  - 50: `#F6E3D6`
  - 100: `#E9C5AD`
  - 200: `#D49570`
  - 300: `#B86B3F`
  - 400: `#8E4A23`
  - 500: `#623418` (Deep Cinnamon)
  - 600: `#4D2810`
  - 700: `#391C0A`
  - 800: `#261206`
  - 900: `#150903`

- **Sage** (Secondary):
  - 50: `#EEF4E5`
  - 100: `#D7E5BF`
  - 200: `#B7CF91`
  - 300: `#92B662`
  - 400: `#6E9A3D`
  - 500: `#4F7A24` (Sage)
  - 600: `#3D5E1B`
  - 700: `#2C4413`

- **Ink** (Text + Structure):
  - 50: `#F7F5F1`
  - 100: `#EAE6DF`
  - 200: `#D2CCC1`
  - 300: `#A89F90`
  - 400: `#7A7165`
  - 500: `#564E45`
  - 600: `#3D372F`
  - 700: `#28231D`
  - 800: `#191612`
  - 900: `#0E0C0A` (Ink - near-black)

- **Paper** (Surfaces):
  - 50: `#FAFAF7` (Brightest paper / card surface)
  - 100: `#F2F0E8` (Subtle surface / active state)
  - 200: `#F7F6F2` (Clean off-white page background)
  - 300: `#E6E3D8` (Warm grey border / divider)
  - 400: `#D8D4C7` (Deeper surface / border)

#### Semantic Colors
- `semantic-success`: `#4F7A24` (aligned with sage-500)
- `semantic-danger`: `#C13030`
- `semantic-danger-50`: `#FDECEC`
- `semantic-danger-100`: `#FAD8D8`
- `semantic-warning`: `#C77B0E`
- `semantic-warning-50`: `#FCF1DE`
- `semantic-warning-100`: `#F8E2BC`
- `semantic-info`: `#2E6FA8`
- `semantic-info-50`: `#E6F0F9`
- `semantic-info-100`: `#D0E2F0`

#### Dark Mode Tokens (reserved for future use)
- Dark persimmon, sage, paper, and ink ramps defined for future dark mode implementation

#### Compatibility Aliases
- `primary`: Maps to persimmon scale
- `secondary`: Maps to sage scale
- `warm`: Maps to ink scale
- `surface-warm`: `#FFE0D1` (persimmon-100)
- `background`: `#F7F6F2` (paper-200)
- `surface-subtle`: `#FAFAF7` (paper-50)

### Typography

#### Font Sizes
- `display`: `40px` (lineHeight: 1.05, fontWeight: 800, letterSpacing: -0.02em)
- `hero`: `56px` (lineHeight: 1.0, fontWeight: 800, letterSpacing: -0.03em)
- `h1`: `28px` (lineHeight: 1.2, fontWeight: 800, letterSpacing: -0.01em)
- `h2`: `20px` (lineHeight: 1.3, fontWeight: 700)
- `h3`: `16px` (lineHeight: 1.4, fontWeight: 600)
- `body`: `14px` (lineHeight: 1.5, fontWeight: 400)
- `caption`: `12px` (lineHeight: 1.4, fontWeight: 400)
- `label`: `10px` (lineHeight: 1.3, fontWeight: 700, letterSpacing: 0.14em)
- `mono`: `12px` (lineHeight: 1.4, fontWeight: 500, letterSpacing: 0.04em)

#### Font Family
- `stack-sans`: ['StackSansText-Regular']
- `stack-sans-extralight`: ['StackSansText-ExtraLight']
- `stack-sans-light`: ['StackSansText-Light']
- `stack-sans-medium`: ['StackSansText-Medium']
- `stack-sans-semibold`: ['StackSansText-SemiBold']
- `stack-sans-bold`: ['StackSansText-Bold']

### Spacing
Tailwind inherits default spacing scale (0.25rem increments):
- `px`: 1px
- `0`: 0px
- `0.5`: 0.125rem (2px)
- `1`: 0.25rem (4px)
- `1.5`: 0.375rem (6px)
- `2`: 0.5rem (8px)
- `2.5`: 0.625rem (10px)
- `3`: 0.75rem (12px)
- `3.5`: 0.875rem (14px)
- `4`: 1rem (16px)
- `5`: 1.25rem (20px)
- `6`: 1.5rem (24px)
- `7`: 1.75rem (28px)
- `8`: 2rem (32px)
- `9`: 2.25rem (36px)
- `10`: 2.5rem (40px)
- `11`: 2.75rem (44px)
- `12`: 3rem (48px)
- `14`: 3.5rem (56px)
- `16`: 4rem (64px)
- `20`: 5rem (80px)
- `24`: 6rem (96px)
- `28`: 7rem (112px)
- `32`: 8rem (128px)
- `36`: 9rem (144px)
- `40`: 10rem (160px)
- `44`: 11rem (176px)
- `48`: 12rem (192px)
- `52`: 13rem (208px)
- `56`: 14rem (224px)
- `60`: 15rem (240px)
- `64`: 16rem (256px)
- `72`: 18rem (288px)
- `80`: 20rem (320px)
- `96`: 24rem (384px)

### Border Radius
- `md`: `6px`
- `lg`: `12px`
- `xl`: `16px`
- `2xl`: `20px`
- `pill`: `9999px`
- `card`: `16px`

### Box Shadows
- `paper`: '0 1px 0 rgba(86, 78, 69, 0.04), 0 2px 6px rgba(86, 78, 69, 0.06)'
- `paper-lift`: '0 1px 0 rgba(86, 78, 69, 0.05), 0 6px 16px rgba(86, 78, 69, 0.10), 0 16px 28px rgba(86, 78, 69, 0.06)'
- `paper-deep`: '0 2px 0 rgba(86, 78, 69, 0.06), 0 12px 24px rgba(86, 78, 69, 0.12), 0 28px 48px rgba(86, 78, 69, 0.10)'
- `card`: '0 1px 2px rgba(86, 78, 69, 0.06)'
- `raised`: '0 4px 12px rgba(86, 78, 69, 0.10)'
- `modal`: '0 6px 20px rgba(86, 78, 69, 0.16)'
- `persimmon-glow`: '0 8px 24px rgba(232, 90, 31, 0.18)'
- `glow-sage`: '0 8px 24px rgba(79, 122, 36, 0.18)'

## Global CSS Tokens (`global.css`)

### CSS Variables (defined in :root)

#### Brand Colors
- `--color-persimmon-50`: `#FFF1EA`
- `--color-persimmon-100`: `#FFE0D1`
- `--color-persimmon-300`: `#FF9E76`
- `--color-persimmon-500`: `#E85A1F`
- `--color-persimmon-600`: `#C8460F`
- `--color-persimmon-700`: `#A1370C`

- `--color-cinnamon-500`: `#623418`
- `--color-cinnamon-700`: `#391C0A`

- `--color-sage-50`: `#EEF4E5`
- `--color-sage-100`: `#D7E5BF`
- `--color-sage-500`: `#4F7A24`
- `--color-sage-600`: `#3D5E1B`

#### Paper Surfaces
- `--color-paper-50`: `#FAFAF7`
- `--color-paper-100`: `#F2F0E8`
- `--color-paper-200`: `#F7F6F2`
- `--color-paper-300`: `#E6E3D8`

#### Ink (Text)
- `--color-ink-500`: `#564E45`
- `--color-ink-700`: `#28231D`
- `--color-ink-900`: `#0E0C0A`

#### Compatibility Aliases
- `--color-primary-500`: `#E85A1F`
- `--color-primary-600`: `#C8460F`
- `--color-secondary-50`: `#EEF4E5`
- `--color-secondary-600`: `#3D5E1B`
- `--color-surface-warm`: `#FFE0D1`
- `--color-background`: `#F7F6F2`
- `--color-surface-subtle`: `#FAFAF7`
- `--color-warm-900`: `#0E0C0A`
- `--color-warm-700`: `#28231D`
- `--color-warm-500`: `#564E45`
- `--color-success`: `#4F7A24`
- `--color-danger`: `#C13030`
- `--color-warning`: `#C77B0E`
- `--color-info`: `#2E6FA8`

#### Dark Mode Overrides (in @media prefers-color-scheme: dark)
All color variables have dark mode equivalents defined.

### Utility Classes Defined

#### Textures
- `.paper-texture`: Applies paper-50 background with radial gradient vignette
- `.paper-texture-warm`: Applies paper-100 background with warm-toned radial gradient

#### Dividers
- `.divider-dotted`: Dashed border-top using ink-300
- `.divider-dotted-thin`: Dotted border-top using ink-200

#### Typography
- `.label-caps`: 10px text, line-height 1.3, font-weight 700, letter-spacing 0.14em, uppercase

#### Interaction Styles
- `.press-scale`: Scale transition (120ms ease) with 0.97 scale on active
- `.focus-ring`: 2px outline using persimmon-300 with 2px offset on focus

## Available Tokens for Alert System Improvements

Based on the audit, the following tokens are available for alert system enhancements:

### Colors for Alert Variants
- **Success**: semantic-success (#4F7A24), sage-500, sage-50/100 for backgrounds
- **Error/Danger**: semantic-danger (#C13030), semantic-danger-50/100 for backgrounds
- **Warning**: semantic-warning (#C77B0E), semantic-warning-50/100 for backgrounds
- **Info**: semantic-info (#2E6FA8), semantic-info-50/100 for backgrounds
- **Default/Notice**: persimmon-500 (#E85A1F), persimmon-50/100 for backgrounds

### Typography for Alerts
- Label/Text styles: caption (12px), body (14px), h3 (16px) for different alert hierarchy
- Label variant: label (10px, uppercase, letter-spaced) for alert type badges
- Font weights: regular, semibold, extrabold for varying emphasis

### Spacing and Layout
- Consistent spacing scale for padding, margins, gaps
- Border radius: md (6px), lg (12px), card (16px) for different alert styles
- Shadow options: paper, paper-lift, card, raised for depth

### Interaction States
- Press scale for tactile feedback
- Focus rings for accessibility
- Transition timing for smooth animations

## Current Implementation Analysis

The existing Toast and Modal components already make good use of the design system:
- Toast component uses variant-based colors from the design system
- Modal component uses design system tokens for colors, spacing, and typography
- Both components maintain accessibility standards
- The system is already theme-aware through CSS variables

This audit confirms that the design system provides a comprehensive foundation for building an improved alert system that maintains visual consistency with the existing SariSari application.