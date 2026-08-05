# 15. Smarter but Explainable Credit Profiles

> Phase: Later

## Problem

Today the owner sets a suki's credit limit from gut feel, or does
not set one at all. Some suki are good payers who could safely get
more credit. Some are risky and the owner keeps extending trust out
of personal loyalty or social pressure, with no signal to push
back. The risk is invisible. The CLAUDE.md already mentions planned
risk/payer profiles; this feature is the on-device, explainable
realization of that note.

## User Story

As a store owner, I want a suggested credit limit for each suki,
with a plain explanation of why the suggestion was made, so I can
set limits that match how each suki actually pays.

## In Scope

- A "Credit profile" per suki, computed entirely on-device, that
  surfaces:
  - Average days to pay over the last 6 months.
  - Number of overdue credits (past the owner's overdue threshold,
    see feature 5).
  - Current balance and balance trend (rising, steady, falling).
  - A suggested credit limit (capped at a configurable owner-set
    ceiling) with the contributing factors.
- The suggestion is presented as a recommendation, not enforced. The
  owner always sets the actual limit (or leaves it unset).
- A "Why this suggestion?" explainer screen showing the inputs
  (averages, counts, caps) and how each contributed.

## Out of Scope

- Automatic enforcement of the suggested limit. That is feature 5.
- Cross-suki risk scoring that ranks "how risky is this person
  across the population." Per-suki profile is the unit.
- A trained model. The suggestion is a transparent formula on a
  small number of inputs.

## Data Implications

- No new tables required. A profile is a derived view over
  `credit_transactions` and `payment_allocations`.
- New function in `database/credits.ts`:
  `computeCreditProfile(customerId, { lookbackDays, ceiling })`
  returning a typed profile object with all intermediate values,
  so the explainer can render them.
- New hook in `hooks/useCredits.tsx`.
- The profile result is computed on demand. Caching is a UI-side
  concern and can use TanStack Query's stale time.
- No migration.

## Dependencies

- Feature 5 (utang guardrails) sets the per-suki `credit_limit`
  column that this feature suggests a value for. The two should
  share the column.
- Feature 6 (collection queue) shares the overdue and "near
  limit" signal.
- Feature 14 (local store insights) shares the payment-pattern
  computation.

## Open Questions

- What is the formula? Concrete default: `suggestedLimit =
  min(ceiling, max(recentAverageMonthlyPurchases * 1.5,
  recentMaxBalance * 1.2))` adjusted downward by a penalty for
  overdue count. The exact formula is a design call; the
  important property is that it is inspectable.
- Should the profile update on every visit, or only on a manual
  "recompute" tap? Manual recompute is friendlier on low-end
  devices; recompute-on-visit is friendlier to the owner.
- Does the owner see the profile for suki with no credit history
  yet? Recommend showing a "not enough data" state rather than a
  guess.

## Feasibility Notes

- The formula is small and inspectable. Do not "improve" it into
  a black box; the explainer is the point.
- The ceiling default should match the most generous limit the
  owner has set on any suki, capped at a sensible number (e.g.
  10,000 pesos). Configurable in Settings.
- This is the highest-trust feature in the Later phase; if the
  explainer is unclear, the feature does more harm than good.
