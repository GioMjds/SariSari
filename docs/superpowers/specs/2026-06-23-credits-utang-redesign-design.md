# Credits/Utang Tab Redesign Design Spec

## Summary

Redesign the Credits tab into a **Follow-up Ledger** experience using NativeWind. The screen should
feel professional, trustworthy, and sari-sari appropriate: a warm paper-ledger interface that helps
store owners quickly identify who needs follow-up and take action.

The approved visual direction is **Ledger Desk**. The approved layout direction is **Follow-up
Ledger**. The primary UX priority is **fast follow-up**, not broad financial reporting.

## Goals

- Make the Credits/Utang tab look polished, elegant, and consistent with the app's receipt/paper
  visual system.
- Prioritize urgent customer follow-up above dense KPI reporting.
- Preserve existing offline-first behavior and current route destinations.
- Keep business data flowing through existing Credits hooks and TanStack Query.
- Use NativeWind `className` styling wherever practical.

## Non-Goals

- Do not change the SQLite schema.
- Do not add network calls or online-only behavior.
- Do not move business data into Zustand.
- Do not redesign credit detail, add payment, add credit, or add customer forms as part of this spec.
- Do not introduce new design tokens unless implementation reveals a concrete gap.

## Screen Structure

The redesigned Credits tab should use this hierarchy:

1. **Cinnamon ledger header**
   - Eyebrow: `Utang Ledger`
   - Title: `Credits`
   - Dynamic subtitle, for example `3 overdue customers need follow-up`
   - Add customer action remains available from the header or floating action area.

2. **Priority receipt hero**
   - Features the customer who most needs attention.
   - Shows customer name, outstanding amount, last activity context, and quick actions.
   - Primary quick action: `Add Payment`
   - Secondary quick action: `Add Credit`

3. **Compact ledger metrics**
   - Total outstanding
   - Collected today
   - Customers with balance
   - Overdue count

4. **Search, filter, and sort controls**
   - Search remains close to the customer list.
   - Filter chips remain horizontal.
   - Sort control stays compact and aligned with the visible customer count.

5. **Action-ready customer list**
   - Cards show name, phone or last activity, balance, status tag, total credit, and quick actions.
   - Balance is the strongest right-side visual anchor.
   - Overdue and high-balance customers should be easy to scan without opening details.

## Component Behavior

### Priority Customer

Use existing customer and KPI data only.

- If overdue customers exist, feature an overdue customer first.
- If there are no overdue customers, feature the customer with the highest outstanding balance.
- If no customer has an outstanding balance, replace the hero with a positive cleared-ledger state.

### Quick Actions

- `Add Payment` routes to `/(edit-forms)/add-payment/[id]`.
- `Add Credit` routes to `/(edit-forms)/add-credit/[id]`.
- Tapping the non-action area of a customer card opens `/(edit-forms)/credit-details/[id]`.
- Buttons should be compact enough for list cards but large enough for touch use.

### Empty States

- No customers: show a ledger-style empty state with an `Add Customer` action.
- Search with no results: show a search-specific empty state and make clearing the search obvious.
- No outstanding balances: show a positive `All balances cleared` state.

### Loading State

- Replace the centered spinner with skeleton placeholders that match the final layout.
- Avoid large layout shifts between loading and loaded states.

## Visual Direction

The redesign should follow the approved **Ledger Desk** direction:

- Use existing tokens: `paper-*`, `ink-*`, `cinnamon-*`, `persimmon-*`, `sage-*`, and semantic
  danger/success colors.
- Header uses deep cinnamon with paper-colored text.
- Hero uses receipt/ledger cues: paper surfaces, dashed dividers, official-label typography, and
  controlled danger accents for money owed.
- Customer cards use paper backgrounds, subtle ink borders, and restrained shadows.
- Overdue customers use danger accents without turning the entire card red.
- Payment actions use sage/success styling.
- Add-credit actions use paper or outline styling.

Motion should be subtle:

- Use Moti for header, hero, and list entrance animation.
- Prefer opacity plus small `translateY`.
- Do not add gesture-driven animation for this redesign.

## Implementation Boundaries

- Main route: `app/(tabs)/credits/index.tsx`
- Credits-specific presentational components may live under `components/credits/`.
- Existing data source remains `useCredits()`.
- Existing `MoneyText`, `Pagination`, and shared UI primitives should be reused where they fit.
- Remove the direct `@react-navigation/native` `useFocusEffect` import from the Credits tab and use
  Expo Router-compatible behavior instead.

## Acceptance Criteria

- Credits tab presents the approved Follow-up Ledger layout.
- Priority hero shows the correct customer or a cleared-ledger state.
- Customer cards include both `Add Payment` and `Add Credit` quick actions.
- Search, filters, sorting, pagination, and pull-to-refresh still work.
- Money display does not introduce decimal money state.
- No DB schema changes are required.
- No network calls are added.
- Styling is primarily NativeWind.
- The screen remains usable on typical mobile widths.

## Test Scenarios

- Loading state renders skeleton ledger placeholders.
- Empty database renders no-customers state with add-customer action.
- Customers with balances render priority hero and customer cards.
- Overdue customers appear as the top priority.
- All customers paid renders the cleared-ledger state.
- Search with matching customers renders filtered results.
- Search with no matches renders search-specific empty state.
- Add customer, customer details, add payment, and add credit navigation all work.
- Pull-to-refresh refetches customers and KPIs.

## Assumptions

- Visual direction is **Ledger Desk**.
- Layout direction is **Follow-up Ledger**.
- UX priority is **Fast follow-up**.
- Customer cards should include both quick actions: `Add Payment` and `Add Credit`.
- The redesign is limited to the Credits/Utang tab and credits-specific presentational components.
