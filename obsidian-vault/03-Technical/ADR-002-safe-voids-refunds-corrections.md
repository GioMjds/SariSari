---
title: ADR-002 Safe Voids Refunds Corrections
description: Auditable reversal flow for cash and credit sales with PIN-gated authorization. Implementation spec at docs/superpowers/specs/2026-08-13-safe-voids-refunds-corrections-design.md. Mirrors the per-feature spec at 02-Features/07-safe-voids-refunds-corrections.md.
type: adr
status: accepted
tags: [adr, architecture, sales, corrections, sqlite, offline-first, audit]
created: 2026-08-13
---

> **Vault mirror.** The implementation-grade design lives at `docs/superpowers/specs/2026-08-13-safe-voids-refunds-corrections-design.md` in the codebase. The feature rationale and scope live at [[07-safe-voids-refunds-corrections|07. Safe Voids, Refunds, and Corrections]]. This ADR captures the architectural decision; the spec captures the implementation mechanics. See [[decisions-moc]] for the full index.

## Status

Accepted (pending user sign-off on 2026-08-13)

## Date

2026-08-13

## Context

Mistakes happen: wrong change, returned damaged goods, misprinted shelf prices. The only "fix" available today is `database/sales.ts:469 deleteSale`, which (a) destroys the audit trail, (b) leaves `inventory_transactions` reconciled but the sale's history gone, and (c) `DELETE`s the linked `credit_transactions` row outright — silently rewinding the suki's balance without explanation.

The per-feature spec at [[07-safe-voids-refunds-corrections|07. Safe Voids, Refunds, and Corrections]] establishes that corrections must be (1) reversible in the audit sense — no rows destroyed, status flags used instead; (2) cash-aware — voids/refunds of cash sales must flow through the cash ledger so [[03-daily-cash-close-out|03. Daily Cash Close-Out]] reconciles correctly; (3) credit-aware — voids/refunds of credit sales must preserve the ledger; (4) PIN-gated — [[11-owner-pin-for-sensitive-actions|11. Owner PIN]] is the authorization control; (5) bounded — a configurable time window prevents stale corrections; (6) audited — every correction gets an append-only log row visible on the sale detail and in a Corrections report.

Six design questions were resolved during brainstorming:

1. Correction entry route → Sales sub-tab + sale detail screen.
2. Void window → configurable per store, default 24h.
3. Witness model → PIN + cashier witness (free text until feature 16 lands).
4. Price-correction form factor → per-line editor in one screen.
5. Cash reversal shape → new `cash_entries.type='cash_refund'` value.
6. Corrections report → list-only, no aggregations in v1.

## Decision

1. **Reversal-by-flag, never delete.** Voids and refunds set `sales.cancelled_at` + `sales.cancelled_by_kind` and `credit_transactions.status='cancelled'` (the column already supports the value). The original rows stay so the audit history is intact. `sale_items` rows are untouched except for price corrections.
2. **Inventory via adjustment rows.** Restocks use `inventory_transactions.type='adjustment'` + `adjustment_sign='positive'` with `note='<kind>:<correction_id>'` as the cross-reference. The shape already exists at `database/inventory.ts:32-37` and matches what the existing `deleteSale` does with `type='restock'` — we use `adjustment` instead because the spec calls it a reversal event, not a restock event.
3. **New `cash_refund` cash-entry type.** A fourth arm on `cash_entries.type CHECK` lets the daily close-out subtract refunds from expected cash without conflating them with expenses, owner drawings, or owner additions. `getCashSessionSummary` at `database/cash.ts:175-187` gains a fourth CASE arm in the same edit.
4. **`app_settings` key/value table.** A simple `key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER` table holds `void_window_hours` (seeded to `'24'`). Feature 13 (expiry threshold) reuses this surface for its own configurable.
5. **`sale_corrections` is append-only.** Schema: `(id, sale_id, kind, actor_reason_code, actor_note, actor_user, witness_user, refund_payment_type, created_at)`. `CHECK (kind <> 'refund' OR refund_payment_type IS NOT NULL)` enforces the refund-must-pay-cash invariant from the spec.
6. **Per-line price deltas in `sale_correction_lines`.** Kind='price_correction' generates a single `sale_corrections` row plus N child rows in `sale_correction_lines` (one per edited `sale_item`). `price_delta` is signed so reverse reporting in feature 10 (Stock Movement Timeline) can decide how to render changes without recomputing.
7. **Correction writes run as one `db.withTransactionAsync` block** that gates on (a) `cash_sessions.status='closed'` for cash-side writes (same lock used by `deleteSale`), (b) the new `void_window_hours` window, (c) `sales.cancelled_at IS NULL` to prevent double-correction. Any precondition failure throws a named error class so the UI can show actionable copy.

## Alternatives Considered

### Reuse `deleteSale` as the only correction path

- _Pros:_ Zero new code paths; ships in one commit.
- _Cons:_ Destroys audit history (the spec's primary motivation for the feature), leaves `credit_transactions` rows deleted so the suki's running balance loses the original event, and conflates "buyer changed mind" with "preserving history" — exactly the wrong semantic.
- _Decision:_ Rejected. New write functions (`voidSale`, `refundSale`, `correctSalePrice`) live alongside `deleteSale`; the older path stays for the original "delete before close-out" use case the migration notes describe.

### Reuse `cash_entries.type='expense'` for cash refunds

- _Pros:_ Zero schema change, smallest migration.
- _Cons:_ A refund and a "bought packaging" expense become indistinguishable in the ledger; reconciliation depends on parsing free-text notes. The spec explicitly distinguishes voids (cash back to customer) from write-offs.
- _Decision:_ Rejected. Add `'cash_refund'` to the CHECK constraint; downstream consumers can switch on the type value cleanly.

### Hard-code `void_window_hours=24`

- _Pros:_ One fewer migration, no settings screen.
- _Cons:_ Locks in a default the spec leaves open as an Open Question; future configurability would need a second migration just for the storage layer.
- _Decision:_ Rejected. `app_settings` table is small and sets the precedent for feature 13's expiry threshold.

### Surface corrections from the Home dashboard

- _Pros:_ Fastest access for an owner who just noticed a mistake.
- _Cons:_ Destructive action with no sale context (owner picks the sale by ID or memory) — exactly the failure mode the spec is trying to prevent. Sale-detail drill-in is the correct mental model for "I made a mistake → fix that specific sale."
- _Decision:_ Rejected. Sale detail screen is the entry point; corrections live next to the sale context.

## Consequences

- Three new database modules (`database/corrections.ts`, `database/settings.ts`, plus additions to `database/sales.ts`) and four new screens (`correction.tsx`, `price-correction.tsx`, `reports/corrections.tsx`, `settings/index.tsx`) ship together. Substantial surface area but each piece is small.
- Every correction is fully audited: `sale_corrections` row + matching `inventory_transactions` adjustment row + matching `cash_entries.cash_refund` row + matching `credit_transactions.status='cancelled'` flag. The audit log can be reconstructed by joining on the `note` text (e.g. `void:42`) for an external review.
- The corrections report is read-only and append-only. No rollback of a correction is offered in v1 — the spec excludes partial refunds and the open question of "edit a correction" is deferred.
- `app_settings` becomes a project convention; feature 13's configurable expiry threshold slots in alongside `void_window_hours` without a new pattern.

## References

- Spec: `docs/superpowers/specs/2026-08-13-safe-voids-refunds-corrections-design.md`
- Feature: [[07-safe-voids-refunds-corrections]]
- Code: `database/sales.ts` (`insertSale`, `deleteSale`), `database/inventory.ts`, `database/cash.ts`, `database/migrations.ts`
- Related notes: [[03-daily-cash-close-out]], [[10-stock-movement-timeline]], [[11-owner-pin-for-sensitive-actions]], [[13-expiry-and-damaged-goods-tracking]], [[16-shift-tracking-on-one-device]]
- MOC: [[decisions-moc]]
