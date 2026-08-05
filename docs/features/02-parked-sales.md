# 02. Parked Sales

> Phase: Now

## Problem

A suki steps away mid-cart to grab a sibling, the line is getting long,
or the cashier needs to switch context (answer a question, check stock,
take a quick payment for someone else). Today the only options are ring
it up incomplete or back out of the cart and lose everything. Both
encourage the cashier to memorize or handwrite the items, which is
error-prone and breaks the audit trail of what was sold.

## User Story

As a store owner, I want to set a customer's cart aside when
interrupted and bring it back exactly as it was, so I can serve
whoever is in front of me without losing the first suki's selections.

## In Scope

- A "Park cart" action on the POS screen that snapshots the current
  cart to a named slot.
- A small, visible list of parked carts (one is usually enough, but
  support up to 3) accessible from the POS tab.
- A "Resume" action that loads the parked cart back into the active
  cart, including line items, quantities, sold-unit metadata, and any
  selected customer for credit.
- Automatic discard of the parked cart after a configurable retention
  window (default: until end of day), with a manual "Discard" option.

## Out of Scope

- Cross-device sync of parked carts (single-device, offline-only).
- Notifications or reminders for parked carts that have been sitting.
- Persisting a parked cart across app uninstalls (would require
  backup, which is feature 17).

## Data Implications

- New table `parked_carts` with: `id`, `label` (suki name or
  auto-generated "Cart 1"), `customer_id` (nullable FK to
  `customers`), `created_at`, `expires_at`, `payload_json` (the
  serialized cart line items).
- New table `parked_cart_items` if we want first-class queryability,
  but a JSON column is sufficient since carts are short-lived and
  never aggregated. Prefer JSON for simplicity.
- New functions in `database/sales.ts`:
  `parkCart(cart, meta)`, `listParkedCarts()`,
  `resumeParkedCart(id)`, `discardParkedCart(id)`.
- New hook in `hooks/useSales.tsx`: `useParkedCarts()` and a
  `useParkCart()` / `useResumeCart()` mutation pair.
- New migration bumping `user_version` past 9.
- A small store flag in `stores/pos.ts` (or equivalent) for
  "active parked cart id" so the resume flow restores without an
  extra query.

## Dependencies

- None — fully independent. Builds on the existing `useCart` hook
  (recently refactored to handle paginated products) but does not
  require any other roadmap feature.

## Open Questions

- Should parked carts include the customer name, or only an auto
  label? Owner might want a quick way to remember "the one with the
  toddler."
- Is one parked cart enough, or do real workflows need 2-3
  concurrent ones (one suki stepping away, one being tallied for
  later)?
- What happens to a parked cart if the product it contains is
  deleted, restocked at a new price, or run through a wholesale
  re-pack? Resume needs a clear policy (resume with stale price,
  prompt to re-price, or refuse).

## Feasibility Notes

- Single-device, local SQLite — trivial to implement.
- A parked cart is just a row; the existing `useCart` already holds
  the state we need to serialize.
- Money invariant: parked carts store integer pesos only; never
  re-parse on resume. Display-only formatting goes through
  `lib/money.ts`.
- If a parked cart expires while the app is closed, the cleanup
  runs on next app open.
