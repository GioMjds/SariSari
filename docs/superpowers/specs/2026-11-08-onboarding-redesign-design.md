# Onboarding Redesign - Design Spec

Date: 2026-11-08
Status: draft, pending owner review
Scope path: architectural (multi-component UI restructure)

## Goal

Make first-run onboarding feel smooth, professional, and premium, and teach new
sari-sari store owners how each part of the app works by letting them try it.
Sari (the jar mascot, also the app logo) appears on every step.

Constraints carried from the project:

- Offline-first. No backend. Onboarding writes nothing new to SQLite.
- Screens never call SQLite; data access goes through `hooks/` (vault `CONTEXT.md`).
- Money is integer pesos; all format/parse goes through `lib/money.ts`.
- Respect Reduce Motion (`hooks/useReducedMotion`), en/tl i18n (`locales/*/onboarding.json`),
  strict TypeScript settings.
- No emojis in code or comments.

Related vault note: `obsidian-vault/07-Planning/app-tour-for-first-time-users.md`
plans a separate in-app, per-screen coach-mark tour. That tour is out of scope here.
It stays a separate future spec.

## Current state

- `app/onboarding/index.tsx`: 7-step flow (profile, 5 tour cards, ready) with a TODO
  at line 114 requesting this redesign.
- `lib/onboardingStepMachine.ts`: pure step functions, tested.
- `components/onboarding/`: `ProfileStep`, `TourCard`, `ReadyStep`,
  `OnboardingPagination`, `StepDots`.
- `constants/onboardingTour.ts`: static text per tab. `onboardingTour.assets.ts`: Sari image map.
- Every tour card is the same layout (image, pill, headline, two text lines). It only tells,
  it never shows or lets the user try.
- `assets/images/sari-emotions/sari-onboarding-state.png` uses a glossy sticker style that
  does not match the flat purple-outline style of the other Sari states.

## Design

### 1. Flow and shell

- The 7-step machine is unchanged (profile index 0, tours 1..5, ready 6). Its tests stay as-is.
- The welcome hero folds into the profile step: larger Sari and a one-line value promise above
  the form. No 8th step.
- The header (`headerTitle` plus dots) becomes a slim segmented progress bar with a
  "N of 7" counter. `Skip tour` moves to the top-right as a quiet text link.
- The bottom CTA bar stays sticky. Back becomes a ghost icon button. Next stays the persimmon
  primary button. Next is never disabled on tour steps (profile validation is unchanged).
- Every tour step uses one layout:
  1. Sari stage: the tab's Sari state image on a warm paper-gradient backdrop with a speech bubble.
  2. Demo widget card (see section 2).
  3. Compact text block: pill label, headline, `whatItDoes`, and `whenToUseIt` as a "Use it when" chip.
- Step transitions use a shared slide and fade. With Reduce Motion on, they fall back to fades only.
- `OnboardingPagination` and `StepDots` are replaced by a single `OnboardingProgress` component.

### 2. Demo widgets and Sari reactions

Each tour step gets one self-contained widget in `components/onboarding/demos/`.
Widgets use local `useState` and hardcoded sample data. They import nothing from
`hooks/` or `database/`.

| Step | Widget | Micro-task | Sari reaction |
|---|---|---|---|
| home | Mini dashboard, 3 stat tiles | Tap a tile to see what it means | default state, bubble explains the tile |
| sales | Mock counter, 3 items, cash/utang toggle | Tap items, watch total change, tap "Cash" | sales state, coin bounce on done |
| inventory | Stock list, 3 products, one low | Tap "Restock" on the low item, bar fills | low-stock state before the tap, inventory state after |
| customers | One suki ledger with a balance | Tap "Mark paid", balance drops to 0 | utang state before, balance-cleared state after |
| more | Weekly bar chart, 3 bars | Tap a bar to see that day's total | reports state |

Behaviour common to all widgets:

- A pulsing hint ring marks the first tap target.
- Completing the task fires a light haptic (skipped under Reduce Motion) and shows a success
  checkmark that is also announced to screen readers.
- The task is never required. The user can always press Next.
- Money uses `formatPesos` from `lib/money.ts`, with integer pesos.
- Widgets reset to their start state on revisit.
- Pure demo logic (sales total, restock clamp, balance to zero) lives in
  `lib/onboardingDemo.ts` so it can be unit tested without React.
- Copy lives in `locales/en/onboarding.json` and `locales/tl/onboarding.json`.

Sari states reused (all exist in `assets/images/sari-emotions/`): default, sales, inventory,
low-stock, utang, balance-cleared, reports. No new art is needed for the swaps.

### 3. Ready step, checklist, and Sari art

Ready step:

- Keeps the "READY" stamp on the celebrating Sari and the personalised greeting.
- Adds a "First steps" list of 3 cards: add first product, ring first sale, add first suki.
  Each card has an icon, a one-line reason, and a chevron.
- The primary CTA stays "Open my store". Tapping a card calls `markOnboardingComplete`
  first, then routes to Inventory, Sales, or Customers.
- If the save fails, show the existing `toastSaveFailed` and do not navigate.
- Onboarding writes nothing beyond what `markOnboardingComplete` already writes.

Persistent Home checklist (the only piece outside `app/onboarding/`; first to cut if scope grows):

- A "Get started" card on the Home tab with the same 3 tasks and live progress ("1 of 3 done").
- Completion is derived from existing hook data (product, sale, and suki counts). No stored
  per-task flags.
- It hides itself when all 3 tasks are done and has a dismiss control.
- The dismiss flag is a separate AsyncStorage key, `getting_started_dismissed_v1`, written
  through a new helper in `lib/` next to `lib/onboardingStorage.ts`. The `OnboardingState`
  shape and the `onboarding_state_v1` key are not changed.

Sari art (produced by the owner):

- A style-anchored prompt sheet is delivered with this work, matching the flat purple-outline
  look of `sari-sales-state.png`. Poses: welcome wave (profile step), celebrate with confetti
  (ready step), pointing at checklist (Home card), and a redo of `sari-onboarding-state.png`
  in the flat style.
- Until the new PNGs exist, those slots use `sari-default-state.png` through the same
  `sari-emotions/` paths and the maps in `constants/onboardingTour.assets.ts`.
  Dropping in new files then needs no code change.

### 4. Testing, accessibility, error handling

Testing:

- Step machine tests are unchanged and must stay green.
- New unit tests: sales total in integer pesos, restock bar clamp at 100%, suki balance reaching 0
  on "Mark paid", Home checklist derived progress, and hide-when-done.
- No component snapshot tests. Widgets contain no logic beyond the pure helpers.
- Manual pass: en and tl, Reduce Motion on and off, small and large font scale, and a
  small-screen phone where the Sari stage plus widget must not overflow.

Accessibility:

- Every widget tap target is at least 44pt with `accessibilityRole` and `accessibilityLabel`.
- Task completion is announced to screen readers.
- The progress bar exposes "Step N of 7" as one accessible element.

Error handling:

- A missing or failed Sari image falls back to `sari-default-state.png`.
- The save-failure toast and the double-tap guard in `handleOpenStore` are kept.

## File impact

New:

- `components/onboarding/OnboardingProgress.tsx`
- `components/onboarding/SariStage.tsx`
- `components/onboarding/demos/` (one widget per tab, plus shared hint-ring and success-check pieces)
- `lib/onboardingDemo.ts` and its test
- `lib/gettingStartedStorage.ts`
- Home "Get started" card component (location decided in the implementation plan)

Changed:

- `app/onboarding/index.tsx` (shell, progress, layout; remove the TODO)
- `components/onboarding/TourCard.tsx`, `ProfileStep.tsx`, `ReadyStep.tsx`
- `constants/onboardingTour.ts` (add Sari state keys and demo copy keys per step)
- `constants/onboardingTour.assets.ts`
- `locales/en/onboarding.json`, `locales/tl/onboarding.json`
- Home tab screen (checklist card)

Removed:

- `components/onboarding/OnboardingPagination.tsx`, `components/onboarding/StepDots.tsx`

## Out of scope

- The per-screen in-app coach-mark tour and the "?" help button
  (vault note `07-Planning/app-tour-for-first-time-users.md`).
- Generating Sari art. The owner produces it from the prompt sheet.
- Any change to `OnboardingState` storage shape or the step machine.
