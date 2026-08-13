# Next Feature Recommendations & Implementation Strategy (Post-Feature #7)

> **Created:** 2026-08-13  
> **Milestone:** Full completion & commit of Feature 07 (Safe Voids, Refunds & Corrections)  
> **Status:** 11 Done · 4 Partial · 3 Not Started  

---

## 1. Overview & Current Roadmap Status

Following the landing of **Feature 07 (Safe Voids, Refunds & Corrections)**, the 18-feature backlog status stands at:

- **Done (11):** POS Fast Lane (#1), Parked Sales (#2), Daily Cash Close-Out (#3), Physical Stocktake (#4), Utang Guardrails (#5), Collection Queue (#6), Safe Voids / Refunds / Corrections (#7), Offline Reorder Suggestions (#9), Stock Movement Timeline (#10), Customer Credit Statements (#12), Manual Backup & Restore (#17).
- **Partial (4):** Supplier Delivery Receiving (#8), Expiry & Damaged Goods Tracking (#13), Transparent Local Store Insights (#14), Smarter Credit Profiles (#15).
- **Not Started (3):** Owner PIN for Sensitive Actions (#11), Shift Tracking (#16), Offline Price-Label Sheets (#18).

For the full detailed status breakdown and Information Architecture audit, see [[01-Roadmap/feature-implementation-status-and-ia|Feature Implementation Status & IA]].

---

## 2. Strategic Feature Recommendations

### 🎯 Option 1 (Top Recommendation): Feature #11 — Owner PIN for Sensitive Actions
*Status: Not Started · Phase: Next*

#### **Rationale**
[[02-Features/07-safe-voids-refunds-corrections|Feature 07 (Safe Voids, Refunds & Corrections)]] and [[02-Features/05-utang-guardrails-at-checkout|Feature 05 (Utang Guardrails)]] were architected to be **owner-gated**. While the underlying database logic, transaction isolation, and UI screens for voids, refunds, price edits, and credit limit overrides are shipped, any user operating the POS can currently execute these actions without PIN authentication. **Feature 11 is the missing security lock** required to complete the owner-gated promise.

#### **Key Execution Scope**
1. **Data Layer**:
   - Store salted PIN hash (`owner_pin_hash`) in `app_settings` (`database/settings.ts`).
   - Add verification state and attempt throttling logic.
2. **Reusable UI Component**:
   - Create `<OwnerPinModal>` component with quick 4-digit / 6-digit pinpad input.
   - `useOwnerPin()` hook for easy verification modal triggering.
3. **Integration Points**:
   - `app/(edit-forms)/sale-correction/[id].tsx` (Void / Refund confirmation).
   - `app/(edit-forms)/price-correction/[id].tsx` (Price adjustment confirmation).
   - `app/(edit-forms)/add-credit/[id].tsx` & POS credit limit override CTA.
   - Destructive settings actions.

---

### 📦 Option 2: Feature #8 — Supplier Delivery Receiving
*Status: Partial · Phase: Next*

#### **Rationale**
Currently, SariSari only supports single-product stock additions via `RestockSheet.tsx`. Sari-sari store owners receiving multi-item deliveries from suppliers (e.g. Coca-Cola, URC, Nestlé) need a dedicated multi-line receiving sheet with shortage tracking.

#### **Key Execution Scope**
1. **Database Schema**:
   - Add `delivery_receipts` table (`id`, `supplier_id`, `invoice_no`, `total_amount`, `receipt_photo_uri`, `received_at`).
   - Add `delivery_receipt_lines` table (`receipt_id`, `product_id`, `expected_qty`, `received_qty`, `unit_cost`).
2. **UI Workflow**:
   - Multi-line receiving screen: Supplier selection → Invoice # entry → Line item expected vs. counted quantities → Automatic shortage report.
3. **Ledger Integration**:
   - Atomic commit creating `inventory_transactions` (`type = 'restock'`) for all received line items.

---

### ⚡ Option 3: Information Architecture & Usability Quick Wins
*Estimated Effort: 1 Day*

Before embarking on a new feature, a minor IA polish pass can immediately resolve two usability gaps:

1. **Expose Feature #9 (Reorder Suggestions)**: Move the orphaned route `app/inventory/recommendations.tsx` into `app/(tabs)/inventory/recommendations.tsx` so users can access AI reorder suggestions directly from the Inventory tab stack navigation.
2. **Mount POS Fast Lane Chips (#1)**: Mount the existing `<FastLaneSection>` quick quantity chips (`+1 / +2 / +5`) into the live POS screen catalog (`app/(tabs)/sales/pos.tsx`).

---

## 3. Next Action Plan

1. **Primary Recommendation:** Proceed with spec & plan generation for **[[02-Features/11-owner-pin-for-sensitive-actions|Feature 11 (Owner PIN for Sensitive Actions)]]**.
2. **Follow-up:** Implement Feature 08 (Supplier Delivery Receiving).

---

## 🔗 Related Documents

- **Master Roadmap:** [[01-Roadmap/project-roadmap|SariSari Feature Release Roadmap]]
- **IA Audit:** [[01-Roadmap/feature-implementation-status-and-ia|Feature Status & Information Architecture]]
- **Shipped Feature 07:** [[02-Features/07-safe-voids-refunds-corrections|07-Safe Voids, Refunds & Corrections]]
- **Owner Guide:** [[02-Features/owner-guide/07-safe-voids-refunds-corrections-owner-guide|07 Owner Walkthrough Guide]]
