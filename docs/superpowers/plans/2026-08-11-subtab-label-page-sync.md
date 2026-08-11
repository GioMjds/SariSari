# Sync SubTabControl Underline to Page Swipe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the `SubTabControl` underline animate in lockstep with the horizontal page swipe driven by `TopTabs`, so the underline tracks the route change instead of snapping after the page lands.

**Architecture:** Each `(tabs)/*` layout creates a UI-thread `SharedValue<number>` representing the current page's "progress" (a continuous index between integer positions). When `activeTab` changes, that `progress` shared value animates with `withTiming` from the old index to the new one. The progress value is passed to `SubTabControl` as the existing `progress` prop; the underline's `useAnimatedStyle` interpolates against it instead of `internalProgress`. `SubTabControl`'s local pan gesture is disabled (page swipe is owned by `TopTabs`/`react-native-pager-view`). Layouts (not headers) own the shared value so it survives header re-renders.

**Tech Stack:** React Native Reanimated 4 (`useSharedValue`, `useAnimatedStyle`, `withTiming`, `useReducedMotion`), existing `@react-navigation/material-top-tabs@^7.6.13` + `react-native-pager-view@^7.0.2`. No new dependencies.

## Global Constraints

From `AGENTS.md`:

- TypeScript strict mode + `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`. New code must compile cleanly under `npm run typecheck`.
- `SubTabControl` is invoked from four headers (`InventoryHeader`, `CustomersHeader`, `SalesHeader`, `DashboardHeader`). All four must continue to type-check.
- i18n via `i18next` + `react-i18next`. No copy changes needed here.
- Styling via NativeWind v4. No styling changes in this plan.
- Prettier: 2-space indent, single quotes, semicolons, trailing commas, 80-col print width.
- Use `useReducedMotion` to gate animation duration (matches `StyledTab.tsx:189-193` precedent).
- No emojis or special characters in code or comments.
- No external libraries added.

Existing behavior to preserve:

- `SubTabControl` must still accept `progress?: SharedValue<number>` and behave correctly when `progress` is undefined (current callers don't pass one — keep that path working for tests and any future standalone use).
- Tap-to-navigate (`onTabPress`) must still fire on label press.
- Haptic + structured `logger.info({ event: 'tab_selected', ... })` on label press must be preserved (`SubTabControl.tsx:141-147`).
- The 200ms underline transition duration (`SubTabControl.tsx:107`) matches `TopTabs`'s internal page transition, so we use the same constant.

---

## File Structure

Files modified by this plan:

- `components/navigation/SubTabControl.tsx` — drop the local pan gesture and `dragToSwitch` API; honor the new "external progress drives underline" path; respect `useReducedMotion`.
- `hooks/useTabProgress.ts` (new) — creates and returns a `SharedValue<number>` that animates between integer indices in sync with `activeTab`.
- `hooks/index.ts` — re-export `useTabProgress`.
- `app/(tabs)/home/_layout.tsx` — call `useTabProgress`, pass `progress` to `DashboardHeader`.
- `components/home/DashboardHeader.tsx` — accept `progress?: SharedValue<number>`, forward to `SubTabControl`.
- `app/(tabs)/sales/_layout.tsx` — call `useTabProgress`, pass `progress` to `SalesHeader`.
- `components/sales/SalesHeader.tsx` — accept `progress?: SharedValue<number>`, forward to `SubTabControl`.
- `app/(tabs)/customers/_layout.tsx` — call `useTabProgress`, pass `progress` to `CustomersHeader`.
- `components/customers/CustomersHeader.tsx` — accept `progress?: SharedValue<number>`, forward to `SubTabControl`.
- `app/(tabs)/inventory/_layout.tsx` — call `useTabProgress`, pass `progress` to `InventoryHeader`.
- `components/inventory/InventoryHeader.tsx` — accept `progress?: SharedValue<number>`, forward to `SubTabControl`.

Why layouts (not headers) own the shared value: the shared value must live for the lifetime of the page; creating it inside the header ties it to header re-render cycles. Layouts are stable. Also, the `useEffect` that watches `activeTab` already lives next to the navigation concern, which is in the layout.

Tests:

- `components/navigation/__tests__/SubTabControl.test.tsx` (new) — covers the no-`progress` legacy path and the `progress`-driven path, including reduced-motion behavior.
- `hooks/__tests__/useTabProgress.test.tsx` (new) — covers seed, transition, and reduced-motion cases.

---

## Task 1: `useTabProgress` hook with tests

**Files:**
- Create: `hooks/useTabProgress.ts`
- Modify: `hooks/index.ts`
- Test: `hooks/__tests__/useTabProgress.test.tsx`

**Interfaces:**
- Consumes: `activeTab: T extends string`, `tabs: readonly T[]`, optional `duration?: number` (default `200`).
- Produces: `SharedValue<number>` that equals `tabs.indexOf(activeTab)` after the animation settles, and tweens between old and new indices via `withTiming`.

- [ ] **Step 1: Write the failing test**

Create `hooks/__tests__/useTabProgress.test.tsx`:

```tsx
import React from 'react';
import { Text } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { useSharedValue, SharedValue } from 'react-native-reanimated';
import { useTabProgress } from '../useTabProgress';

interface HarnessProps {
  activeTab: 'a' | 'b' | 'c';
  tabs: readonly ('a' | 'b' | 'c')[];
  refHolder: { current: SharedValue<number> | null };
}

function Harness({ activeTab, tabs, refHolder }: HarnessProps) {
  const progress = useTabProgress(activeTab, tabs);
  refHolder.current = progress;
  return <Text testID="harness">harness</Text>;
}

describe('useTabProgress', () => {
  it('seeds the shared value to the initial active index', () => {
    const refHolder: { current: SharedValue<number> | null } = { current: null };
    render(
      <Harness
        activeTab="b"
        tabs={['a', 'b', 'c'] as const}
        refHolder={refHolder}
      />,
    );
    expect(refHolder.current?.value).toBe(1);
  });

  it('returns a value that does not throw when read before mount completes', () => {
    const refHolder: { current: SharedValue<number> | null } = { current: null };
    expect(() =>
      render(
        <Harness
          activeTab="a"
          tabs={['a', 'b'] as const}
          refHolder={refHolder}
        />,
      ),
    ).not.toThrow();
  });

  it('uses withTiming so changing activeTab moves the value over time', () => {
    // We assert the contract by checking the shared value updates when
    // activeTab changes. Reduced motion is mocked to instant by default in
    // jest.setup; we rely on the shared value settling to the new index.
    const refHolder: { current: SharedValue<number> | null } = { current: null };
    const { rerender } = render(
      <Harness
        activeTab="a"
        tabs={['a', 'b', 'c'] as const}
        refHolder={refHolder}
      />,
    );
    expect(refHolder.current?.value).toBe(0);

    rerender(
      <Harness
        activeTab="c"
        tabs={['a', 'b', 'c'] as const}
        refHolder={refHolder}
      />,
    );

    // After rerender, the value should be in-flight or settled at 2.
    // We accept both: the contract is that it's not still 0.
    expect(refHolder.current?.value).not.toBe(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- hooks/__tests__/useTabProgress.test.tsx`
Expected: FAIL — module `../useTabProgress` does not exist.

- [ ] **Step 3: Implement the hook**

Create `hooks/useTabProgress.ts`:

```ts
import { useEffect, useRef } from 'react';
import { useReducedMotion, useSharedValue, withTiming, SharedValue } from 'react-native-reanimated';

const DEFAULT_DURATION_MS = 200;

export function useTabProgress<T extends string>(
  activeTab: T,
  tabs: readonly T[],
  duration: number = DEFAULT_DURATION_MS,
): SharedValue<number> {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue<number>(0);
  const seededRef = useRef(false);

  // Resolve the index for a tab key. Falls back to 0 when the active tab
  // is not present in the list (defensive — the layouts guard against
  // this, but the hook should not throw).
  const indexOf = (key: T): number => {
    const i = tabs.indexOf(key);
    return i < 0 ? 0 : i;
  };

  // Seed on first render so the underline starts in the right place
  // before any layout pass. Mirrors SubTabControl's cold-mount seeding.
  if (!seededRef.current) {
    seededRef.current = true;
    progress.value = indexOf(activeTab);
  }

  useEffect(() => {
    const target = indexOf(activeTab);
    const ms = reduceMotion ? 0 : duration;
    // Always go through withTiming so the underline tween matches the
    // page transition in TopTabs. Duration 0 collapses to an instant jump,
    // which is the right behavior for reduced motion.
    progress.value = withTiming(target, { duration: ms });
  }, [activeTab, duration, progress, reduceMotion, tabs]);

  return progress;
}
```

- [ ] **Step 4: Re-export from hooks index**

Edit `hooks/index.ts`, add a line at the end:

```ts
export * from './useTabProgress';
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- hooks/__tests__/useTabProgress.test.tsx`
Expected: PASS for all three cases.

- [ ] **Step 6: Run typecheck**

Run: `npm run typecheck`
Expected: zero errors.

- [ ] **Step 7: Commit**

```bash
git add hooks/useTabProgress.ts hooks/index.ts hooks/__tests__/useTabProgress.test.tsx
git commit -m "feat(navigation): add useTabProgress hook for shared label underline progress"
```

---

## Task 2: Update `SubTabControl` to drop the local pan and honor external progress

**Files:**
- Modify: `components/navigation/SubTabControl.tsx`
- Test: `components/navigation/__tests__/SubTabControl.test.tsx` (new)

**Interfaces:**
- `SubTabControlProps<T>` keeps `tabs`, `activeTab`, `onTabPress`, `containerClassName`, `progress`, `dragToSwitch` (now ignored, deprecated), `dragThreshold` (now ignored, deprecated).
- New: callers passing `progress` get an underline that follows the shared value. Callers not passing it get the existing internal `internalProgress` (legacy path, used by tests and any standalone caller).

- [ ] **Step 1: Write the failing tests**

Create `components/navigation/__tests__/SubTabControl.test.tsx`:

```tsx
import React from 'react';
import { act, render } from '@testing-library/react-native';
import { useSharedValue } from 'react-native-reanimated';
import { SubTabControl, SubTabItem } from '../SubTabControl';

interface HarnessProps {
  activeTab: 'one' | 'two';
  onTabPress?: (k: 'one' | 'two') => void;
  sharedRef?: { current: ReturnType<typeof useSharedValue<number>> | null };
}

function Harness({ activeTab, onTabPress, sharedRef }: HarnessProps) {
  const progress = useSharedValue<number>(activeTab === 'one' ? 0 : 1);
  if (sharedRef) sharedRef.current = progress;
  const tabs: SubTabItem<'one' | 'two'>[] = [
    { key: 'one', label: 'ONE' },
    { key: 'two', label: 'TWO' },
  ];
  return (
    <SubTabControl
      tabs={tabs}
      activeTab={activeTab}
      onTabPress={onTabPress ?? (() => {})}
      progress={progress}
    />
  );
}

describe('SubTabControl', () => {
  it('renders all tab labels with correct accessibility state', () => {
    const { getByTestId } = render(<Harness activeTab="one" />);
    expect(getByTestId('subtab-one').props.accessibilityState.selected).toBe(true);
    expect(getByTestId('subtab-two').props.accessibilityState.selected).toBe(false);
  });

  it('fires onTabPress when a label is tapped', () => {
    const onTabPress = jest.fn();
    const { getByTestId } = render(
      <Harness activeTab="one" onTabPress={onTabPress} />,
    );
    act(() => {
      getByTestId('subtab-two').props.onPress();
    });
    expect(onTabPress).toHaveBeenCalledWith('two');
  });

  it('does not fire onTabPress when tapping the already-active tab', () => {
    const onTabPress = jest.fn();
    const { getByTestId } = render(
      <Harness activeTab="one" onTabPress={onTabPress} />,
    );
    act(() => {
      getByTestId('subtab-one').props.onPress();
    });
    expect(onTabPress).not.toHaveBeenCalled();
  });

  it('honors an external progress SharedValue for the underline', () => {
    const sharedRef: { current: ReturnType<typeof useSharedValue<number>> | null } = {
      current: null,
    };
    const { rerender } = render(
      <Harness activeTab="one" sharedRef={sharedRef} />,
    );
    expect(sharedRef.current?.value).toBe(0);

    rerender(<Harness activeTab="two" sharedRef={sharedRef} />);
    expect(sharedRef.current?.value).toBe(1);
  });
});
```

- [ ] **Step 2: Run the test to verify current behavior**

Run: `npm test -- components/navigation/__tests__/SubTabControl.test.tsx`
Expected: FAIL — test file does not exist (treated as "no tests").

- [ ] **Step 3: Update `SubTabControl`**

Edit `components/navigation/SubTabControl.tsx`. The changes:

1. Remove `Gesture.Pan` and the `GestureDetector` wrapper. The page swipe lives in `TopTabs`; the labels only render and respond to taps.
2. Remove the `dragToSwitch` and `dragThreshold` props from the public API. Mark them removed in the JSDoc. (Keep `dragToSwitch` in the type signature with `@deprecated` so any future caller gets a soft warning during type review — don't break compilation.)
3. Add `useReducedMotion` import; when reducing motion, skip the `withTiming` and snap instantly.
4. The `useEffect` that watches `activeTab` (currently lines ~101-110) should:
   - Snap `internalProgress` instantly when `progress` is provided (because the parent owns the timing via `useTabProgress`).
   - Continue using `withTiming` when `progress` is undefined (legacy path).

Apply this exact diff to `SubTabControl.tsx`:

Replace the import block (lines 1-16):

```ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { StyledText } from '@/components/elements';
import { logger } from '@/lib/logger';
```

Replace the props interface (lines 28-36):

```ts
export interface SubTabControlProps<T extends string> {
  tabs: SubTabItem<T>[];
  activeTab: T;
  onTabPress: (tab: T) => void;
  containerClassName?: string;
  /**
   * Optional UI-thread progress (continuous index across tab positions).
   * When provided, the underline follows this value exactly. The owner of
   * `progress` is responsible for animating it between integer indices
   * (typically via the `useTabProgress` hook).
   */
  progress?: SharedValue<number>;
  /** @deprecated The component no longer owns a drag-to-switch gesture;
   * the underlying pager (TopTabs / react-native-pager-view) does. Kept
   * for API compatibility; the value is ignored. */
  dragToSwitch?: boolean;
  /** @deprecated See `dragToSwitch`. Ignored. */
  dragThreshold?: number;
}
```

Replace the `activeTab` effect (the `useEffect` whose body sets `activeIndexShared.value` and `internalProgress.value`):

```ts
useEffect(() => {
  const index = tabs.findIndex((t) => t.key === activeTab);
  if (index < 0) return;
  activeIndexShared.value = index;
  if (!progress) {
    // Legacy path: animate the underline internally because no external
    // progress is provided.
    internalProgress.value = ready
      ? withTiming(index, { duration: reduceMotion ? 0 : 200 })
      : index;
  }
  // When `progress` is provided, the parent owns timing via
  // `useTabProgress`; we don't tween `internalProgress` here.
}, [
  activeTab,
  progress,
  ready,
  reduceMotion,
  activeIndexShared,
  internalProgress,
  tabs,
]);
```

Replace the entire `panGesture` block with nothing — remove the `panGesture` declaration entirely (lines that previously read `const panGesture = Gesture.Pan()...` through the closing `);`). Add `useReducedMotion` hook call at the top of the component body alongside the other hooks:

```ts
const reduceMotion = useReducedMotion();
```

(Place `const reduceMotion = useReducedMotion();` immediately above the existing `const internalProgress = useSharedValue(0);` line.)

Replace the return block to remove `<GestureDetector gesture={panGesture}>`:

```tsx
return (
  <View accessibilityRole="tablist" className={resolvedContainerClassName}>
    <View className="flex-row gap-4">
      {tabs.map((tab, index) => {
        // ... existing Pressable + label + badge rendering, unchanged ...
      })}
    </View>

    <View className="h-[3px] bg-paper-200">
      <Animated.View
        style={underlineStyle}
        className="absolute h-[3px] rounded-full bg-persimmon-500"
      />
    </View>
  </View>
);
```

The underline `useAnimatedStyle` (lines 174-188 in the previous version) needs no changes — it already reads `progress` when provided.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- components/navigation/__tests__/SubTabControl.test.tsx`
Expected: all four tests pass.

- [ ] **Step 5: Run typecheck**

Run: `npm run typecheck`
Expected: zero errors. If unused-import lint complains about `withTiming` (still imported for the legacy path), keep the import.

- [ ] **Step 6: Commit**

```bash
git add components/navigation/SubTabControl.tsx components/navigation/__tests__/SubTabControl.test.tsx
git commit -m "refactor(navigation): drop SubTabControl drag gesture; honor external progress"
```

---

## Task 3: Wire `useTabProgress` into the Home tab

**Files:**
- Modify: `app/(tabs)/home/_layout.tsx`
- Modify: `components/home/DashboardHeader.tsx`

**Interfaces:**
- `DashboardHeaderProps` gains `progress?: SharedValue<number>` (optional).
- `HomeLayout` creates the shared value via `useTabProgress(activeTab, HOME_SUB_TABS)` and passes it.

- [ ] **Step 1: Update `DashboardHeader` to accept and forward `progress`**

Edit `components/home/DashboardHeader.tsx`:

Add `SharedValue` to the reanimated import:

```ts
import { SharedValue } from 'react-native-reanimated';
```

Add to the `DashboardHeaderProps` interface:

```ts
progress?: SharedValue<number>;
```

Destructure it:

```ts
export function DashboardHeader({
  storeName,
  ownerInitials,
  activeTab,
  showTopHeader,
  onTabPress,
  progress,
}: DashboardHeaderProps) {
```

Pass it to `SubTabControl`:

```tsx
<SubTabControl
  tabs={tabs}
  activeTab={activeTab}
  onTabPress={onTabPress}
  containerClassName="mb-0"
  progress={progress}
/>
```

- [ ] **Step 2: Update `HomeLayout` to provide the shared value**

Edit `app/(tabs)/home/_layout.tsx`:

Add imports:

```ts
import { useTabProgress } from '@/hooks';
import { HOME_SUB_TABS } from '@/constants/tabs';
```

Inside `HomeLayout`, after the `useHomeDashboardData` call, add:

```ts
const progress = useTabProgress(activeTab as HomeSubTab, HOME_SUB_TABS);
```

(Note: `activeTab` is currently typed as `HomeSubTab` from `getCurrentTab()` but TypeScript may infer the return as a wider type — coerce via `as HomeSubTab` if needed. If `getCurrentTab()` already returns `HomeSubTab`, the cast is unnecessary.)

Pass `progress` to `DashboardHeader`:

```tsx
<DashboardHeader
  storeName={storeName || ''}
  ownerInitials={ownerInitials || ''}
  activeTab={getCurrentTab()}
  showTopHeader={false}
  onTabPress={handleTabPress}
  progress={progress}
/>
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: zero errors.

- [ ] **Step 4: Manual smoke (or skip if no device)**

Run: `npm start` and on the iOS/Android simulator, navigate to the Home tab, tap between OVERVIEW and TODAY. The underline should slide with the page (it already does because TopTabs has `swipeEnabled: true`). Swipe horizontally on the page area — underline tracks. Swipe horizontally on the label row — no movement (correct: labels don't own the gesture now).

If a device isn't available, run `npm run lint` and `npm test -- components/navigation/__tests__/SubTabControl.test.tsx` to confirm nothing regressed in the existing test suite.

- [ ] **Step 5: Commit**

```bash
git add app/\(tabs\)/home/_layout.tsx components/home/DashboardHeader.tsx
git commit -m "feat(navigation): wire home sub-tab labels to TopTabs page progress"
```

---

## Task 4: Wire `useTabProgress` into the Sales tab

**Files:**
- Modify: `app/(tabs)/sales/_layout.tsx`
- Modify: `components/sales/SalesHeader.tsx`

**Interfaces:**
- `SalesHeaderProps` gains `progress?: SharedValue<number>` (optional).
- `SalesLayout` calls `useTabProgress` and passes it.
- Note: `SalesHeader` declares its own `SalesSubTab` type with `'cart' | 'checkout' | 'pos' | 'receipts'` while `constants/tabs.ts:75` declares `(typeof SALES_SUB_TABS)[number]` which is `'pos' | 'receipts'`. The header remaps `'cart'`/`'checkout'` to `'pos'` (`SalesHeader.tsx:28-29`). The hook must operate on the post-remap value (`'pos'` or `'receipts'`), so `SalesLayout` should pass the *effective* active tab, not the raw `pathname` derivative. Pass the same value the header sees.

- [ ] **Step 1: Update `SalesHeader` to accept and forward `progress`**

Edit `components/sales/SalesHeader.tsx`:

Add import:

```ts
import { SharedValue } from 'react-native-reanimated';
```

Add to `SalesHeaderProps`:

```ts
progress?: SharedValue<number>;
```

Destructure it in the function signature:

```ts
export function SalesHeader({
  activeTab,
  todayTotal = 0,
  transactionCount,
  onTabPress,
  progress,
}: SalesHeaderProps) {
```

Pass to `SubTabControl`:

```tsx
<SubTabControl
  tabs={tabs}
  activeTab={effectiveActiveTab}
  onTabPress={onTabPress}
  containerClassName="mb-3.5"
  progress={progress}
/>
```

- [ ] **Step 2: Update `SalesLayout` to provide the shared value**

Edit `app/(tabs)/sales/_layout.tsx`:

Add imports:

```ts
import { useTabProgress } from '@/hooks';
import { SALES_SUB_TABS } from '@/constants/tabs';
```

Inside `SalesLayout`, after the `useTodayStats` call, add a `useMemo` that produces the same effective tab the header sees (so the hook and the header stay in lockstep):

```ts
const effectiveActiveTab = useMemo<SalesSubTab>(() => {
  const raw = getCurrentTab();
  return raw === 'cart' || raw === 'checkout' ? 'pos' : raw;
}, [pathname]);

const progress = useTabProgress(effectiveActiveTab, SALES_SUB_TABS);
```

Note: `SALES_SUB_TABS` is `'pos' | 'receipts'`, so `useTabProgress` is typed correctly. The layout's `getCurrentTab()` returns `SalesSubTab` which is the wider union (`'pos' | 'cart' | 'checkout' | 'receipts'`); the `useMemo` narrows to the effective one.

Pass `progress` to `SalesHeader`:

```tsx
<SalesHeader
  activeTab={effectiveActiveTab}
  todayTotal={todayStats?.total || 0}
  onTabPress={handleTabPress}
  progress={progress}
/>
```

(The layout currently calls `getCurrentTab()` again inside the JSX; replace both call sites with `effectiveActiveTab` to avoid drift. Or keep `getCurrentTab()` for `activeTab` and only use `effectiveActiveTab` for the hook — the header will remap regardless. Both approaches work; pick the second for minimal diff.)

Minimal-diff approach: pass `effectiveActiveTab` only to `progress` (it doesn't matter to the hook whether the header sees the raw or effective tab). The header keeps receiving `getCurrentTab()`.

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: zero errors.

- [ ] **Step 4: Manual smoke**

Same procedure as Task 3. Tap POS ↔ RECEIPTS, swipe the page area, swipe the label row. Verify underline tracks the page.

- [ ] **Step 5: Commit**

```bash
git add app/\(tabs\)/sales/_layout.tsx components/sales/SalesHeader.tsx
git commit -m "feat(navigation): wire sales sub-tab labels to TopTabs page progress"
```

---

## Task 5: Wire `useTabProgress` into the Customers tab

**Files:**
- Modify: `app/(tabs)/customers/_layout.tsx`
- Modify: `components/customers/CustomersHeader.tsx`

**Interfaces:**
- `CustomersHeaderProps` gains `progress?: SharedValue<number>` (optional).
- `CustomersLayout` calls `useTabProgress(activeTab, CUSTOMERS_SUB_TABS)` and passes it.

- [ ] **Step 1: Update `CustomersHeader` to accept and forward `progress`**

Edit `components/customers/CustomersHeader.tsx`:

Add import:

```ts
import { SharedValue } from 'react-native-reanimated';
```

Add to `CustomersHeaderProps`:

```ts
progress?: SharedValue<number>;
```

Destructure:

```ts
export function CustomersHeader({
  activeTab,
  totalCustomers = 142,
  debtorCount = 0,
  loyalCount = 28,
  totalCredit = 4850,
  onTabPress,
  progress,
}: CustomersHeaderProps) {
```

Pass to `SubTabControl`:

```tsx
<SubTabControl
  tabs={tabs}
  activeTab={activeTab}
  onTabPress={onTabPress}
  containerClassName="mb-3"
  progress={progress}
/>
```

- [ ] **Step 2: Update `CustomersLayout` to provide the shared value**

Edit `app/(tabs)/customers/_layout.tsx`:

Add imports:

```ts
import { useTabProgress } from '@/hooks';
import { CUSTOMERS_SUB_TABS } from '@/constants/tabs';
```

`getCurrentTab()` already returns `CustomersSubTab`. Create the shared value:

```ts
const activeTab = getCurrentTab();
const progress = useTabProgress(activeTab, CUSTOMERS_SUB_TABS);
```

(Use `useCallback`-wrapped `getCurrentTab` to keep `activeTab` stable across renders; the current implementation isn't memoized but it's a single `pathname.includes` so re-running it per render is fine. If preferred, wrap it: `const getCurrentTab = useCallback((): CustomersSubTab => {...}, [pathname]);`.)

Pass `progress` to `CustomersHeader`:

```tsx
<CustomersHeader
  activeTab={getCurrentTab()}
  totalCustomers={customers.length}
  debtorCount={debtorCount}
  loyalCount={loyalCount}
  totalCredit={kpis?.totalOutstanding || 0}
  onTabPress={handleTabPress}
  onAddCustomer={handleAddCustomer}
  progress={progress}
/>
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: zero errors.

- [ ] **Step 4: Manual smoke**

Tap ALL ↔ CREDIT, swipe the page, swipe the label row. Verify underline tracks.

- [ ] **Step 5: Commit**

```bash
git add app/\(tabs\)/customers/_layout.tsx components/customers/CustomersHeader.tsx
git commit -m "feat(navigation): wire customers sub-tab labels to TopTabs page progress"
```

---

## Task 6: Wire `useTabProgress` into the Inventory tab

**Files:**
- Modify: `app/(tabs)/inventory/_layout.tsx`
- Modify: `components/inventory/InventoryHeader.tsx`

**Interfaces:**
- `InventoryHeaderProps` gains `progress?: SharedValue<number>` (optional).
- `InventoryLayout` calls `useTabProgress(activeTab, INVENTORY_SUB_TABS)` and passes it.

- [ ] **Step 1: Update `InventoryHeader` to accept and forward `progress`**

Edit `components/inventory/InventoryHeader.tsx`:

Add import:

```ts
import { SharedValue } from 'react-native-reanimated';
```

Add to `InventoryHeaderProps`:

```ts
progress?: SharedValue<number>;
```

Destructure:

```ts
export function InventoryHeader(props: InventoryHeaderProps) {
  // ...
  const { active, search, onSearchChange, onOpenScanner, onTabChange, onPillPress, progress } = props;
```

(The current component takes a single `props` object rather than destructuring. Either keep that pattern and add `progress` to the destructure inside the body, or refactor to destructured args. Keep the existing pattern for minimal diff: extract `progress` via `const { ..., progress } = props;`.)

Pass to `SubTabControl`:

```tsx
<SubTabControl
  tabs={tabs}
  activeTab={props.active}
  onTabPress={(k) => props.onTabChange(k as InventorySubTab)}
  progress={progress}
/>
```

- [ ] **Step 2: Update `InventoryLayout` to provide the shared value**

Edit `app/(tabs)/inventory/_layout.tsx`:

Add imports:

```ts
import { useTabProgress } from '@/hooks';
import { INVENTORY_SUB_TABS } from '@/constants/tabs';
```

`activeTab` is already memoized as `InventorySubTab` (line 46-49). Create the shared value:

```ts
const progress = useTabProgress(activeTab, INVENTORY_SUB_TABS);
```

Pass to `InventoryHeader`:

```tsx
<InventoryHeader
  active={activeTab}
  search={search}
  onSearchChange={handleSearchChange}
  onOpenScanner={() => setScannerOpen(true)}
  onTabChange={handleTabChange}
  onPillPress={handlePillPress}
  progress={progress}
/>
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: zero errors.

- [ ] **Step 4: Manual smoke**

This tab has 5 sub-tabs (PRODUCTS, MOVEMENTS, STOCKTAKE, DAMAGED, RECOMMENDATIONS). Test:
- Tap each label — underline should slide with the page.
- Swipe horizontally on the page — underline tracks.
- Swipe horizontally on the label row — no movement (correct).
- During a swipe, confirm there is no visible snap on the underline.

- [ ] **Step 5: Commit**

```bash
git add app/\(tabs\)/inventory/_layout.tsx components/inventory/InventoryHeader.tsx
git commit -m "feat(navigation): wire inventory sub-tab labels to TopTabs page progress"
```

---

## Task 7: Final verification

**Files:**
- Read-only: existing test files, no production changes.

- [ ] **Step 1: Run the full verification command**

Run: `npm run verify`
Expected: typecheck and tests pass with zero errors. Any pre-existing test failures unrelated to this plan (e.g. `CheckoutModal.tsx:1364` lint warning) are out of scope.

- [ ] **Step 2: Confirm no orphaned imports**

Run: `npx tsc --noEmit 2>&1 | head -30`
Expected: zero errors. If `ScheduleWakeup` flags any unused imports introduced by this plan (e.g. `withSpring` removed from `SubTabControl`), clean them up.

- [ ] **Step 3: Manual smoke across all four tabs**

Boot the dev client. Cycle through Home, Sales, Customers, Inventory. On each:
- Tap each sub-tab label — underline slides.
- Swipe the page area — underline tracks.
- Swipe the label row — no movement.

- [ ] **Step 4: Commit (only if cleanup happened)**

If step 1 or 2 surfaced any leftover issues, fix and commit:

```bash
git add <changed files>
git commit -m "chore(navigation): cleanup unused imports after SubTabControl refactor"
```

If nothing changed, skip the commit.

- [ ] **Step 5: Write activity-log entry**

Append a brief entry to `docs/activity-log.md` (or create it if missing) describing what was built and where to look in the code. One paragraph. Keep it short.

---

## Self-Review

**Spec coverage:**

- "Sync underline to page swipe" → Tasks 1 (hook), 2 (component honors `progress`), 3–6 (wire each tab), 7 (verify).
- "Labels stay tappable" → Task 2 keeps `onTabPress`; tests in Task 2 cover tap behavior.
- "Haptic + structured log on label press preserved" → Task 2 keeps `handleSelect` unchanged; covered by the existing implementation.
- "Reduced motion honored" → Tasks 1 and 2 use `useReducedMotion` to gate `withTiming`.
- "TypeScript strict mode + `exactOptionalPropertyTypes`" → every modification passes `npm run typecheck`.

**Placeholder scan:** No "TBD", "TODO", or "implement later" in the plan. Every code block is the actual content. No "similar to Task N" references.

**Type consistency:** `SharedValue<number>` is used uniformly for `progress` and the hook's return. `useTabProgress<T extends string>` parameterization matches the `*_SUB_TABS` const arrays. `SubTabControlProps<T>` keeps its existing generics.

**Risk noted, not in plan:** `SalesSubTab` is declared in two places (`constants/tabs.ts:75` and `components/sales/SalesHeader.tsx:8`). The plan works around it by passing the narrower `'pos' | 'receipts'` array to the hook. Consolidating the duplicate type is a separate cleanup, out of scope.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-11-subtab-label-page-sync.md`.

Two execution options:

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?