# Features Needed to Move in a Respective Screen Routes

> **Parent Index**: [[planning|07-Planning Index]]  
> **Related Roadmap**: [[01-Roadmap/feature-implementation-status-and-ia|Feature Implementation Status & IA]] | [[01-Roadmap/project-roadmap|Project Roadmap]]

This is to repurpose the features that are currently in the home screen to be moved to their respective screens. This is to make the home screen more focused on the dashboard and summary of the data.

---

## List of Features to Move

1. **Gastos & Kaha Ledger** (currently in the `today` screen)
   - Target destination: Dedicated `/gastos-kaha` route linked from `(tabs)/more`.
   - Feature Spec: [[02-Features/03-daily-cash-close-out|03-Daily Cash Close Out]]

2. **Sarado Na!** (currently not yet implemented in all screen routes, feature to planned)
   - Store end-of-day closing ritual and cash drawer reconciliation.
   - Feature Spec: [[02-Features/03-daily-cash-close-out|03-Daily Cash Close Out]]
   
   If the store is closed, the system will not allow any transactions to be made and will show a message that the store is closed.

3. **Pa-Void** (currently not yet implemented, feature to be planned)
   - Void transaction logic returning items to stock and updating sales ledger.
   - Feature Spec: [[02-Features/07-safe-voids-refunds-corrections|07-Safe Voids, Refunds & Corrections]]

4. **Pa-Refund** (currently not yet implemented, feature to be planned)
   - Partial/Full customer refund workflow.
   - Feature Spec: [[02-Features/07-safe-voids-refunds-corrections|07-Safe Voids, Refunds & Corrections]]

5. **More Tab Content & Visual Redesign** (spec approved 2026-08-10)

   Spec: `docs/superpowers/specs/2026-08-10-more-tab-content-design.md`  
   Replaces the flat list in `components/more/MoreHomeScreen.tsx` with a
   sectioned icon-grid (Quick actions hero + 6 sections + About list).
   Surfaces only features that already have working routes — no
   "Coming soon" tiles. Adds build-out of `app/(tabs)/more/settings.tsx`
   (currently an empty stub). The Reports tiles deep-link into the
   existing `/(tabs)/home/today` almanac with a `?section=…` query
   (requires a small additive `id` prop on `CollapsibleSection`).

   Follow-up (not part of this spec):
   - Remove the standalone `/settings` route now that `/(tabs)/more/settings` is built out.
   - Move the `/(tabs)/home/today` almanac under a dedicated top-level `/reports` route so the More tab can own it without also keeping Home tab sub-tab navigation.

---

## 🔗 Connected Notes

- [[planning|07-Planning Index]]
- [[02-Features/03-daily-cash-close-out|03-Daily Cash Close Out]]
- [[02-Features/07-safe-voids-refunds-corrections|07-Safe Voids, Refunds & Corrections]]
- [[01-Roadmap/feature-implementation-status-and-ia|Feature Implementation Status & IA]]

