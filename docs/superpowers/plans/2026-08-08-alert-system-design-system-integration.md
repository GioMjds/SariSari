# Alert System Design System Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the visual design of the alert system through better integration with the existing NativeWind/Tailwind design system, making alerts more consistent, maintainable, and theme-aware.

**Architecture:** Update the Modal component to use design system tokens instead of hardcoded values, then enhance the alert utility to leverage these improvements while maintaining backward compatibility.

**Tech Stack:** React Native, NativeWind/Tailwind, TypeScript, Zustand (for modal store)

## Global Constraints

- Must maintain backward compatibility with existing alert usage
- Must work with existing NativeWind/Tailwind configuration
- Must support both light and dark modes
- No breaking changes to public APIs
- Follow existing code patterns and conventions
- All monetary values use integer pesos (already handled in lower layers)
- Use async database operations where applicable

---

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
  - 250: `#D49570`
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
- `semantic-warning-50`: `$FCF1DE`
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
- `--color-primary-600`: `$C8460F`
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

---

### Task 1: Audit Current Design System Tokens

**Files:**

- Read: `tailwind.config.js`
- Read: `global.css`
- Modify: `docs/superpowers/plans/2026-08-08-alert-system-design-system-integration.md`

**Interfaces:**

- Consumes: None
- Produces: List of available design system tokens (colors, spacing, typography) for reference

- [ ] **Step 1: Examine tailwind.config.js to understand available tokens**

```javascript
// Examine the tailwind config to see what tokens are available
// Note down color palette, spacing scale, typography settings
```

- [ ] **Step 2: Check global.css for base styles and custom properties**

```css
/* Review global.css for any CSS variables or base styles */
```

- [ ] **Step 3: Document available tokens for reference in implementation**

Available tokens to be documented in plan:

- Colors: text-semantic-_, bg-semantic-_, border-semantic-*
- Spacing: space-_, p-_, m-* scales
- Typography: text-_, font-_, leading-_, tracking-*
- Shadows: shadow-*
- Radius: rounded-*

- [ ] **Step 4: Commit token audit documentation**

```bash
git add docs/superpowers/plans/2026-08-08-alert-system-design-system-integration.md
git commit -m "docs: record available design system tokens for alert system integration"
```

### Task 2: Update Modal Component Backdrop

**Files:**

- Modify: `components/ui/Modal.tsx:200-216`

**Interfaces:**

- Consumes: Design system background-muted token
- Produces: Updated backdrop with theme-aware opacity

- [ ] **Step 1: Write test to verify backdrop color uses design system token**

```typescript
// This would be a visual/regression test - for now we'll implement and verify manually
// In a real test setup, we might check computed styles or use snapshot testing
```

- [ ] **Step 2: Run test to verify current implementation**

Manually verify that the backdrop currently uses hardcoded rgba(14, 12, 10, 0.4)

- [ ] **Step 3: Write minimal implementation using design system token**

```diff
      {/* Backdrop */}
      <MotiView
        from={{ opacity: 0 }}
        animate{{ opacity: 1 }}
        exit{{ opacity: 0 }}
        transition={{ type: 'timing', duration: 200 }}
        style={[
          StyleSheet.absoluteFillObject,
+         { backgroundColor: 'rgba(var(--background-muted), 0.4)' },
-         { backgroundColor: 'rgba(14, 12, 10, 0.4)' },
        ]}
      >
        <Pressable
          accessibilityLabel="Dismiss"
          accessibilityRole="button"
          onPress={handleOverlayPress}
          style={StyleSheet.absoluteFill}
        />
      </MotiView>
```

- [ ] **Step 4: Run test to verify it passes**

Manually verify that the backdrop now uses the CSS variable and adapts to theme changes

- [ ] **Step 5: Commit backdrop update**

```bash
git add components/ui/Modal.tsx
git commit -m "feat(modal): update backdrop to use design system token"
```

### Task 3: Update Modal Component Variant Colors

**Files:**

- Modify: `components/ui/Modal.tsx:147-180`

**Interfaces:**

- Consumes: Design system semantic color tokens
- Produces: Updated variant colors that adapt to theme

- [ ] **Step 1: Write test to verify variant colors use design system tokens**

Manual verification test

- [ ] **Step 2: Run test to verify current implementation**

Check that iconColor, iconBg, etc. use hardcoded values

- [ ] **Step 3: Write minimal implementation using design system tokens**

```diff
  const getVariantStyles = () => {
    switch (finalVariant) {
      case 'danger':
        return {
-         iconBg: 'bg-semantic-danger-50',
-         iconColor: '#C13030',
-         defaultIcon: 'exclamation-triangle',
+         iconBg: 'bg-semantic-danger-50',
+         iconColor: 'text-semantic-danger',
+         defaultIcon: 'exclamation-triangle',
        };
      case 'success':
        return {
-         iconBg: 'bg-sage-50',
-         iconColor: '#3D5E1B',
-         defaultIcon: 'check-circle',
+         iconBg: 'bg-sage-50',
+         iconColor: 'text-semantic-success',
+         defaultIcon: 'check-circle',
        };
      case 'warning':
        return {
-         iconBg: 'bg-semantic-warning-50',
-         iconColor: '#C77B0E',
-         defaultIcon: 'exclamation-circle',
+         iconBg: 'bg-semantic-warning-50',
+         iconColor: 'text-semantic-warning',
+         defaultIcon: 'exclamation-circle',
        };
      case 'info':
        return {
-         iconBg: 'bg-semantic-info-50',
-         iconColor: '#2E6FA8',
-         defaultIcon: 'info-circle',
+         iconBg: 'bg-semantic-info-50',
+         iconColor: 'text-semantic-info',
+         defaultIcon: 'info-circle',
        };
      default:
        return {
-         iconBg: 'bg-surface-warm',
-         iconColor: '#B45309',
-         defaultIcon: 'info-circle',
+         iconBg: 'bg-surface-warm',
+         iconColor: 'text-semantic-info', // or appropriate default
+         defaultIcon: 'info-circle',
        };
    }
  };
```

- [ ] **Step 4: Run test to verify it passes**

Manually verify that variant colors now use semantic tokens and adapt to theme

- [ ] **Step 5: Commit variant colors update**

```bash
git add components/ui/Modal.tsx
git commit -m "feat(modal): update variant colors to use design system tokens"
```

### Task 4: Update Modal Component Text Styles

**Files:**

- Modify: `components/ui/Modal.tsx:257-272`

**Interfaces:**

- Consumes: Design system typography tokens
- Produces: Updated text styles using type scale

- [ ] **Step 1: Write test to verify text styles use design system tokens**

Manual verification

- [ ] **Step 2: Run test to verify current implementation**

Check that title and description text use hardcoded font sizes and weights

- [ ] **Step 3: Write minimal implementation using design system typography**

```diff
            {finalTitle && (
-             <StyledText
-               variant="extrabold"
-               className="text-warm-900 text-xl mb-2 text-center"
-             >
-               {finalTitle}
-             </StyledText>
+             <StyledText
+               variant="extrabold"
+               className="text-heading-medium text-warm-900 mb-4 text-center"
+             >
+               {finalTitle}
+             </StyledText>
            )}
            {finalDescription && (
-             <StyledText
-               variant="regular"
-               className="text-warm-700 text-sm text-center"
-             >
-               {finalDescription}
-             </StyledText>
+             <StyledText
+               variant="regular"
+               className="text-body-medium text-warm-700 mb-4 text-center"
+             >
+               {finalDescription}
+             </StyledText>
            )}
```

- [ ] **Step 4: Run test to verify it passes**

Manually verify that text now uses semantic type scale classes

- [ ] **Step 5: Commit text styles update**

```bash
git add components/ui/Modal.tsx
git commit -m "feat(modal): update text styles to use design system typography"
```

### Task 5: Update Modal Component Spacing and Layout

**Files:**

- Modify: `components/ui/Modal.tsx:185-344`

**Interfaces:**

- Consumes: Design system spacing tokens
- Produces: Updated spacing using 4-based scale

- [ ] **Step 1: Write test to verify spacing uses design system tokens**

Manual verification

- [ ] **Step 2: Run test to verify current implementation**

Check that padding, margins, and spacing use hardcoded values

- [ ] **Step 3: Write minimal implementation using design system spacing**

```diff
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            justifyContent: 'center',
            alignItems: 'center',
-           paddingHorizontal: 24,
+           paddingHorizontal: 'space-x-6', // or appropriate spacing value
            zIndex: 9999,
            elevation: 9999,
          },
        ]}
        pointerEvents={isVisible ? 'auto' : 'none'}
      >
```

```diff
        {/* Modal Dialog Card */}
        <MotiView
          from={{
            opacity: 0,
            scale: reducedMotion ? 1 : 0.95,
          }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{
            opacity: 0,
            scale: reducedMotion ? 1 : 0.95,
          }}
          transition={{ type: 'timing', duration: 200 }}
          style={{
            backgroundColor: '#FFFFFF';
            borderRadius: 16;
-           padding: 24;
+           padding: 'space-y-6';
            width: '100%';
            maxWidth: getSizeWidth();
            zIndex: 1;
          }}
          accessibilityLabel={finalTitle || 'Dialog'}
        >
```

```diff
            {(finalIcon || finalVariant !== 'default') && (
-             <View
-               className={`${variantStyles.iconBg} rounded-full px-4 py-3 mb-3`}
-             >
+             <View
+               className={`${variantStyles.iconBg} rounded-full px-3 py-2 mb-3`}
+             >
            )}
```

```diff
            {finalTitle && (
-             <StyledText
-               variant="extrabold"
-               className="text-warm-900 text-xl mb-2 text-center"
-             >
-               {finalTitle}
-             </StyledText>
+             <StyledText
+               variant="extrabold"
+               className="text-heading-medium text-warm-900 mb-4 text-center"
+             >
+               {finalTitle}
+             </StyledText>
            )}
            {finalDescription && (
-             <StyledText
-               variant="regular"
-               className="text-warm-700 text-sm text-center"
-             >
-               {finalDescription}
-             </StyledText>
+             <StyledText
+               variant="regular"
+               className="text-body-medium text-warm-700 mb-4 text-center"
+             >
+               {finalDescription}
+             </StyledText>
            )}
```

```diff
          {/* Custom Content */}
          {finalChildren && <View className="mb-4">{finalChildren}</View>}
```

```diff
          {/* Buttons */}
          {finalButtons && finalButtons.length > 0 && (
-           <View className="gap-3">
+           <View className="gap-4">
            {finalButtons.map((button: ModalButton, index: number) => {
              // ... button logic remains the same
              return (
                <Pressable
                  key={index}
                  onPress={() => {
                    button.onPress?.();
                    if (id) closeModal(id);
                  }}
                  disabled={isLoading}
                  accessibilityRole="button"
                  accessibilityLabel={button.text}
-                 className={`${bgClass} ${borderClass} rounded-xl py-3 press-scale active:opacity-70`}
+                 className={`${bgClass} ${borderClass} rounded-xl py-2.5 press-scale active:opacity-70`}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <StyledText
                      variant={isCancel ? 'semibold' : 'extrabold'}
                      className={`${textClass} text-center text-base`}
                    >
                      {button.text}
                    </StyledText>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
```

```diff
          {/* Close Button (if no buttons and showCloseButton is true) */}
          {finalShowCloseButton &&
          (!finalButtons || finalButtons.length === 0) && (
            <Pressable
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
-             className="absolute top-4 right-4 z-10 w-8 h-8 justify-center items-center rounded-full bg-gray-100 press-scale active:opacity-70"
+             className="absolute top-3 right-3 z-10 w-7 h-7 justify-center items-center rounded-full bg-gray-100 press-scale active:opacity-70"
            >
              <FontAwesome name="times" size={18} color="#A89F90" />
            </Pressable
          )}
```

- [ ] **Step 4: Run test to verify it passes**

Manually verify that spacing now uses design system tokens and maintains similar visual appearance

- [ ] **Step 5: Commit spacing and layout update**

```bash
git add components/ui/Modal.tsx
git commit -m "feat(modal): update spacing and layout to use design system tokens"
```

### Task 6: Update Alert Utility for Better Variant Mapping

**Files:**

- Modify: `utils/alert.ts:17-38`

**Interfaces:**

- Consumes: Enhanced Modal component with design system tokens
- Produces: Improved alert utility with better semantic variant mapping

- [x] **Step 1: Write test to verify alert variant mapping**

Manual verification test

- [x] **Step 2: Run test to verify current implementation**

Check that alert currently uses basic danger/default mapping

- [x] **Step 3: Write minimal implementation with improved variant mapping**

```diff
const alert = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: AlertOptions,
) => {
  const { openModal } = useModalStore.getState();

  const modalButtons: ModalButton[] = buttons
    ? buttons.map((btn) => ({
        text: btn.text || 'OK',
        style: btn.style,
        onPress: btn.onPress,
      }))
    : [{ text: 'OK', style: 'default' }];

  // Determine variant based on buttons or content
  // If there is a destructive button, set variant to danger
  const hasDestructive = modalButtons.some((b) => b.style === 'destructive');
- const variant = hasDestructive ? 'danger' : 'default';
+ const variant = hasDestructive ? 'danger' : 'info';

  openModal({
    title,
    description: message,
    buttons: modalButtons,
    variant,
    closeOnOverlay: options?.cancelable ?? true,
    closeOnEscape: options?.cancelable ?? true,
    onClose: options?.onDismiss,
  });
};
```

- [x] **Step 4: Run test to verify it passes**

Manually verify that alert now maps to 'info' variant by default instead of 'default'

- [x] **Step 5: Commit alert utility update**

```bash
git add utils/alert.ts
git commit -m "feat(alert): improve variant mapping to use info as default variant"
```

### Task 7: Update Alert Utility Button Styling Consistency

**Files:**

- Modify: `utils/alert.ts:17-38`

**Interfaces:**

- Consumes: Enhanced Modal button styling
- Produces: Alert buttons that leverage improved Modal button styling

- [ ] **Step 1: Write test to verify alert button styling consistency**

Manual verification - ensure alert buttons use same styling as Modal buttons

- [ ] **Step 2: Run test to verify current implementation**

Check that alert relies on Modal's internal button styling

- [ ] **Step 3: Write implementation (no changes needed - Modal already handles button styling)**

The alert utility already passes buttons directly to Modal, so it will automatically benefit from the Modal button styling improvements we made.

```diff
// No changes needed here - the alert utility already leverages Modal's button styling
const alert = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: AlertOptions,
) => {
  // ... existing implementation
};
```

- [ ] **Step 4: Run test to verify it passes**

Manually verify that alert buttons now use the improved Modal button styling

- [ ] **Step 5: Commit verification of button styling consistency**

```bash
git add utils/alert.ts
git commit -m "feat(alert): verify button styling consistency with enhanced Modal"
```

### Task 8: Test Dark/Light Mode Adaptation

**Files:**

- Modify: `components/ui/Modal.tsx` (various)
- Test: Manual verification

**Interfaces:**

- Consumes: Design system theme tokens
- Produces: Theme-aware alert modals

- [ ] **Step 1: Write test to verify dark mode colors adapt**

Manual verification test

- [ ] **Step 2: Run test to verify current light mode appearance**

Check modal appearance in light mode

- [ ] **Step 3: Implement and verify dark mode adaptation**

Since we're using semantic color tokens like `text-semantic-danger`, `bg-semantic-danger-50`, etc., these should automatically adapt based on the theme. We need to verify:

1. Backdrop opacity works in both modes
2. Variant colors (danger, success, etc.) have appropriate contrast in both modes
3. Text remains readable in both modes

- [ ] **Step 4: Run test to verify it passes**

Manually test in both light and dark modes to ensure proper appearance

- [ ] **Step 5: Commit theme adaptation verification**

```bash
git add components/ui/Modal.tsx
git commit -m "feat(modal): verify dark/light mode adaptation with design system tokens"
```

### Task 9: Update Documentation and Add Comments

**Files:**

- Modify: `components/ui/Modal.tsx` (add comments)
- Modify: `utils/alert.ts` (add comments)
- Modify: `docs/superpowers/plans/2026-08-08-alert-system-design-system-integration.md`

**Interfaces:**

- Consumes: None
- Produces: Better documented code with explanations of design system usage

- [ ] **Step 1: Write test to verify documentation completeness**

Manual verification

- [ ] **Step 2: Run test to verify current documentation level**

Check current comment density and clarity

- [ ] **Step 3: Write minimal implementation adding helpful comments**

```diff
+ // Backdrop - uses theme-aware background color with 40% opacity
+ // The CSS variable --background-muted should be defined in your CSS to adapt to theme
      <MotiView
        from={{ opacity: 0 }}
        animate{{ opacity: 1 }}
        exit{{ opacity: 0 }}
        transition={{ type: 'timing', duration: 200 }}
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: 'rgba(var(--background-muted), 0.4)' },
        ]}
      >
```

```diff
+ // Variant styles - use semantic color tokens that adapt to light/dark theme
+ // These ensure proper contrast and theme compliance
  const getVariantStyles = () => {
    switch (finalVariant) {
      case 'danger':
        return {
          // Using bg-semantic-danger-50 for background and text-semantic-danger for icon
          // These tokens automatically adapt to light/dark themes
          iconBg: 'bg-semantic-danger-50';
          iconColor: 'text-semantic-danger';
          defaultIcon: 'exclamation-triangle';
        };
      // ... rest remains similar with comments
    }
  };
```

```diff
+ // Alert utility - maps to Modal component which now uses design system tokens
+ // Default variant changed from 'default' to 'info' for better semantic meaning
+ // Button styling is handled entirely by the Modal component for consistency
const alert = (
  // ... params
) => {
  // ... implementation
};
```

- [ ] **Step 4: Run test to verify it passes**

Manually verify that comments are clear and helpful

- [ ] **Step 5: Commit documentation updates**

```bash
git add components/ui/Modal.tsx utils/alert.ts docs/superpowers/plans/2026-08-08-alert-system-design-system-integration.md
git commit -m "docs: add comments explaining design system integration in alert system"
```

### Task 10: Final Verification and Integration Testing

**Files:**

- Test: Various alert usages throughout the app
- Modify: None (verification only)

**Interfaces:**

- Consumes: All updated alert system components
- Produces: Verified working alert system with design system integration

- [ ] **Step 1: Write test to verify end-to-end alert functionality**

Manual verification of:

1. Basic alert() calls
2. Alerts with destructive buttons
3. Alerts with custom buttons
4. Alerts in different contexts (checkout, inventory, etc.)

- [ ] **Step 2: Run test to verify current implementation**

Test alert system in various parts of the app:

- Checkout modal (uses alert internally)
- Inventory alerts
- Any other places where Alert.utility is used
- Direct Modal usage

- [ ] **Step 3: Implement and verify end-to-end functionality**

Test the following scenarios:

- Success alerts (variant: success)
- Error alerts (variant: danger)
- Warning alerts (variant: warning)
- Info alerts (variant: info)
- Alerts with various button combinations
- Alerts in both light and dark modes

- [ ] **Step 4: Run test to verify it passes**

Manually verify that:

1. Alerts visually integrate with the rest of the app
2. Spacing, typography, and colors are consistent
3. Theme adaptation works properly
4. No breaking changes to existing usage
5. Button interactions work correctly
6. Loading states display properly

- [ ] **Step 5: Commit final verification**

```bash
git add .
git commit -m "feat(alert system): complete design system integration verification"
```
