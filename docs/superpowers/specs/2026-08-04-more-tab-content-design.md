# More Tab Content Design

**Date:** 2026-08-04  
**Status:** Approved  
**Scope:** Information architecture and route ownership for the More tab.

## Decision

More is the fifth bottom-tab intent group and uses a grouped launcher home. It
is not a Settings screen and does not use horizontally swiped sub-tabs.

The app's primary tabs already own frequent, operational work:

- Home: current store state and quick actions
- Sales: counter transactions and receipts
- Inventory: products, stock control, and reorder advice
- Customers: suki credit management
- More: occasional business review, administration, and data-safety tasks

## More Home

`/(tabs)/more` presents one scrollable, grouped list. Every row opens a
dedicated screen; the landing screen itself performs no destructive operation.

### Business review

- **Reports and insights** opens `/(tabs)/more/reports`. This is the existing
  reporting almanac and remains reachable from Home quick actions and alerts.
- **Expenses and cash** opens `/gastos-kaha`. It records operating expenses
  and owner drawings. Reports keeps its contextual link to the same ledger.

### Store setup

- **Store profile** opens settings/profile editing. Store name and owner name
  must be editable rather than display-only.
- **Language** opens the existing English/Tagalog picker.

### Data and safety

- **Backup and restore** opens the existing cloud-backup and local-snapshot
  controls. Restore retains its current rollback and confirmation safeguards.

### App

- **Help** provides concise, offline-first guidance for sales, inventory, and
  suki credit workflows.
- **About SariSari** shows the app version, privacy information, and
  acknowledgements.

## Deliberately Excluded

- **Stock recommendations:** remain an Inventory destination because owners
  act on recommendations through stock workflows.
- **Standalone insights:** the Reports screen already includes insights, so a
  second route would be empty or duplicate data.
- **Sync:** SariSari is offline-first and currently provides backup rather
  than transaction synchronization.
- **Themes:** the established warm SariSari identity is not user-configurable.
- **Developer tools:** reset and diagnostic tools remain unavailable in the
  production More menu.

## Route Ownership

```text
/(tabs)/more                 grouped launcher
/(tabs)/more/reports         reports and insights
/(tabs)/more/settings        profile, language, backup, help, and about
/gastos-kaha                 expenses and owner drawings
/inventory/recommendations   inventory-owned reorder advice
```

The old top-level `app/more` location is retired. `app/(tabs)/more` is the
sole owner of More routes so the shared tab chrome and back-navigation behavior
are consistent.

## Interaction and Error Handling

- More rows use explicit labels, short descriptions, and familiar icons; they
  are destinations rather than toggle-heavy settings.
- Backup/restore keeps its existing loading, unavailable-cloud, confirmation,
  and rollback states.
- Routes reached from More must provide a clear back action to the More hub.
- Home may link directly to Reports; this is intentional shortcut access, not
  duplicate functionality.

## Implementation Boundaries

- The More hub is a presentation/navigation screen and reads no business data
  directly.
- Existing report, settings, backup, and financial hooks keep their current
  data ownership. No database schema or migration is required.
- New profile editing follows the established screen -> hook -> database
  layering; it is separate from the navigation migration.

## Testing

- Verify each More row opens the intended route and hardware back returns to
  the More hub.
- Verify Home report shortcuts open `/(tabs)/more/reports`.
- Verify backup, restore confirmation, language change, and existing Reports
  data loading remain functional.
- Add route/navigation tests where the project already has coverage; run
  `npm run typecheck` and the relevant Jest suite for implementation changes.

## Scope and Sequencing

1. Build the grouped More launcher and route ownership consolidation.
2. Move/settings-shell navigation and preserve backup and language behavior.
3. Add editable store profile, Help, and About as separate, later features.

This keeps the navigation work small while leaving distinct product features
with clear future boundaries.
