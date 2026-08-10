# Custom Tally Bead LoadingBar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a custom, minimalist, animated `LoadingBar` component for SariSari in `components/ui/LoadingBar.tsx` featuring the Tally Bead Wave motif and 60fps Reanimated 4 UI-thread performance.

**Architecture:** A container `<View>` rendering 5 `<Animated.View>` capsule beads. Each bead handles an isolated Reanimated shared value running a sequence loop with staggered `index * 120ms` delay to create a fluid wave transformation (`scaleY` and `opacity`).

**Tech Stack:** React Native 0.81, Expo SDK 54, React Native Reanimated 4, NativeWind v4, TypeScript, Jest, React Native Testing Library.

## Global Constraints

- **File Location:** `components/ui/LoadingBar.tsx` (replaces stub)
- **Single Handle SQLite / DB Rules:** N/A (UI presentation component)
- **Styling:** NativeWind `className` + Reanimated `useAnimatedStyle`
- **Quality Gates:** `npm typecheck` must compile cleanly with strict flags; Jest tests must pass.

---

### Task 1: Component Unit Tests (`tests/components/LoadingBar.test.tsx`)

**Files:**

- Create: `tests/components/LoadingBar.test.tsx`
- Modify: `components/ui/LoadingBar.tsx`

**Interfaces:**

- Consumes: Reanimated 4, React Native Testing Library
- Produces: Test suite for `LoadingBar` props, sizes, color schemes, and accessibility.

- [ ] **Step 1: Write the failing unit tests**

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { LoadingBar } from '@/components/ui/LoadingBar';

describe('LoadingBar Component', () => {
  it('renders default LoadingBar with progressbar accessibility role', () => {
    const { getByRole } = render(<LoadingBar />);
    const bar = getByRole('progressbar');
    expect(bar).toBeTruthy();
  });

  it('renders optional text label when provided', () => {
    const { getByText } = render(<LoadingBar label="Kinakalkula..." />);
    expect(getByText('Kinakalkula...')).toBeTruthy();
  });

  it('renders with custom size and color scheme without crashing', () => {
    const { getByRole } = render(
      <LoadingBar size="lg" colorScheme="sage" className="my-4" />,
    );
    const bar = getByRole('progressbar');
    expect(bar).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/components/LoadingBar.test.tsx`
Expected: FAIL ("LoadingBar is not exported or returns null")

- [ ] **Step 3: Write minimal implementation in `components/ui/LoadingBar.tsx`**

```tsx
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';

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

const SIZE_MAP = {
  sm: { beadWidth: 4, beadHeight: 10, gap: 4, height: 16 },
  md: { beadWidth: 6, beadHeight: 16, gap: 6, height: 24 },
  lg: { beadWidth: 8, beadHeight: 22, gap: 8, height: 32 },
};

const COLOR_MAP = {
  brand: ['#E85A1F', '#FA7A4B', '#623418', '#4F7A24', '#4F7A24'],
  persimmon: ['#FA7A4B', '#E85A1F', '#C8460F', '#E85A1F', '#FA7A4B'],
  sage: ['#92B662', '#4F7A24', '#3D5E1B', '#4F7A24', '#92B662'],
  ink: ['#A89F90', '#564E45', '#28231D', '#564E45', '#A89F90'],
};

interface BeadItemProps {
  index: number;
  color: string;
  beadWidth: number;
  beadHeight: number;
}

function BeadItem({ index, color, beadWidth, beadHeight }: BeadItemProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withDelay(
        index * 120,
        withSequence(
          withTiming(1, { duration: 350, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 350, easing: Easing.in(Easing.quad) }),
        ),
      ),
      -1,
      false,
    );
  }, [index, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scaleY: interpolate(progress.value, [0, 1], [0.75, 1.25]),
        },
      ],
      opacity: interpolate(progress.value, [0, 1], [0.35, 1.0]),
    };
  });

  return (
    <Animated.View
      style={[
        {
          width: beadWidth,
          height: beadHeight,
          backgroundColor: color,
          borderRadius: beadWidth / 2,
        },
        animatedStyle,
      ]}
    />
  );
}

export function LoadingBar({
  size = 'md',
  colorScheme = 'brand',
  label,
  labelPosition = 'right',
  className = '',
  testID = 'loading-bar',
}: LoadingBarProps) {
  const config = SIZE_MAP[size];
  const colors = COLOR_MAP[colorScheme];

  const isBottom = labelPosition === 'bottom';

  return (
    <View
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      className={`flex-row items-center justify-center ${
        isBottom ? 'flex-col gap-2' : 'gap-3'
      } ${className}`}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: config.gap,
          height: config.height,
        }}
      >
        {colors.map((color, index) => (
          <BeadItem
            key={index}
            index={index}
            color={color}
            beadWidth={config.beadWidth}
            beadHeight={config.beadHeight}
          />
        ))}
      </View>
      {Boolean(label) && (
        <Text className="text-xs font-semibold text-ink-500">{label}</Text>
      )}
    </View>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/components/LoadingBar.test.tsx`
Expected: PASS (3 passing tests)

- [ ] **Step 5: Commit**

```bash
git add components/ui/LoadingBar.tsx tests/components/LoadingBar.test.tsx
git commit -m "feat(ui): implement custom Tally Bead LoadingBar component"
```

---

### Task 2: Re-export in `components/ui/index.ts` & Verify Types

**Files:**

- Modify: `components/ui/index.ts`

**Interfaces:**

- Consumes: `components/ui/LoadingBar.tsx`
- Produces: Public export `export * from './LoadingBar'`

- [ ] **Step 1: Check existing `components/ui/index.ts`**

View `components/ui/index.ts` to ensure clean export syntax.

- [ ] **Step 2: Update `components/ui/index.ts`**

Add `export * from './LoadingBar';` to `components/ui/index.ts`.

- [ ] **Step 3: Run typecheck and verification**

Run: `npm verify`
Expected: Typecheck passes cleanly without any error, all unit tests pass.

- [ ] **Step 4: Commit**

```bash
git add components/ui/index.ts
git commit -m "chore(ui): re-export LoadingBar component"
```
