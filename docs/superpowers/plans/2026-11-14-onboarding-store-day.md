# Onboarding "A Day at Your Store" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the tab-by-tab onboarding tour with a simulated store day (cash sale, utang sale, restock, close) acted out on prop-driven replicas of the real screens, with state that carries across beats.

**Architecture:** A pure reducer (`lib/onboardingDay.ts`) owns all sample-day state; the screen holds it in `useReducer` and passes `state`/`dispatch` to one replica per beat. A rewritten step machine (`profile -> 4 beats -> ready`) drives navigation. Only `markOnboardingComplete` persists anything.

**Tech Stack:** Expo SDK 54, React Native 0.81, React 19, NativeWind v4, moti, react-i18next, Jest 30 + @testing-library/react-native (async `render`/`fireEvent`).

**Spec:** `docs/superpowers/specs/2026-11-14-onboarding-store-day-design.md`

## Global Constraints

- Money is integer pesos typed `Pesos` from `lib/money.ts`; display only through `formatPesos` or `MoneyText`.
- Replicas and `BeatScene` never call hooks that touch SQLite or Zustand stores. `useTranslation` and `useReducedMotion` are allowed. Toasts are fired by the screen, not by replicas.
- `markOnboardingComplete({ ownerName, storeName })` stays the only persistence.
- TypeScript strict with `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`. Use `null` instead of optional props where a value may be absent.
- Every user-visible string goes through the `onboarding` i18n namespace; en and tl keys must stay in parity (`tests/onboardingLocales.test.ts`).
- No emojis in code or comments.
- Tap targets at least 48px (`min-h-[48px]` / `h-12`). All motion at most 250ms; Reduce Motion means no slide, no pulse.
- Seed: Kopiko P15 x5, Pandesal P8 x30, Lucky Me P20 x12, Coke Mismo P24 x10. Suki Aling Nena, balance 0.
- Beat outcomes: cash 2 Kopiko + 1 Pandesal = P38, tender P50, change P12; utang 2 Lucky Me + 1 Coke Mismo = P64; restock Kopiko 3 -> 27; close Nena pays P40, balance 64 -> 24. Day totals after beat 2: sales P102, items 6, utang out P64.
- Show me plays one scripted action every 400ms; under Reduce Motion it applies the whole beat at once.
- The user edits and commits on `main` concurrently. Always commit with explicit pathspecs (`git commit -m "..." -- <paths>`); never `git add -A` or `git commit -a`.
- Commit message trailer on every commit:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_014rjHKgC8USryhdaz3FC6os
  ```

## Review Focus

1. **Back to a finished beat shows that beat's own numbers.** After the utang sale, going back to the cash beat must still say "Sold P38, change P12", not the day total of P102. Pinned by per-beat `receipts` in Task 1 and the screen test in Task 7.
2. **Repeat taps after a beat is done must not change state.** Tapping Restock or Record payment again on revisiting (or a double tap) must not add another 24 stock or subtract another P40. Pinned by reducer idempotence tests in Task 1.
3. **Owner taps during Show me playback.** A stray tap mid-autoplay must not leave the beat stuck unfinished; playback ends with a reducer `autoplay` that repairs the cart. Pinned by Task 1 (`autoplay` clears a messy cart) and Task 7 (fake-timer test).
4. **Leaving the beat while Show me timers are pending.** Pressing Back or Skip during playback must cancel the remaining timers so they do not dispatch into another beat. Pinned by the Task 7 timer-cancel test.
5. **Adding more of an item than is in stock.** The cart must cap at available stock, matching the real POS. Pinned by a Task 1 test.

---

## File Map

| Path | Action | Responsibility |
| --- | --- | --- |
| `constants/onboardingDay.ts` | create | Seed data, scripted orders, beat copy keys and poses |
| `lib/onboardingDay.ts` | create | Pure day reducer, selectors, scripts, outcome params |
| `tests/lib/onboardingDay.test.ts` | create | Reducer tests |
| `locales/en/onboarding.json`, `locales/tl/onboarding.json` | modify | New day keys; later remove `tour*`/`demo*` |
| `tests/onboardingLocales.test.ts` | modify | Day key coverage; later drop tour checks |
| `components/onboarding/DayClock.tsx` | create | Header timeline |
| `components/onboarding/replicas/PosReplica.tsx` | create | Beats 1-2 |
| `components/onboarding/replicas/InventoryReplica.tsx` | create | Beat 3 |
| `components/onboarding/replicas/HomeCloseReplica.tsx` | create | Beat 4 |
| `components/onboarding/BeatScene.tsx` | create | Sari + scene line + replica slot + Show me |
| `components/onboarding/__tests__/*.test.tsx` | create/replace | Component tests |
| `lib/onboardingStepMachine.ts` | rewrite | 6-step machine |
| `tests/lib/onboardingStepMachine.test.ts` | create | Step machine tests |
| `app/onboarding/index.tsx` | rewrite | Screen shell |
| `components/onboarding/ReadyStep.tsx` | trim | Drop First steps list |
| `tests/onboardingScreen.test.tsx` | rewrite | Screen flow tests |
| `components/onboarding/TourCard.tsx`, `components/onboarding/demos/`, `components/onboarding/OnboardingProgress.tsx`, `constants/onboardingTour.ts`, `lib/onboardingDemo.ts`, `tests/onboardingDemo.test.ts`, `components/onboarding/__tests__/demos.test.tsx`, `components/onboarding/__tests__/OnboardingProgress.test.tsx` | delete | Old tour |
| `constants/index.ts` | modify | Drop `./onboardingTour` re-export |
| `constants/onboardingTour.assets.ts` | keep | Used by `app/index.tsx`, `GettingStartedCard`, `ReadyStep`, `SariStage` |

Shared test mocks used by every component test in this plan (copy into each file; they match the existing `components/onboarding/__tests__/ReadyStep.test.tsx` style):

```tsx
jest.mock('moti', () => {
  const { View } = require('react-native');
  return { MotiView: View };
});
jest.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}));
```

---

### Task 1: Day model (seed constants + reducer)

**Files:**
- Create: `constants/onboardingDay.ts`
- Create: `lib/onboardingDay.ts`
- Test: `tests/lib/onboardingDay.test.ts`

**Interfaces:**
- Consumes: `Pesos`, `formatPesos` from `@/lib/money`; type `SariState` from `@/components/mascot`.
- Produces (later tasks rely on these exact names):
  - `constants/onboardingDay.ts`: `DayProductId`, `DaySukiId`, `BeatId`, `SaleBeat`, `isSaleBeat(beat)`, `BEAT_ORDER`, `PRODUCT_ORDER`, `SEED_PRODUCTS`, `SUKI_NAME_KEY`, `SCRIPTED_ORDERS`, `CASH_TENDERED`, `TENDER_OPTIONS`, `SCRIPTED_RESTOCK`, `SCRIPTED_PAYMENT`, `LOW_STOCK_AT`, `BEAT_COPY` (`BeatCopy = { clockKey; sceneKey; nudgeKey: string | null; outcomeKey; pose: SariState; donePose: SariState }`).
  - `lib/onboardingDay.ts`: `CartLine`, `DayState`, `DayAction`, `createDaySeed()`, `dayReducer(state, action)`, `scriptFor(beat): DayAction[]`, `cartQty(cart, id)`, `cartTotal(state): Pesos`, `cartMatches(cart, beat: SaleBeat)`, `cartHasExtras(cart, beat: SaleBeat)`, `isLowStock(stock)`, `outcomeParams(beat, state): Record<string, string>`.

- [ ] **Step 1: Write the seed constants**

Create `constants/onboardingDay.ts`:

```ts
import type { SariState } from '@/components/mascot';
import type { Pesos } from '@/lib/money';

/**
 * Sample data for the onboarding "day at your store" walkthrough.
 * Nothing here is ever written to SQLite. Display names are i18n keys
 * in the `onboarding` namespace.
 */

export type DayProductId = 'kopiko' | 'pandesal' | 'luckyMe' | 'cokeMismo';
export type DaySukiId = 'nena';
export type BeatId = 'cash' | 'utang' | 'restock' | 'close';
export type SaleBeat = Extract<BeatId, 'cash' | 'utang'>;

export const isSaleBeat = (beat: BeatId): beat is SaleBeat =>
  beat === 'cash' || beat === 'utang';

export const BEAT_ORDER: readonly BeatId[] = [
  'cash',
  'utang',
  'restock',
  'close',
];

export const PRODUCT_ORDER: readonly DayProductId[] = [
  'kopiko',
  'pandesal',
  'luckyMe',
  'cokeMismo',
];

export type SeedProduct = { price: Pesos; stock: number; nameKey: string };

export const SEED_PRODUCTS: Readonly<Record<DayProductId, SeedProduct>> = {
  kopiko: { price: 15 as Pesos, stock: 5, nameKey: 'dayProductKopiko' },
  pandesal: { price: 8 as Pesos, stock: 30, nameKey: 'dayProductPandesal' },
  luckyMe: { price: 20 as Pesos, stock: 12, nameKey: 'dayProductLuckyMe' },
  cokeMismo: { price: 24 as Pesos, stock: 10, nameKey: 'dayProductCokeMismo' },
};

export const SUKI_NAME_KEY: Readonly<Record<DaySukiId, string>> = {
  nena: 'daySukiNena',
};

/** What the customer in each sale beat asks for. */
export const SCRIPTED_ORDERS: Readonly<
  Record<SaleBeat, Readonly<Partial<Record<DayProductId, number>>>>
> = {
  cash: { kopiko: 2, pandesal: 1 },
  utang: { luckyMe: 2, cokeMismo: 1 },
};

export const CASH_TENDERED = 50 as Pesos;
/** Bills the cash beat offers. The first one is the scripted tap. */
export const TENDER_OPTIONS: readonly Pesos[] = [CASH_TENDERED, 100 as Pesos];

export const SCRIPTED_RESTOCK: { id: DayProductId; qty: number } = {
  id: 'kopiko',
  qty: 24,
};

export const SCRIPTED_PAYMENT: { suki: DaySukiId; amount: Pesos } = {
  suki: 'nena',
  amount: 40 as Pesos,
};

/** Stock at or below this count is flagged Low. */
export const LOW_STOCK_AT = 3;

export type BeatCopy = {
  clockKey: string;
  sceneKey: string;
  /** Shown when the cart has items the customer did not ask for. */
  nudgeKey: string | null;
  outcomeKey: string;
  pose: SariState;
  donePose: SariState;
};

export const BEAT_COPY: Readonly<Record<BeatId, BeatCopy>> = {
  cash: {
    clockKey: 'clockCash',
    sceneKey: 'beatCashScene',
    nudgeKey: 'beatCashNudge',
    outcomeKey: 'beatCashOutcome',
    pose: 'sales',
    donePose: 'sales',
  },
  utang: {
    clockKey: 'clockUtang',
    sceneKey: 'beatUtangScene',
    nudgeKey: 'beatUtangNudge',
    outcomeKey: 'beatUtangOutcome',
    pose: 'utang',
    donePose: 'utang',
  },
  restock: {
    clockKey: 'clockRestock',
    sceneKey: 'beatRestockScene',
    nudgeKey: null,
    outcomeKey: 'beatRestockOutcome',
    pose: 'low-stock',
    donePose: 'inventory',
  },
  close: {
    clockKey: 'clockClose',
    sceneKey: 'beatCloseScene',
    nudgeKey: null,
    outcomeKey: 'beatCloseOutcome',
    pose: 'reports',
    donePose: 'balance-cleared',
  },
};
```

Do NOT add it to `constants/index.ts`; import it by path so `DayProductId` never collides with database types.

- [ ] **Step 2: Write the failing reducer tests**

Create `tests/lib/onboardingDay.test.ts`:

```ts
import {
  cartHasExtras,
  cartMatches,
  cartTotal,
  createDaySeed,
  dayReducer,
  outcomeParams,
  scriptFor,
  type DayAction,
  type DayState,
} from '@/lib/onboardingDay';
import { formatPesos, type Pesos } from '@/lib/money';
import type { BeatId } from '@/constants/onboardingDay';

const run = (state: DayState, actions: DayAction[]) =>
  actions.reduce(dayReducer, state);

const add = (id: 'kopiko' | 'pandesal' | 'luckyMe' | 'cokeMismo', n: number) =>
  Array.from({ length: n }, (): DayAction => ({ type: 'addToCart', id }));

const cashDone = () =>
  run(createDaySeed(), [
    ...add('kopiko', 2),
    ...add('pandesal', 1),
    { type: 'checkoutCash', tendered: 50 as Pesos },
  ]);

const utangDone = () =>
  run(cashDone(), [
    ...add('luckyMe', 2),
    ...add('cokeMismo', 1),
    { type: 'checkoutUtang', suki: 'nena' },
  ]);

describe('onboarding day reducer', () => {
  it('seeds the sample store', () => {
    const s = createDaySeed();
    expect(s.products.kopiko).toEqual({ stock: 5, price: 15 });
    expect(s.sukiBalances.nena).toBe(0);
    expect(s.sales).toEqual({ total: 0, items: 0, utangOut: 0 });
    expect(s.cart).toEqual([]);
    expect(s.beatDone).toEqual({
      cash: false,
      utang: false,
      restock: false,
      close: false,
    });
    expect(s.receipts).toEqual({ cash: null, utang: null });
  });

  it('adds and removes cart lines one at a time', () => {
    const s = run(createDaySeed(), [
      ...add('kopiko', 2),
      { type: 'removeFromCart', id: 'kopiko' },
    ]);
    expect(s.cart).toEqual([{ id: 'kopiko', qty: 1 }]);
    const empty = dayReducer(s, { type: 'removeFromCart', id: 'kopiko' });
    expect(empty.cart).toEqual([]);
  });

  it('caps the cart at available stock', () => {
    const s = run(createDaySeed(), add('kopiko', 9));
    expect(s.cart).toEqual([{ id: 'kopiko', qty: 5 }]);
  });

  it('matches the cart only against the exact scripted order', () => {
    const exact = run(createDaySeed(), [...add('kopiko', 2), ...add('pandesal', 1)]);
    expect(cartMatches(exact.cart, 'cash')).toBe(true);
    expect(cartHasExtras(exact.cart, 'cash')).toBe(false);

    const extra = dayReducer(exact, { type: 'addToCart', id: 'luckyMe' });
    expect(cartMatches(extra.cart, 'cash')).toBe(false);
    expect(cartHasExtras(extra.cart, 'cash')).toBe(true);
  });

  it('rings a cash sale: change, stock, totals, receipt', () => {
    const s = cashDone();
    expect(s.products.kopiko.stock).toBe(3);
    expect(s.products.pandesal.stock).toBe(29);
    expect(s.sales).toEqual({ total: 38, items: 3, utangOut: 0 });
    expect(s.receipts.cash).toEqual({ total: 38, change: 12 });
    expect(s.cart).toEqual([]);
    expect(s.beatDone.cash).toBe(true);
  });

  it('rejects cash checkout on a wrong cart or a short tender', () => {
    const wrong = run(createDaySeed(), [
      ...add('kopiko', 1),
      { type: 'checkoutCash', tendered: 50 as Pesos },
    ]);
    expect(wrong.beatDone.cash).toBe(false);
    expect(wrong.products.kopiko.stock).toBe(5);

    const short = run(createDaySeed(), [
      ...add('kopiko', 2),
      ...add('pandesal', 1),
      { type: 'checkoutCash', tendered: 20 as Pesos },
    ]);
    expect(short.beatDone.cash).toBe(false);
    expect(short.cart).toHaveLength(2);
  });

  it('puts the utang sale on Aling Nena and the day totals', () => {
    const s = utangDone();
    expect(s.sukiBalances.nena).toBe(64);
    expect(s.sales).toEqual({ total: 102, items: 6, utangOut: 64 });
    expect(s.receipts.utang).toEqual({ total: 64 });
    expect(s.receipts.cash).toEqual({ total: 38, change: 12 });
    expect(s.beatDone.utang).toBe(true);
  });

  it('restocks a low item once and ignores repeats', () => {
    const s = dayReducer(utangDone(), { type: 'restock', id: 'kopiko', qty: 24 });
    expect(s.products.kopiko.stock).toBe(27);
    expect(s.beatDone.restock).toBe(true);
    const again = dayReducer(s, { type: 'restock', id: 'kopiko', qty: 24 });
    expect(again).toBe(s);
  });

  it('rejects restocking an item that is not low, or a bad quantity', () => {
    const seed = createDaySeed();
    expect(dayReducer(seed, { type: 'restock', id: 'kopiko', qty: 24 })).toBe(seed);
    const low = cashDone();
    expect(dayReducer(low, { type: 'restock', id: 'kopiko', qty: 0 })).toBe(low);
    expect(dayReducer(low, { type: 'restock', id: 'kopiko', qty: 1.5 })).toBe(low);
  });

  it('records a partial payment once and rejects overpayment', () => {
    const owed = utangDone();
    const over = dayReducer(owed, {
      type: 'receivePayment',
      suki: 'nena',
      amount: 65 as Pesos,
    });
    expect(over).toBe(owed);

    const paid = dayReducer(owed, {
      type: 'receivePayment',
      suki: 'nena',
      amount: 40 as Pesos,
    });
    expect(paid.sukiBalances.nena).toBe(24);
    expect(paid.sales.utangOut).toBe(24);
    expect(paid.beatDone.close).toBe(true);

    const again = dayReducer(paid, {
      type: 'receivePayment',
      suki: 'nena',
      amount: 10 as Pesos,
    });
    expect(again).toBe(paid);
  });

  it('autoplay reaches the same state as doing each beat by hand', () => {
    const beats: BeatId[] = ['cash', 'utang', 'restock', 'close'];
    const auto = beats.reduce(
      (s, beat) => dayReducer(s, { type: 'autoplay', beat }),
      createDaySeed(),
    );
    const manual = beats.reduce((s, beat) => run(s, scriptFor(beat)), createDaySeed());
    expect(auto).toEqual(manual);
    expect(auto.beatDone).toEqual({
      cash: true,
      utang: true,
      restock: true,
      close: true,
    });
  });

  it('autoplay repairs a messy cart and is a no-op on a done beat', () => {
    const messy = run(createDaySeed(), add('cokeMismo', 3));
    const fixed = dayReducer(messy, { type: 'autoplay', beat: 'cash' });
    expect(fixed.beatDone.cash).toBe(true);
    expect(fixed.products.cokeMismo.stock).toBe(10);
    expect(dayReducer(fixed, { type: 'autoplay', beat: 'cash' })).toBe(fixed);
  });

  it('keeps every money value an integer', () => {
    const s = dayReducer(utangDone(), { type: 'autoplay', beat: 'close' });
    for (const n of [
      s.sales.total,
      s.sales.utangOut,
      s.sukiBalances.nena,
      cartTotal(s),
    ]) {
      expect(Number.isInteger(n)).toBe(true);
    }
  });

  it('builds outcome params from per-beat receipts, not day totals', () => {
    const s = utangDone();
    expect(outcomeParams('cash', s)).toEqual({
      total: formatPesos(38),
      change: formatPesos(12),
    });
    expect(outcomeParams('utang', s)).toEqual({ total: formatPesos(64) });
    const restocked = dayReducer(s, { type: 'autoplay', beat: 'restock' });
    expect(outcomeParams('restock', restocked)).toEqual({ stock: '27' });
    const closed = dayReducer(restocked, { type: 'autoplay', beat: 'close' });
    expect(outcomeParams('close', closed)).toEqual({ balance: formatPesos(24) });
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx jest tests/lib/onboardingDay.test.ts`
Expected: FAIL with `Cannot find module '@/lib/onboardingDay'`.

- [ ] **Step 4: Implement the reducer**

Create `lib/onboardingDay.ts`:

```ts
import {
  CASH_TENDERED,
  LOW_STOCK_AT,
  PRODUCT_ORDER,
  SCRIPTED_ORDERS,
  SCRIPTED_PAYMENT,
  SCRIPTED_RESTOCK,
  SEED_PRODUCTS,
  type BeatId,
  type DayProductId,
  type DaySukiId,
  type SaleBeat,
} from '@/constants/onboardingDay';
import { formatPesos, type Pesos } from '@/lib/money';

/**
 * onboardingDay - pure state for the onboarding "day at your store"
 * walkthrough. Every action either returns a new state or the same
 * state object (rejected). Nothing here touches SQLite, React, or
 * stores; the screen holds it in useReducer.
 */

export type CartLine = { id: DayProductId; qty: number };

export type DayState = {
  products: Record<DayProductId, { stock: number; price: Pesos }>;
  sukiBalances: Record<DaySukiId, Pesos>;
  sales: { total: Pesos; items: number; utangOut: Pesos };
  cart: CartLine[];
  /** Per-beat receipts so revisiting a beat shows its own numbers. */
  receipts: {
    cash: { total: Pesos; change: Pesos } | null;
    utang: { total: Pesos } | null;
  };
  beatDone: Record<BeatId, boolean>;
};

export type DayAction =
  | { type: 'addToCart'; id: DayProductId }
  | { type: 'removeFromCart'; id: DayProductId }
  | { type: 'clearCart' }
  | { type: 'checkoutCash'; tendered: Pesos }
  | { type: 'checkoutUtang'; suki: DaySukiId }
  | { type: 'restock'; id: DayProductId; qty: number }
  | { type: 'receivePayment'; suki: DaySukiId; amount: Pesos }
  | { type: 'autoplay'; beat: BeatId };

const pesos = (n: number): Pesos => n as Pesos;

function withKey<K extends string, V>(
  record: Record<K, V>,
  key: K,
  value: V,
): Record<K, V> {
  return { ...record, [key]: value } as Record<K, V>;
}

export function createDaySeed(): DayState {
  const products = {} as DayState['products'];
  for (const id of PRODUCT_ORDER) {
    products[id] = { stock: SEED_PRODUCTS[id].stock, price: SEED_PRODUCTS[id].price };
  }
  return {
    products,
    sukiBalances: { nena: pesos(0) },
    sales: { total: pesos(0), items: 0, utangOut: pesos(0) },
    cart: [],
    receipts: { cash: null, utang: null },
    beatDone: { cash: false, utang: false, restock: false, close: false },
  };
}

export function cartQty(cart: readonly CartLine[], id: DayProductId): number {
  return cart.find((line) => line.id === id)?.qty ?? 0;
}

export function cartTotal(state: DayState): Pesos {
  return pesos(
    state.cart.reduce(
      (sum, line) => sum + state.products[line.id].price * line.qty,
      0,
    ),
  );
}

export function cartMatches(cart: readonly CartLine[], beat: SaleBeat): boolean {
  const order = SCRIPTED_ORDERS[beat];
  const ids = PRODUCT_ORDER.filter((id) => (order[id] ?? 0) > 0);
  if (cart.length !== ids.length) return false;
  return ids.every((id) => cartQty(cart, id) === order[id]);
}

export function cartHasExtras(cart: readonly CartLine[], beat: SaleBeat): boolean {
  const order = SCRIPTED_ORDERS[beat];
  return cart.some((line) => line.qty > (order[line.id] ?? 0));
}

export function isLowStock(stock: number): boolean {
  return stock <= LOW_STOCK_AT;
}

/** Deduct the cart from stock, add it to the day totals, empty the cart. */
function applySale(state: DayState): DayState {
  let products = state.products;
  let items = 0;
  for (const line of state.cart) {
    const product = products[line.id];
    products = withKey(products, line.id, {
      ...product,
      stock: product.stock - line.qty,
    });
    items += line.qty;
  }
  return {
    ...state,
    products,
    cart: [],
    sales: {
      ...state.sales,
      total: pesos(state.sales.total + cartTotal(state)),
      items: state.sales.items + items,
    },
  };
}

function orderActions(beat: SaleBeat): DayAction[] {
  const order = SCRIPTED_ORDERS[beat];
  return PRODUCT_ORDER.flatMap((id) =>
    Array.from({ length: order[id] ?? 0 }, (): DayAction => ({ type: 'addToCart', id })),
  );
}

/** The exact taps "Show me" performs for a beat, in order. */
export function scriptFor(beat: BeatId): DayAction[] {
  switch (beat) {
    case 'cash':
      return [
        { type: 'clearCart' },
        ...orderActions('cash'),
        { type: 'checkoutCash', tendered: CASH_TENDERED },
      ];
    case 'utang':
      return [
        { type: 'clearCart' },
        ...orderActions('utang'),
        { type: 'checkoutUtang', suki: 'nena' },
      ];
    case 'restock':
      return [{ type: 'restock', id: SCRIPTED_RESTOCK.id, qty: SCRIPTED_RESTOCK.qty }];
    case 'close':
      return [
        {
          type: 'receivePayment',
          suki: SCRIPTED_PAYMENT.suki,
          amount: SCRIPTED_PAYMENT.amount,
        },
      ];
  }
}

export function dayReducer(state: DayState, action: DayAction): DayState {
  switch (action.type) {
    case 'addToCart': {
      const inCart = cartQty(state.cart, action.id);
      if (inCart >= state.products[action.id].stock) return state;
      const cart =
        inCart === 0
          ? [...state.cart, { id: action.id, qty: 1 }]
          : state.cart.map((line) =>
              line.id === action.id ? { ...line, qty: line.qty + 1 } : line,
            );
      return { ...state, cart };
    }
    case 'removeFromCart': {
      if (cartQty(state.cart, action.id) === 0) return state;
      const cart = state.cart.flatMap((line) => {
        if (line.id !== action.id) return [line];
        return line.qty > 1 ? [{ ...line, qty: line.qty - 1 }] : [];
      });
      return { ...state, cart };
    }
    case 'clearCart':
      return state.cart.length === 0 ? state : { ...state, cart: [] };
    case 'checkoutCash': {
      if (state.beatDone.cash || !cartMatches(state.cart, 'cash')) return state;
      const total = cartTotal(state);
      if (!Number.isInteger(action.tendered) || action.tendered < total) return state;
      const sold = applySale(state);
      return {
        ...sold,
        receipts: {
          ...sold.receipts,
          cash: { total, change: pesos(action.tendered - total) },
        },
        beatDone: { ...sold.beatDone, cash: true },
      };
    }
    case 'checkoutUtang': {
      if (state.beatDone.utang || !cartMatches(state.cart, 'utang')) return state;
      const total = cartTotal(state);
      const sold = applySale(state);
      return {
        ...sold,
        sukiBalances: withKey(
          sold.sukiBalances,
          action.suki,
          pesos(sold.sukiBalances[action.suki] + total),
        ),
        sales: { ...sold.sales, utangOut: pesos(sold.sales.utangOut + total) },
        receipts: { ...sold.receipts, utang: { total } },
        beatDone: { ...sold.beatDone, utang: true },
      };
    }
    case 'restock': {
      const product = state.products[action.id];
      if (
        state.beatDone.restock ||
        !isLowStock(product.stock) ||
        !Number.isInteger(action.qty) ||
        action.qty <= 0
      ) {
        return state;
      }
      return {
        ...state,
        products: withKey(state.products, action.id, {
          ...product,
          stock: product.stock + action.qty,
        }),
        beatDone: { ...state.beatDone, restock: true },
      };
    }
    case 'receivePayment': {
      const balance = state.sukiBalances[action.suki];
      if (
        state.beatDone.close ||
        !Number.isInteger(action.amount) ||
        action.amount <= 0 ||
        action.amount > balance
      ) {
        return state;
      }
      return {
        ...state,
        sukiBalances: withKey(
          state.sukiBalances,
          action.suki,
          pesos(balance - action.amount),
        ),
        sales: {
          ...state.sales,
          utangOut: pesos(state.sales.utangOut - action.amount),
        },
        beatDone: { ...state.beatDone, close: true },
      };
    }
    case 'autoplay': {
      if (state.beatDone[action.beat]) return state;
      return scriptFor(action.beat).reduce(dayReducer, state);
    }
  }
}

/** i18n params for a finished beat's outcome line. */
export function outcomeParams(beat: BeatId, state: DayState): Record<string, string> {
  switch (beat) {
    case 'cash':
      return state.receipts.cash
        ? {
            total: formatPesos(state.receipts.cash.total),
            change: formatPesos(state.receipts.cash.change),
          }
        : {};
    case 'utang':
      return state.receipts.utang
        ? { total: formatPesos(state.receipts.utang.total) }
        : {};
    case 'restock':
      return { stock: String(state.products[SCRIPTED_RESTOCK.id].stock) };
    case 'close':
      return { balance: formatPesos(state.sukiBalances[SCRIPTED_PAYMENT.suki]) };
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx jest tests/lib/onboardingDay.test.ts`
Expected: PASS, 14 tests.

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors in `constants/onboardingDay.ts` or `lib/onboardingDay.ts`. (Pre-existing errors elsewhere, if any, are not this task's; note them in the report.)

- [ ] **Step 7: Commit**

```bash
git add -- constants/onboardingDay.ts lib/onboardingDay.ts tests/lib/onboardingDay.test.ts
git commit -m "feat(onboarding): add store-day reducer and seed data" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_014rjHKgC8USryhdaz3FC6os" -- constants/onboardingDay.ts lib/onboardingDay.ts tests/lib/onboardingDay.test.ts
```

---

### Task 2: Day locale keys

**Files:**
- Modify: `locales/en/onboarding.json`
- Modify: `locales/tl/onboarding.json`
- Test: `tests/onboardingLocales.test.ts`

**Interfaces:**
- Consumes: `BEAT_COPY`, `SEED_PRODUCTS`, `SUKI_NAME_KEY` from Task 1.
- Produces: every i18n key used by Tasks 3-7 (listed below). Old `tour*`/`demo*` keys stay until Task 8.

- [ ] **Step 1: Write the failing locale test**

In `tests/onboardingLocales.test.ts`, add this import at the top:

```ts
import {
  BEAT_COPY,
  SEED_PRODUCTS,
  SUKI_NAME_KEY,
} from '@/constants/onboardingDay';
```

Add these cases inside the `describe` block:

```ts
  const DAY_UI_KEYS = [
    'clockBeforeOpen',
    'clockClosed',
    'clockA11y',
    'showMe',
    'showMeA11y',
    'beatDone',
    'coachHint',
    'continueLockedHint',
    'finishDay',
    'posAddA11y',
    'posRemoveA11y',
    'posStock',
    'posCartEmpty',
    'posTotal',
    'posCheckout',
    'posEditCart',
    'posPayWith',
    'posCash',
    'posUtang',
    'posTendered',
    'posTenderA11y',
    'posPickSuki',
    'posPickSukiA11y',
    'posPaidCash',
    'posPaidUtang',
    'invTitle',
    'invStockCount',
    'invLow',
    'invOk',
    'invRestock',
    'invRestockA11y',
    'invDeliveryTitle',
    'invDeliveryQty',
    'invConfirm',
    'homeTitle',
    'homeTodaySales',
    'homeItemsSold',
    'homeUtangOut',
    'homeSukiTitle',
    'homeBalance',
    'homeRecordPayment',
    'homePaid',
  ];

  it('defines every key the day walkthrough references', () => {
    const copyKeys = Object.values(BEAT_COPY).flatMap((c) =>
      [c.clockKey, c.sceneKey, c.outcomeKey, c.nudgeKey].filter(
        (k): k is string => k !== null,
      ),
    );
    const nameKeys = [
      ...Object.values(SEED_PRODUCTS).map((p) => p.nameKey),
      ...Object.values(SUKI_NAME_KEY),
    ];
    for (const key of [...copyKeys, ...nameKeys, ...DAY_UI_KEYS]) {
      expect(`${key}:${key in en}`).toBe(`${key}:true`);
      expect(`${key}:${key in tl}`).toBe(`${key}:true`);
    }
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/onboardingLocales.test.ts`
Expected: FAIL on `clockCash:false` (or the first missing key).

- [ ] **Step 3: Add the English keys**

In `locales/en/onboarding.json`, change the value of `skipTour` to `"Skip to the end"`, then add these entries before the closing `}` (add a comma after the current last entry):

```json
  "clockBeforeOpen": "Before opening",
  "clockCash": "6:30 AM",
  "clockUtang": "10:00 AM",
  "clockRestock": "2:00 PM",
  "clockClose": "9:00 PM",
  "clockClosed": "Day done",
  "clockA11y": "{{time}}, step {{current}} of {{total}}",

  "showMe": "Show me",
  "showMeA11y": "Play this step for me",
  "beatDone": "Done",
  "coachHint": "Sari suggests tapping this next",
  "continueLockedHint": "Finish this step first, or tap Show me.",
  "finishDay": "Finish the day",

  "dayProductKopiko": "Kopiko",
  "dayProductPandesal": "Pandesal",
  "dayProductLuckyMe": "Lucky Me",
  "dayProductCokeMismo": "Coke Mismo",
  "daySukiNena": "Aling Nena",

  "beatCashScene": "6:30 AM at {{store}}. Mang Tonyo wants 2 Kopiko and 1 pandesal. Tap them in.",
  "beatCashNudge": "Mang Tonyo only wants 2 Kopiko and 1 pandesal. Tap minus to take extras out.",
  "beatCashOutcome": "Sold {{total}}. Change is {{change}}. Stock went down by itself.",
  "beatUtangScene": "10:00 AM. Aling Nena wants 2 Lucky Me and 1 Coke Mismo. \"Tabi muna,\" she says.",
  "beatUtangNudge": "Aling Nena only wants 2 Lucky Me and 1 Coke Mismo. Tap minus to take extras out.",
  "beatUtangOutcome": "{{total}} added to Aling Nena's utang. Her balance is always up to date.",
  "beatRestockScene": "2:00 PM. Kopiko is down to 3 and your delivery just came. Tap Restock.",
  "beatRestockOutcome": "Kopiko is back to {{stock}}. Sari warns you before you run out.",
  "beatCloseScene": "9:00 PM. Closing time. Here is your day. Aling Nena drops by to pay 40 pesos.",
  "beatCloseOutcome": "Payment saved. Aling Nena now owes {{balance}}.",

  "posAddA11y": "Add 1 {{name}}",
  "posRemoveA11y": "Remove 1 {{name}}",
  "posStock": "{{count}} left",
  "posCartEmpty": "Tap an item to add it",
  "posTotal": "Total",
  "posCheckout": "Checkout",
  "posEditCart": "Edit cart",
  "posPayWith": "How will they pay?",
  "posCash": "Cash",
  "posUtang": "Utang",
  "posTendered": "Customer gave",
  "posTenderA11y": "Customer gave {{amount}}",
  "posPickSuki": "Whose utang?",
  "posPickSukiA11y": "Put on {{name}}'s utang",
  "posPaidCash": "Paid {{total}}. Change {{change}}",
  "posPaidUtang": "{{total}} on {{name}}'s utang",

  "invTitle": "Products",
  "invStockCount": "{{count}} in stock",
  "invLow": "Low",
  "invOk": "OK",
  "invRestock": "Restock",
  "invRestockA11y": "Restock {{name}}",
  "invDeliveryTitle": "Delivery for {{name}}",
  "invDeliveryQty": "+{{qty}} pcs",
  "invConfirm": "Save delivery",

  "homeTitle": "Today",
  "homeTodaySales": "Today's sales",
  "homeItemsSold": "Items sold",
  "homeUtangOut": "Utang out",
  "homeSukiTitle": "Suki with utang",
  "homeBalance": "Balance",
  "homeRecordPayment": "Record {{amount}} payment",
  "homePaid": "Paid"
```

- [ ] **Step 4: Add the Tagalog keys**

In `locales/tl/onboarding.json`, change the value of `skipTour` to `"Laktawan hanggang dulo"`, then add before the closing `}`:

```json
  "clockBeforeOpen": "Bago magbukas",
  "clockCash": "6:30 AM",
  "clockUtang": "10:00 AM",
  "clockRestock": "2:00 PM",
  "clockClose": "9:00 PM",
  "clockClosed": "Tapos ang araw",
  "clockA11y": "{{time}}, hakbang {{current}} sa {{total}}",

  "showMe": "Ipakita mo",
  "showMeA11y": "Ipakita ang hakbang na ito",
  "beatDone": "Tapos na",
  "coachHint": "Ito ang susunod na i-tap, sabi ni Sari",
  "continueLockedHint": "Tapusin muna ito, o i-tap ang Ipakita mo.",
  "finishDay": "Tapusin ang araw",

  "dayProductKopiko": "Kopiko",
  "dayProductPandesal": "Pandesal",
  "dayProductLuckyMe": "Lucky Me",
  "dayProductCokeMismo": "Coke Mismo",
  "daySukiNena": "Aling Nena",

  "beatCashScene": "6:30 AM sa {{store}}. Gusto ni Mang Tonyo ng 2 Kopiko at 1 pandesal. I-tap mo sila.",
  "beatCashNudge": "2 Kopiko at 1 pandesal lang ang kay Mang Tonyo. I-tap ang minus para tanggalin ang sobra.",
  "beatCashOutcome": "Nabenta ang {{total}}. Sukli: {{change}}. Kusa nang nabawasan ang stock.",
  "beatUtangScene": "10:00 AM. Gusto ni Aling Nena ng 2 Lucky Me at 1 Coke Mismo. \"Tabi muna,\" sabi niya.",
  "beatUtangNudge": "2 Lucky Me at 1 Coke Mismo lang ang kay Aling Nena. I-tap ang minus para tanggalin ang sobra.",
  "beatUtangOutcome": "Naidagdag ang {{total}} sa utang ni Aling Nena. Laging tama ang balanse niya.",
  "beatRestockScene": "2:00 PM. 3 na lang ang Kopiko at dumating na ang delivery mo. I-tap ang Restock.",
  "beatRestockOutcome": "{{stock}} na ulit ang Kopiko. Sasabihan ka ni Sari bago maubos.",
  "beatCloseScene": "9:00 PM. Oras na para magsara. Ito ang araw mo. Dumaan si Aling Nena para magbayad ng 40 piso.",
  "beatCloseOutcome": "Naitala ang bayad. {{balance}} na lang ang utang ni Aling Nena.",

  "posAddA11y": "Magdagdag ng 1 {{name}}",
  "posRemoveA11y": "Bawasan ng 1 {{name}}",
  "posStock": "{{count}} na lang",
  "posCartEmpty": "I-tap ang item para idagdag",
  "posTotal": "Kabuuan",
  "posCheckout": "Bayaran",
  "posEditCart": "Baguhin ang cart",
  "posPayWith": "Paano magbabayad?",
  "posCash": "Cash",
  "posUtang": "Utang",
  "posTendered": "Ibinigay ng customer",
  "posTenderA11y": "Ibinigay ng customer ang {{amount}}",
  "posPickSuki": "Kanino ang utang?",
  "posPickSukiA11y": "Ilista kay {{name}}",
  "posPaidCash": "Bayad {{total}}. Sukli {{change}}",
  "posPaidUtang": "{{total}} sa utang ni {{name}}",

  "invTitle": "Mga Produkto",
  "invStockCount": "{{count}} ang stock",
  "invLow": "Paubos",
  "invOk": "OK",
  "invRestock": "Restock",
  "invRestockA11y": "Mag-restock ng {{name}}",
  "invDeliveryTitle": "Delivery ng {{name}}",
  "invDeliveryQty": "+{{qty}} piraso",
  "invConfirm": "I-save ang delivery",

  "homeTitle": "Ngayong araw",
  "homeTodaySales": "Benta ngayon",
  "homeItemsSold": "Naibentang items",
  "homeUtangOut": "Kabuuang utang",
  "homeSukiTitle": "Suki na may utang",
  "homeBalance": "Balanse",
  "homeRecordPayment": "Itala ang bayad na {{amount}}",
  "homePaid": "Nagbayad"
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx jest tests/onboardingLocales.test.ts`
Expected: PASS (parity, no empty strings, tour keys, first-step keys, day keys).

- [ ] **Step 6: Commit**

```bash
git add -- locales/en/onboarding.json locales/tl/onboarding.json tests/onboardingLocales.test.ts
git commit -m "feat(onboarding): add store-day locale keys (en, tl)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_014rjHKgC8USryhdaz3FC6os" -- locales/en/onboarding.json locales/tl/onboarding.json tests/onboardingLocales.test.ts
```

---

### Task 3: DayClock header

**Files:**
- Create: `components/onboarding/DayClock.tsx`
- Test: `components/onboarding/__tests__/DayClock.test.tsx`

**Interfaces:**
- Produces: `DayClock({ currentIndex: number; totalSteps: number; timeLabel: string; counterText: string; label: string })`. Presentational; the parent passes translated strings.

- [ ] **Step 1: Write the failing test**

Create `components/onboarding/__tests__/DayClock.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { DayClock } from '@/components/onboarding/DayClock';

jest.mock('moti', () => {
  const { View } = require('react-native');
  return { MotiView: View };
});
jest.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

describe('DayClock', () => {
  it('exposes one progressbar with the time and step', async () => {
    const screen = await render(
      <DayClock
        currentIndex={2}
        totalSteps={6}
        timeLabel="10:00 AM"
        counterText="3 of 6"
        label="10:00 AM, step 3 of 6"
      />,
    );
    const bar = screen.getByLabelText('10:00 AM, step 3 of 6');
    expect(bar.props.accessibilityRole).toBe('progressbar');
    expect(bar.props.accessibilityValue).toEqual({ min: 1, max: 6, now: 3 });
    expect(screen.getByText('10:00 AM')).toBeTruthy();
    expect(screen.getByText('3 of 6')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest components/onboarding/__tests__/DayClock.test.tsx`
Expected: FAIL with `Cannot find module '@/components/onboarding/DayClock'`.

- [ ] **Step 3: Implement DayClock**

Create `components/onboarding/DayClock.tsx`:

```tsx
import { useState } from 'react';
import { View } from 'react-native';
import { MotiView } from 'moti';
import { StyledText } from '@/components/elements';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * DayClock - onboarding header. Shows the simulated time of day and a
 * timeline whose marker moves from opening to closing as the owner
 * walks through the day. One progressbar element for screen readers;
 * the parent passes translated strings. Reduce Motion jumps the marker.
 */

const MARKER = 14;

type Props = {
  currentIndex: number; // 0-based
  totalSteps: number;
  timeLabel: string;
  counterText: string;
  label: string;
};

export function DayClock({
  currentIndex,
  totalSteps,
  timeLabel,
  counterText,
  label,
}: Props) {
  const reducedMotion = useReducedMotion();
  const [trackWidth, setTrackWidth] = useState(0);
  const fraction = totalSteps > 1 ? currentIndex / (totalSteps - 1) : 0;
  const x = Math.max(0, (trackWidth - MARKER) * fraction);
  const transition = reducedMotion
    ? ({ type: 'timing', duration: 0 } as const)
    : ({ type: 'timing', duration: 240 } as const);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 1, max: totalSteps, now: currentIndex + 1 }}
    >
      <View
        importantForAccessibility="no-hide-descendants"
        className="flex-row items-baseline justify-between mb-2"
      >
        <StyledText variant="extrabold" className="text-ink-900 text-base">
          {timeLabel}
        </StyledText>
        <StyledText variant="semibold" className="text-ink-600 text-caption">
          {counterText}
        </StyledText>
      </View>
      <View
        importantForAccessibility="no-hide-descendants"
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        className="h-3.5 justify-center"
      >
        <View className="h-1 rounded-full bg-paper-400" />
        <MotiView
          animate={{ width: x + MARKER / 2 }}
          transition={transition}
          className="absolute left-0 h-1 rounded-full bg-persimmon-500"
        />
        <MotiView
          animate={{ translateX: x }}
          transition={transition}
          className="absolute left-0 h-3.5 w-3.5 rounded-full border-2 border-paper-50 bg-persimmon-600"
        />
      </View>
    </View>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest components/onboarding/__tests__/DayClock.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -- components/onboarding/DayClock.tsx components/onboarding/__tests__/DayClock.test.tsx
git commit -m "feat(onboarding): add DayClock timeline header" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_014rjHKgC8USryhdaz3FC6os" -- components/onboarding/DayClock.tsx components/onboarding/__tests__/DayClock.test.tsx
```

---

### Task 4: PosReplica (beats 1 and 2)

**Files:**
- Create: `components/onboarding/replicas/PosReplica.tsx`
- Test: `components/onboarding/__tests__/PosReplica.test.tsx`

**Interfaces:**
- Consumes: from Task 1 `DayState`, `DayAction`, `cartQty`, `cartTotal`, `cartMatches`, `SCRIPTED_ORDERS`, `SEED_PRODUCTS`, `PRODUCT_ORDER`, `SUKI_NAME_KEY`, `TENDER_OPTIONS`, `SaleBeat`, `DayProductId`. `HintRing({ active, children })` from `components/onboarding/HintRing.tsx`. `MoneyText` from `@/components/ui/MoneyText`. `CustomerAvatar` from `@/components/customers/CustomerAvatar`.
- Produces: `PosReplica({ mode: SaleBeat; state: DayState; dispatch: (action: DayAction) => void })`.

Reuse check: `FastLaneCard` calls `useToggleFavorite` (SQLite mutation), so the tile copies its card classes instead of importing it. `MoneyText` and `CustomerAvatar` are pure and imported directly by path (not through the `@/components/ui` barrel, which pulls the barcode scanner).

- [ ] **Step 1: Write the failing test**

Create `components/onboarding/__tests__/PosReplica.test.tsx` (paste the four shared mocks from the File Map section after the imports):

```tsx
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { PosReplica } from '@/components/onboarding/replicas/PosReplica';
import { createDaySeed, dayReducer, type DayAction } from '@/lib/onboardingDay';

// ...shared mocks here...

const addLabel = (key: string) => `posAddA11y:{"name":"${key}"}`;

describe('PosReplica', () => {
  it('dispatches addToCart when a product tile is tapped', async () => {
    const dispatch = jest.fn();
    const screen = await render(
      <PosReplica mode="cash" state={createDaySeed()} dispatch={dispatch} />,
    );
    await fireEvent.press(screen.getByLabelText(addLabel('dayProductKopiko')));
    expect(dispatch).toHaveBeenCalledWith({ type: 'addToCart', id: 'kopiko' });
  });

  it('keeps Checkout disabled until the cart matches the order', async () => {
    const dispatch = jest.fn();
    const partial = dayReducer(createDaySeed(), { type: 'addToCart', id: 'kopiko' });
    const screen = await render(
      <PosReplica mode="cash" state={partial} dispatch={dispatch} />,
    );
    expect(screen.getByLabelText('posCheckout').props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true }),
    );
  });

  it('walks Checkout -> Cash -> P50 to a cash checkout', async () => {
    const dispatch = jest.fn();
    const ready = (
      [
        { type: 'addToCart', id: 'kopiko' },
        { type: 'addToCart', id: 'kopiko' },
        { type: 'addToCart', id: 'pandesal' },
      ] as DayAction[]
    ).reduce(dayReducer, createDaySeed());
    const screen = await render(
      <PosReplica mode="cash" state={ready} dispatch={dispatch} />,
    );
    await fireEvent.press(screen.getByLabelText('posCheckout'));
    await fireEvent.press(screen.getByLabelText('posCash'));
    await fireEvent.press(screen.getByLabelText(/^posTenderA11y:.*50/));
    expect(dispatch).toHaveBeenCalledWith({ type: 'checkoutCash', tendered: 50 });
  });

  it('walks Checkout -> Utang -> Aling Nena to an utang checkout', async () => {
    const dispatch = jest.fn();
    const ready = (
      [
        { type: 'addToCart', id: 'luckyMe' },
        { type: 'addToCart', id: 'luckyMe' },
        { type: 'addToCart', id: 'cokeMismo' },
      ] as DayAction[]
    ).reduce(dayReducer, createDaySeed());
    const screen = await render(
      <PosReplica mode="utang" state={ready} dispatch={dispatch} />,
    );
    await fireEvent.press(screen.getByLabelText('posCheckout'));
    await fireEvent.press(screen.getByLabelText('posUtang'));
    await fireEvent.press(
      screen.getByLabelText('posPickSukiA11y:{"name":"daySukiNena"}'),
    );
    expect(dispatch).toHaveBeenCalledWith({ type: 'checkoutUtang', suki: 'nena' });
  });

  it('shows a minus control that removes an extra item', async () => {
    const dispatch = jest.fn();
    const extra = dayReducer(createDaySeed(), { type: 'addToCart', id: 'luckyMe' });
    const screen = await render(
      <PosReplica mode="cash" state={extra} dispatch={dispatch} />,
    );
    await fireEvent.press(
      screen.getByLabelText('posRemoveA11y:{"name":"dayProductLuckyMe"}'),
    );
    expect(dispatch).toHaveBeenCalledWith({ type: 'removeFromCart', id: 'luckyMe' });
  });

  it('shows its own receipt when the beat is done', async () => {
    const done = dayReducer(createDaySeed(), { type: 'autoplay', beat: 'cash' });
    const screen = await render(
      <PosReplica mode="cash" state={done} dispatch={jest.fn()} />,
    );
    expect(screen.getByText(/^posPaidCash:/)).toBeTruthy();
    expect(screen.queryByLabelText('posCheckout')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest components/onboarding/__tests__/PosReplica.test.tsx`
Expected: FAIL with `Cannot find module '@/components/onboarding/replicas/PosReplica'`.

- [ ] **Step 3: Implement PosReplica**

Create `components/onboarding/replicas/PosReplica.tsx`:

```tsx
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { CustomerAvatar } from '@/components/customers/CustomerAvatar';
import { MoneyText } from '@/components/ui/MoneyText';
import { HintRing } from '@/components/onboarding/HintRing';
import {
  PRODUCT_ORDER,
  SCRIPTED_ORDERS,
  SEED_PRODUCTS,
  SUKI_NAME_KEY,
  TENDER_OPTIONS,
  type DayProductId,
  type SaleBeat,
} from '@/constants/onboardingDay';
import {
  cartMatches,
  cartQty,
  cartTotal,
  type DayAction,
  type DayState,
} from '@/lib/onboardingDay';
import { formatPesos } from '@/lib/money';

/**
 * PosReplica - prop-driven copy of the Sales POS for onboarding beats
 * 1 (cash) and 2 (utang). Tiles copy FastLaneCard's classes; the real
 * card is not reused because it calls a SQLite favorite mutation.
 * Local `stage` only tracks which panel is open; all data lives in
 * the day reducer.
 */

type Stage = 'cart' | 'pay' | 'tender' | 'suki';

const TILE_CLASS =
  'min-h-[88px] justify-between rounded-2xl border border-paper-300 bg-paper-100 p-3 shadow-paper active:bg-paper-200/60';
const PRIMARY_CLASS =
  'min-h-[52px] items-center justify-center rounded-md bg-persimmon-600 px-4 active:bg-persimmon-700';
const SECONDARY_CLASS =
  'min-h-[52px] flex-1 items-center justify-center rounded-md bg-cinnamon-500 px-4 active:bg-cinnamon-600';

type Props = {
  mode: SaleBeat;
  state: DayState;
  dispatch: (action: DayAction) => void;
};

export function PosReplica({ mode, state, dispatch }: Props) {
  const { t } = useTranslation('onboarding');
  const [stage, setStage] = useState<Stage>('cart');
  const order = SCRIPTED_ORDERS[mode];
  const name = (id: DayProductId) => t(SEED_PRODUCTS[id].nameKey);
  const nena = t(SUKI_NAME_KEY.nena);
  const hint = t('coachHint');

  if (state.beatDone[mode]) {
    const text =
      mode === 'cash' && state.receipts.cash
        ? t('posPaidCash', {
            total: formatPesos(state.receipts.cash.total),
            change: formatPesos(state.receipts.cash.change),
          })
        : state.receipts.utang
          ? t('posPaidUtang', {
              total: formatPesos(state.receipts.utang.total),
              name: nena,
            })
          : '';
    return (
      <View className="min-h-[120px] items-center justify-center rounded-2xl bg-sage-50 px-4 py-6">
        <StyledText variant="extrabold" className="text-sage-700 text-base text-center">
          {text}
        </StyledText>
      </View>
    );
  }

  const ready = cartMatches(state.cart, mode);
  const extraId = state.cart.find((l) => l.qty > (order[l.id] ?? 0))?.id ?? null;
  const missingId =
    extraId === null
      ? (PRODUCT_ORDER.find((id) => cartQty(state.cart, id) < (order[id] ?? 0)) ?? null)
      : null;

  if (stage === 'cart') {
    return (
      <View className="gap-3">
        <View className="flex-row flex-wrap justify-between gap-y-2">
          {PRODUCT_ORDER.map((id) => {
            const stock = state.products[id].stock - cartQty(state.cart, id);
            const target = missingId === id;
            return (
              <View key={id} className="w-[48%]">
                <HintRing active={target}>
                  <Pressable
                    onPress={() => dispatch({ type: 'addToCart', id })}
                    accessibilityRole="button"
                    accessibilityLabel={t('posAddA11y', { name: name(id) })}
                    accessibilityHint={target ? hint : undefined}
                    className={TILE_CLASS}
                  >
                    <StyledText variant="extrabold" className="text-ink-900 text-sm">
                      {name(id)}
                    </StyledText>
                    <View className="flex-row items-end justify-between">
                      <MoneyText value={state.products[id].price} size="sm" />
                      <StyledText variant="medium" className="text-ink-600 text-caption">
                        {t('posStock', { count: stock })}
                      </StyledText>
                    </View>
                  </Pressable>
                </HintRing>
              </View>
            );
          })}
        </View>

        <View className="rounded-2xl border border-paper-300 bg-paper-50 p-3 gap-2">
          {state.cart.length === 0 ? (
            <StyledText variant="medium" className="text-ink-600 text-sm text-center py-2">
              {t('posCartEmpty')}
            </StyledText>
          ) : (
            state.cart.map((line) => (
              <View key={line.id} className="flex-row items-center gap-2">
                <HintRing active={extraId === line.id}>
                  <Pressable
                    onPress={() => dispatch({ type: 'removeFromCart', id: line.id })}
                    accessibilityRole="button"
                    accessibilityLabel={t('posRemoveA11y', { name: name(line.id) })}
                    accessibilityHint={extraId === line.id ? hint : undefined}
                    className="h-12 w-12 items-center justify-center rounded-md border border-paper-400 bg-paper-100 active:bg-paper-200"
                  >
                    <StyledText variant="extrabold" className="text-ink-900 text-lg">
                      -
                    </StyledText>
                  </Pressable>
                </HintRing>
                <StyledText variant="semibold" className="flex-1 text-ink-900 text-sm">
                  {`${line.qty} x ${name(line.id)}`}
                </StyledText>
                <MoneyText value={state.products[line.id].price * line.qty} size="sm" />
              </View>
            ))
          )}
          <View className="flex-row items-center justify-between border-t border-paper-300 pt-2">
            <StyledText variant="semibold" className="text-ink-700 text-sm">
              {t('posTotal')}
            </StyledText>
            <MoneyText value={cartTotal(state)} size="lg" />
          </View>
        </View>

        <HintRing active={ready}>
          <Pressable
            onPress={() => setStage('pay')}
            disabled={!ready}
            accessibilityRole="button"
            accessibilityLabel={t('posCheckout')}
            accessibilityHint={ready ? hint : undefined}
            accessibilityState={{ disabled: !ready }}
            className={`${PRIMARY_CLASS} ${ready ? '' : 'opacity-50'}`}
          >
            <StyledText variant="extrabold" className="text-white text-base">
              {t('posCheckout')}
            </StyledText>
          </Pressable>
        </HintRing>
      </View>
    );
  }

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <StyledText variant="semibold" className="text-ink-700 text-sm">
          {t('posTotal')}
        </StyledText>
        <MoneyText value={cartTotal(state)} size="lg" />
      </View>

      {stage === 'pay' ? (
        <>
          <StyledText variant="semibold" className="text-ink-900 text-sm">
            {t('posPayWith')}
          </StyledText>
          <View className="flex-row gap-2">
            {(['cash', 'utang'] as const).map((method) => {
              const enabled = method === mode;
              const label = method === 'cash' ? t('posCash') : t('posUtang');
              return (
                <View key={method} className="flex-1">
                  <HintRing active={enabled}>
                    <Pressable
                      onPress={() => setStage(method === 'cash' ? 'tender' : 'suki')}
                      disabled={!enabled}
                      accessibilityRole="button"
                      accessibilityLabel={label}
                      accessibilityHint={enabled ? hint : undefined}
                      accessibilityState={{ disabled: !enabled }}
                      className={`${SECONDARY_CLASS} ${enabled ? '' : 'opacity-40'}`}
                    >
                      <StyledText variant="extrabold" className="text-paper-50 text-base">
                        {label}
                      </StyledText>
                    </Pressable>
                  </HintRing>
                </View>
              );
            })}
          </View>
        </>
      ) : null}

      {stage === 'tender' ? (
        <>
          <StyledText variant="semibold" className="text-ink-900 text-sm">
            {t('posTendered')}
          </StyledText>
          <View className="flex-row gap-2">
            {TENDER_OPTIONS.map((amount, i) => (
              <View key={amount} className="flex-1">
                <HintRing active={i === 0}>
                  <Pressable
                    onPress={() => dispatch({ type: 'checkoutCash', tendered: amount })}
                    accessibilityRole="button"
                    accessibilityLabel={t('posTenderA11y', { amount: formatPesos(amount) })}
                    accessibilityHint={i === 0 ? hint : undefined}
                    className={SECONDARY_CLASS}
                  >
                    <StyledText variant="extrabold" className="text-paper-50 text-base">
                      {formatPesos(amount)}
                    </StyledText>
                  </Pressable>
                </HintRing>
              </View>
            ))}
          </View>
        </>
      ) : null}

      {stage === 'suki' ? (
        <>
          <StyledText variant="semibold" className="text-ink-900 text-sm">
            {t('posPickSuki')}
          </StyledText>
          <HintRing active>
            <Pressable
              onPress={() => dispatch({ type: 'checkoutUtang', suki: 'nena' })}
              accessibilityRole="button"
              accessibilityLabel={t('posPickSukiA11y', { name: nena })}
              accessibilityHint={hint}
              className="min-h-[56px] flex-row items-center gap-3 rounded-lg border border-paper-400 bg-paper-50 px-3 active:bg-paper-100"
            >
              <CustomerAvatar name={nena} size={40} />
              <StyledText variant="semibold" className="flex-1 text-ink-900 text-sm">
                {nena}
              </StyledText>
              <MoneyText value={state.sukiBalances.nena} size="sm" />
            </Pressable>
          </HintRing>
        </>
      ) : null}

      <Pressable
        onPress={() => setStage('cart')}
        accessibilityRole="button"
        accessibilityLabel={t('posEditCart')}
        className="min-h-[44px] items-center justify-center active:opacity-70"
      >
        <StyledText variant="semibold" className="text-persimmon-700 text-sm underline">
          {t('posEditCart')}
        </StyledText>
      </Pressable>
    </View>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest components/onboarding/__tests__/PosReplica.test.tsx`
Expected: PASS, 6 tests. If `MoneyText` renders the amount in a nested way that breaks a `getByText`, the assertions above only use labels and the receipt text, so no change is needed.

- [ ] **Step 5: Commit**

```bash
git add -- components/onboarding/replicas/PosReplica.tsx components/onboarding/__tests__/PosReplica.test.tsx
git commit -m "feat(onboarding): add POS replica for cash and utang beats" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_014rjHKgC8USryhdaz3FC6os" -- components/onboarding/replicas/PosReplica.tsx components/onboarding/__tests__/PosReplica.test.tsx
```

---

### Task 5: InventoryReplica and HomeCloseReplica (beats 3 and 4)

**Files:**
- Create: `components/onboarding/replicas/InventoryReplica.tsx`
- Create: `components/onboarding/replicas/HomeCloseReplica.tsx`
- Test: `components/onboarding/__tests__/InventoryReplica.test.tsx`
- Test: `components/onboarding/__tests__/HomeCloseReplica.test.tsx`

**Interfaces:**
- Consumes: Task 1 `DayState`, `DayAction`, `isLowStock`, `PRODUCT_ORDER`, `SEED_PRODUCTS`, `SCRIPTED_RESTOCK`, `SCRIPTED_PAYMENT`, `SUKI_NAME_KEY`. `HintRing`, `MoneyText`, `CustomerAvatar`, `StatusPill` (`@/components/ui/StatusPill`, props `{ variant: 'success' | 'danger' | 'warning' | 'info' | 'neutral'; size?: 'sm' | 'md'; children }`).
- Produces: `InventoryReplica({ state: DayState; dispatch: (action: DayAction) => void })`, `HomeCloseReplica({ state: DayState; dispatch: (action: DayAction) => void })`.

- [ ] **Step 1: Write the failing tests**

Create `components/onboarding/__tests__/InventoryReplica.test.tsx` (shared mocks after imports):

```tsx
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { InventoryReplica } from '@/components/onboarding/replicas/InventoryReplica';
import { createDaySeed, dayReducer } from '@/lib/onboardingDay';

// ...shared mocks here...

const afterCash = () => dayReducer(createDaySeed(), { type: 'autoplay', beat: 'cash' });

describe('InventoryReplica', () => {
  it('offers Restock only on the low item, then saves the delivery', async () => {
    const dispatch = jest.fn();
    const screen = await render(
      <InventoryReplica state={afterCash()} dispatch={dispatch} />,
    );
    expect(
      screen.queryByLabelText('invRestockA11y:{"name":"dayProductPandesal"}'),
    ).toBeNull();
    await fireEvent.press(
      screen.getByLabelText('invRestockA11y:{"name":"dayProductKopiko"}'),
    );
    await fireEvent.press(screen.getByLabelText('invConfirm'));
    expect(dispatch).toHaveBeenCalledWith({ type: 'restock', id: 'kopiko', qty: 24 });
  });

  it('shows no Restock button once the beat is done', async () => {
    const done = dayReducer(afterCash(), { type: 'autoplay', beat: 'restock' });
    const screen = await render(<InventoryReplica state={done} dispatch={jest.fn()} />);
    expect(screen.queryByLabelText(/^invRestockA11y/)).toBeNull();
    expect(screen.getByText('invStockCount:{"count":27}')).toBeTruthy();
  });
});
```

Create `components/onboarding/__tests__/HomeCloseReplica.test.tsx` (shared mocks after imports):

```tsx
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { HomeCloseReplica } from '@/components/onboarding/replicas/HomeCloseReplica';
import { createDaySeed, dayReducer, type DayState } from '@/lib/onboardingDay';
import type { BeatId } from '@/constants/onboardingDay';

// ...shared mocks here...

const through = (beats: BeatId[]): DayState =>
  beats.reduce((s, beat) => dayReducer(s, { type: 'autoplay', beat }), createDaySeed());

describe('HomeCloseReplica', () => {
  it('shows the day totals and records the scripted payment', async () => {
    const dispatch = jest.fn();
    const screen = await render(
      <HomeCloseReplica state={through(['cash', 'utang', 'restock'])} dispatch={dispatch} />,
    );
    expect(screen.getByText('6')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText(/^homeRecordPayment:/));
    expect(dispatch).toHaveBeenCalledWith({
      type: 'receivePayment',
      suki: 'nena',
      amount: 40,
    });
  });

  it('replaces the payment button with Paid once done', async () => {
    const screen = await render(
      <HomeCloseReplica
        state={through(['cash', 'utang', 'restock', 'close'])}
        dispatch={jest.fn()}
      />,
    );
    expect(screen.queryByLabelText(/^homeRecordPayment:/)).toBeNull();
    expect(screen.getByText('homePaid')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest components/onboarding/__tests__/InventoryReplica.test.tsx components/onboarding/__tests__/HomeCloseReplica.test.tsx`
Expected: FAIL with `Cannot find module` for both replicas.

- [ ] **Step 3: Implement InventoryReplica**

Create `components/onboarding/replicas/InventoryReplica.tsx`:

```tsx
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { StatusPill } from '@/components/ui/StatusPill';
import { HintRing } from '@/components/onboarding/HintRing';
import {
  PRODUCT_ORDER,
  SCRIPTED_RESTOCK,
  SEED_PRODUCTS,
  type DayProductId,
} from '@/constants/onboardingDay';
import { isLowStock, type DayAction, type DayState } from '@/lib/onboardingDay';

/**
 * InventoryReplica - prop-driven copy of the Inventory products list
 * for onboarding beat 3. Low rows get a Restock button that opens a
 * delivery confirm panel with the scripted quantity.
 */

type Props = { state: DayState; dispatch: (action: DayAction) => void };

export function InventoryReplica({ state, dispatch }: Props) {
  const { t } = useTranslation('onboarding');
  const [confirming, setConfirming] = useState<DayProductId | null>(null);
  const done = state.beatDone.restock;
  const name = (id: DayProductId) => t(SEED_PRODUCTS[id].nameKey);
  const hint = t('coachHint');

  return (
    <View className="gap-2">
      <StyledText variant="extrabold" className="text-ink-900 text-base mb-1">
        {t('invTitle')}
      </StyledText>
      {PRODUCT_ORDER.map((id) => {
        const stock = state.products[id].stock;
        const low = isLowStock(stock);
        const canRestock = low && !done && confirming === null;
        return (
          <View
            key={id}
            className="min-h-[56px] flex-row items-center gap-3 rounded-lg border border-paper-400 bg-paper-50 px-3 py-2"
          >
            <View className="flex-1">
              <StyledText variant="semibold" className="text-ink-900 text-sm">
                {name(id)}
              </StyledText>
              <StyledText variant="regular" className="text-ink-600 text-caption">
                {t('invStockCount', { count: stock })}
              </StyledText>
            </View>
            <StatusPill variant={low ? 'warning' : 'success'} size="sm">
              {low ? t('invLow') : t('invOk')}
            </StatusPill>
            {canRestock ? (
              <HintRing active>
                <Pressable
                  onPress={() => setConfirming(id)}
                  accessibilityRole="button"
                  accessibilityLabel={t('invRestockA11y', { name: name(id) })}
                  accessibilityHint={hint}
                  className="min-h-[48px] items-center justify-center rounded-md bg-cinnamon-500 px-3 active:bg-cinnamon-600"
                >
                  <StyledText variant="extrabold" className="text-paper-50 text-sm">
                    {t('invRestock')}
                  </StyledText>
                </Pressable>
              </HintRing>
            ) : null}
          </View>
        );
      })}

      {confirming !== null && !done ? (
        <View className="mt-1 gap-2 rounded-2xl border border-paper-300 bg-paper-100 p-3">
          <StyledText variant="semibold" className="text-ink-900 text-sm">
            {t('invDeliveryTitle', { name: name(confirming) })}
          </StyledText>
          <StyledText variant="extrabold" className="text-ink-900 text-h2">
            {t('invDeliveryQty', { qty: SCRIPTED_RESTOCK.qty })}
          </StyledText>
          <HintRing active>
            <Pressable
              onPress={() => {
                dispatch({ type: 'restock', id: confirming, qty: SCRIPTED_RESTOCK.qty });
                setConfirming(null);
              }}
              accessibilityRole="button"
              accessibilityLabel={t('invConfirm')}
              accessibilityHint={hint}
              className="min-h-[52px] items-center justify-center rounded-md bg-persimmon-600 px-4 active:bg-persimmon-700"
            >
              <StyledText variant="extrabold" className="text-white text-base">
                {t('invConfirm')}
              </StyledText>
            </Pressable>
          </HintRing>
        </View>
      ) : null}
    </View>
  );
}
```

- [ ] **Step 4: Implement HomeCloseReplica**

Create `components/onboarding/replicas/HomeCloseReplica.tsx`:

```tsx
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { CustomerAvatar } from '@/components/customers/CustomerAvatar';
import { MoneyText } from '@/components/ui/MoneyText';
import { StatusPill } from '@/components/ui/StatusPill';
import { HintRing } from '@/components/onboarding/HintRing';
import { SCRIPTED_PAYMENT, SUKI_NAME_KEY } from '@/constants/onboardingDay';
import type { DayAction, DayState } from '@/lib/onboardingDay';
import { formatPesos } from '@/lib/money';

/**
 * HomeCloseReplica - prop-driven copy of the Home "today" tiles plus
 * one suki row, for onboarding beat 4. Totals come from what the owner
 * did in beats 1-2. The payment button records the scripted P40.
 */

type Props = { state: DayState; dispatch: (action: DayAction) => void };

function Tile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="flex-1 min-h-[72px] justify-between rounded-2xl border border-paper-300 bg-paper-100 p-3">
      <StyledText variant="medium" className="text-ink-600 text-caption">
        {label}
      </StyledText>
      {children}
    </View>
  );
}

export function HomeCloseReplica({ state, dispatch }: Props) {
  const { t } = useTranslation('onboarding');
  const done = state.beatDone.close;
  const suki = SCRIPTED_PAYMENT.suki;
  const nena = t(SUKI_NAME_KEY[suki]);

  return (
    <View className="gap-3">
      <StyledText variant="extrabold" className="text-ink-900 text-base">
        {t('homeTitle')}
      </StyledText>
      <View className="flex-row gap-2">
        <Tile label={t('homeTodaySales')}>
          <MoneyText value={state.sales.total} size="md" />
        </Tile>
        <Tile label={t('homeItemsSold')}>
          <StyledText variant="extrabold" className="text-ink-900 text-base">
            {String(state.sales.items)}
          </StyledText>
        </Tile>
        <Tile label={t('homeUtangOut')}>
          <MoneyText value={state.sales.utangOut} size="md" />
        </Tile>
      </View>

      <StyledText variant="semibold" className="text-ink-700 text-sm">
        {t('homeSukiTitle')}
      </StyledText>
      <View className="min-h-[64px] flex-row items-center gap-3 rounded-lg border border-paper-400 bg-paper-50 px-3 py-2">
        <CustomerAvatar name={nena} size={40} />
        <View className="flex-1">
          <StyledText variant="semibold" className="text-ink-900 text-sm">
            {nena}
          </StyledText>
          <View className="flex-row items-center gap-1">
            <StyledText variant="regular" className="text-ink-600 text-caption">
              {t('homeBalance')}
            </StyledText>
            <MoneyText value={state.sukiBalances[suki]} size="sm" />
          </View>
        </View>
        {done ? (
          <StatusPill variant="success" size="sm">
            {t('homePaid')}
          </StatusPill>
        ) : (
          <HintRing active>
            <Pressable
              onPress={() =>
                dispatch({ type: 'receivePayment', suki, amount: SCRIPTED_PAYMENT.amount })
              }
              accessibilityRole="button"
              accessibilityLabel={t('homeRecordPayment', {
                amount: formatPesos(SCRIPTED_PAYMENT.amount),
              })}
              accessibilityHint={t('coachHint')}
              className="min-h-[48px] items-center justify-center rounded-md bg-cinnamon-500 px-3 active:bg-cinnamon-600"
            >
              <StyledText variant="extrabold" className="text-paper-50 text-sm">
                {t('homeRecordPayment', { amount: formatPesos(SCRIPTED_PAYMENT.amount) })}
              </StyledText>
            </Pressable>
          </HintRing>
        )}
      </View>
    </View>
  );
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx jest components/onboarding/__tests__/InventoryReplica.test.tsx components/onboarding/__tests__/HomeCloseReplica.test.tsx`
Expected: PASS, 4 tests.

- [ ] **Step 6: Commit**

```bash
git add -- components/onboarding/replicas/InventoryReplica.tsx components/onboarding/replicas/HomeCloseReplica.tsx components/onboarding/__tests__/InventoryReplica.test.tsx components/onboarding/__tests__/HomeCloseReplica.test.tsx
git commit -m "feat(onboarding): add inventory and home-close replicas" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_014rjHKgC8USryhdaz3FC6os" -- components/onboarding/replicas/InventoryReplica.tsx components/onboarding/replicas/HomeCloseReplica.tsx components/onboarding/__tests__/InventoryReplica.test.tsx components/onboarding/__tests__/HomeCloseReplica.test.tsx
```

---

### Task 6: BeatScene

**Files:**
- Create: `components/onboarding/BeatScene.tsx`
- Test: `components/onboarding/__tests__/BeatScene.test.tsx`

**Interfaces:**
- Consumes: Task 1 `BEAT_COPY`, `isSaleBeat`, `BeatId`, `DayState`, `cartHasExtras`, `outcomeParams`. Existing `SariStage({ mascot, bubble, poseKey, size })`, `SuccessCheck({ label })`.
- Produces: `BeatScene({ beat: BeatId; state: DayState; storeName: string; autoplaying: boolean; onShowMe: () => void; children: ReactNode })`.

- [ ] **Step 1: Write the failing test**

Create `components/onboarding/__tests__/BeatScene.test.tsx` (shared mocks after imports, plus the mascot mock below):

```tsx
import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { BeatScene } from '@/components/onboarding/BeatScene';
import { createDaySeed, dayReducer } from '@/lib/onboardingDay';

// ...shared mocks here...
jest.mock('@/components/mascot', () => ({ SariMascot: () => null }));

const renderScene = (state = createDaySeed(), onShowMe = jest.fn()) =>
  render(
    <BeatScene beat="cash" state={state} storeName="Nena Store" autoplaying={false} onShowMe={onShowMe}>
      <Text>replica</Text>
    </BeatScene>,
  );

describe('BeatScene', () => {
  it('shows the scene line with the store name and the replica', async () => {
    const screen = await renderScene();
    expect(screen.getByText('beatCashScene:{"store":"Nena Store"}')).toBeTruthy();
    expect(screen.getByText('replica')).toBeTruthy();
  });

  it('swaps to the nudge when the cart has extras', async () => {
    const extra = dayReducer(createDaySeed(), { type: 'addToCart', id: 'luckyMe' });
    const screen = await renderScene(extra);
    expect(screen.getByText('beatCashNudge')).toBeTruthy();
  });

  it('calls onShowMe, and hides Show me once the beat is done', async () => {
    const onShowMe = jest.fn();
    const screen = await renderScene(createDaySeed(), onShowMe);
    await fireEvent.press(screen.getByLabelText('showMeA11y'));
    expect(onShowMe).toHaveBeenCalledTimes(1);

    const done = dayReducer(createDaySeed(), { type: 'autoplay', beat: 'cash' });
    const doneScreen = await renderScene(done);
    expect(doneScreen.queryByLabelText('showMeA11y')).toBeNull();
    expect(doneScreen.getByText('beatDone')).toBeTruthy();
    expect(doneScreen.getByText(/^beatCashOutcome:/)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest components/onboarding/__tests__/BeatScene.test.tsx`
Expected: FAIL with `Cannot find module '@/components/onboarding/BeatScene'`.

- [ ] **Step 3: Implement BeatScene**

Create `components/onboarding/BeatScene.tsx`:

```tsx
import { ReactNode, useEffect } from 'react';
import { AccessibilityInfo, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { SariStage } from '@/components/onboarding/SariStage';
import { SuccessCheck } from '@/components/onboarding/SuccessCheck';
import { BEAT_COPY, isSaleBeat, type BeatId } from '@/constants/onboardingDay';
import { cartHasExtras, outcomeParams, type DayState } from '@/lib/onboardingDay';

/**
 * BeatScene - one moment of the onboarding day. Sari sets the scene in
 * her bubble, nudges if the cart has extras, and states the outcome
 * once the beat is done. The replica for the beat is passed as
 * children. "Show me" asks the screen to play the beat.
 */

type Props = {
  beat: BeatId;
  state: DayState;
  storeName: string;
  autoplaying: boolean;
  onShowMe: () => void;
  children: ReactNode;
};

export function BeatScene({
  beat,
  state,
  storeName,
  autoplaying,
  onShowMe,
  children,
}: Props) {
  const { t } = useTranslation('onboarding');
  const copy = BEAT_COPY[beat];
  const done = state.beatDone[beat];
  const scene = t(copy.sceneKey, { store: storeName });
  const nudging =
    !done &&
    copy.nudgeKey !== null &&
    isSaleBeat(beat) &&
    cartHasExtras(state.cart, beat);

  const bubble = done
    ? t(copy.outcomeKey, outcomeParams(beat, state))
    : nudging && copy.nudgeKey !== null
      ? t(copy.nudgeKey)
      : scene;

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(scene);
  }, [scene]);

  return (
    <View className="gap-4">
      <SariStage
        mascot={done ? copy.donePose : copy.pose}
        poseKey={done ? 'done' : 'start'}
        bubble={bubble}
        size={88}
      />
      <View className="rounded-3xl border border-paper-400 bg-paper-50 p-3">
        {children}
      </View>
      <View className="min-h-[44px] flex-row items-center justify-center">
        {done ? (
          <SuccessCheck label={t('beatDone')} />
        ) : (
          <TouchableOpacity
            onPress={onShowMe}
            disabled={autoplaying}
            accessibilityRole="button"
            accessibilityLabel={t('showMeA11y')}
            accessibilityState={{ disabled: autoplaying }}
            className={`min-h-[44px] justify-center px-4 active:opacity-70 ${
              autoplaying ? 'opacity-50' : ''
            }`}
          >
            <StyledText variant="semibold" className="text-persimmon-700 text-sm underline">
              {t('showMe')}
            </StyledText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest components/onboarding/__tests__/BeatScene.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add -- components/onboarding/BeatScene.tsx components/onboarding/__tests__/BeatScene.test.tsx
git commit -m "feat(onboarding): add BeatScene wrapper" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_014rjHKgC8USryhdaz3FC6os" -- components/onboarding/BeatScene.tsx components/onboarding/__tests__/BeatScene.test.tsx
```

---

### Task 7: Step machine, screen rewrite, ReadyStep trim

**Files:**
- Rewrite: `lib/onboardingStepMachine.ts`
- Create: `tests/lib/onboardingStepMachine.test.ts`
- Rewrite: `app/onboarding/index.tsx`
- Modify: `components/onboarding/ReadyStep.tsx`
- Rewrite: `components/onboarding/__tests__/ReadyStep.test.tsx`
- Rewrite: `tests/onboardingScreen.test.tsx`

**Interfaces:**
- Consumes: everything from Tasks 1-6. `markOnboardingComplete` from `@/lib`. `useToastStore` from `@/stores` (`addToast({ message, variant, duration })`). `useReducedMotion` from `@/hooks/useReducedMotion`.
- Produces: `Step = { kind: 'profile' } | { kind: 'beat'; beat: BeatId } | { kind: 'ready' }`, `TOTAL_STEPS = 6`, `PROFILE_INDEX = 0`, `BEAT_START_INDEX = 1`, `READY_INDEX = 5`, `indexOf`, `stepAt`, `next`, `back`, `skipToReady`, `jumpTo`, `canJumpBack`. `ReadyStep({ profile, saving, onEditProfile })` (no `onOpenStore`).

- [ ] **Step 1: Write the failing step machine test**

Create `tests/lib/onboardingStepMachine.test.ts`:

```ts
import {
  READY_INDEX,
  TOTAL_STEPS,
  back,
  canJumpBack,
  indexOf,
  jumpTo,
  next,
  skipToReady,
  stepAt,
} from '@/lib/onboardingStepMachine';

describe('onboarding step machine', () => {
  it('has six steps: profile, four beats, ready', () => {
    expect(TOTAL_STEPS).toBe(6);
    expect([0, 1, 2, 3, 4, 5].map(stepAt)).toEqual([
      { kind: 'profile' },
      { kind: 'beat', beat: 'cash' },
      { kind: 'beat', beat: 'utang' },
      { kind: 'beat', beat: 'restock' },
      { kind: 'beat', beat: 'close' },
      { kind: 'ready' },
    ]);
  });

  it('round-trips index and step', () => {
    for (let i = 0; i < TOTAL_STEPS; i++) expect(indexOf(stepAt(i))).toBe(i);
  });

  it('clamps next and back at the ends', () => {
    expect(next({ kind: 'ready' })).toEqual({ kind: 'ready' });
    expect(back({ kind: 'profile' })).toEqual({ kind: 'profile' });
    expect(next({ kind: 'beat', beat: 'close' })).toEqual({ kind: 'ready' });
    expect(back({ kind: 'beat', beat: 'cash' })).toEqual({ kind: 'profile' });
  });

  it('clamps out-of-range indexes and skips to ready', () => {
    expect(stepAt(-3)).toEqual({ kind: 'profile' });
    expect(stepAt(99)).toEqual({ kind: 'ready' });
    expect(indexOf(skipToReady())).toBe(READY_INDEX);
  });

  it('never jumps past the furthest reached step', () => {
    expect(jumpTo(5, 2)).toEqual({ kind: 'beat', beat: 'utang' });
    expect(canJumpBack(1, 3)).toBe(true);
    expect(canJumpBack(3, 3)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/lib/onboardingStepMachine.test.ts`
Expected: FAIL (`TOTAL_STEPS` is 7 / `kind: 'tour'` returned).

- [ ] **Step 3: Rewrite the step machine**

Replace the whole of `lib/onboardingStepMachine.ts` with:

```ts
import { BEAT_ORDER, type BeatId } from '@/constants/onboardingDay';

/**
 * onboardingStepMachine - pure functions over the 6-step onboarding day.
 *
 *   index 0     -> profile (owner + store name)
 *   index 1..4  -> beat, one per BeatId in BEAT_ORDER
 *   index 5     -> ready (CTA persists profile + routes to /(tabs))
 *
 * Side-effect free so the screen stays a thin renderer and tests can
 * exercise navigation without React. Whether a beat is finished lives
 * in the day reducer, not here.
 */

export type Step =
  | { kind: 'profile' }
  | { kind: 'beat'; beat: BeatId }
  | { kind: 'ready' };

export const TOTAL_STEPS = 6;
export const PROFILE_INDEX = 0;
export const BEAT_START_INDEX = 1;
export const READY_INDEX = 5;

export function indexOf(step: Step): number {
  switch (step.kind) {
    case 'profile':
      return PROFILE_INDEX;
    case 'beat': {
      const i = BEAT_ORDER.indexOf(step.beat);
      return i < 0 ? PROFILE_INDEX : BEAT_START_INDEX + i;
    }
    case 'ready':
      return READY_INDEX;
  }
}

export function stepAt(index: number): Step {
  if (index <= PROFILE_INDEX) return { kind: 'profile' };
  if (index >= READY_INDEX) return { kind: 'ready' };
  const beat = BEAT_ORDER[index - BEAT_START_INDEX] ?? 'cash';
  return { kind: 'beat', beat };
}

export function next(step: Step): Step {
  const i = indexOf(step);
  if (i >= READY_INDEX) return step;
  return stepAt(i + 1);
}

export function back(step: Step): Step {
  const i = indexOf(step);
  if (i <= PROFILE_INDEX) return step;
  return stepAt(i - 1);
}

export function skipToReady(): Step {
  return { kind: 'ready' };
}

/** Jump to an ordinal, never past the furthest step already reached. */
export function jumpTo(index: number, maxReachableIndex: number): Step {
  const clamped = Math.max(PROFILE_INDEX, Math.min(READY_INDEX, index));
  return stepAt(Math.min(clamped, maxReachableIndex));
}

export function canJumpBack(target: number, current: number): boolean {
  return target < current;
}
```

- [ ] **Step 4: Run step machine test to verify it passes**

Run: `npx jest tests/lib/onboardingStepMachine.test.ts`
Expected: PASS, 5 tests. (`app/onboarding/index.tsx` no longer typechecks until Step 9; that is expected inside this task.)

- [ ] **Step 5: Trim ReadyStep**

In `components/onboarding/ReadyStep.tsx`:
1. Delete the imports of `Ionicons`, `ONBOARDING_COLORS`, and `FIRST_STEPS`.
2. Replace the doc comment, `Props`, and the function signature with:

```tsx
/**
 * ReadyStep - final onboarding screen. A persimmon "READY" stamp sits
 * on the celebrating Sari and the headline uses the owner's name. The
 * "open my store" action lives in the screen's sticky footer. A text
 * link under the greeting sends the owner back to fix a name. Setup
 * shortcuts live on the Home Getting Started card, not here.
 */

type Props = {
  profile: OnboardingProfile;
  saving: boolean;
  /** Return to the profile step to correct the names. */
  onEditProfile: () => void;
};

export function ReadyStep({ profile, saving, onEditProfile }: Props) {
  const { t } = useTranslation('onboarding');
  const trimmedName = profile.ownerName.trim();
  const trimmedStore = profile.storeName.trim();
```

3. Delete the `canOpen` line and the whole `<View className="mt-4">` block that renders `readyFirstStepsTitle` and `FIRST_STEPS.map(...)` (from `<View className="mt-4">` through its closing `</View>` just before the outer `</View>`).

- [ ] **Step 6: Rewrite the ReadyStep test**

Replace `components/onboarding/__tests__/ReadyStep.test.tsx` with:

```tsx
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ReadyStep } from '@/components/onboarding/ReadyStep';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}));

describe('ReadyStep', () => {
  it('greets the owner by trimmed name and store', async () => {
    const screen = await render(
      <ReadyStep
        profile={{ ownerName: ' Nena ', storeName: ' Nena Store ' }}
        saving={false}
        onEditProfile={jest.fn()}
      />,
    );
    expect(screen.getByText('readyGreetingNamed:{"name":"Nena"}')).toBeTruthy();
    expect(screen.getByText('readySublineNamed:{"storeName":"Nena Store"}')).toBeTruthy();
    expect(screen.queryByText('readyFirstStepsTitle')).toBeNull();
  });

  it('sends the owner back to the profile step from the edit link', async () => {
    const onEditProfile = jest.fn();
    const screen = await render(
      <ReadyStep
        profile={{ ownerName: 'Nena', storeName: 'Nena Store' }}
        saving={false}
        onEditProfile={onEditProfile}
      />,
    );
    await fireEvent.press(screen.getByText('readyEditProfile'));
    expect(onEditProfile).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 7: Write the failing screen test**

Replace `tests/onboardingScreen.test.tsx` with the following. The mock block is the current file's mocks, with `useReducedMotion` made switchable:

```tsx
import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import OnboardingPage from '@/app/onboarding/index';

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockAddToast = jest.fn();
const mockMarkOnboardingComplete = jest.fn();
let mockReducedMotion = true;

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
}));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View };
});
jest.mock('react-native-keyboard-controller', () => {
  const { ScrollView } = require('react-native');
  return { KeyboardAwareScrollView: ScrollView };
});
jest.mock('moti', () => {
  const { View } = require('react-native');
  return { MotiView: View };
});
jest.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => mockReducedMotion,
}));
jest.mock('@/components/mascot', () => ({ SariMascot: () => null }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));
jest.mock('@/lib/i18n', () => ({ changeAppLanguage: jest.fn() }));
jest.mock('@/lib', () => ({
  markOnboardingComplete: (...args: unknown[]) =>
    mockMarkOnboardingComplete(...args),
}));
jest.mock('@/stores', () => ({
  useToastStore: (
    selector: (state: { addToast: typeof mockAddToast }) => unknown,
  ) => selector({ addToast: mockAddToast }),
}));

type Screen = Awaited<ReturnType<typeof render>>;

const isDisabled = (screen: Screen, label: string) =>
  screen.getByLabelText(label).props.accessibilityState?.disabled === true;

async function fillProfile(screen: Screen) {
  await fireEvent.changeText(
    screen.getByLabelText('onboarding:profileNameLabel'),
    '  Nena ',
  );
  await fireEvent.changeText(
    screen.getByLabelText('onboarding:profileStoreLabel'),
    ' Nena Sari-Sari  ',
  );
  await fireEvent.press(screen.getByLabelText('letsGo'));
}

async function reachReady(screen: Screen) {
  await fillProfile(screen);
  await fireEvent.press(screen.getByLabelText('skipA11y'));
}

describe('OnboardingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReducedMotion = true;
    mockMarkOnboardingComplete.mockResolvedValue(undefined);
  });

  it('shows inline errors and stays on the profile step when names are blank', async () => {
    const screen = await render(<OnboardingPage />);
    await fireEvent.press(screen.getByLabelText('letsGo'));
    expect(screen.getByText('onboarding:profileNameError')).toBeTruthy();
    expect(screen.getByText('onboarding:profileStoreError')).toBeTruthy();
    expect(screen.queryByLabelText('readyCta')).toBeNull();
    expect(mockMarkOnboardingComplete).not.toHaveBeenCalled();
  });

  it('locks Continue on a beat until the beat is done', async () => {
    const screen = await render(<OnboardingPage />);
    await fillProfile(screen);
    expect(screen.getByText('beatCashScene')).toBeTruthy();
    expect(isDisabled(screen, 'next')).toBe(true);

    await fireEvent.press(screen.getByLabelText('showMeA11y'));

    expect(isDisabled(screen, 'next')).toBe(false);
    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'beatCashOutcome', variant: 'success' }),
    );
  });

  it('plays the whole day with Show me and saves the trimmed profile', async () => {
    const screen = await render(<OnboardingPage />);
    await fillProfile(screen);
    for (const label of ['next', 'next', 'next', 'finishDay']) {
      await fireEvent.press(screen.getByLabelText('showMeA11y'));
      await fireEvent.press(screen.getByLabelText(label));
    }
    await fireEvent.press(screen.getByLabelText('readyCta'));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(tabs)'));
    expect(mockMarkOnboardingComplete).toHaveBeenCalledTimes(1);
    expect(mockMarkOnboardingComplete).toHaveBeenCalledWith({
      ownerName: 'Nena',
      storeName: 'Nena Sari-Sari',
    });
  });

  it('shows the cash receipt, not the day total, when going back', async () => {
    const screen = await render(<OnboardingPage />);
    await fillProfile(screen);
    await fireEvent.press(screen.getByLabelText('showMeA11y'));
    await fireEvent.press(screen.getByLabelText('next'));
    await fireEvent.press(screen.getByLabelText('showMeA11y'));
    await fireEvent.press(screen.getByLabelText('backA11y'));
    expect(screen.getByText('beatCashOutcome')).toBeTruthy();
    expect(isDisabled(screen, 'next')).toBe(false);
    expect(screen.queryByLabelText('showMeA11y')).toBeNull();
  });

  it('plays Show me step by step without Reduce Motion', async () => {
    jest.useFakeTimers();
    mockReducedMotion = false;
    try {
      const screen = await render(<OnboardingPage />);
      await fillProfile(screen);
      await fireEvent.press(screen.getByLabelText('showMeA11y'));
      expect(isDisabled(screen, 'next')).toBe(true);
      await act(async () => {
        jest.advanceTimersByTime(400 * 6);
      });
      expect(isDisabled(screen, 'next')).toBe(false);
    } finally {
      jest.useRealTimers();
    }
  });

  it('cancels pending Show me actions when the owner leaves the beat', async () => {
    jest.useFakeTimers();
    mockReducedMotion = false;
    try {
      const screen = await render(<OnboardingPage />);
      await fillProfile(screen);
      await fireEvent.press(screen.getByLabelText('showMeA11y'));
      await fireEvent.press(screen.getByLabelText('backA11y'));
      await act(async () => {
        jest.advanceTimersByTime(400 * 10);
      });
      await fireEvent.press(screen.getByLabelText('letsGo'));
      expect(isDisabled(screen, 'next')).toBe(true);
      expect(mockAddToast).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it('skips to Ready from a beat', async () => {
    const screen = await render(<OnboardingPage />);
    await reachReady(screen);
    expect(screen.getByLabelText('readyCta')).toBeTruthy();
  });

  it('stays on Ready and reports the failure when the save throws', async () => {
    mockMarkOnboardingComplete.mockRejectedValue(new Error('disk full'));
    const screen = await render(<OnboardingPage />);
    await reachReady(screen);
    await fireEvent.press(screen.getByLabelText('readyCta'));
    await waitFor(() =>
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'toastSaveFailed', variant: 'danger' }),
      ),
    );
    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.getByLabelText('readyCta')).toBeTruthy();
  });

  it('returns from the Ready edit link to the profile, then straight back to Ready', async () => {
    const screen = await render(<OnboardingPage />);
    await reachReady(screen);
    await fireEvent.press(screen.getByText('readyEditProfile'));
    expect(
      screen.getByLabelText('onboarding:profileNameLabel').props['value'],
    ).toBe('  Nena ');
    await fireEvent.press(screen.getByLabelText('letsGo'));
    expect(screen.getByLabelText('readyCta')).toBeTruthy();
  });
});
```

- [ ] **Step 8: Run the screen test to verify it fails**

Run: `npx jest tests/onboardingScreen.test.tsx`
Expected: FAIL (the screen still imports `TourCard`/`TOUR_ORDER` and renders no `showMeA11y`).

- [ ] **Step 9: Rewrite the screen**

Replace the whole of `app/onboarding/index.tsx` with:

```tsx
import { StyledText } from '@/components/elements';
import { BeatScene } from '@/components/onboarding/BeatScene';
import { DayClock } from '@/components/onboarding/DayClock';
import { ONBOARDING_COLORS } from '@/components/onboarding/palette';
import { ProfileStep } from '@/components/onboarding/ProfileStep';
import { ReadyStep } from '@/components/onboarding/ReadyStep';
import { HomeCloseReplica } from '@/components/onboarding/replicas/HomeCloseReplica';
import { InventoryReplica } from '@/components/onboarding/replicas/InventoryReplica';
import { PosReplica } from '@/components/onboarding/replicas/PosReplica';
import { StepTransition } from '@/components/onboarding/StepTransition';
import { BEAT_COPY, BEAT_ORDER, type BeatId } from '@/constants/onboardingDay';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { markOnboardingComplete } from '@/lib';
import {
  createDaySeed,
  dayReducer,
  outcomeParams,
  scriptFor,
} from '@/lib/onboardingDay';
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
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  BackHandler,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Delay between Show me taps when motion is allowed. */
const AUTOPLAY_STEP_MS = 400;

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>({ kind: 'profile' });
  const [profile, setProfile] = useState<OnboardingProfile>({
    ownerName: '',
    storeName: '',
  });
  const [day, dispatch] = useReducer(dayReducer, undefined, createDaySeed);
  const [saving, setSaving] = useState<boolean>(false);
  // Counts failed "continue" presses on the profile step. Above zero,
  // ProfileStep shows inline errors; each bump refocuses the empty field.
  const [submitAttempt, setSubmitAttempt] = useState(0);
  // True while the owner is fixing their names from the Ready screen,
  // so continuing returns there instead of replaying the day.
  const [editingFromReady, setEditingFromReady] = useState(false);
  const [autoplayingBeat, setAutoplayingBeat] = useState<BeatId | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);
  const reducedMotion = useReducedMotion();
  const { t } = useTranslation('onboarding');

  const currentIndex = indexOf(step);
  const previousIndex = useRef(currentIndex);
  const direction: 1 | -1 = currentIndex >= previousIndex.current ? 1 : -1;
  useEffect(() => {
    previousIndex.current = currentIndex;
  }, [currentIndex]);

  const beat = step.kind === 'beat' ? step.beat : null;
  const isProfile = step.kind === 'profile';
  const isReady = step.kind === 'ready';
  const isLastBeat = beat === BEAT_ORDER[BEAT_ORDER.length - 1];
  const beatLocked = beat !== null && !day.beatDone[beat];

  const isProfileComplete =
    profile.ownerName.trim().length > 0 && profile.storeName.trim().length > 0;

  const cancelAutoplay = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setAutoplayingBeat(null);
  }, []);

  // Leaving a step, or unmounting, drops any queued Show me taps.
  useEffect(() => cancelAutoplay, [currentIndex, cancelAutoplay]);

  // Fire the outcome toast once, when a beat flips to done.
  const doneBefore = useRef(day.beatDone);
  useEffect(() => {
    for (const id of BEAT_ORDER) {
      if (day.beatDone[id] && !doneBefore.current[id]) {
        const message = t(BEAT_COPY[id].outcomeKey, outcomeParams(id, day));
        addToast({ message, variant: 'success', duration: 2200 });
        AccessibilityInfo.announceForAccessibility(message);
      }
    }
    doneBefore.current = day.beatDone;
  }, [day, addToast, t]);

  const handleShowMe = (target: BeatId) => {
    if (day.beatDone[target] || autoplayingBeat !== null) return;
    if (reducedMotion) {
      dispatch({ type: 'autoplay', beat: target });
      return;
    }
    setAutoplayingBeat(target);
    const script = scriptFor(target);
    script.forEach((action, i) => {
      timers.current.push(
        setTimeout(() => dispatch(action), AUTOPLAY_STEP_MS * (i + 1)),
      );
    });
    // Safety net: a stray tap mid-playback cannot leave the beat stuck.
    timers.current.push(
      setTimeout(() => {
        dispatch({ type: 'autoplay', beat: target });
        timers.current = [];
        setAutoplayingBeat(null);
      }, AUTOPLAY_STEP_MS * (script.length + 1)),
    );
  };

  const handleBack = () => {
    if (saving) return;
    setStep(back(step));
  };

  // Android hardware back walks the flow instead of leaving it, so typed
  // names are never dropped by a stray back press.
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (saving) return true;
        if (step.kind === 'profile') {
          if (!editingFromReady) return false;
          setEditingFromReady(false);
          setStep(skipToReady());
          return true;
        }
        setStep(back(step));
        return true;
      },
    );
    return () => subscription.remove();
  }, [step, saving, editingFromReady]);

  const handleOpenStore = async () => {
    if (saving) return;
    const ownerName = profile.ownerName.trim();
    const storeName = profile.storeName.trim();
    if (!ownerName || !storeName) {
      addToast({
        message: t('toastMissingFields'),
        variant: 'danger',
        duration: 3500,
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
    } catch {
      addToast({
        message: t('toastSaveFailed'),
        variant: 'danger',
        duration: 4000,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    if (isProfile && !isProfileComplete) {
      setSubmitAttempt((n) => n + 1);
      return;
    }
    if (isProfile && editingFromReady) {
      setEditingFromReady(false);
      setStep(skipToReady());
      return;
    }
    if (beatLocked) return;
    setStep(next(step));
  };
  const handleSkip = () => {
    if (!isProfileComplete) return;
    setStep(skipToReady());
  };
  const handleEditProfile = () => {
    if (saving) return;
    setEditingFromReady(true);
    setStep({ kind: 'profile' });
  };

  const showSkip = beat !== null && isProfileComplete;

  const primaryLabel = isReady
    ? t('readyCta')
    : isProfile
      ? t('letsGo')
      : isLastBeat
        ? t('finishDay')
        : t('next');
  const primaryDisabled = saving || beatLocked;

  const timeLabel =
    beat !== null
      ? t(BEAT_COPY[beat].clockKey)
      : isReady
        ? t('clockClosed')
        : t('clockBeforeOpen');

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="dark" backgroundColor={ONBOARDING_COLORS.page} />

      <View className="px-6 pt-4">
        <DayClock
          currentIndex={currentIndex}
          totalSteps={TOTAL_STEPS}
          timeLabel={timeLabel}
          counterText={t('progressCount', {
            current: currentIndex + 1,
            total: TOTAL_STEPS,
          })}
          label={t('clockA11y', {
            time: timeLabel,
            current: currentIndex + 1,
            total: TOTAL_STEPS,
          })}
        />
      </View>

      <View className="flex-1">
        <StepTransition stepKey={currentIndex} direction={direction}>
          <KeyboardAwareScrollView
            bottomOffset={24}
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
              <ProfileStep
                profile={profile}
                onChange={setProfile}
                submitAttempt={submitAttempt}
                onSubmit={handleNext}
              />
            )}
            {beat !== null && (
              <BeatScene
                beat={beat}
                state={day}
                storeName={profile.storeName.trim()}
                autoplaying={autoplayingBeat === beat}
                onShowMe={() => handleShowMe(beat)}
              >
                {beat === 'cash' || beat === 'utang' ? (
                  <PosReplica mode={beat} state={day} dispatch={dispatch} />
                ) : beat === 'restock' ? (
                  <InventoryReplica state={day} dispatch={dispatch} />
                ) : (
                  <HomeCloseReplica state={day} dispatch={dispatch} />
                )}
              </BeatScene>
            )}
            {isReady && (
              <ReadyStep
                profile={profile}
                saving={saving}
                onEditProfile={handleEditProfile}
              />
            )}
          </KeyboardAwareScrollView>
        </StepTransition>
      </View>

      <View className="px-6 pb-4 pt-2">
        <View className="flex-row gap-3 items-center">
          {isProfile ? null : (
            <TouchableOpacity
              onPress={handleBack}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel={t('backA11y')}
              accessibilityState={{ disabled: saving }}
              className={`h-[52px] w-[52px] items-center justify-center rounded-md border border-paper-400 bg-paper-50 press-scale active:bg-paper-100 ${
                saving ? 'opacity-50' : ''
              }`}
            >
              <Ionicons
                name="chevron-back"
                size={22}
                color={ONBOARDING_COLORS.action}
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={isReady ? () => handleOpenStore() : handleNext}
            disabled={primaryDisabled}
            accessibilityRole="button"
            accessibilityLabel={primaryLabel}
            accessibilityHint={beatLocked ? t('continueLockedHint') : undefined}
            accessibilityState={{ disabled: primaryDisabled, busy: saving }}
            className={`flex-1 min-h-[52px] flex-row items-center justify-center gap-2 rounded-md bg-persimmon-600 px-4 press-scale active:bg-persimmon-700 ${
              beatLocked ? 'opacity-50' : ''
            }`}
          >
            {saving ? (
              <ActivityIndicator color={ONBOARDING_COLORS.onAction} />
            ) : (
              <>
                <StyledText variant="extrabold" className="text-white text-base">
                  {primaryLabel}
                </StyledText>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={ONBOARDING_COLORS.onAction}
                />
              </>
            )}
          </TouchableOpacity>
        </View>

        {showSkip ? (
          <TouchableOpacity
            onPress={handleSkip}
            accessibilityRole="button"
            accessibilityLabel={t('skipA11y')}
            className="mt-1 min-h-[44px] items-center justify-center active:opacity-70"
          >
            <StyledText variant="semibold" className="text-persimmon-700 text-sm">
              {t('skipTour')}
            </StyledText>
          </TouchableOpacity>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
```

Notes for the implementer:
- The screen test mocks `t` as `(key) => key`, so the scene text is the bare key `beatCashScene`.
- `doneBefore` is compared by beat so a revisit never re-fires a toast.
- If `exactOptionalPropertyTypes` rejects `accessibilityHint={... : undefined}`, spread it instead: `{...(beatLocked ? { accessibilityHint: t('continueLockedHint') } : {})}`. Apply the same fix in `PosReplica` if it errors there.

- [ ] **Step 10: Run the Task 7 tests**

Run: `npx jest tests/lib/onboardingStepMachine.test.ts tests/onboardingScreen.test.tsx components/onboarding/__tests__/ReadyStep.test.tsx`
Expected: PASS (5 + 9 + 2 tests).

- [ ] **Step 11: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors in files touched by Tasks 1-7. `components/onboarding/TourCard.tsx` and `constants/onboardingTour.ts` may now error on the removed `TabKey` import from the step machine; those files are deleted in Task 8. If they error, list them in the report and do not fix them here.

- [ ] **Step 12: Commit**

```bash
git add -- lib/onboardingStepMachine.ts tests/lib/onboardingStepMachine.test.ts app/onboarding/index.tsx components/onboarding/ReadyStep.tsx components/onboarding/__tests__/ReadyStep.test.tsx tests/onboardingScreen.test.tsx
git commit -m "feat(onboarding): run onboarding as a simulated store day" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_014rjHKgC8USryhdaz3FC6os" -- lib/onboardingStepMachine.ts tests/lib/onboardingStepMachine.test.ts app/onboarding/index.tsx components/onboarding/ReadyStep.tsx components/onboarding/__tests__/ReadyStep.test.tsx tests/onboardingScreen.test.tsx
```

---

### Task 8: Remove the old tour and verify

**Files:**
- Delete: `components/onboarding/TourCard.tsx`, `components/onboarding/demos/` (whole folder), `components/onboarding/OnboardingProgress.tsx`, `constants/onboardingTour.ts`, `lib/onboardingDemo.ts`, `tests/onboardingDemo.test.ts`, `components/onboarding/__tests__/demos.test.tsx`, `components/onboarding/__tests__/OnboardingProgress.test.tsx`
- Modify: `constants/index.ts` (drop `export * from './onboardingTour';`)
- Modify: `locales/en/onboarding.json`, `locales/tl/onboarding.json`
- Modify: `tests/onboardingLocales.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: no references to `onboardingTour` (except `onboardingTour.assets`), `TourCard`, `OnboardingProgress`, `onboardingDemo`, or `demos/` anywhere in `app/`, `components/`, `lib/`, `constants/`, `tests/`.

- [ ] **Step 1: Confirm nothing else imports the old modules**

Run (Bash): `grep -rnE "constants/onboardingTour'|from '\./onboardingTour'|TourCard|OnboardingProgress|onboardingDemo|onboarding/demos" app components lib constants hooks tests --include=*.ts --include=*.tsx`
Expected: hits only in the files listed for deletion above and in `constants/index.ts`. If any other file appears, stop and report it.

- [ ] **Step 2: Update the locale test first (it should fail)**

In `tests/onboardingLocales.test.ts`:
1. Delete `import { ONBOARDING_TOUR_STEPS } from '@/constants/onboardingTour';`.
2. Delete the whole `it('defines every key the tour constants reference', ...)` case.
3. Add:

```ts
  it('has no leftover tour or demo keys', () => {
    const stale = Object.keys(en).filter(
      (key) =>
        /^(tour|demo)[A-Z]/.test(key) ||
        key === 'finishTour' ||
        key === 'progressA11y',
    );
    expect(stale).toEqual([]);
  });
```

Run: `npx jest tests/onboardingLocales.test.ts`
Expected: FAIL listing the `tour*`/`demo*` keys.

- [ ] **Step 3: Remove stale locale keys**

From both `locales/en/onboarding.json` and `locales/tl/onboarding.json`, delete every key whose name starts with `tour` or `demo` followed by an uppercase letter, plus `finishTour` and `progressA11y`. Keep every other key (`readyStep*`, `readyFirstStepsTitle`, `gettingStarted*`, `profile*`, `toast*`, `progressCount`, and the Task 2 keys). Check that the file is valid JSON: no trailing comma before `}`.

Run: `node -e "require('./locales/en/onboarding.json');require('./locales/tl/onboarding.json');console.log('ok')"`
Expected: `ok`

- [ ] **Step 4: Delete the old files and the re-export**

```bash
git rm -r -q -- components/onboarding/TourCard.tsx components/onboarding/demos components/onboarding/OnboardingProgress.tsx constants/onboardingTour.ts lib/onboardingDemo.ts tests/onboardingDemo.test.ts components/onboarding/__tests__/demos.test.tsx components/onboarding/__tests__/OnboardingProgress.test.tsx
```

In `constants/index.ts`, delete the line `export * from './onboardingTour';`.

- [ ] **Step 5: Full verification**

Run: `npx tsc --noEmit`
Expected: no errors in onboarding files. Report any pre-existing errors elsewhere verbatim without fixing them.

Run: `npx jest`
Expected: all suites PASS. Report any failures verbatim.

Run: `npx expo lint`
Expected: no new errors in onboarding files.

- [ ] **Step 6: Commit**

```bash
git add -- constants/index.ts locales/en/onboarding.json locales/tl/onboarding.json tests/onboardingLocales.test.ts
git commit -m "refactor(onboarding): remove tab tour, demos, and stale keys" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_014rjHKgC8USryhdaz3FC6os" -- constants/index.ts locales/en/onboarding.json locales/tl/onboarding.json tests/onboardingLocales.test.ts components/onboarding/TourCard.tsx components/onboarding/demos components/onboarding/OnboardingProgress.tsx constants/onboardingTour.ts lib/onboardingDemo.ts tests/onboardingDemo.test.ts components/onboarding/__tests__/demos.test.tsx components/onboarding/__tests__/OnboardingProgress.test.tsx
```

- [ ] **Step 7: Device check (human)**

Ask the user to run `npm run start:onboarding` and walk the day on a device in both English and Tagalog, once with system Reduce Motion on. Checklist to hand them:
- Cash beat: tap 2 Kopiko + 1 Pandesal, Checkout, Cash, P50; change shows P12.
- Utang beat: Aling Nena's balance rises to P64.
- Restock beat: Kopiko shows Low at 3, then 27 after Save delivery.
- Close beat: sales P102, items 6, utang out P64, then P24 after payment.
- Back from the utang beat shows the cash receipt (P38), not P102.
- Show me plays tap by tap; with Reduce Motion it finishes instantly.
- Android hardware back steps back; on the profile step it leaves nothing broken.
