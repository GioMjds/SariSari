# Onboarding Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild first-run onboarding so each tour step lets the owner try a safe demo widget with Sari reacting, plus a "First steps" list on the ready screen and a persistent "Get started" card on Home.

**Architecture:** The 7-step machine (`lib/onboardingStepMachine.ts`) is untouched. A new shell in `app/onboarding/index.tsx` renders one `StepTransition`-wrapped step at a time. Each tour step is a `TourCard` made of a `SariStage`, a self-contained demo widget (local state, hardcoded data, pure helpers in `lib/onboardingDemo.ts`), and a text block. Copy moves into `locales/{en,tl}/onboarding.json`. Home gets a card driven by existing hooks and a derived-progress helper.

**Tech Stack:** Expo SDK 54, React Native 0.81, React 19, NativeWind v4, Moti, `expo-linear-gradient`, `expo-haptics`, react-i18next, TanStack Query v5, Jest (`preset: react-native`) with `@testing-library/react-native` v14.

**Spec:** `docs/superpowers/specs/2026-11-08-onboarding-redesign-design.md`

## Global Constraints

- Offline-first, no backend. Onboarding writes nothing beyond what `markOnboardingComplete` already writes.
- Screens never call SQLite. Demo widgets import nothing from `hooks/` or `database/`.
- Money is integer pesos. Format through `formatPesos` from `lib/money.ts`.
- Respect Reduce Motion via `useReducedMotion` from `@/hooks/useReducedMotion`. Haptics are skipped under Reduce Motion.
- All user-facing copy goes in `locales/en/onboarding.json` and `locales/tl/onboarding.json`, same keys in both.
- Every widget tap target is at least 44pt high, with `accessibilityRole` and `accessibilityLabel`.
- Strict TypeScript: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`. Optional props that may receive `undefined` are typed `?: T | undefined`.
- No emojis in code or comments. Markdown filenames kebab-case.
- The step machine and the `OnboardingState` storage shape (`onboarding_state_v1`) do not change.
- Tests live under `tests/` (lib logic) or `components/**/__tests__/` (components). Run one file with `pnpm jest <path>`. Final gate is `pnpm verify` (`tsc --noEmit` plus `jest`).
- **Git:** the working tree holds the owner's unrelated staged changes (deleted and renamed `app/` files, edits under `components/reports/` and `components/settings/`). Never run a bare `git commit`. Stage only this plan's files with `git add <paths>`, then commit with `git commit -m "<msg>" -- <same paths>` so nothing else is swept in. End every commit message with these two lines:
  `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`
  `Claude-Session: https://claude.ai/code/session_014rjHKgumkK7HrQxGz5WJdZ`

## Review Focus

- Demo math fed out-of-range values: restock when quantity is already above max or the amount is negative must never lower stock; marking paid with a payment larger than the balance, or a negative balance, must yield 0, not a negative number. (Task 1)
- Weekly bar chart with all-zero or empty totals must not produce `NaN` heights. (Task 1)
- Dismiss flag storage: a corrupted stored value or a failing AsyncStorage read must read as "not dismissed", and a failing write must not throw into the UI. (Task 2)
- Ready-step first-step cards while the profile is blank or whitespace-only, or while saving, must not navigate or call save. (Task 7)
- Tagalog copy missing a key that English has, or a tour constant pointing at a key that does not exist, would render the raw key to a user. (Task 3)

## File Structure

New:

- `lib/onboardingDemo.ts` - pure demo math (cart, restock, mark paid, bar heights).
- `lib/gettingStarted.ts` - pure derive of checklist progress and visibility.
- `lib/gettingStartedStorage.ts` - AsyncStorage helper for the dismiss flag.
- `constants/gettingStarted.ts` - the 3 first-step definitions (icon, i18n keys, route), shared by ready step and Home card.
- `hooks/useGettingStarted.ts` - wires existing data hooks and storage into the Home card.
- `components/onboarding/OnboardingProgress.tsx`, `StepTransition.tsx`, `SariStage.tsx`, `SuccessCheck.tsx`, `HintRing.tsx`.
- `components/onboarding/demos/{types,HomeDemo,SalesDemo,InventoryDemo,CustomersDemo,ReportsDemo,index}.ts(x)`.
- `components/home/GettingStartedCard.tsx`.
- `assets/images/sari-emotions/sari-{welcome,celebrate,pointing}-state.png` - placeholder copies of `sari-default-state.png`.
- `docs/superpowers/sari-art-prompts.md` - prompt sheet for the owner.
- Tests: `tests/onboardingDemo.test.ts`, `tests/gettingStarted.test.ts`, `tests/onboardingLocales.test.ts`, `components/onboarding/__tests__/OnboardingProgress.test.tsx`, `components/onboarding/__tests__/demos.test.tsx`, `components/onboarding/__tests__/ReadyStep.test.tsx`.

Changed: `constants/onboardingTour.ts`, `constants/onboardingTour.assets.ts`, `locales/{en,tl}/onboarding.json`, `components/onboarding/{TourCard,ProfileStep,ReadyStep}.tsx`, `app/onboarding/index.tsx`, `app/(tabs)/home/index.tsx`, `components/home/index.ts`, `hooks/index.ts`.

Removed: `components/onboarding/OnboardingPagination.tsx`, `components/onboarding/StepDots.tsx`.

## Decisions that differ slightly from the spec text (flag to owner at handoff)

1. **Tap-to-jump on the progress dots is dropped.** The spec asks for the progress bar to be one accessible "Step N of 7" element, which cannot also hold tappable children. Back remains available. `jumpTo` and `canJumpBack` stay exported from the step machine, unused by the screen.
2. **Placeholder Sari art is real file copies, not a code fallback.** Metro resolves `require()` statically, so "drop in new PNGs with no code change" only works if files already exist at the final paths. Task 3 copies `sari-default-state.png` to `sari-{welcome,celebrate,pointing}-state.png`. The owner overwrites those files later.
3. **First-step cards route to the add forms** (`/(edit-forms)/add-product`, `/(tabs)/sales/pos`, `/(edit-forms)/add-customer`) instead of the tab roots, so a tap lands on the actual task.
4. **Tour copy moves into locale files.** `constants/onboardingTour.ts` currently holds hardcoded English, so the tour never translated to Tagalog. It now holds i18n keys.

---

### Task 1: Pure demo logic

**Files:**
- Create: `lib/onboardingDemo.ts`
- Test: `tests/onboardingDemo.test.ts`

**Interfaces:**
- Produces (used by Tasks 5):
  - `type DemoItem = { readonly id: string; readonly name: string; readonly price: number }`
  - `const DEMO_SALE_ITEMS: readonly DemoItem[]`
  - `type DemoCart = Readonly<Record<string, number>>`
  - `const MAX_CART_QTY = 99`, `const STOCK_MAX = 20`, `const LOW_STOCK_THRESHOLD = 5`
  - `addToCart(cart: DemoCart, id: string, items?: readonly DemoItem[]): DemoCart`
  - `cartTotal(cart: DemoCart, items?: readonly DemoItem[]): number`
  - `cartQuantity(cart: DemoCart): number`
  - `restock(qty: number, amount: number, max?: number): number`
  - `stockRatio(qty: number, max?: number): number`
  - `isLowStock(qty: number, threshold?: number): boolean`
  - `markPaid(balance: number, payment?: number): number`
  - `weeklyBarHeights(totals: readonly number[]): number[]`

- [ ] **Step 1: Write the failing test**

Create `tests/onboardingDemo.test.ts`:

```ts
import {
  DEMO_SALE_ITEMS,
  LOW_STOCK_THRESHOLD,
  MAX_CART_QTY,
  STOCK_MAX,
  addToCart,
  cartQuantity,
  cartTotal,
  isLowStock,
  markPaid,
  restock,
  stockRatio,
  weeklyBarHeights,
} from '@/lib/onboardingDemo';

describe('cart', () => {
  it('sums price times quantity in integer pesos', () => {
    let cart = addToCart({}, 'kape');
    cart = addToCart(cart, 'kape');
    cart = addToCart(cart, 'sabon');
    expect(cartTotal(cart)).toBe(8 * 2 + 25);
    expect(cartQuantity(cart)).toBe(3);
  });

  it('is zero for an empty cart', () => {
    expect(cartTotal({})).toBe(0);
    expect(cartQuantity({})).toBe(0);
  });

  it('ignores unknown item ids', () => {
    const cart = addToCart({}, 'not-a-product');
    expect(cartQuantity(cart)).toBe(0);
  });

  it('caps quantity per item at MAX_CART_QTY', () => {
    let cart: Record<string, number> = { kape: MAX_CART_QTY };
    cart = { ...addToCart(cart, 'kape') };
    expect(cart['kape']).toBe(MAX_CART_QTY);
  });

  it('exposes three demo items with integer prices', () => {
    expect(DEMO_SALE_ITEMS).toHaveLength(3);
    for (const item of DEMO_SALE_ITEMS) {
      expect(Number.isInteger(item.price)).toBe(true);
    }
  });
});

describe('restock', () => {
  it('adds the amount up to the max', () => {
    expect(restock(3, 12)).toBe(15);
    expect(restock(15, 12)).toBe(STOCK_MAX);
  });

  it('never lowers stock that is already above max', () => {
    expect(restock(30, 5)).toBe(30);
  });

  it('ignores a negative amount', () => {
    expect(restock(7, -4)).toBe(7);
  });

  it('flags low stock at or below the threshold', () => {
    expect(isLowStock(LOW_STOCK_THRESHOLD)).toBe(true);
    expect(isLowStock(LOW_STOCK_THRESHOLD + 1)).toBe(false);
  });

  it('clamps the bar ratio to 0..1 and survives a bad max', () => {
    expect(stockRatio(10)).toBe(0.5);
    expect(stockRatio(50)).toBe(1);
    expect(stockRatio(-3)).toBe(0);
    expect(stockRatio(5, 0)).toBe(0);
  });
});

describe('markPaid', () => {
  it('clears the full balance by default', () => {
    expect(markPaid(350)).toBe(0);
  });

  it('subtracts a partial payment', () => {
    expect(markPaid(350, 100)).toBe(250);
  });

  it('never goes negative on overpayment or negative balance', () => {
    expect(markPaid(100, 500)).toBe(0);
    expect(markPaid(-40)).toBe(0);
  });

  it('ignores a negative payment', () => {
    expect(markPaid(100, -50)).toBe(100);
  });
});

describe('weeklyBarHeights', () => {
  it('normalises to the tallest bar', () => {
    expect(weeklyBarHeights([400, 800, 200])).toEqual([0.5, 1, 0.25]);
  });

  it('returns zeros, not NaN, for all-zero totals', () => {
    expect(weeklyBarHeights([0, 0, 0])).toEqual([0, 0, 0]);
  });

  it('returns an empty array for no data', () => {
    expect(weeklyBarHeights([])).toEqual([]);
  });

  it('treats negative totals as zero height', () => {
    expect(weeklyBarHeights([-10, 20])).toEqual([0, 1]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm jest tests/onboardingDemo.test.ts`
Expected: FAIL with "Cannot find module '@/lib/onboardingDemo'"

- [ ] **Step 3: Write minimal implementation**

Create `lib/onboardingDemo.ts`:

```ts
/**
 * onboardingDemo - pure helpers behind the onboarding demo widgets.
 * No React, no storage. Money is integer pesos.
 */

export type DemoItem = {
  readonly id: string;
  readonly name: string;
  readonly price: number;
};

export const DEMO_SALE_ITEMS: readonly DemoItem[] = [
  { id: 'kape', name: 'Kape sachet', price: 8 },
  { id: 'sabon', name: 'Sabon', price: 25 },
  { id: 'itlog', name: 'Itlog', price: 12 },
];

export type DemoCart = Readonly<Record<string, number>>;

export const MAX_CART_QTY = 99;
export const STOCK_MAX = 20;
export const LOW_STOCK_THRESHOLD = 5;

export function addToCart(
  cart: DemoCart,
  id: string,
  items: readonly DemoItem[] = DEMO_SALE_ITEMS,
): DemoCart {
  if (!items.some((item) => item.id === id)) return cart;
  const current = cart[id] ?? 0;
  if (current >= MAX_CART_QTY) return cart;
  return { ...cart, [id]: current + 1 };
}

export function cartTotal(
  cart: DemoCart,
  items: readonly DemoItem[] = DEMO_SALE_ITEMS,
): number {
  return items.reduce(
    (sum, item) => sum + item.price * (cart[item.id] ?? 0),
    0,
  );
}

export function cartQuantity(cart: DemoCart): number {
  return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
}

export function restock(
  qty: number,
  amount: number,
  max: number = STOCK_MAX,
): number {
  const added = qty + Math.max(0, amount);
  return Math.max(qty, Math.min(max, added));
}

export function stockRatio(qty: number, max: number = STOCK_MAX): number {
  if (max <= 0) return 0;
  return Math.min(1, Math.max(0, qty / max));
}

export function isLowStock(
  qty: number,
  threshold: number = LOW_STOCK_THRESHOLD,
): boolean {
  return qty <= threshold;
}

export function markPaid(balance: number, payment?: number): number {
  const owed = Math.max(0, balance);
  const paid = payment === undefined ? owed : Math.max(0, payment);
  return Math.max(0, owed - paid);
}

export function weeklyBarHeights(totals: readonly number[]): number[] {
  const max = totals.reduce((m, t) => Math.max(m, t), 0);
  if (max <= 0) return totals.map(() => 0);
  return totals.map((t) => Math.max(0, t) / max);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm jest tests/onboardingDemo.test.ts`
Expected: PASS, all tests green.

- [ ] **Step 5: Commit**

```bash
git add lib/onboardingDemo.ts tests/onboardingDemo.test.ts
git commit -m "feat(onboarding): add pure demo logic helpers" -- lib/onboardingDemo.ts tests/onboardingDemo.test.ts
```
(append the two trailer lines from Global Constraints)

---

### Task 2: Getting-started logic and dismiss storage

**Files:**
- Create: `lib/gettingStarted.ts`, `lib/gettingStartedStorage.ts`
- Test: `tests/gettingStarted.test.ts`

**Interfaces:**
- Produces (used by Tasks 7, 9):
  - `type GettingStartedTaskId = 'product' | 'sale' | 'suki'`
  - `type GettingStartedInput = { productCount: number; hasSales: boolean; customerCount: number }`
  - `type GettingStartedProgress = { tasks: { id: GettingStartedTaskId; done: boolean }[]; doneCount: number; total: number; allDone: boolean }`
  - `deriveGettingStarted(input: GettingStartedInput): GettingStartedProgress`
  - `shouldShowGettingStarted(progress: GettingStartedProgress, dismissed: boolean): boolean`
  - `loadGettingStartedDismissed(): Promise<boolean>`
  - `setGettingStartedDismissed(): Promise<void>`
  - `GETTING_STARTED_DISMISSED_KEY = 'getting_started_dismissed_v1'`

- [ ] **Step 1: Write the failing test**

Create `tests/gettingStarted.test.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  deriveGettingStarted,
  shouldShowGettingStarted,
} from '@/lib/gettingStarted';
import {
  GETTING_STARTED_DISMISSED_KEY,
  loadGettingStartedDismissed,
  setGettingStartedDismissed,
} from '@/lib/gettingStartedStorage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

const storage = AsyncStorage as unknown as {
  getItem: jest.Mock;
  setItem: jest.Mock;
};

describe('deriveGettingStarted', () => {
  it('counts each finished task', () => {
    const p = deriveGettingStarted({
      productCount: 2,
      hasSales: false,
      customerCount: 0,
    });
    expect(p.tasks).toEqual([
      { id: 'product', done: true },
      { id: 'sale', done: false },
      { id: 'suki', done: false },
    ]);
    expect(p.doneCount).toBe(1);
    expect(p.total).toBe(3);
    expect(p.allDone).toBe(false);
  });

  it('is allDone when every task is done', () => {
    const p = deriveGettingStarted({
      productCount: 1,
      hasSales: true,
      customerCount: 1,
    });
    expect(p.allDone).toBe(true);
  });

  it('treats negative or non-finite counts as not done', () => {
    const p = deriveGettingStarted({
      productCount: -1,
      hasSales: false,
      customerCount: Number.NaN,
    });
    expect(p.doneCount).toBe(0);
  });
});

describe('shouldShowGettingStarted', () => {
  const partial = deriveGettingStarted({
    productCount: 1,
    hasSales: false,
    customerCount: 0,
  });
  const complete = deriveGettingStarted({
    productCount: 1,
    hasSales: true,
    customerCount: 1,
  });

  it('shows while tasks remain and not dismissed', () => {
    expect(shouldShowGettingStarted(partial, false)).toBe(true);
  });

  it('hides when dismissed', () => {
    expect(shouldShowGettingStarted(partial, true)).toBe(false);
  });

  it('hides when all done', () => {
    expect(shouldShowGettingStarted(complete, false)).toBe(false);
  });
});

describe('gettingStartedStorage', () => {
  beforeEach(() => {
    storage.getItem.mockReset();
    storage.setItem.mockReset();
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  it('reads true only for the stored string "true"', async () => {
    storage.getItem.mockResolvedValueOnce('true');
    await expect(loadGettingStartedDismissed()).resolves.toBe(true);
    expect(storage.getItem).toHaveBeenCalledWith(GETTING_STARTED_DISMISSED_KEY);
  });

  it('reads false when nothing is stored', async () => {
    storage.getItem.mockResolvedValueOnce(null);
    await expect(loadGettingStartedDismissed()).resolves.toBe(false);
  });

  it('reads false for a corrupted value', async () => {
    storage.getItem.mockResolvedValueOnce('{not json');
    await expect(loadGettingStartedDismissed()).resolves.toBe(false);
  });

  it('reads false when storage throws', async () => {
    storage.getItem.mockRejectedValueOnce(new Error('boom'));
    await expect(loadGettingStartedDismissed()).resolves.toBe(false);
  });

  it('writes "true" and swallows a failing write', async () => {
    storage.setItem.mockResolvedValueOnce(undefined);
    await setGettingStartedDismissed();
    expect(storage.setItem).toHaveBeenCalledWith(
      GETTING_STARTED_DISMISSED_KEY,
      'true',
    );

    storage.setItem.mockRejectedValueOnce(new Error('disk full'));
    await expect(setGettingStartedDismissed()).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm jest tests/gettingStarted.test.ts`
Expected: FAIL with "Cannot find module '@/lib/gettingStarted'"

- [ ] **Step 3: Write minimal implementation**

Create `lib/gettingStarted.ts`:

```ts
/**
 * gettingStarted - derives the "Get started" checklist from existing data.
 * No per-task flags are stored; progress is always recomputed.
 */

export type GettingStartedTaskId = 'product' | 'sale' | 'suki';

export type GettingStartedInput = {
  productCount: number;
  hasSales: boolean;
  customerCount: number;
};

export type GettingStartedProgress = {
  tasks: { id: GettingStartedTaskId; done: boolean }[];
  doneCount: number;
  total: number;
  allDone: boolean;
};

const hasAny = (count: number): boolean => Number.isFinite(count) && count > 0;

export function deriveGettingStarted(
  input: GettingStartedInput,
): GettingStartedProgress {
  const tasks: GettingStartedProgress['tasks'] = [
    { id: 'product', done: hasAny(input.productCount) },
    { id: 'sale', done: input.hasSales },
    { id: 'suki', done: hasAny(input.customerCount) },
  ];
  const doneCount = tasks.filter((task) => task.done).length;
  return {
    tasks,
    doneCount,
    total: tasks.length,
    allDone: doneCount === tasks.length,
  };
}

export function shouldShowGettingStarted(
  progress: GettingStartedProgress,
  dismissed: boolean,
): boolean {
  return !dismissed && !progress.allDone;
}
```

Create `lib/gettingStartedStorage.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export const GETTING_STARTED_DISMISSED_KEY = 'getting_started_dismissed_v1';

export const loadGettingStartedDismissed = async (): Promise<boolean> => {
  try {
    const raw = await AsyncStorage.getItem(GETTING_STARTED_DISMISSED_KEY);
    return raw === 'true';
  } catch (error) {
    console.warn('Failed to load getting-started dismissed flag', error);
    return false;
  }
};

export const setGettingStartedDismissed = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(GETTING_STARTED_DISMISSED_KEY, 'true');
  } catch (error) {
    console.warn('Failed to save getting-started dismissed flag', error);
  }
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm jest tests/gettingStarted.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/gettingStarted.ts lib/gettingStartedStorage.ts tests/gettingStarted.test.ts
git commit -m "feat(onboarding): add getting-started progress and dismiss storage" -- lib/gettingStarted.ts lib/gettingStartedStorage.ts tests/gettingStarted.test.ts
```

---

### Task 3: Copy, tour constants, Sari asset slots

**Files:**
- Modify: `locales/en/onboarding.json`, `locales/tl/onboarding.json`, `constants/onboardingTour.ts`, `constants/onboardingTour.assets.ts`
- Create: `constants/gettingStarted.ts`, `assets/images/sari-emotions/sari-welcome-state.png`, `sari-celebrate-state.png`, `sari-pointing-state.png`
- Test: `tests/onboardingLocales.test.ts`

**Interfaces:**
- Produces (used by Tasks 4-9):
  - From `constants/onboardingTour.assets.ts`: `type SariState = 'default' | 'sales' | 'inventory' | 'lowStock' | 'utang' | 'balanceCleared' | 'reports'`, `SARI_STATE_ASSETS: Record<SariState, ImageSourcePropType>`, `SARI_FALLBACK_ASSET`, `SARI_WELCOME_ASSET`, `SARI_CELEBRATE_ASSET`, `SARI_POINTING_ASSET`, `SARI_READY_ASSET` (kept; `app/index.tsx` imports it).
  - From `constants/onboardingTour.ts`: `TabKey`, `TOUR_ORDER` (unchanged), `TourStepContent = { tab: TabKey; pose: SariState; labelKey: string; headlineKey: string; whatItDoesKey: string; whenToUseItKey: string; bubbleKey: string }`, `ONBOARDING_TOUR_STEPS`.
  - From `constants/gettingStarted.ts`: `FIRST_STEPS: readonly { id: GettingStartedTaskId; icon: IoniconName; titleKey: string; reasonKey: string; href: string }[]` with `IoniconName = 'cube-outline' | 'cash-outline' | 'people-outline'`.

- [ ] **Step 1: Write the failing test**

Create `tests/onboardingLocales.test.ts`:

```ts
import { FIRST_STEPS } from '@/constants/gettingStarted';
import { ONBOARDING_TOUR_STEPS } from '@/constants/onboardingTour';

const en = require('@/locales/en/onboarding.json') as Record<string, string>;
const tl = require('@/locales/tl/onboarding.json') as Record<string, string>;

describe('onboarding locales', () => {
  it('has the same keys in en and tl', () => {
    expect(Object.keys(tl).sort()).toEqual(Object.keys(en).sort());
  });

  it('has no empty strings', () => {
    for (const [key, value] of Object.entries({ ...en })) {
      expect(`${key}:${value.trim().length > 0}`).toBe(`${key}:true`);
    }
    for (const [key, value] of Object.entries({ ...tl })) {
      expect(`${key}:${value.trim().length > 0}`).toBe(`${key}:true`);
    }
  });

  it('defines every key the tour constants reference', () => {
    const keys = ONBOARDING_TOUR_STEPS.flatMap((step) => [
      step.labelKey,
      step.headlineKey,
      step.whatItDoesKey,
      step.whenToUseItKey,
      step.bubbleKey,
    ]);
    for (const key of keys) {
      expect(`${key}:${key in en}`).toBe(`${key}:true`);
      expect(`${key}:${key in tl}`).toBe(`${key}:true`);
    }
  });

  it('defines every key the first-step cards reference', () => {
    for (const step of FIRST_STEPS) {
      for (const key of [step.titleKey, step.reasonKey]) {
        expect(`${key}:${key in en}`).toBe(`${key}:true`);
        expect(`${key}:${key in tl}`).toBe(`${key}:true`);
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm jest tests/onboardingLocales.test.ts`
Expected: FAIL with "Cannot find module '@/constants/gettingStarted'"

- [ ] **Step 3: Implement**

3a. Copy placeholder art (Git Bash):

```bash
cd assets/images/sari-emotions
cp sari-default-state.png sari-welcome-state.png
cp sari-default-state.png sari-celebrate-state.png
cp sari-default-state.png sari-pointing-state.png
```

3b. Replace `constants/onboardingTour.assets.ts` entirely:

```ts
import { ImageSourcePropType } from 'react-native';

export type SariState =
  | 'default'
  | 'sales'
  | 'inventory'
  | 'lowStock'
  | 'utang'
  | 'balanceCleared'
  | 'reports';

export const SARI_STATE_ASSETS: Record<SariState, ImageSourcePropType> = {
  default: require('@/assets/images/sari-emotions/sari-default-state.png'),
  sales: require('@/assets/images/sari-emotions/sari-sales-state.png'),
  inventory: require('@/assets/images/sari-emotions/sari-inventory-state.png'),
  lowStock: require('@/assets/images/sari-emotions/sari-low-stock-state.png'),
  utang: require('@/assets/images/sari-emotions/sari-utang-state.png'),
  balanceCleared: require('@/assets/images/sari-emotions/sari-balance-cleared-state.png'),
  reports: require('@/assets/images/sari-emotions/sari-reports-state.png'),
};

export const SARI_FALLBACK_ASSET = SARI_STATE_ASSETS.default;

// The three files below start as copies of sari-default-state.png.
// Overwrite them with the real art (see docs/superpowers/sari-art-prompts.md).
export const SARI_WELCOME_ASSET: ImageSourcePropType = require('@/assets/images/sari-emotions/sari-welcome-state.png');
export const SARI_CELEBRATE_ASSET: ImageSourcePropType = require('@/assets/images/sari-emotions/sari-celebrate-state.png');
export const SARI_POINTING_ASSET: ImageSourcePropType = require('@/assets/images/sari-emotions/sari-pointing-state.png');

// Still imported by app/index.tsx.
export const SARI_READY_ASSET: ImageSourcePropType = SARI_STATE_ASSETS.default;
```

3c. Replace `constants/onboardingTour.ts` entirely:

```ts
import type { SariState } from './onboardingTour.assets';

export type TabKey = 'home' | 'sales' | 'inventory' | 'customers' | 'more';

export const TOUR_ORDER: TabKey[] = [
  'home',
  'sales',
  'inventory',
  'customers',
  'more',
];

/** All text fields are i18n keys in the `onboarding` namespace. */
export type TourStepContent = {
  tab: TabKey;
  pose: SariState; // Sari pose when the step opens
  labelKey: string;
  headlineKey: string;
  whatItDoesKey: string;
  whenToUseItKey: string;
  bubbleKey: string; // Sari's opening speech bubble
};

export const ONBOARDING_TOUR_STEPS: TourStepContent[] = [
  {
    tab: 'home',
    pose: 'default',
    labelKey: 'tourHomeLabel',
    headlineKey: 'tourHomeHeadline',
    whatItDoesKey: 'tourHomeWhatItDoes',
    whenToUseItKey: 'tourHomeWhen',
    bubbleKey: 'tourHomeBubble',
  },
  {
    tab: 'sales',
    pose: 'default',
    labelKey: 'tourSalesLabel',
    headlineKey: 'tourSalesHeadline',
    whatItDoesKey: 'tourSalesWhatItDoes',
    whenToUseItKey: 'tourSalesWhen',
    bubbleKey: 'tourSalesBubble',
  },
  {
    tab: 'inventory',
    pose: 'lowStock',
    labelKey: 'tourInventoryLabel',
    headlineKey: 'tourInventoryHeadline',
    whatItDoesKey: 'tourInventoryWhatItDoes',
    whenToUseItKey: 'tourInventoryWhen',
    bubbleKey: 'tourInventoryBubble',
  },
  {
    tab: 'customers',
    pose: 'utang',
    labelKey: 'tourCustomersLabel',
    headlineKey: 'tourCustomersHeadline',
    whatItDoesKey: 'tourCustomersWhatItDoes',
    whenToUseItKey: 'tourCustomersWhen',
    bubbleKey: 'tourCustomersBubble',
  },
  {
    tab: 'more',
    pose: 'reports',
    labelKey: 'tourMoreLabel',
    headlineKey: 'tourMoreHeadline',
    whatItDoesKey: 'tourMoreWhatItDoes',
    whenToUseItKey: 'tourMoreWhen',
    bubbleKey: 'tourMoreBubble',
  },
];
```

3d. Create `constants/gettingStarted.ts`:

```ts
import type { GettingStartedTaskId } from '@/lib/gettingStarted';

export type FirstStepIcon = 'cube-outline' | 'cash-outline' | 'people-outline';

export type FirstStep = {
  id: GettingStartedTaskId;
  icon: FirstStepIcon;
  titleKey: string;
  reasonKey: string;
  /** expo-router path; cast to Href at the call site. */
  href: string;
};

export const FIRST_STEPS: readonly FirstStep[] = [
  {
    id: 'product',
    icon: 'cube-outline',
    titleKey: 'readyStepProductTitle',
    reasonKey: 'readyStepProductReason',
    href: '/(edit-forms)/add-product',
  },
  {
    id: 'sale',
    icon: 'cash-outline',
    titleKey: 'readyStepSaleTitle',
    reasonKey: 'readyStepSaleReason',
    href: '/(tabs)/sales/pos',
  },
  {
    id: 'suki',
    icon: 'people-outline',
    titleKey: 'readyStepSukiTitle',
    reasonKey: 'readyStepSukiReason',
    href: '/(edit-forms)/add-customer',
  },
];
```

3e. Append these keys to `locales/en/onboarding.json` (keep all existing keys; add a comma after the last existing entry, then add before the closing brace). Remove `"profileIntro"` only if unused later; keep it, Task 7 still uses it.

```json
  "progressA11y": "Step {{current}} of {{total}}",
  "progressCount": "{{current}} of {{total}}",

  "profileHeroTitle": "Your store, organized.",
  "profileHeroSub": "Sales, stock, and suki balances in one place. Works with no internet.",

  "tourUseItWhen": "Use it when",
  "tourHomeLabel": "HOME",
  "tourHomeHeadline": "Your counter at a glance",
  "tourHomeWhatItDoes": "See today's sales, items sold, and credit totals without opening anything else.",
  "tourHomeWhen": "First thing in the morning, or between rushes, to know where you stand.",
  "tourHomeBubble": "Tap a box to see what it shows.",
  "tourSalesLabel": "SALES",
  "tourSalesHeadline": "Ring up a sale in seconds",
  "tourSalesWhatItDoes": "Pick items, set quantity, choose cash or utang. Works without internet.",
  "tourSalesWhen": "Every time a suki is at the counter.",
  "tourSalesBubble": "Tap the items your suki is buying.",
  "tourInventoryLabel": "INVENTORY",
  "tourInventoryHeadline": "Know what's on the shelf",
  "tourInventoryWhatItDoes": "Add products, set prices, and restock. Sari flags low stock so you don't run out.",
  "tourInventoryWhen": "When new stock arrives or when you notice something running low.",
  "tourInventoryBubble": "Kape is running low. Tap Restock.",
  "tourCustomersLabel": "CUSTOMERS",
  "tourCustomersHeadline": "Track suki balances",
  "tourCustomersWhatItDoes": "Log credit sales and payments. Balances are computed from each suki's transactions and always add up.",
  "tourCustomersWhen": "When a suki says \"tabi muna\" or comes in to pay.",
  "tourCustomersBubble": "Aling Nena came to pay. Tap Mark paid.",
  "tourMoreLabel": "MORE",
  "tourMoreHeadline": "See how the store is doing",
  "tourMoreWhatItDoes": "Daily, weekly, and monthly totals. Best sellers, slow movers, and credit aging.",
  "tourMoreWhen": "At the end of the day, or when you want to plan tomorrow's stock.",
  "tourMoreBubble": "Tap a bar to see that day's total.",

  "demoTryIt": "TRY IT",
  "demoDone": "Nice, you got it",
  "demoDoneA11y": "Practice step complete",
  "demoHomeTileSales": "Today's sales",
  "demoHomeTileItems": "Items sold",
  "demoHomeTileCredit": "Utang out",
  "demoHomeSalesBubble": "This is how much you earned today.",
  "demoHomeItemsBubble": "How many items left the shelf today.",
  "demoHomeCreditBubble": "Money your suki still owe you.",
  "demoSalesItemA11y": "Add {{name}}",
  "demoSalesTotal": "Total",
  "demoSalesEmpty": "Tap an item to start",
  "demoSalesCash": "Cash",
  "demoSalesUtang": "Utang",
  "demoSalesDoneBubble": "Sold! The total was {{total}}.",
  "demoInvLow": "Low",
  "demoInvOk": "OK",
  "demoInvRestock": "Restock",
  "demoInvRestockA11y": "Restock {{name}}",
  "demoInvDoneBubble": "Restocked. The bar is full again.",
  "demoCustBalance": "Balance",
  "demoCustOwes": "Owes",
  "demoCustPaid": "Paid",
  "demoCustMarkPaid": "Mark paid",
  "demoCustDoneBubble": "Balance cleared. No more utang.",
  "demoMoreDayMon": "Mon",
  "demoMoreDayTue": "Tue",
  "demoMoreDayWed": "Wed",
  "demoMoreDayBarA11y": "{{day}}, {{total}}",
  "demoMoreSelectedBubble": "On {{day}} you earned {{total}}.",

  "readyFirstStepsTitle": "First steps",
  "readyStepProductTitle": "Add your first product",
  "readyStepProductReason": "So Sari knows what's on your shelf.",
  "readyStepSaleTitle": "Ring your first sale",
  "readyStepSaleReason": "See how fast checkout feels.",
  "readyStepSukiTitle": "Add your first suki",
  "readyStepSukiReason": "Start tracking who owes you.",
  "readyStepA11y": "{{title}}. {{reason}}",

  "gettingStartedTitle": "Get started",
  "gettingStartedProgress": "{{done}} of {{total}} done",
  "gettingStartedDismissA11y": "Hide the Get started card"
```

Append to `locales/tl/onboarding.json` (same placement, same keys):

```json
  "progressA11y": "Hakbang {{current}} sa {{total}}",
  "progressCount": "{{current}} sa {{total}}",

  "profileHeroTitle": "Maayos na ang tindahan mo.",
  "profileHeroSub": "Benta, stock, at utang ng suki sa iisang lugar. Gumagana kahit walang internet.",

  "tourUseItWhen": "Gamitin kapag",
  "tourHomeLabel": "HOME",
  "tourHomeHeadline": "Tanaw ang buong tindahan",
  "tourHomeWhatItDoes": "Makita ang benta ngayon, mga naibenta, at kabuuang utang nang hindi nagbubukas ng iba.",
  "tourHomeWhen": "Pagbukas sa umaga, o sa pagitan ng dagsa ng bumibili.",
  "tourHomeBubble": "Pindutin ang kahon para makita ang laman.",
  "tourSalesLabel": "BENTA",
  "tourSalesHeadline": "Magbenta sa ilang segundo",
  "tourSalesWhatItDoes": "Pumili ng items, itakda ang dami, piliin ang cash o utang. Gumagana kahit walang internet.",
  "tourSalesWhen": "Tuwing may suki sa counter.",
  "tourSalesBubble": "Pindutin ang mga binibili ng suki mo.",
  "tourInventoryLabel": "INVENTORY",
  "tourInventoryHeadline": "Alamin ang laman ng istante",
  "tourInventoryWhatItDoes": "Magdagdag ng produkto, magtakda ng presyo, at mag-restock. Babalaan ka ni Sari kapag paubos na.",
  "tourInventoryWhen": "Kapag dumating ang bagong stock o napansin mong paubos na.",
  "tourInventoryBubble": "Paubos na ang kape. Pindutin ang Restock.",
  "tourCustomersLabel": "SUKI",
  "tourCustomersHeadline": "Bantayan ang utang ng suki",
  "tourCustomersWhatItDoes": "I-log ang utang at bayad. Kinukwenta ang balanse mula sa bawat transaksyon ng suki kaya laging tama.",
  "tourCustomersWhen": "Kapag may nagsabing \"tabi muna\" o kapag may magbabayad.",
  "tourCustomersBubble": "Nagbayad si Aling Nena. Pindutin ang Mark paid.",
  "tourMoreLabel": "IBA PA",
  "tourMoreHeadline": "Tingnan ang takbo ng tindahan",
  "tourMoreWhatItDoes": "Kabuuan kada araw, linggo, at buwan. Pinakamabenta, mabagal ang benta, at tagal ng utang.",
  "tourMoreWhen": "Sa pagsara ng araw, o kapag magpaplano ng stock bukas.",
  "tourMoreBubble": "Pindutin ang bar para makita ang kabuuan ng araw na iyon.",

  "demoTryIt": "SUBUKAN",
  "demoDone": "Ayos, nagawa mo",
  "demoDoneA11y": "Tapos na ang pagsasanay",
  "demoHomeTileSales": "Benta ngayon",
  "demoHomeTileItems": "Naibenta",
  "demoHomeTileCredit": "Utang",
  "demoHomeSalesBubble": "Ito ang kinita mo ngayong araw.",
  "demoHomeItemsBubble": "Ilang item ang lumabas sa istante ngayon.",
  "demoHomeCreditBubble": "Perang utang pa sa iyo ng mga suki.",
  "demoSalesItemA11y": "Idagdag ang {{name}}",
  "demoSalesTotal": "Kabuuan",
  "demoSalesEmpty": "Pumili ng item para magsimula",
  "demoSalesCash": "Cash",
  "demoSalesUtang": "Utang",
  "demoSalesDoneBubble": "Naibenta! Ang kabuuan ay {{total}}.",
  "demoInvLow": "Paubos",
  "demoInvOk": "OK",
  "demoInvRestock": "Restock",
  "demoInvRestockA11y": "I-restock ang {{name}}",
  "demoInvDoneBubble": "Na-restock na. Puno ulit ang bar.",
  "demoCustBalance": "Balanse",
  "demoCustOwes": "May utang",
  "demoCustPaid": "Bayad na",
  "demoCustMarkPaid": "Mark paid",
  "demoCustDoneBubble": "Bayad na. Wala nang utang.",
  "demoMoreDayMon": "Lun",
  "demoMoreDayTue": "Mar",
  "demoMoreDayWed": "Miy",
  "demoMoreDayBarA11y": "{{day}}, {{total}}",
  "demoMoreSelectedBubble": "Nitong {{day}} kumita ka ng {{total}}.",

  "readyFirstStepsTitle": "Mga unang hakbang",
  "readyStepProductTitle": "Idagdag ang unang produkto",
  "readyStepProductReason": "Para alam ni Sari ang laman ng istante mo.",
  "readyStepSaleTitle": "Subukan ang unang benta",
  "readyStepSaleReason": "Tingnan kung gaano kabilis mag-checkout.",
  "readyStepSukiTitle": "Idagdag ang unang suki",
  "readyStepSukiReason": "Simulan ang pagbantay sa mga may utang.",
  "readyStepA11y": "{{title}}. {{reason}}",

  "gettingStartedTitle": "Magsimula",
  "gettingStartedProgress": "{{done}} sa {{total}} tapos na",
  "gettingStartedDismissA11y": "Itago ang Magsimula card"
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm jest tests/onboardingLocales.test.ts`
Expected: PASS (JSON parses, keys match, constants resolve).

Note: `tsc` will now fail in `TourCard.tsx`, `ProfileStep.tsx`, `app/onboarding/index.tsx` (they import removed exports). That is expected. Later tasks fix them. Do not run `pnpm typecheck` as a gate until Task 8.

- [ ] **Step 5: Commit**

```bash
git add locales/en/onboarding.json locales/tl/onboarding.json constants/onboardingTour.ts constants/onboardingTour.assets.ts constants/gettingStarted.ts assets/images/sari-emotions/sari-welcome-state.png assets/images/sari-emotions/sari-celebrate-state.png assets/images/sari-emotions/sari-pointing-state.png tests/onboardingLocales.test.ts
git commit -m "feat(onboarding): move tour copy to locales and add Sari asset slots" -- locales/en/onboarding.json locales/tl/onboarding.json constants/onboardingTour.ts constants/onboardingTour.assets.ts constants/gettingStarted.ts assets/images/sari-emotions/sari-welcome-state.png assets/images/sari-emotions/sari-celebrate-state.png assets/images/sari-emotions/sari-pointing-state.png tests/onboardingLocales.test.ts
```

---

### Task 4: Shared onboarding primitives

**Files:**
- Create: `components/onboarding/OnboardingProgress.tsx`, `StepTransition.tsx`, `SariStage.tsx`, `SuccessCheck.tsx`, `HintRing.tsx`, `components/onboarding/demos/types.ts`
- Test: `components/onboarding/__tests__/OnboardingProgress.test.tsx`

**Interfaces:**
- Consumes: `SariState`, `SARI_FALLBACK_ASSET` (Task 3); `useReducedMotion`.
- Produces:
  - `OnboardingProgress({ currentIndex, totalSteps, label, counterText })`
  - `StepTransition({ stepKey: number; direction: 1 | -1; children })`
  - `SariStage({ source: ImageSourcePropType; bubble?: string | undefined; poseKey?: string | undefined; size?: number })`
  - `SuccessCheck({ label: string })`
  - `HintRing({ active: boolean; children })`
  - `demos/types.ts`: `type BubbleParams = Record<string, string | number>`, `type DemoProps = { setPose: (state: SariState) => void; say: (key: string, params?: BubbleParams) => void; complete: () => void }`

- [ ] **Step 1: Write the failing test**

Create `components/onboarding/__tests__/OnboardingProgress.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';

jest.mock('moti', () => {
  const { View } = require('react-native');
  return { MotiView: View };
});

describe('OnboardingProgress', () => {
  it('is one accessible progressbar with a 1-based value', async () => {
    const screen = await render(
      <OnboardingProgress
        currentIndex={2}
        totalSteps={7}
        label="Step 3 of 7"
        counterText="3 of 7"
      />,
    );

    const bar = screen.getByLabelText('Step 3 of 7');
    expect(bar.props['accessibilityRole']).toBe('progressbar');
    expect(bar.props['accessibilityValue']).toEqual({
      min: 1,
      max: 7,
      now: 3,
    });
    expect(screen.getByText('3 of 7')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm jest components/onboarding/__tests__/OnboardingProgress.test.tsx`
Expected: FAIL with "Cannot find module '@/components/onboarding/OnboardingProgress'"

- [ ] **Step 3: Implement**

`components/onboarding/OnboardingProgress.tsx`:

```tsx
import { View } from 'react-native';
import { MotiView } from 'moti';
import { StyledText } from '@/components/elements';

/**
 * OnboardingProgress - slim segmented bar plus a "N of M" counter,
 * exposed to screen readers as one progressbar element. The parent
 * passes pre-translated strings so this stays presentational.
 */

type Props = {
  currentIndex: number; // 0-based
  totalSteps: number;
  label: string;
  counterText: string;
};

export function OnboardingProgress({
  currentIndex,
  totalSteps,
  label,
  counterText,
}: Props) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 1, max: totalSteps, now: currentIndex + 1 }}
      className="flex-1 flex-row items-center gap-3"
    >
      <View
        importantForAccessibility="no-hide-descendants"
        className="flex-1 flex-row gap-1"
      >
        {Array.from({ length: totalSteps }).map((_, idx) => {
          const reached = idx <= currentIndex;
          return (
            <MotiView
              key={idx}
              animate={{ opacity: reached ? 1 : 0.35 }}
              transition={{ type: 'timing', duration: 240 }}
              className={`h-1.5 flex-1 rounded-full ${
                reached ? 'bg-persimmon-500' : 'bg-ink-300'
              }`}
            />
          );
        })}
      </View>
      <StyledText variant="semibold" className="text-ink-500 text-caption">
        {counterText}
      </StyledText>
    </View>
  );
}
```

`components/onboarding/StepTransition.tsx`:

```tsx
import { ReactNode } from 'react';
import { MotiView } from 'moti';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * StepTransition - enter animation shared by every onboarding step.
 * Forward steps slide in from the right, back steps from the left.
 * Changing `stepKey` remounts the child tree, which also resets any
 * local widget state. Reduce Motion falls back to a fade.
 */

type Props = {
  stepKey: number;
  direction: 1 | -1;
  children: ReactNode;
};

export function StepTransition({ stepKey, direction, children }: Props) {
  const reducedMotion = useReducedMotion();
  return (
    <MotiView
      key={stepKey}
      from={{ opacity: 0, translateX: reducedMotion ? 0 : 24 * direction }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: 320 }}
      className="flex-1"
    >
      {children}
    </MotiView>
  );
}
```

`components/onboarding/SariStage.tsx`:

```tsx
import { useState } from 'react';
import { Image, ImageSourcePropType, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { StyledText } from '@/components/elements';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { SARI_FALLBACK_ASSET } from '@/constants/onboardingTour.assets';

/**
 * SariStage - Sari on a warm paper gradient with an optional speech
 * bubble. Changing `poseKey` replays a small spring so pose swaps feel
 * alive. A failed image load falls back to the default Sari.
 */

type Props = {
  source: ImageSourcePropType;
  bubble?: string | undefined;
  poseKey?: string | undefined;
  size?: number;
};

export function SariStage({ source, bubble, poseKey, size = 140 }: Props) {
  const reducedMotion = useReducedMotion();
  const [failedSource, setFailedSource] = useState<ImageSourcePropType | null>(
    null,
  );
  const shown = failedSource === source ? SARI_FALLBACK_ASSET : source;

  return (
    <View className="w-full rounded-3xl overflow-hidden">
      <LinearGradient
        colors={['#F7F6F2', '#FFE0D1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <MotiView
          key={poseKey ?? 'static'}
          from={{
            scale: reducedMotion ? 1 : 0.9,
            translateY: reducedMotion ? 0 : 6,
          }}
          animate={{ scale: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 12 }}
          style={{ width: size, height: size }}
        >
          <Image
            source={shown}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
            onError={() => setFailedSource(source)}
            className="w-full h-full"
          />
        </MotiView>

        {bubble ? (
          <View
            accessibilityLiveRegion="polite"
            className="flex-1 ml-3 bg-paper-50 border border-paper-300 rounded-2xl px-4 py-3"
          >
            <StyledText variant="medium" className="text-ink-700 text-sm">
              {bubble}
            </StyledText>
          </View>
        ) : null}
      </LinearGradient>
    </View>
  );
}
```

`components/onboarding/SuccessCheck.tsx`:

```tsx
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { StyledText } from '@/components/elements';

type Props = { label: string };

export function SuccessCheck({ label }: Props) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 14 }}
    >
      <View className="flex-row items-center gap-1">
        <Ionicons name="checkmark-circle" size={18} color="#4F7A4B" />
        <StyledText variant="semibold" className="text-sage-700 text-caption">
          {label}
        </StyledText>
      </View>
    </MotiView>
  );
}
```

`components/onboarding/HintRing.tsx`:

```tsx
import { ReactNode } from 'react';
import { View } from 'react-native';
import { MotiView } from 'moti';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * HintRing - pulsing ring that marks the next tap target. Under Reduce
 * Motion it renders a static ring instead of pulsing.
 */

type Props = { active: boolean; children: ReactNode };

export function HintRing({ active, children }: Props) {
  const reducedMotion = useReducedMotion();
  return (
    <View className="relative">
      {active ? (
        <MotiView
          pointerEvents="none"
          from={{ opacity: 0.9, scale: 1 }}
          animate={{
            opacity: reducedMotion ? 0.9 : 0,
            scale: reducedMotion ? 1 : 1.1,
          }}
          transition={{ type: 'timing', duration: 1100, loop: !reducedMotion }}
          className="absolute inset-0 rounded-2xl border-2 border-persimmon-400"
        />
      ) : null}
      {children}
    </View>
  );
}
```

`components/onboarding/demos/types.ts`:

```ts
import type { SariState } from '@/constants/onboardingTour.assets';

export type BubbleParams = Record<string, string | number>;

/** What TourCard hands to every demo widget. */
export type DemoProps = {
  setPose: (state: SariState) => void;
  say: (key: string, params?: BubbleParams) => void;
  /** Idempotent: safe to call on every qualifying tap. */
  complete: () => void;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm jest components/onboarding/__tests__/OnboardingProgress.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/onboarding/OnboardingProgress.tsx components/onboarding/StepTransition.tsx components/onboarding/SariStage.tsx components/onboarding/SuccessCheck.tsx components/onboarding/HintRing.tsx components/onboarding/demos/types.ts components/onboarding/__tests__/OnboardingProgress.test.tsx
git commit -m "feat(onboarding): add progress, transition, Sari stage, and hint primitives" -- components/onboarding/OnboardingProgress.tsx components/onboarding/StepTransition.tsx components/onboarding/SariStage.tsx components/onboarding/SuccessCheck.tsx components/onboarding/HintRing.tsx components/onboarding/demos/types.ts components/onboarding/__tests__/OnboardingProgress.test.tsx
```

---

### Task 5: Demo widgets and registry

**Files:**
- Create: `components/onboarding/demos/{HomeDemo,SalesDemo,InventoryDemo,CustomersDemo,ReportsDemo}.tsx`, `components/onboarding/demos/index.ts`
- Test: `components/onboarding/__tests__/demos.test.tsx`

**Interfaces:**
- Consumes: `DemoProps`, `HintRing` (Task 4); all helpers from `lib/onboardingDemo.ts` (Task 1); `formatPesos`; `StatusPill` from `@/components/ui/StatusPill`.
- Produces: `DEMO_BY_TAB: Record<TabKey, ComponentType<DemoProps>>`.

- [ ] **Step 1: Write the failing test**

Create `components/onboarding/__tests__/demos.test.tsx`:

```tsx
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { CustomersDemo } from '@/components/onboarding/demos/CustomersDemo';
import { InventoryDemo } from '@/components/onboarding/demos/InventoryDemo';
import { SalesDemo } from '@/components/onboarding/demos/SalesDemo';

jest.mock('moti', () => {
  const { View } = require('react-native');
  return { MotiView: View };
});
jest.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}));

const makeApi = () => ({
  setPose: jest.fn(),
  say: jest.fn(),
  complete: jest.fn(),
});

describe('SalesDemo', () => {
  it('keeps the pay buttons disabled until an item is added', async () => {
    const api = makeApi();
    const screen = await render(<SalesDemo {...api} />);

    await fireEvent.press(screen.getByLabelText('demoSalesCash'));
    expect(api.complete).not.toHaveBeenCalled();

    await fireEvent.press(
      screen.getByLabelText('demoSalesItemA11y:{"name":"Kape sachet"}'),
    );
    await fireEvent.press(screen.getByLabelText('demoSalesCash'));

    expect(api.complete).toHaveBeenCalledTimes(1);
    expect(api.setPose).toHaveBeenCalledWith('sales');
    expect(api.say).toHaveBeenCalledWith('demoSalesDoneBubble', {
      total: '₱8.00',
    });
  });
});

describe('InventoryDemo', () => {
  it('restocks the low item and swaps Sari to the inventory pose', async () => {
    const api = makeApi();
    const screen = await render(<InventoryDemo {...api} />);

    await fireEvent.press(
      screen.getByLabelText('demoInvRestockA11y:{"name":"Kape sachet"}'),
    );

    expect(api.complete).toHaveBeenCalledTimes(1);
    expect(api.setPose).toHaveBeenCalledWith('inventory');
    expect(
      screen.queryByLabelText('demoInvRestockA11y:{"name":"Kape sachet"}'),
    ).toBeNull();
  });
});

describe('CustomersDemo', () => {
  it('clears the balance and swaps Sari to the cleared pose', async () => {
    const api = makeApi();
    const screen = await render(<CustomersDemo {...api} />);

    expect(screen.getByText('₱350.00')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('demoCustMarkPaid'));

    expect(screen.getByText('₱0.00')).toBeTruthy();
    expect(api.setPose).toHaveBeenCalledWith('balanceCleared');
    expect(api.complete).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm jest components/onboarding/__tests__/demos.test.tsx`
Expected: FAIL with "Cannot find module '@/components/onboarding/demos/CustomersDemo'"

- [ ] **Step 3: Implement**

`components/onboarding/demos/HomeDemo.tsx`:

```tsx
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { HintRing } from '@/components/onboarding/HintRing';
import { formatPesos } from '@/lib/money';
import type { DemoProps } from './types';

const TILES = [
  {
    id: 'sales',
    labelKey: 'demoHomeTileSales',
    bubbleKey: 'demoHomeSalesBubble',
    value: formatPesos(1250),
  },
  {
    id: 'items',
    labelKey: 'demoHomeTileItems',
    bubbleKey: 'demoHomeItemsBubble',
    value: '48',
  },
  {
    id: 'credit',
    labelKey: 'demoHomeTileCredit',
    bubbleKey: 'demoHomeCreditBubble',
    value: formatPesos(320),
  },
] as const;

export function HomeDemo({ say, complete }: DemoProps) {
  const { t } = useTranslation('onboarding');
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <View className="flex-row gap-2">
      {TILES.map((tile, idx) => {
        const isSelected = selected === tile.id;
        return (
          <View key={tile.id} className="flex-1">
            <HintRing active={selected === null && idx === 0}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t(tile.labelKey)}
                accessibilityState={{ selected: isSelected }}
                onPress={() => {
                  setSelected(tile.id);
                  say(tile.bubbleKey);
                  complete();
                }}
                className={`min-h-[88px] justify-between rounded-2xl border p-3 ${
                  isSelected
                    ? 'bg-persimmon-50 border-persimmon-400'
                    : 'bg-paper-100 border-paper-300'
                }`}
              >
                <StyledText
                  variant="medium"
                  className="text-ink-500 text-caption"
                >
                  {t(tile.labelKey)}
                </StyledText>
                <StyledText variant="extrabold" className="text-ink-900 text-base">
                  {tile.value}
                </StyledText>
              </Pressable>
            </HintRing>
          </View>
        );
      })}
    </View>
  );
}
```

`components/onboarding/demos/SalesDemo.tsx`:

```tsx
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { HintRing } from '@/components/onboarding/HintRing';
import { formatPesos } from '@/lib/money';
import {
  DEMO_SALE_ITEMS,
  DemoCart,
  addToCart,
  cartQuantity,
  cartTotal,
} from '@/lib/onboardingDemo';
import type { DemoProps } from './types';

export function SalesDemo({ setPose, say, complete }: DemoProps) {
  const { t } = useTranslation('onboarding');
  const [cart, setCart] = useState<DemoCart>({});
  const [paid, setPaid] = useState(false);

  const total = cartTotal(cart);
  const hasItems = cartQuantity(cart) > 0;
  const canPay = hasItems && !paid;

  const handlePay = () => {
    if (!canPay) return;
    setPaid(true);
    setPose('sales');
    say('demoSalesDoneBubble', { total: formatPesos(total) });
    complete();
  };

  return (
    <View className="gap-2">
      {DEMO_SALE_ITEMS.map((item, idx) => {
        const qty = cart[item.id] ?? 0;
        return (
          <HintRing key={item.id} active={!hasItems && idx === 0}>
            <Pressable
              disabled={paid}
              accessibilityRole="button"
              accessibilityLabel={t('demoSalesItemA11y', { name: item.name })}
              onPress={() => setCart((c) => addToCart(c, item.id))}
              className="min-h-[44px] flex-row items-center justify-between rounded-2xl border border-paper-300 bg-paper-100 px-3 py-2"
            >
              <StyledText variant="medium" className="text-ink-800 text-sm">
                {item.name}
                {qty > 0 ? `  x${qty}` : ''}
              </StyledText>
              <StyledText variant="semibold" className="text-ink-600 text-sm">
                {formatPesos(item.price)}
              </StyledText>
            </Pressable>
          </HintRing>
        );
      })}

      <View className="flex-row items-center justify-between px-1 pt-1">
        <StyledText variant="medium" className="text-ink-500 text-caption">
          {hasItems ? t('demoSalesTotal') : t('demoSalesEmpty')}
        </StyledText>
        <StyledText variant="extrabold" className="text-ink-900 text-base">
          {formatPesos(total)}
        </StyledText>
      </View>

      <View className="flex-row gap-2">
        <View className="flex-1">
          <HintRing active={canPay}>
            <Pressable
              disabled={!canPay}
              accessibilityRole="button"
              accessibilityLabel={t('demoSalesCash')}
              accessibilityState={{ disabled: !canPay }}
              onPress={handlePay}
              className={`min-h-[44px] items-center justify-center rounded-2xl bg-persimmon-500 ${
                canPay ? '' : 'opacity-50'
              }`}
            >
              <StyledText variant="semibold" className="text-white">
                {t('demoSalesCash')}
              </StyledText>
            </Pressable>
          </HintRing>
        </View>
        <Pressable
          disabled={!canPay}
          accessibilityRole="button"
          accessibilityLabel={t('demoSalesUtang')}
          accessibilityState={{ disabled: !canPay }}
          onPress={handlePay}
          className={`min-h-[44px] flex-1 items-center justify-center rounded-2xl border border-persimmon-500 ${
            canPay ? '' : 'opacity-50'
          }`}
        >
          <StyledText variant="semibold" className="text-persimmon-600">
            {t('demoSalesUtang')}
          </StyledText>
        </Pressable>
      </View>
    </View>
  );
}
```

Note: the test presses the element labelled `demoSalesCash`; because the mocked `t` returns the key and both the pay `Pressable` and its inner text share that label only on the Pressable (Text has no `accessibilityLabel`), `getByLabelText` resolves to the single button.

`components/onboarding/demos/InventoryDemo.tsx`:

```tsx
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { StatusPill } from '@/components/ui/StatusPill';
import { HintRing } from '@/components/onboarding/HintRing';
import { isLowStock, restock, stockRatio } from '@/lib/onboardingDemo';
import type { DemoProps } from './types';

const PRODUCTS = [
  { id: 'kape', name: 'Kape sachet', qty: 3 },
  { id: 'sabon', name: 'Sabon', qty: 14 },
  { id: 'asukal', name: 'Asukal', qty: 9 },
] as const;

const RESTOCK_AMOUNT = 12;

export function InventoryDemo({ setPose, say, complete }: DemoProps) {
  const { t } = useTranslation('onboarding');
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(PRODUCTS.map((p) => [p.id, p.qty])),
  );

  const handleRestock = (id: string) => {
    setQuantities((q) => ({ ...q, [id]: restock(q[id] ?? 0, RESTOCK_AMOUNT) }));
    setPose('inventory');
    say('demoInvDoneBubble');
    complete();
  };

  return (
    <View className="gap-3">
      {PRODUCTS.map((product) => {
        const qty = quantities[product.id] ?? 0;
        const low = isLowStock(qty);
        return (
          <View key={product.id} className="gap-1.5">
            <View className="flex-row items-center justify-between">
              <StyledText variant="medium" className="text-ink-800 text-sm">
                {product.name}
              </StyledText>
              <StatusPill variant={low ? 'warning' : 'success'} size="sm">
                {low ? t('demoInvLow') : t('demoInvOk')}
              </StatusPill>
            </View>
            <View className="h-2 rounded-full bg-ink-100 overflow-hidden">
              <View
                className={`h-2 rounded-full ${low ? 'bg-persimmon-500' : 'bg-sage-500'}`}
                style={{ width: `${Math.round(stockRatio(qty) * 100)}%` }}
              />
            </View>
            {low ? (
              <HintRing active>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('demoInvRestockA11y', {
                    name: product.name,
                  })}
                  onPress={() => handleRestock(product.id)}
                  className="min-h-[44px] items-center justify-center rounded-2xl bg-persimmon-500"
                >
                  <StyledText variant="semibold" className="text-white">
                    {t('demoInvRestock')}
                  </StyledText>
                </Pressable>
              </HintRing>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
```

`components/onboarding/demos/CustomersDemo.tsx`:

```tsx
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { StatusPill } from '@/components/ui/StatusPill';
import { HintRing } from '@/components/onboarding/HintRing';
import { formatPesos } from '@/lib/money';
import { markPaid } from '@/lib/onboardingDemo';
import type { DemoProps } from './types';

const START_BALANCE = 350;
const CUSTOMER_NAME = 'Aling Nena';

export function CustomersDemo({ setPose, say, complete }: DemoProps) {
  const { t } = useTranslation('onboarding');
  const [balance, setBalance] = useState(START_BALANCE);
  const cleared = balance === 0;

  const handleMarkPaid = () => {
    if (cleared) return;
    setBalance((b) => markPaid(b));
    setPose('balanceCleared');
    say('demoCustDoneBubble');
    complete();
  };

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <StyledText variant="semibold" className="text-ink-900 text-base">
          {CUSTOMER_NAME}
        </StyledText>
        <StatusPill variant={cleared ? 'success' : 'danger'} size="sm">
          {cleared ? t('demoCustPaid') : t('demoCustOwes')}
        </StatusPill>
      </View>

      <View className="flex-row items-end justify-between">
        <StyledText variant="medium" className="text-ink-500 text-caption">
          {t('demoCustBalance')}
        </StyledText>
        <StyledText variant="extrabold" className="text-ink-900 text-h1">
          {formatPesos(balance)}
        </StyledText>
      </View>

      <HintRing active={!cleared}>
        <Pressable
          disabled={cleared}
          accessibilityRole="button"
          accessibilityLabel={t('demoCustMarkPaid')}
          accessibilityState={{ disabled: cleared }}
          onPress={handleMarkPaid}
          className={`min-h-[44px] items-center justify-center rounded-2xl bg-persimmon-500 ${
            cleared ? 'opacity-50' : ''
          }`}
        >
          <StyledText variant="semibold" className="text-white">
            {t('demoCustMarkPaid')}
          </StyledText>
        </Pressable>
      </HintRing>
    </View>
  );
}
```

`components/onboarding/demos/ReportsDemo.tsx`:

```tsx
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { HintRing } from '@/components/onboarding/HintRing';
import { formatPesos } from '@/lib/money';
import { weeklyBarHeights } from '@/lib/onboardingDemo';
import type { DemoProps } from './types';

const DAYS = [
  { id: 'mon', labelKey: 'demoMoreDayMon', total: 800 },
  { id: 'tue', labelKey: 'demoMoreDayTue', total: 1250 },
  { id: 'wed', labelKey: 'demoMoreDayWed', total: 640 },
] as const;

const BAR_MAX_HEIGHT = 72;
const BAR_MIN_HEIGHT = 8;

export function ReportsDemo({ say, complete }: DemoProps) {
  const { t } = useTranslation('onboarding');
  const [selected, setSelected] = useState<string | null>(null);
  const heights = weeklyBarHeights(DAYS.map((d) => d.total));

  return (
    <View className="flex-row items-end justify-between gap-3">
      {DAYS.map((day, idx) => {
        const isSelected = selected === day.id;
        const barHeight =
          BAR_MIN_HEIGHT +
          Math.round((heights[idx] ?? 0) * (BAR_MAX_HEIGHT - BAR_MIN_HEIGHT));
        const label = t(day.labelKey);
        const total = formatPesos(day.total);
        return (
          <View key={day.id} className="flex-1">
            <HintRing active={selected === null && idx === 0}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('demoMoreDayBarA11y', { day: label, total })}
                accessibilityState={{ selected: isSelected }}
                onPress={() => {
                  setSelected(day.id);
                  say('demoMoreSelectedBubble', { day: label, total });
                  complete();
                }}
                className="min-h-[44px] items-center justify-end gap-1.5 rounded-2xl p-1"
                style={{ height: BAR_MAX_HEIGHT + 56 }}
              >
                <StyledText
                  variant="semibold"
                  className="text-ink-700 text-caption"
                >
                  {isSelected ? total : ' '}
                </StyledText>
                <View
                  className={`w-full rounded-xl ${
                    isSelected ? 'bg-persimmon-500' : 'bg-persimmon-200'
                  }`}
                  style={{ height: barHeight }}
                />
                <StyledText
                  variant="medium"
                  className="text-ink-500 text-caption"
                >
                  {label}
                </StyledText>
              </Pressable>
            </HintRing>
          </View>
        );
      })}
    </View>
  );
}
```

`components/onboarding/demos/index.ts`:

```ts
import type { ComponentType } from 'react';
import type { TabKey } from '@/constants/onboardingTour';
import { CustomersDemo } from './CustomersDemo';
import { HomeDemo } from './HomeDemo';
import { InventoryDemo } from './InventoryDemo';
import { ReportsDemo } from './ReportsDemo';
import { SalesDemo } from './SalesDemo';
import type { DemoProps } from './types';

export type { BubbleParams, DemoProps } from './types';

export const DEMO_BY_TAB: Record<TabKey, ComponentType<DemoProps>> = {
  home: HomeDemo,
  sales: SalesDemo,
  inventory: InventoryDemo,
  customers: CustomersDemo,
  more: ReportsDemo,
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm jest components/onboarding/__tests__/demos.test.tsx`
Expected: PASS. If `StatusPill` or `StyledText` need fonts or `className` handling that breaks under Jest, mock `@/components/elements` locally the way `components/more/__tests__/MoreDestinationRow.test.tsx` does not need to; first try unmocked.

- [ ] **Step 5: Commit**

```bash
git add components/onboarding/demos components/onboarding/__tests__/demos.test.tsx
git commit -m "feat(onboarding): add interactive demo widgets for each tour step" -- components/onboarding/demos components/onboarding/__tests__/demos.test.tsx
```

---

### Task 6: TourCard rewrite

**Files:**
- Modify (full replace): `components/onboarding/TourCard.tsx`

**Interfaces:**
- Consumes: `TourStepContent` (Task 3), `SARI_STATE_ASSETS`/`SariState` (Task 3), `SariStage`, `SuccessCheck` (Task 4), `DEMO_BY_TAB`, `BubbleParams` (Task 5), `StatusPill`.
- Produces: `TourCard({ step: TourStepContent })`. Remount (via the parent's `StepTransition` key) resets pose, bubble, and done state.

- [ ] **Step 1: Replace `components/onboarding/TourCard.tsx`**

```tsx
import { useCallback, useRef, useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { StatusPill } from '@/components/ui/StatusPill';
import { SariStage } from '@/components/onboarding/SariStage';
import { SuccessCheck } from '@/components/onboarding/SuccessCheck';
import {
  BubbleParams,
  DEMO_BY_TAB,
} from '@/components/onboarding/demos';
import { TourStepContent } from '@/constants/onboardingTour';
import {
  SARI_STATE_ASSETS,
  SariState,
} from '@/constants/onboardingTour.assets';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * TourCard - one tour step: Sari stage with a speech bubble, a
 * try-it demo widget, then the explanation text. The widget talks to
 * Sari through setPose / say and reports completion through complete.
 * Completing is never required to continue. The parent remounts this
 * component per step, which resets all local state.
 */

type Bubble = { key: string; params?: BubbleParams | undefined };

type Props = {
  step: TourStepContent;
};

export function TourCard({ step }: Props) {
  const { t } = useTranslation('onboarding');
  const reducedMotion = useReducedMotion();
  const [pose, setPose] = useState<SariState>(step.pose);
  const [bubble, setBubble] = useState<Bubble>({ key: step.bubbleKey });
  const [done, setDone] = useState(false);
  const doneRef = useRef(false);

  const Demo = DEMO_BY_TAB[step.tab];

  const say = useCallback((key: string, params?: BubbleParams) => {
    setBubble({ key, params });
  }, []);

  const complete = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setDone(true);
    AccessibilityInfo.announceForAccessibility(t('demoDoneA11y'));
    if (!reducedMotion) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
        () => undefined,
      );
    }
  }, [reducedMotion, t]);

  return (
    <View className="gap-4">
      <SariStage
        source={SARI_STATE_ASSETS[pose]}
        poseKey={pose}
        bubble={t(bubble.key, bubble.params)}
      />

      <View>
        <View className="flex-row items-center justify-between mb-2 min-h-[24px]">
          <StatusPill variant="neutral" size="md">
            {t(step.labelKey)}
          </StatusPill>
          {done ? (
            <SuccessCheck label={t('demoDone')} />
          ) : (
            <StyledText variant="extrabold" className="label-caps text-ink-400">
              {t('demoTryIt')}
            </StyledText>
          )}
        </View>
        <View className="bg-paper-50 border border-paper-300 rounded-3xl p-3">
          <Demo setPose={setPose} say={say} complete={complete} />
        </View>
      </View>

      <View>
        <StyledText variant="extrabold" className="text-ink-900 text-h1">
          {t(step.headlineKey)}
        </StyledText>
        <StyledText
          variant="regular"
          className="text-ink-600 text-body mt-2 leading-5"
        >
          {t(step.whatItDoesKey)}
        </StyledText>
        <View className="mt-3 self-start flex-row flex-wrap items-center gap-2 rounded-2xl bg-paper-100 border border-paper-300 px-3 py-2">
          <StyledText variant="extrabold" className="label-caps text-persimmon-600">
            {t('tourUseItWhen')}
          </StyledText>
          <StyledText variant="medium" className="text-ink-600 text-caption flex-shrink">
            {t(step.whenToUseItKey)}
          </StyledText>
        </View>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Commit** (typecheck is deferred to Task 8, because `app/onboarding/index.tsx` still imports removed exports)

```bash
git add components/onboarding/TourCard.tsx
git commit -m "feat(onboarding): rebuild TourCard around Sari stage and demo widget" -- components/onboarding/TourCard.tsx
```

---

### Task 7: Profile step hero and Ready step first-steps list

**Files:**
- Modify: `components/onboarding/ProfileStep.tsx`, `components/onboarding/ReadyStep.tsx`
- Test: `components/onboarding/__tests__/ReadyStep.test.tsx`

**Interfaces:**
- Consumes: `SARI_WELCOME_ASSET`, `SARI_CELEBRATE_ASSET` (Task 3); `FIRST_STEPS` (Task 3).
- Produces: `ReadyStep` props `{ profile: OnboardingProfile; saving: boolean; onOpenStore: (href?: string) => void }`. `onOpenStore()` with no argument is the primary CTA; `onOpenStore(href)` is a first-step card.

- [ ] **Step 1: Write the failing test**

Create `components/onboarding/__tests__/ReadyStep.test.tsx`:

```tsx
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ReadyStep } from '@/components/onboarding/ReadyStep';

jest.mock('moti', () => {
  const { View } = require('react-native');
  return { MotiView: View };
});
jest.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}));

const PRODUCT_CARD =
  'readyStepA11y:{"title":"readyStepProductTitle","reason":"readyStepProductReason"}';

describe('ReadyStep first steps', () => {
  it('routes a card tap with its href when the profile is valid', async () => {
    const onOpenStore = jest.fn();
    const screen = await render(
      <ReadyStep
        profile={{ ownerName: 'Nena', storeName: 'Nena Sari-Sari' }}
        saving={false}
        onOpenStore={onOpenStore}
      />,
    );

    await fireEvent.press(screen.getByLabelText(PRODUCT_CARD));
    expect(onOpenStore).toHaveBeenCalledWith('/(edit-forms)/add-product');
  });

  it('ignores card taps when names are blank or whitespace-only', async () => {
    const onOpenStore = jest.fn();
    const screen = await render(
      <ReadyStep
        profile={{ ownerName: '   ', storeName: '' }}
        saving={false}
        onOpenStore={onOpenStore}
      />,
    );

    await fireEvent.press(screen.getByLabelText(PRODUCT_CARD));
    await fireEvent.press(screen.getByLabelText('readyCtaA11y'));
    expect(onOpenStore).not.toHaveBeenCalled();
  });

  it('ignores card taps while saving', async () => {
    const onOpenStore = jest.fn();
    const screen = await render(
      <ReadyStep
        profile={{ ownerName: 'Nena', storeName: 'Nena Sari-Sari' }}
        saving
        onOpenStore={onOpenStore}
      />,
    );

    await fireEvent.press(screen.getByLabelText(PRODUCT_CARD));
    expect(onOpenStore).not.toHaveBeenCalled();
  });

  it('calls onOpenStore with no argument for the primary CTA', async () => {
    const onOpenStore = jest.fn();
    const screen = await render(
      <ReadyStep
        profile={{ ownerName: 'Nena', storeName: 'Nena Sari-Sari' }}
        saving={false}
        onOpenStore={onOpenStore}
      />,
    );

    await fireEvent.press(screen.getByLabelText('readyCtaA11y'));
    expect(onOpenStore).toHaveBeenCalledWith();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm jest components/onboarding/__tests__/ReadyStep.test.tsx`
Expected: FAIL (ReadyStep has no first-steps cards; import of removed asset may also error).

- [ ] **Step 3: Implement**

3a. Replace `components/onboarding/ReadyStep.tsx` entirely:

```tsx
import { ActivityIndicator, Image, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { StyledText } from '@/components/elements';
import { StatusStamp } from '@/components/ui/StatusStamp';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { FIRST_STEPS } from '@/constants/gettingStarted';
import { SARI_CELEBRATE_ASSET } from '@/constants/onboardingTour.assets';
import { OnboardingProfile } from '@/types/onboarding.types';
import { useTranslation } from 'react-i18next';

/**
 * ReadyStep - final onboarding screen. A persimmon "READY" stamp sits
 * on the celebrating Sari, the headline uses the owner's name, a
 * "First steps" list offers three shortcuts, and the CTA persists the
 * profile and routes to the tab group. A first-step card does the same
 * save, then also opens its screen. Cards and CTA share one guard:
 * no taps while saving or while a name is blank.
 */

type Props = {
  profile: OnboardingProfile;
  saving: boolean;
  /** No argument: open the store. With href: open the store, then that screen. */
  onOpenStore: (href?: string) => void;
};

export function ReadyStep({ profile, saving, onOpenStore }: Props) {
  const reducedMotion = useReducedMotion();
  const { t } = useTranslation('onboarding');
  const trimmedName = profile.ownerName.trim();
  const trimmedStore = profile.storeName.trim();
  const canOpen = !saving && trimmedName.length > 0 && trimmedStore.length > 0;

  return (
    <MotiView
      from={{ opacity: 0, translateY: reducedMotion ? 0 : 18 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 480, delay: 80 }}
    >
      <View className="items-center relative" style={{ height: 180 }}>
        <Image
          source={SARI_CELEBRATE_ASSET}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
          className="w-full h-full"
        />
        <View className="absolute top-2 right-2">
          <StatusStamp label={t('readyStamp')} tone="persimmon" rotate={-8} />
        </View>
      </View>

      <View className="items-center mt-4 px-4">
        <StyledText
          variant="extrabold"
          className="text-ink-900 text-h1 text-center"
        >
          {trimmedName
            ? t('readyGreetingNamed', { name: trimmedName })
            : t('readyGreetingDefault')}
        </StyledText>
        <StyledText
          variant="regular"
          className="text-ink-600 text-body text-center mt-2"
        >
          {trimmedStore
            ? t('readySublineNamed', { storeName: trimmedStore })
            : t('readySublineDefault')}
        </StyledText>
      </View>

      <View className="mt-6">
        <StyledText variant="extrabold" className="label-caps text-ink-400 mb-2">
          {t('readyFirstStepsTitle')}
        </StyledText>
        <View className="gap-2">
          {FIRST_STEPS.map((first) => {
            const title = t(first.titleKey);
            const reason = t(first.reasonKey);
            return (
              <TouchableOpacity
                key={first.id}
                disabled={!canOpen}
                onPress={() => {
                  if (canOpen) onOpenStore(first.href);
                }}
                accessibilityRole="button"
                accessibilityLabel={t('readyStepA11y', { title, reason })}
                accessibilityState={{ disabled: !canOpen }}
                className={`min-h-[56px] flex-row items-center gap-3 rounded-2xl border border-paper-300 bg-paper-50 px-3 py-2 press-scale active:opacity-80 ${
                  canOpen ? '' : 'opacity-50'
                }`}
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-persimmon-50">
                  <Ionicons name={first.icon} size={20} color="#E85A1F" />
                </View>
                <View className="flex-1">
                  <StyledText variant="semibold" className="text-ink-900 text-sm">
                    {title}
                  </StyledText>
                  <StyledText variant="regular" className="text-ink-500 text-caption">
                    {reason}
                  </StyledText>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#A89F90" />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View className="mt-6">
        <TouchableOpacity
          onPress={() => {
            if (canOpen) onOpenStore();
          }}
          disabled={!canOpen}
          accessibilityRole="button"
          accessibilityLabel={t('readyCtaA11y')}
          accessibilityState={{ disabled: !canOpen }}
          className={`bg-persimmon-500 rounded-2xl py-4 items-center shadow-persimmon-glow press-scale active:opacity-80 ${
            !canOpen ? 'opacity-50' : ''
          }`}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <StyledText variant="semibold" className="text-white text-base">
              {t('readyCta')}
            </StyledText>
          )}
        </TouchableOpacity>
      </View>
    </MotiView>
  );
}
```

3b. Edit `components/onboarding/ProfileStep.tsx`:

- Replace the import `import { SARI_PROFILE_ASSET } from '@/constants/onboardingTour.assets';` with `import { SARI_WELCOME_ASSET } from '@/constants/onboardingTour.assets';`.
- Replace the image block (the `<View className="items-center" style={{ height: 220 }}>` ... `</View>` containing `SARI_PROFILE_ASSET`) with:

```tsx
			<View className="items-center">
				<View style={{ height: 160, width: '100%' }}>
					<Image
						source={SARI_WELCOME_ASSET}
						resizeMode="contain"
						accessibilityIgnoresInvertColors
						className="w-full h-full"
					/>
				</View>
				<StyledText
					variant="extrabold"
					className="text-ink-900 text-h1 text-center mt-2"
				>
					{t('onboarding:profileHeroTitle')}
				</StyledText>
				<StyledText
					variant="regular"
					className="text-ink-600 text-body text-center mt-1 mb-5 px-2"
				>
					{t('onboarding:profileHeroSub')}
				</StyledText>
			</View>
```

- Change the root `MotiView` className from `"flex-1"` to `""` is not needed; leave it. The shell wraps the step in a `ScrollView` (Task 8), so content may exceed the screen height.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm jest components/onboarding/__tests__/ReadyStep.test.tsx`
Expected: PASS (4 tests). If `StatusStamp` breaks under Jest, add `jest.mock('@/components/ui/StatusStamp', () => ({ StatusStamp: () => null }));` to the test file.

- [ ] **Step 5: Commit**

```bash
git add components/onboarding/ReadyStep.tsx components/onboarding/ProfileStep.tsx components/onboarding/__tests__/ReadyStep.test.tsx
git commit -m "feat(onboarding): add welcome hero and first-steps list" -- components/onboarding/ReadyStep.tsx components/onboarding/ProfileStep.tsx components/onboarding/__tests__/ReadyStep.test.tsx
```

---

### Task 8: Onboarding screen shell, remove old components

**Files:**
- Modify (full replace): `app/onboarding/index.tsx`
- Delete: `components/onboarding/OnboardingPagination.tsx`, `components/onboarding/StepDots.tsx`

**Interfaces:**
- Consumes: everything from Tasks 3-7; step machine functions `indexOf`, `back`, `next`, `skipToReady`, `TOTAL_STEPS` from `@/lib/onboardingStepMachine`.
- Produces: the final screen. `handleOpenStore(href?: string)`.

- [ ] **Step 1: Replace `app/onboarding/index.tsx`**

```tsx
import { StyledText } from '@/components/elements';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { ProfileStep } from '@/components/onboarding/ProfileStep';
import { ReadyStep } from '@/components/onboarding/ReadyStep';
import { StepTransition } from '@/components/onboarding/StepTransition';
import { TourCard } from '@/components/onboarding/TourCard';
import { ONBOARDING_TOUR_STEPS, TOUR_ORDER } from '@/constants/onboardingTour';
import { markOnboardingComplete } from '@/lib';
import {
  Step,
  TOTAL_STEPS,
  back,
  indexOf,
  next,
  skipToReady,
} from '@/lib/onboardingStepMachine';
import { useToastStore } from '@/stores';
import { OnboardingProfile } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Href, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>({ kind: 'profile' });
  const [profile, setProfile] = useState<OnboardingProfile>({
    ownerName: '',
    storeName: '',
  });
  const [saving, setSaving] = useState<boolean>(false);

  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);
  const { t } = useTranslation('onboarding');

  const currentIndex = indexOf(step);
  const previousIndex = useRef(currentIndex);
  const direction: 1 | -1 = currentIndex >= previousIndex.current ? 1 : -1;
  useEffect(() => {
    previousIndex.current = currentIndex;
  }, [currentIndex]);

  const handleBack = () => setStep(back(step));

  const handleOpenStore = async (href?: string) => {
    const ownerName = profile.ownerName.trim();
    const storeName = profile.storeName.trim();
    if (!ownerName || !storeName) {
      addToast({
        message: t('toastMissingFields'),
        variant: 'danger',
        duration: 1800,
      });
      return;
    }

    try {
      setSaving(true);
      await markOnboardingComplete({ ownerName, storeName });
      addToast({
        message: t('toastWelcome'),
        variant: 'success',
        duration: 1800,
      });
      router.replace('/(tabs)' as Href);
      if (href) router.push(href as Href);
    } catch {
      addToast({
        message: t('toastSaveFailed'),
        variant: 'danger',
        duration: 2000,
      });
    } finally {
      setSaving(false);
    }
  };

  const isProfile = step.kind === 'profile';
  const isReady = step.kind === 'ready';
  const isFirstTour = step.kind === 'tour' && step.tab === TOUR_ORDER[0];
  const isLastTour =
    step.kind === 'tour' && step.tab === TOUR_ORDER[TOUR_ORDER.length - 1];

  const isProfileComplete =
    profile.ownerName.trim().length > 0 && profile.storeName.trim().length > 0;

  const handleNext = () => {
    if (isProfile && !isProfileComplete) return;
    setStep(next(step));
  };
  const handleSkip = () => {
    if (!isProfileComplete) return;
    setStep(skipToReady());
  };

  const tourStep =
    step.kind === 'tour'
      ? ONBOARDING_TOUR_STEPS.find((s) => s.tab === step.tab)
      : undefined;

  const showSkip = !isProfile && !isReady && !isLastTour && isProfileComplete;

  const continueLabel = isProfile
    ? t('letsGo')
    : isLastTour
      ? t('finishTour')
      : t('next');

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="dark" backgroundColor="#F7F6F2" />

      <View className="px-6 pt-4 flex-row items-center gap-4">
        <OnboardingProgress
          currentIndex={currentIndex}
          totalSteps={TOTAL_STEPS}
          label={t('progressA11y', {
            current: currentIndex + 1,
            total: TOTAL_STEPS,
          })}
          counterText={t('progressCount', {
            current: currentIndex + 1,
            total: TOTAL_STEPS,
          })}
        />
        {showSkip ? (
          <TouchableOpacity
            onPress={handleSkip}
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={t('skipA11y')}
            className="active:opacity-70"
          >
            <StyledText variant="medium" className="text-persimmon-600 text-sm">
              {t('skipTour')}
            </StyledText>
          </TouchableOpacity>
        ) : null}
      </View>

      <View className="flex-1">
        <StepTransition stepKey={currentIndex} direction={direction}>
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingTop: 20,
              paddingBottom: 16,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {isProfile && (
              <ProfileStep profile={profile} onChange={setProfile} />
            )}
            {!!tourStep && <TourCard step={tourStep} />}
            {isReady && (
              <ReadyStep
                profile={profile}
                saving={saving}
                onOpenStore={handleOpenStore}
              />
            )}
          </ScrollView>
        </StepTransition>
      </View>

      {!isReady && (
        <View className="px-6 pb-6 pt-2 flex-row gap-3 items-center">
          {isProfile || isFirstTour ? null : (
            <TouchableOpacity
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel={t('backA11y')}
              className="h-12 w-12 items-center justify-center rounded-2xl border border-paper-300 bg-paper-50 press-scale active:opacity-70"
            >
              <Ionicons name="chevron-back" size={22} color="#C8460F" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleNext}
            disabled={isProfile && !isProfileComplete}
            accessibilityRole="button"
            accessibilityLabel={t('continueA11y')}
            accessibilityState={{
              disabled: isProfile && !isProfileComplete,
            }}
            className={`flex-1 bg-persimmon-500 rounded-2xl py-3.5 items-center shadow-persimmon-glow press-scale active:opacity-80 ${
              isProfile && !isProfileComplete ? 'opacity-50' : ''
            }`}
          >
            <StyledText variant="semibold" className="text-white">
              {continueLabel}
            </StyledText>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
```

Notes for the implementer:
- `onOpenStore={handleOpenStore}` passes an async function where `ReadyStep` expects `(href?: string) => void`; that is assignable.
- The `back` button keeps `t('back')` key unused; leave the key in the locale files.
- The old `TODO` comment is removed.

- [ ] **Step 2: Delete the replaced components**

```bash
git rm components/onboarding/OnboardingPagination.tsx components/onboarding/StepDots.tsx
```

- [ ] **Step 3: Typecheck and run the suite**

Run: `pnpm typecheck`
Expected: no errors. Fix any strict-mode complaint at the source (for example a missing `| undefined` on an optional prop). Do not loosen `tsconfig`.

Run: `pnpm test`
Expected: all suites pass.

- [ ] **Step 4: Commit**

```bash
git add app/onboarding/index.tsx
git commit -m "feat(onboarding): new shell with progress bar, transitions, and scrollable steps" -- app/onboarding/index.tsx components/onboarding/OnboardingPagination.tsx components/onboarding/StepDots.tsx
```

---

### Task 9: Home "Get started" checklist

**Files:**
- Create: `hooks/useGettingStarted.ts`, `components/home/GettingStartedCard.tsx`
- Modify: `hooks/index.ts`, `components/home/index.ts`, `app/(tabs)/home/index.tsx`

**Interfaces:**
- Consumes: `deriveGettingStarted`, `shouldShowGettingStarted` (Task 2), `loadGettingStartedDismissed`, `setGettingStartedDismissed` (Task 2), `FIRST_STEPS` (Task 3), `SARI_POINTING_ASSET`, existing hooks `useProducts`, `useHasSales`, `useCustomers`.
- Produces: `useGettingStarted(): { visible: boolean; progress: GettingStartedProgress; dismiss: () => void }`; `GettingStartedCard()`.

- [ ] **Step 1: Create `hooks/useGettingStarted.ts`**

```ts
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  GettingStartedProgress,
  deriveGettingStarted,
  shouldShowGettingStarted,
} from '@/lib/gettingStarted';
import {
  loadGettingStartedDismissed,
  setGettingStartedDismissed,
} from '@/lib/gettingStartedStorage';
import { useCustomers } from './useCredits';
import { useProducts } from './useProducts';
import { useHasSales } from './useSales';

/**
 * useGettingStarted - Home checklist state. Progress is derived from
 * existing product, sale, and customer data. The card stays hidden
 * until every query and the dismiss flag have loaded, so it never
 * flashes for a store that is already set up.
 */
export function useGettingStarted(): {
  visible: boolean;
  progress: GettingStartedProgress;
  dismiss: () => void;
} {
  const { getAllProductsQuery } = useProducts();
  const { data: hasSales, isSuccess: salesLoaded } = useHasSales();
  const { data: customers, isSuccess: customersLoaded } = useCustomers('all');
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    loadGettingStartedDismissed().then((value) => {
      if (active) setDismissed(value);
    });
    return () => {
      active = false;
    };
  }, []);

  const productCount = getAllProductsQuery.data?.length ?? 0;
  const customerCount = customers?.length ?? 0;

  const progress = useMemo(
    () =>
      deriveGettingStarted({
        productCount,
        hasSales: hasSales === true,
        customerCount,
      }),
    [productCount, hasSales, customerCount],
  );

  const loaded =
    getAllProductsQuery.isSuccess &&
    salesLoaded &&
    customersLoaded &&
    dismissed !== null;
  const visible = loaded && shouldShowGettingStarted(progress, dismissed === true);

  const dismiss = useCallback(() => {
    setDismissed(true);
    void setGettingStartedDismissed();
  }, []);

  return { visible, progress, dismiss };
}
```

Add to `hooks/index.ts` (append a line):

```ts
export * from './useGettingStarted';
```

- [ ] **Step 2: Create `components/home/GettingStartedCard.tsx`**

```tsx
import { Image, Pressable, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { FIRST_STEPS } from '@/constants/gettingStarted';
import { SARI_POINTING_ASSET } from '@/constants/onboardingTour.assets';
import { useGettingStarted } from '@/hooks/useGettingStarted';

/**
 * GettingStartedCard - Home checklist for new stores. Hides itself when
 * all three tasks are done or the owner dismisses it.
 */
export function GettingStartedCard() {
  const { t } = useTranslation('onboarding');
  const router = useRouter();
  const { visible, progress, dismiss } = useGettingStarted();

  if (!visible) return null;

  return (
    <View className="mx-4 mb-5 rounded-3xl border border-paper-300 bg-paper-50 p-4">
      <View className="flex-row items-center gap-3">
        <Image
          source={SARI_POINTING_ASSET}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
          style={{ width: 64, height: 64 }}
        />
        <View className="flex-1">
          <StyledText variant="extrabold" className="text-ink-900 text-base">
            {t('gettingStartedTitle')}
          </StyledText>
          <StyledText variant="medium" className="text-ink-500 text-caption">
            {t('gettingStartedProgress', {
              done: progress.doneCount,
              total: progress.total,
            })}
          </StyledText>
          <View className="mt-2 flex-row gap-1">
            {progress.tasks.map((task) => (
              <View
                key={task.id}
                className={`h-1.5 flex-1 rounded-full ${
                  task.done ? 'bg-sage-500' : 'bg-ink-200'
                }`}
              />
            ))}
          </View>
        </View>
        <TouchableOpacity
          onPress={dismiss}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={t('gettingStartedDismissA11y')}
          className="h-8 w-8 items-center justify-center"
        >
          <Ionicons name="close" size={20} color="#A89F90" />
        </TouchableOpacity>
      </View>

      <View className="mt-3 gap-2">
        {FIRST_STEPS.map((first) => {
          const done =
            progress.tasks.find((task) => task.id === first.id)?.done ?? false;
          const title = t(first.titleKey);
          return (
            <Pressable
              key={first.id}
              disabled={done}
              onPress={() => router.push(first.href as Href)}
              accessibilityRole="button"
              accessibilityLabel={title}
              accessibilityState={{ disabled: done, checked: done }}
              className={`min-h-[48px] flex-row items-center gap-3 rounded-2xl border border-paper-300 bg-paper-100 px-3 py-2 ${
                done ? 'opacity-60' : ''
              }`}
            >
              <Ionicons
                name={done ? 'checkmark-circle' : first.icon}
                size={20}
                color={done ? '#4F7A4B' : '#E85A1F'}
              />
              <StyledText
                variant="medium"
                className={`flex-1 text-sm ${
                  done ? 'text-ink-500 line-through' : 'text-ink-800'
                }`}
              >
                {title}
              </StyledText>
              {done ? null : (
                <Ionicons name="chevron-forward" size={16} color="#A89F90" />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
```

- [ ] **Step 3: Export and mount**

Append to `components/home/index.ts`:

```ts
export * from './GettingStartedCard';
```

(Open the file first; if it uses named re-exports instead of `export *`, match its style.)

In `app/(tabs)/home/index.tsx`:
- Add `GettingStartedCard` to the existing `import { ... } from '@/components/home';` list.
- Inside `<RefreshableScrollView ...>`, add `<GettingStartedCard />` as the first child, before the `{isError ? (...) : ...}` ternary, so it shows above both the empty state and the populated dashboard.

- [ ] **Step 4: Verify**

Run: `pnpm typecheck && pnpm test`
Expected: both pass.

- [ ] **Step 5: Commit, with a staged-rename check**

Run: `git status --short "app/(tabs)/home"`

- If it shows `R  app/(tabs)/home/overview.tsx -> app/(tabs)/home/index.tsx` (the owner's uncommitted rename), do **not** commit `app/(tabs)/home/index.tsx`; committing it would half-commit their rename. Commit the other files and tell the owner the Home wiring edit is saved but uncommitted until they commit their rename:

```bash
git add hooks/useGettingStarted.ts hooks/index.ts components/home/GettingStartedCard.tsx components/home/index.ts
git commit -m "feat(home): add Get started checklist card and hook" -- hooks/useGettingStarted.ts hooks/index.ts components/home/GettingStartedCard.tsx components/home/index.ts
```

- Otherwise include `app/(tabs)/home/index.tsx` in both the `git add` and the `--` path list.

---

### Task 10: Sari art prompt sheet

**Files:**
- Create: `docs/superpowers/sari-art-prompts.md`

- [ ] **Step 1: Write the sheet**

Create `docs/superpowers/sari-art-prompts.md`:

```markdown
# Sari Art Prompt Sheet

Sari is the jar mascot and the app logo. These prompts produce the missing onboarding poses in the same flat style as `assets/images/sari-emotions/sari-sales-state.png`.

## Style anchor (paste at the start of every prompt)

Flat vector cartoon mascot, a glass jar with a terracotta-orange lid, dark purple outline of even weight, simple oval smiling eyes and a small open smile, thin white arms and legs, soft grey-white jar body with two pale highlight strokes, a flat terracotta oval shadow under the feet, transparent background, no text, square 1024x1024, centered with margin. Match the reference image `sari-sales-state.png` exactly in line weight, palette, and proportions. Avoid gloss, gradients, 3D shading, thick brown outlines, and sticker borders.

## Poses

1. **sari-welcome-state.png** (profile step): Sari waving hello with one raised hand, friendly closed-eye smile, slight lean toward the viewer.
2. **sari-celebrate-state.png** (ready step): Sari jumping with both arms up, a few flat confetti pieces in terracotta, gold, and sage around the jar, big open smile.
3. **sari-pointing-state.png** (Home checklist card): Sari standing, one arm pointing to the right, other hand on hip, encouraging expression.
4. **sari-onboarding-state.png** (redo, optional): the current file is a glossy sticker style that does not match the other states. If regenerated in the flat style, use a wave with a small "Sari's Shop" sign. It is no longer used by onboarding, so this is only for brand consistency.

## How to install

1. Export each PNG with a transparent background at 1024x1024.
2. Overwrite the matching file in `assets/images/sari-emotions/`. Items 1-3 already exist as placeholder copies of `sari-default-state.png`, so the app picks up the new art with no code change.
3. Restart Metro with a cleared cache (`pnpm start --clear`) if the old image still shows.
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/sari-art-prompts.md
git commit -m "docs: add Sari onboarding art prompt sheet" -- docs/superpowers/sari-art-prompts.md
```

---

### Task 11: Final verification

- [ ] **Step 1: Automated gate**

Run: `pnpm verify`
Expected: `tsc --noEmit` clean, all Jest suites green.

Run: `pnpm lint`
Expected: no new errors in files this plan touched.

- [ ] **Step 2: Manual pass**

Run `pnpm start:onboarding` (resets onboarding state and launches), then check on a device or emulator:

- Both languages: switch English and Tagalog on the profile step; every screen shows translated text and no raw keys (for example `tourHomeLabel`).
- Walk all 7 steps forward and back. Progress bar and "N of 7" update. Back and Next both always work on tour steps without finishing the demo.
- Each demo: Home tile tap, Sales items then Cash, Inventory Restock, Customers Mark paid, Reports bar tap. Sari swaps pose and the bubble text changes. A checkmark appears once.
- Leave a step and return: the widget is back at its start state.
- Reduce Motion on: no slide, no pulsing ring (static ring), no haptic.
- Large font scale and a small phone: content scrolls, nothing is clipped, bottom CTA stays visible.
- Ready step: tap each first-step card; the app opens the tabs, then the add-product form, the POS screen, or the add-customer form. Blank name on profile blocks Next, so the ready cards are unreachable without names.
- Home after onboarding: "Get started" card shows "0 of 3 done". Add a product and return; progress becomes 1 of 3. Dismiss with the x; kill and reopen the app; it stays hidden. Complete all 3 on a fresh install; it disappears.
- Airplane mode: everything still works.

- [ ] **Step 3: Report**

Tell the owner:
- What was verified and how, including anything not checked on a device.
- The four deviations listed under "Decisions that differ slightly from the spec text".
- That `app/(tabs)/home/index.tsx` is uncommitted if the rename check in Task 9 applied.
- That the three Sari slots are placeholders until their PNGs replace the files, per `docs/superpowers/sari-art-prompts.md`.
