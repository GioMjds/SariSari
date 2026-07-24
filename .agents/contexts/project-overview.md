# Project Overview — SariSari Mobile

## What SariSari is

An **offline-first** mobile app for Filipino sari-sari store owners, built in
English with a full Tagalog (tl) translation available. Filipino domain terms
(`utang`, `suki`, `tinda`) are used in code, column names, and comments where
they are the natural term. The companion brand site lives in a separate
`web/` project (Vite + shadcn/ui) — this project is the mobile app only.

## The three core jobs (everything works offline)

1. **Inventory** — products, categories, stock levels, suppliers, and a
   pre-loaded offline barcode catalog.
2. **Sales (POS)** — fast point-of-sale at the counter, with barcode scanning,
   multi-tier pricing (tingi / pakyaw), cash + credit, and cash-session
   reconciliation.
3. **Utang** — customer (suki) loan tracking with a per-customer running
   balance, FIFO payment allocation, and reversible payment deletions.

A **Reports** screen rolls up daily revenue, profitability, inventory valuation,
cash-vs-credit breakdowns, fast/slow-moving goods, and credit aging buckets.

## Bottom tabs

Defined in `constants/tabs.ts` and rendered in `app/(tabs)/_layout.tsx`:

| Order | Tab       | Route        | Purpose                                               |
| ----- | --------- | ------------ | ----------------------------------------------------- |
| 1     | Dashboard | `/`          | Home base — daily summary, low stock, recent activity |
| 2     | Sell      | `/sell`      | POS / barcode-scanning counter                        |
| 3     | Inventory | `/inventory` | Product catalog, categories, restock, suppliers       |
| 4     | Utang     | `/utang`     | Suki ledger — outstanding balances, credits, payments |
| 5     | Reports   | `/reports`   | Analytics and aging buckets                           |

A `dev/reset` route is hidden in production builds and lets a developer wipe
and re-seed the database against `scripts/sample-mock-datas.ts`.

## Key features (built today, not planned)

- **Offline-first barcode catalog.** `constants/barcodes/` ships JSON for
  ~150 common Philippine SKUs (Milo, Lucky Me, Coca-Cola, etc.) split by
  category. `lib/barcodes/resolveBarcode.ts` looks up scans against the
  catalog, the user's own product list, and a custom-barcode store, in that
  order. New barcodes get auto-learned for next time.
- **Multi-tier pricing.** Items can be sold by piece (_tingi_) or by wholesale
  pack (_pakyaw_). The product form supports per-tier prices, units, and a
  dual-barcode collision check. Each tier snapshots its own profit at sale
  time so historical margin is preserved even if cost changes.
- **FIFO utang allocation.** `database/credits.ts` allocates each payment
  against the oldest unpaid credit for that suki, recording the split in
  `payment_allocations` so a payment deletion can reverse the allocation
  exactly.
- **Cash sessions.** `database/cash.ts` and the `cash-entry` / `cash-session`
  forms track per-shift opening floats, cash/credit splits, and a closeout
  report.
- **Backup queue.** `lib/backup/` runs a background scheduler that snapshots
  the DB to user-chosen destinations. The dev `reset` screen exposes a
  re-seed path; the production flow is silent.
- **i18n.** `lib/i18n.ts` wires `i18next` + `react-i18next` with two
  languages: `en` (default) and `tl` (Tagalog). The user's preference is
  persisted in `AsyncStorage` under `sarisari_language_preference`. Locale
  JSON lives in `locales/<lang>/<namespace>.json`.
- **Stock intelligence.** `database/stock-intelligence.ts` derives low-stock
  signals and restock suggestions from raw stock events. The table is built
  from inventory event log entries, not denormalized on the products row.

## Stack at a glance

See `.agents/contexts/stack-and-architecture.md` for the full table. Headline
choices: Expo SDK 54, React Native 0.81, React 19 (Fabric), `expo-router` 6,
`expo-sqlite` 16, NativeWind v4, TanStack Query v5, Zustand 5, `react-hook-form`
7, Moti + Reanimated 4, `i18next` + `react-i18next`, `better-sqlite3` for
Jest.

## Project layout (what actually lives where)

This is the real layout — note `database/` (not `db/`) is the SQLite layer.

```folder
app/                       Routes (expo-router). One folder per screen group.
  (tabs)/                  Bottom-tab screens.
    index.tsx              Dashboard (home).
    sell/                  POS screens.
    inventory/             Product catalog + restock.
    utang/                 Suki ledger.
    reports/               Analytics.
    dev/reset.tsx          Hidden dev-only reset + re-seed.
  (edit-forms)/            Modal form routes (add/edit) — one folder per flow:
                           add-product, edit-product, add-customer, add-credit,
                           add-payment, add-sales, sale-details, credit-details,
                           add-supplier, edit-supplier, category,
                           inventory-ledger, product-details, cash-entry,
                           cash-session.
  onboarding/              First-run store initialization tour.
  _layout.tsx              Root provider tree (QueryClient, i18n, theme, backup,
                           splash, gestures, safe-area, global modals/toasts).
  +not-found.tsx           404 screen.

components/                Cross-screen UI, grouped by feature.
  ui/                      Shared primitives: Modal, GlobalModal, Toast,
                           BarcodeScannerModal, MoneyText, Pagination,
                           ReceiptHero, SearchBar, Skeleton, StatusPill,
                           StatusStamp.
  elements/                Core styled wrappers (StyledText, etc.).
  dashboard/ sell/ inventory/ utang/ reports/ cash-entry/ cash-session/
  settings/ onboarding/ layout/ system/
                           Feature-co-located components.

database/                  SQLite access. One file per domain. Plain async fns.
  index.ts                 Re-exports every domain module.
  migrations.ts            Migration runner.
  migrations/              Numbered SQL files (e.g. 002_inventory_events.sql).
  categories.ts credits.ts inventory.ts products.ts reports.ts sales.ts
  suppliers.ts cash.ts stock-intelligence.ts catalog.ts
                           Domain files. snake_case SQL -> camelCase TS mapping
                           lives here, not in hooks.

hooks/                     TanStack Query hooks. One file per domain, mirrors
                           database/. Extras: useAppInfo, useBackup,
                           useBarcodeResolver, useCash, useCatalog,
                           useCategories, useCredits, useFindProductByBarcode,
                           useInventory, useProducts, useProfile,
                           useReducedMotion, useReports, useSales,
                           useStockIntelligence, useSuppliers.

stores/                    Zustand stores. UI state ONLY (modals, dialogs,
                           toasts, scroll position, inventory view mode,
                           backup counter). Never cached business data.

constants/                 Fixed lists and config strings.
  tabs.ts categories.ts filters.ts sort-option.ts stocks.ts env.ts
                           Tabs, enums, copy, sort options, thresholds.
  barcodes/                Pre-loaded offline barcode JSON, split by category
                           (beverages, canned-goods, noodles, snacks).
  onboardingTour.ts onboardingTour.assets.ts
                           First-run tour config.

configs/                   App config (not runtime toggles).
  sqlite.ts                The one and only `db` export. `openDatabaseSync`
                           is called exactly once, here.
  startup.ts               Boot-time checks and migrations kickoff.
  index.ts                 Barrel.

lib/                       Pure utilities + integrations.
  money.ts                 parsePesosInput, formatPesos — single source for
                           money. Do not bypass.
  i18n.ts                  i18next init, language persistence.
  pdfGenerator.ts          Receipt / report PDF export.
  images.ts units.ts timezone.ts formatters.ts alert.ts
                           Small helpers.
  creditDetails.ts onboardingStepMachine.ts onboardingStorage.ts
                           Larger domain helpers.
  backup/                  Backup scheduler + queue + destinations.
  barcodes/                Barcode resolution and form-application helpers.

types/                     Shared TypeScript types. Domain types live with
                           their database/ file via re-export, but a flat
                           mirror sits in `types/` for cross-domain imports.

utils/                     Misc helpers (formatting, time, alerts).

locales/                   i18next JSON. `en/` and `tl/`, with `common`,
                           `inventory`, `sales`, `utang`, `onboarding`
                           namespaces.

scripts/                   Developer-only scripts: `sample-mock-datas.ts`
                           (rich seed dataset), `fetch-barcodes.ts`
                           (catalog refresh), `start-onboarding.js`.

tests/                     Jest specs — DB tests use `better-sqlite3` to
                           mirror `expo-sqlite`. `tests/sqlite/single-handle.test.ts`
                           enforces the one-connection rule.

web/                       Sibling marketing/support site (Vite + shadcn).
                           Not part of the mobile app.
```

## Architecture, in one diagram

```diagram
Screen (app/) ──reads──▶ Hook (hooks/) ──calls──▶ db fn (database/) ──uses──▶ SQLite (configs/sqlite.ts)
       │                        │                          │
       │                        │                          └─ snake_case SQL -> camelCase TS
       │                        └─ wraps in useQuery / useMutation
       └─ renders components/, reads from stores/ for UI state
```

- A screen **never** calls `database/` directly. Always through a hook.
- A hook **never** holds business data in state outside the query cache.
- `database/` functions **never** import from `app/`, `components/`, `hooks/`,
  or `stores/`. (They can import other `database/` files, e.g. for FIFO logic.)
- `stores/` (Zustand) is for UI state only: filters, modals, draft form
  values that need to survive navigation. **It is not a cache.**

For the full layering rule and the new-domain worked example, see
`.agents/contexts/stack-and-architecture.md` and `.agents/contexts/playbook.md`.
