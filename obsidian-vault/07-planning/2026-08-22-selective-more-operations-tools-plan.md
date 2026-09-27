---
title: Selective More Operations Tools Rollout Plan
created: 2026-08-22
tags: [planning, more, settings, inventory, cash-control]
type: implementation-plan
status: draft
---

# Selective More Operations Tools Rollout Plan

## Goal

Add optional owner-controlled operations tools without duplicating the capabilities that are already live. The **More** tab is the discovery and activation surface; each tool's working screen lives in `app/settings/` and is reachable only when its module is enabled.

This plan deliberately treats the current cash model as a prerequisite for cash-sensitive features. The current audit identifies daily cash sessions as legacy, even though legacy tables and functions remain in the codebase. Do not build shift balancing or e-services against that retired flow without first resolving the model.

## Reconciliation: Existing Capability vs. Planned Delta

| Requested tool | Existing capability | Status | Include only this delta |
| --- | --- | --- | --- |
| Owner Draw / Pang-Ulam | Cash owner drawings are live in the financial ledger. | Partial | Record inventory consumption at cost as `owner_consumption`; include it in owner-draw totals without creating a sale or a duplicate financial-entry row. |
| Bantay Mode | Owner PIN and biometric approval exist; shift attribution and a restricted operator surface do not. Legacy cash-session data/functions remain. | Partial / blocked by cash-model decision | Owner handover, restricted POS-only mode, active bantay attribution, opening/closing count, and discrepancy review. |
| Palengke Sheet | Reorder recommendations, supplier association, suggested quantities, and estimated costs are live. | Partial | Create the grouped checklist, total working-capital view, offline text share, and printable PDF; do not rebuild reorder intelligence. |
| Tingi Calculator | Bundle/pakyaw conversion, cost-per-piece math, markup, and product pricing are live. | Partial | Add packaging cost, expected spillage, price-rounding, and margin recommendation. Do not duplicate the existing product-pricing form. |
| E-Services Ledger | No wallet/float ledger or service-income reporting exists. | Not started | Add the independent digital-float ledger only after the physical-cash movement model is settled. |
| Spoilage Monitor | Manual damaged write-offs and inventory movement history are live. Expiry capture, reason-coded loss reporting, and a usable near-expiry view are not. | Partial | Add optional expiry monitoring, markdown/write-off prompts, and loss reporting; do not create a second generic damaged-goods workflow. |

Source notes: [[02-Features/owner-inventory-consumption-pang-ulam]], [[02-Features/16-shift-tracking-on-one-device]], [[02-Features/palengke-restock-sheet]], [[02-Features/e-loading-and-digital-cash-services]], [[02-Features/13-expiry-and-damaged-goods-tracking]], and [[01-Roadmap/current-implemented-feature-inventory]].

## Route and Module Architecture

`app/(tabs)/more` remains the tab-owned navigation area. `app/settings/` is an ordinary Expo Router path today (not a parenthesized route group), so the proposed screens will resolve to `/settings/...`.

```text
More tab
  More home: enabled tool cards only
  More > Settings: "Operations tools" row
    /settings/more-tools: owner-only module selector
      /settings/owner-draw
      /settings/bantay-mode
      /settings/palengke-sheet
      /settings/tingi-calculator
      /settings/e-services-ledger
      /settings/spoilage-monitor
```

- Add `app/settings/_layout.tsx` for a focused stack and shared back behavior.
- Keep the existing `app/(tabs)/more/settings.tsx` as the primary settings home. It links to `/settings/more-tools`; it should absorb or replace the orphaned legacy `app/settings/index.tsx` setting rather than creating a second Settings home.
- Store enabled modules in one versioned JSON app-setting, `more_enabled_tools_v1`, whose keys are the six stable slugs above. Default every module to `false`; a module is discoverable in the selector but is not shown as a More-home card until the owner enables it.
- Guard editing the selector with `useOwnerPinGuard`. Route-level checks must also reject direct navigation to a disabled tool and return to `/settings/more-tools`; hiding a card alone is not access control.
- Maintain authorization at the action level. Enabling Owner Draw, Bantay, or E-Services does not remove PIN checks for sensitive writes, balance edits, or mode exit.
- Add translations, navigation identifiers, enabled-module query keys, and tests as part of the foundation. Do not put persisted business state in Zustand.

## Feature Contracts and Delivery Order

### 0. Resolve the physical-cash model before drawer features

Choose one authoritative model for expected drawer cash: restore and modernize cash sessions, or replace them with a unified physical-cash movement ledger. Record the decision in a technical note before schema work.

Acceptance criteria:

- Cash sales, owner cash draws, expenses, refunds, and later e-service deltas have one auditable effect on expected drawer cash.
- Current cash-session-dependent correction behavior has an explicit migration/retirement path.
- Shift and e-service schemas depend on that chosen ledger, not on duplicated totals.

### 1. Build the optional-tools foundation

Create the module selector, enabled-card rendering in More, route guard, `/settings` stack, and canonical tool metadata. Use one label/icon/description registry for the selector and More cards.

Acceptance criteria:

- An owner can enable or disable each tool offline and the choice survives app restart.
- Enabled tools appear in More; disabled tools do not.
- A deep link to a disabled route is rejected without mounting the tool screen.
- Existing More destinations, reports, backup, and Settings keep working.

### 2. Deliver the independent, read-only tools first

**Palengke Sheet:** derive a read-only plan from `useStockRecommendations`, group by preferred supplier then category fallback, calculate totals from the existing cost snapshot, and export text/PDF. The sheet must not change inventory or mark recommendations received.

**Tingi Calculator:** accept bulk cost, usable output quantity, packaging cost, expected loss/spillage, desired margin, and an owner-selected rounding rule. Return effective unit cost, break-even price, recommended price, and per-unit margin. Version one is an ephemeral calculator with an optional prefill handoff to Add Product; it does not silently modify product costs or stock.

Acceptance criteria:

- Both tools work without network access and never mutate stock merely by calculating/exporting.
- Palengke totals reconcile to the visible item subtotals.
- Tingi calculation handles zero/invalid usable quantity and rounds only at the final price suggestion.

### 3. Add the inventory-control deltas

**Owner inventory consumption:** introduce `owner_consumption` as a negative inventory movement with immutable `unit_cost` snapshot, note, timestamp, and owner attribution. Financial reporting calculates owner draws as cash draws plus goods consumption, never as revenue or an operating expense.

**Spoilage monitor:** add optional per-product expiry fields and a reason code for damaged/write-off events. Surface date-ordered near-expiry items with configurable threshold, markdown reminder, and PIN-gated write-off. Aggregate loss by reason and period from transaction snapshots.

Acceptance criteria:

- Both operations use atomic SQLite transactions and cannot reduce stock below zero.
- Inventory timeline and product detail explain the new movement types clearly.
- Expiry remains opt-in; non-perishable products do not require new data entry.
- Owner draws and spoilage stay distinct in stocktake and profit reports.

### 4. Build Bantay Mode after task 0

Extend [[02-Features/16-shift-tracking-on-one-device]] rather than creating a duplicate shift feature. Create minimal helper profiles, active shift records, opening/closing counts, variance reason, and action attribution. On handover, the owner starts Bantay Mode; the helper can scan/add items and complete allowed sales only. Margin, supplier-cost, reports, settings, price corrections, stock adjustments, cash/float edits, and module management remain owner-gated. Owner PIN or biometrics is required to enter or exit Bantay Mode and to reveal sensitive views.

Acceptance criteria:

- Shift handover produces a deterministic expected-versus-counted drawer result under the model chosen in task 0.
- Restricted navigation is enforced for direct routes as well as visible controls.
- Every sale, allowed drawer movement, correction, and relevant stock event records its active helper/owner actor when one exists.
- No payroll, attendance, or multi-device account scope is introduced.

### 5. Build E-Services Ledger after task 0

Create separate wallet and transaction tables for GCash, Maya, and telco-load floats. A transaction atomically changes exactly three concerns: wallet balance, physical-cash movement, and service-fee income. Product sales/COGS remain untouched. Wallet adjustments and reconciliation differences require owner approval.

Acceptance criteria:

- Cash-in, cash-out, e-load, replenishment, and adjustments produce balanced and auditable records.
- Reports show service income separately from merchandise sales and COGS.
- The expected drawer calculation includes only the physical-cash delta, not the digital principal twice.
- No wallet credentials, OTPs, SMS reading, or gateway integrations are stored or attempted.

## Database and Verification Principles

- Make schema changes as forward-only migrations after the current version 22; assign one migration version per cohesive vertical slice.
- Keep money in integer pesos and use `lib/money.ts` at every UI boundary.
- Place SQLite functions in `database/`, TanStack Query access in `hooks/`, and screen composition in `app/`/`components/`; screens never query SQLite directly.
- Use `db.withTransactionAsync` for any operation that changes stock, cash movement, wallet balance, or a related audit row.
- Add migration, database, hook, navigation-guard, and calculation tests per slice; run typecheck and the focused test suite before moving to the next tool.

## Checkpoints

1. **Foundation review:** approve the cash-model decision and verify module selection, persistence, disabled-route protection, and current More navigation.
2. **Low-risk tools review:** verify Palengke export and Tingi arithmetic with representative store data before inventory writes are introduced.
3. **Inventory-control review:** verify cost snapshots, report separation, expiry behavior, and stocktake compatibility.
4. **Cash-control review:** test Bantay handover and e-service cases end to end with opening float, sales, owner draw, cash-in, cash-out, and a closing count.

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Retired cash sessions conflict with new shift/e-service assumptions. | Complete the explicit cash-model decision first; do not let either feature call legacy session APIs by default. |
| Hidden More cards are mistaken for authorization. | Add a route guard and action-level PIN checks. |
| Owner goods draws distort profit reports. | Never create a sale or duplicate financial entry; aggregate cash and goods draws only in reporting. |
| Repack calculator overwrites catalog costing accidentally. | Keep v1 calculation-only; make any product handoff an explicit reviewed action. |
| Optional tools bloat the daily UI. | Default off, show only enabled modules in More, and retain a single owner-controlled selector. |

## Approval Needed Before Implementation

- Confirm the authoritative physical-cash model from task 0.
- Confirm that all six modules should default to disabled, with the owner choosing which cards appear in More.
- Confirm the Tingi v1 boundary: calculator plus optional product prefill, but no saved repack batches or automatic stock conversion.
