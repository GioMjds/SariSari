# Design Spec: Custom Tally Bead LoadingBar Component

**Date:** 2026-08-10  
**Target File:** `components/ui/LoadingBar.tsx`  
**Status:** Approved

---

## 1. Executive Summary

This spec defines the custom, minimalist, animated `LoadingBar` component for SariSari. Departing from generic spinners, `LoadingBar` introduces the **Tally Bead Wave** — a 5-bead vertical capsule animation inspired by Filipino sari-sari store suki credit tally marks and abacus counters. It runs at 60fps on the React Native UI thread using Reanimated 4 and NativeWind v4 styling.

---

## 2. Goals & Key Requirements

- **Brand-aligned Aesthetic:** Distinctive minimalist Filipino store motif featuring SariSari brand tokens (Persimmon `#E85A1F`, Cinnamon `#623418`, Sage `#4F7A24`).
- **High Performance:** 100% UI thread execution via Reanimated 4 (`useSharedValue`, `useAnimatedStyle`, `withRepeat`, `withSequence`, `withDelay`). No JS main thread blocking during heavy database or network operations.
- **Flexible Usage:** Designed as the primary global loading bar component in `components/ui/LoadingBar.tsx`, supporting inline lists, card loading, pull-to-refresh headers, and full-section loading states.
- **Accessible & Typed:** Strict TypeScript props with full React Native accessibility state metadata (`accessibilityRole="progressbar"`).

---

## 3. Component Interface & API

### Location

`components/ui/LoadingBar.tsx` (replaces current stub file)

### Props Interface

```typescript
export interface LoadingBarProps {
  /** Size variant of the tally beads */
  size?: 'sm' | 'md' | 'lg';
  /** Color palette variant */
  colorScheme?: 'brand' | 'persimmon' | 'sage' | 'ink';
  /** Optional text label displayed next to or below beads */
  label?: string;
  /** Position of optional label relative to beads */
  labelPosition?: 'right' | 'bottom';
  /** NativeWind class name wrapper for layout & margins */
  className?: string;
  /** Optional test identifier */
  testID?: string;
}
```

### Size Dimensions Matrix

| Variant          | Bead Width | Bead Base Height | Bead Gap | Container Height | Primary Usage                        |
| :--------------- | :--------- | :--------------- | :------- | :--------------- | :----------------------------------- |
| `'sm'`           | 4px        | 10px             | 4px      | 16px             | Small buttons, search input loading  |
| `'md'` (default) | 6px        | 16px             | 6px      | 24px             | Cards, list headers, pull-to-refresh |
| `'lg'`           | 8px        | 22px             | 8px      | 32px             | Section loader, full screen overlay  |

### Color Scheme Palette Matrix

| Scheme              | Bead 1                | Bead 2                      | Bead 3               | Bead 4           | Bead 5           |
| :------------------ | :-------------------- | :-------------------------- | :------------------- | :--------------- | :--------------- |
| `'brand'` (default) | Persimmon (`#E85A1F`) | Persimmon-Light (`#FA7A4B`) | Cinnamon (`#623418`) | Sage (`#4F7A24`) | Sage (`#4F7A24`) |
| `'persimmon'`       | `persimmon-400`       | `persimmon-500`             | `persimmon-600`      | `persimmon-500`  | `persimmon-400`  |
| `'sage'`            | `sage-400`            | `sage-500`                  | `sage-600`           | `sage-500`       | `sage-400`       |
| `'ink'`             | `ink-300`             | `ink-500`                   | `ink-700`            | `ink-500`        | `ink-300`        |

---

## 4. Architecture & Animation Mechanics

### Structure

```
LoadingBar (Container View)
 ├── BeadItem 0 (index=0, delay=0ms)
 ├── BeadItem 1 (index=1, delay=120ms)
 ├── BeadItem 2 (index=2, delay=240ms)
 ├── BeadItem 3 (index=3, delay=360ms)
 └── BeadItem 4 (index=4, delay=480ms)
 └── [Optional Text Label]
```

### Reanimated 4 Engine Specifications

- Each `BeadItem` maintains an isolated `progress` shared value (`useSharedValue(0)`).
- On mount:
  ```typescript
  progress.value = withRepeat(
    withDelay(
      index * 120,
      withSequence(
        withTiming(1, { duration: 350, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 350, easing: Easing.in(Easing.quad) }),
      ),
    ),
    -1, // Infinite loop
    false,
  );
  ```
- Animated Transform & Opacity:
  - `transform: [{ scaleY: interpolate(progress.value, [0, 1], [0.75, 1.25]) }]`
  - `opacity: interpolate(progress.value, [0, 1], [0.35, 1.0])`

---

## 5. Testing & Verification Plan

1. **Type Checking:** Run `npm typecheck` (`tsc --noEmit`) to verify zero TypeScript errors.
2. **Linting:** Run `npm lint` to verify compliance with Expo ESLint rules.
3. **Unit / Snapshot Tests:** Add test cases in `tests/components/LoadingBar.test.tsx` verifying:
   - Renders successfully with default props.
   - Applies custom `size`, `colorScheme`, and `label` correctly.
   - Sets accessibility attributes (`accessibilityRole="progressbar"`, `accessibilityState={{ busy: true }}`).
4. **Verification Command:** `npm verify` (typecheck + jest tests).

---

## 6. Migration & Usage Guidelines

Replace any inline ActivityIndicators or loading placeholders across screens with `<LoadingBar size="md" />` or `<LoadingBar size="sm" label="Naglo-load..." />`.
