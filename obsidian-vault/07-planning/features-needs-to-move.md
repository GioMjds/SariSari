# Features Needed to Move in a Respective Screen Routes

This is to repurpose the features that are currently in the home screen to be moved to their respective screens. This is to make the home screen more focused on the dashboard and summary of the data.

## List of Features to Move

1. **Gastos & Kaha Ledger** (currently in the `today` screen)

2. **Sarado Na!** (currently not yet implemented in all screen routes, feature to planned)

This feature is to help owners to declare their store as closed for the day. This will help the system to know that the store is closed and will not accept any transactions for the day. This will also help the system to know that the store is closed and will not accept any transactions for the day.

If the store is closed, the system will not allow any transactions to be made and will show a message that the store is closed. This will also help the system to know that the store is closed and will not accept any transactions for the day.

3. **Pa-Void** (currently not yet implemented, feature to be planned)

This feature is to help owners to void a transaction that has been made. This will help the system to know that the transaction has been voided and will not be counted in the sales for the day. This will also help the system to know that the transaction has been voided and will not be counted in the sales for the day.

4. **Pa-Refund** (currently not yet implemented, feature to be planned)

This feature is to help owners to refund a transaction that has been made. This will help the system to know that the transaction has been refunded and will not be counted in the sales for the day. This will also help the system to know that the transaction has been refunded and will not be counted in the sales for the day.

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
   - Remove the standalone `/settings` route now that
     `/(tabs)/more/settings` is built out.
   - Move the `/(tabs)/home/today` almanac under a dedicated top-level
     `/reports` route so the More tab can own it without also keeping
     Home tab sub-tab navigation.
