---
title: Onboarding redesign - "A day at your store"
status: approved
created: 2026-11-14
---

# Onboarding redesign: "A day at your store"

## Problem

The current onboarding (`app/onboarding/index.tsx`) is a feature catalog: profile form, then one tour card per tab (HOME, SALES, INVENTORY, CUSTOMERS, MORE), then a ready screen. Every tour step repeats the same template (pill, demo box, headline, "Use it when" chip). It teaches "this screen does X" instead of "this is how you run your store", and it reads as generic.

## Goal

A new owner finishes onboarding understanding what a real day with SariSari looks like. They act out four moments of one store day on faithful replicas of the real screens, using sample data. Actions in earlier moments visibly cause effects in later ones.

Only the profile (owner name, store name) is persisted. All day data is in-memory and discarded on exit.

## Non-goals

- Writing real products, sales, or customers to SQLite.
- A Reports beat.
- Changes to the Home `GettingStartedCard` (it remains the post-onboarding setup checklist).
- Replaying onboarding from Settings.

## Flow

```
0 Profile -> 1 6:30 AM Cash sale -> 2 10:00 AM Utang sale -> 3 2:00 PM Restock -> 4 9:00 PM Close -> 5 Ready
```

Six steps total (was seven).

### Shell (every beat)

- **Day clock header** replaces the progress dots. Horizontal timeline 6:30 AM to 9:00 PM with a moving marker. Skip link on its right (shown from beat 1 onward).
- **Scene line**: one short sentence from Sari setting up the moment, using the owner's store name where natural.
- **Replica**: a faithful, prop-driven copy of the real screen. Takes most of the viewport.
- **Coach ring** (existing `HintRing`) pulses on the next control to tap.
- **Continue is locked** until the beat's action is done. A **"Show me"** link autoplays the beat's scripted actions for owners who are stuck.
- **Outcome toast** in the app's real toast style after the beat completes, tying the action to its effect (e.g. "Sold P38. Stock auto-deducted.").

### Sample data (seed)

Money is integer pesos, displayed via `formatPesos`.

| Product    | Price | Starting stock |
| ---------- | ----- | -------------- |
| Kopiko     | 15    | 5              |
| Pandesal   | 8     | 30             |
| Lucky Me   | 20    | 12             |
| Coke Mismo | 24    | 10             |

Suki: Aling Nena, starting balance 0. Display names are i18n'd (en/tl).

### Beats

| #   | Time     | Replica of                                | Owner does                                                                                                         | State after                                                       |
| --- | -------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| 0   | -        | -                                         | Welcome hero + owner name + store name on one screen                                                               | profile filled                                                    |
| 1   | 6:30 AM  | `sales/pos` fast-lane tiles, cart, checkout | Mang Tonyo wants 2 Kopiko + 1 Pandesal. Tap items, Checkout, Cash, tender P50, see change P12                      | Kopiko 5 -> 3; sales total 38; items 3                            |
| 2   | 10:00 AM | POS checkout + customer picker            | Aling Nena wants 2 Lucky Me + 1 Coke Mismo "tabi muna". Add items, Checkout, Utang, pick Aling Nena                | Nena balance 0 -> 64; sales total 102; items 6; utang out 64      |
| 3   | 2:00 PM  | `inventory/products` + Sari stock alert   | Sari flags Kopiko (3 left). Tap Restock, confirm +24                                                               | Kopiko 3 -> 27                                                    |
| 4   | 9:00 PM  | `home` KPI tiles + suki row               | Read today's totals (derived from beats 1-2). Aling Nena pays P40                                                  | Nena balance 64 -> 24; utang out 24                               |
| 5   | -        | trimmed `ReadyStep`                       | "Open my store" saves the profile and routes to `/(tabs)`                                                          | profile persisted                                                 |

Credit sales count toward the day's sales total, matching the real app: `getTodayStats` in `database/sales.ts` sums `total` across all payment types.

### Sari poses (vector `SariMascot` states)

| Step    | Pose                                   |
| ------- | -------------------------------------- |
| Profile | `onboarding`                           |
| Cash    | `sales`                                |
| Utang   | `utang`                                |
| Restock | `low-stock`, then `inventory` when done |
| Close   | `reports`, then `balance-cleared` after payment |
| Ready   | existing celebrate asset               |

### Removed

- HOME/SALES/... pill labels, "Use it when" chip, per-tab "what it does" paragraph.
- The five tab tour steps and their demos.
- Ready screen's "First steps" list (duplicates the Home Getting Started card). Ready keeps greeting, stamp, and the single CTA.

## Architecture

### Day state: `lib/onboardingDay.ts`

Pure reducer. No React, no SQLite, no stores.

```ts
type BeatId = 'cash' | 'utang' | 'restock' | 'close';

type DayState = {
  products: Record<ProductId, { stock: number; price: Pesos }>;
  sukiBalances: Record<SukiId, Pesos>;
  sales: { total: Pesos; items: number; utangOut: Pesos };
  cart: CartLine[];
  beatDone: Record<BeatId, boolean>;
};

type DayAction =
  | { type: 'addToCart'; id: ProductId }
  | { type: 'removeFromCart'; id: ProductId }
  | { type: 'checkoutCash'; tendered: Pesos }
  | { type: 'checkoutUtang'; suki: SukiId }
  | { type: 'restock'; id: ProductId; qty: number }
  | { type: 'receivePayment'; suki: SukiId; amount: Pesos }
  | { type: 'autoplay'; beat: BeatId };
```

- Checkout is rejected (state unchanged) unless the cart matches the beat's scripted order exactly.
- `checkoutCash` rejects `tendered < cart total`.
- Each successful beat action sets `beatDone[beat] = true`.
- `autoplay` applies the beat's scripted actions in sequence and results in the same state as doing them by hand.
- Seed data in `constants/onboardingDay.ts`.

### Step machine: `lib/onboardingStepMachine.ts` (rewrite)

```ts
type Step = { kind: 'profile' } | { kind: 'beat'; beat: BeatId } | { kind: 'ready' };
```

`TOTAL_STEPS = 6`. Keeps `indexOf`, `stepAt`, `next`, `back`, `skipToReady`, `jumpTo`, `canJumpBack`. `TabKey` and `TOUR_ORDER` are removed.

### Components (`components/onboarding/`)

| File                               | Status   | Role                                                                     |
| ---------------------------------- | -------- | ------------------------------------------------------------------------ |
| `DayClock.tsx`                     | new      | Replaces `OnboardingProgress`. A11y label "10:00 AM, step 3 of 6".      |
| `BeatScene.tsx`                    | new      | Replaces `TourCard`. Sari pose + scene line + replica slot + outcome toast + Show me. |
| `replicas/PosReplica.tsx`          | new      | Beats 1 and 2 (`mode: 'cash' \| 'utang'`).                               |
| `replicas/InventoryReplica.tsx`    | new      | Beat 3.                                                                  |
| `replicas/HomeCloseReplica.tsx`    | new      | Beat 4.                                                                  |
| `HintRing.tsx`                     | reused   | Coach ring.                                                              |
| `ProfileStep.tsx`                  | trimmed  | Copy refresh; still one screen.                                          |
| `ReadyStep.tsx`                    | trimmed  | Drop First steps list.                                                   |
| `SariStage.tsx`, `StepTransition.tsx`, `SuccessCheck.tsx` | reused if they fit `BeatScene` | -               |
| `TourCard.tsx`, `demos/*`, `OnboardingProgress.tsx` | deleted | -                                                               |
| `constants/onboardingTour.ts`      | deleted  | Also remove its re-export from `constants/index.ts`.                     |
| `constants/onboardingTour.assets.ts` | kept   | Still used by `app/index.tsx` and `GettingStartedCard`.                  |

Replicas are prop-driven only: they receive `state` and `dispatch` and never call hooks that touch SQLite or Zustand stores. Real presentational leaves from `components/sales/pos`, `components/home`, and `components/customers` are reused where they are pure props-in components; otherwise the replica copies their classes. Planning must check each leaf.

### Screen: `app/onboarding/index.tsx`

Holds `useReducer(dayReducer, seed)` and the step state, passes `state`/`dispatch` to the active beat. `markOnboardingComplete({ ownerName, storeName })` remains the only persistence and the only side effect besides navigation and toasts.

### i18n

Rewrite `locales/en/onboarding.json` and `locales/tl/onboarding.json`. Remove `tour*` and `demo*` keys. Keep `readyStep*` (used by `FIRST_STEPS` / Getting Started card) and `gettingStarted*` keys. New key groups: `clock*`, `beat<Name>Scene`, `beat<Name>Outcome`, `beat<Name>Nudge`, `showMe`, seed product and suki names.

## Edge cases

- **Back**: day state is not rewound. A done beat shows its finished state with Continue enabled. No replay.
- **Skip**: available from beat 1. Jumps to Ready. Profile is still required to save.
- **Wrong taps**: no error state. A non-scripted item still goes in the cart; Sari nudges ("Mang Tonyo only wants Kopiko and pandesal") and a -1 control removes it. Checkout stays disabled until the cart matches.
- **Save failure**: existing danger toast; stay on Ready.
- **Android hardware back**: acts as step back. On the profile step it does nothing.

## Accessibility and motion

- Tap targets at least 48px, matching the real POS.
- Coach ring target also gets `accessibilityHint`. Scene line and outcome are announced via `AccessibilityInfo.announceForAccessibility`.
- Reduced motion: clock marker jumps, coach ring static, Sari still (handled by `SariMascot`), step transition fades only. All motion at most 250ms per `PRODUCT.md`.
- Show me plays one action every 400ms; under reduced motion it applies all actions at once.

## Testing

| Test                                                  | Covers                                                                                                                     |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `tests/lib/onboardingDay.test.ts` (new)               | cash change, stock decrement, utang balance, restock, partial payment, checkout rejection on wrong cart / short tender, `beatDone` gating, autoplay equals manual path, money stays integer |
| step machine tests (update)                           | 6 steps; next/back/skip/jumpTo bounds                                                                                      |
| `tests/onboardingScreen.test.tsx` (rewrite)           | Continue locked until beat done; Show me unlocks; skip to Ready; profile required; `markOnboardingComplete` called once with trimmed names |
| replica component tests (replace `demos.test.tsx`)    | each replica renders from props and dispatches the right action on tap                                                     |
| `components/onboarding/__tests__/OnboardingProgress.test.tsx` | replaced by a `DayClock` test                                                                                     |
| `tests/onboardingLocales.test.ts` (update)            | en/tl key parity; no orphan `tour*`/`demo*` keys; no longer imports `ONBOARDING_TOUR_STEPS`                                |
