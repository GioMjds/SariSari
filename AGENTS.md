# AGENTS.md

- Concise entry point for AI Agents (Claude Code, Gemini CLI, Antigravity, Codex, etc). Guidance working code with this repo.

## Project

SariSari — offline-first mobile assistant for Filipino sari-sari store owners. Tracks inventory, runs a POS, and maintains suki credit (utang) ledgers on-device. Expo SDK 54 / React Native 0.81 / React 19, New Architecture (Fabric). No backend; everything runs on a single local SQLite database.

## Commands

All commands run from the project root. Package manager is `npm`.

```bash
npm install                  # also runs `pnpm rebuild better-sqlite3` (postinstall)
npm start                    # expo start (use `i` / `a` / `w`)
npm run:ios                  # local iOS build (dev client)
npm run:android              # local Android build (dev client)
npm web                      # expo start --web
npm lint                     # expo lint (eslint-config-expo flat config)
npm typecheck                # tsc --noEmit
npm test                     # jest (test files under tests/, utils/__tests__/)
npm verify                   # typecheck + test, run before pushing
npm start:onboarding         # node scripts/start-onboarding.js
npm doctor                   # react-doctor diagnostics
```

To run a single Jest test:

```bash
npm test -- tests/sqlite/single-handle.test.ts
npm test -- -t "pattern from describe/it"
```

Jest uses `better-sqlite3` to mock `expo-sqlite` (see `jest.setup.ts`). The test environment override to top-level `jest-environment-node` exists because RN 0.81 ships a nested jest 29.7.0 that crashes on `clearMocksOnScope` — do not remove that override.

## Architecture & Layering

Strict unidirectional flow. Violations should be caught in review.

```diagram
Screen (app/) ──reads/writes──▶ Hook (hooks/) ──calls──▶ DB Fn (database/) ──uses──▶ SQLite
       │                            │                       │
       │                            │                       └─ maps snake_case rows → camelCase TS
       │                            └─ wraps in useQuery/useMutation, invalidates on success
       └─ renders components/, reads stores/ for UI-only state
```

Hard rules:

- `app/` screens NEVER call SQLite directly. All data access goes through hooks in `hooks/`.
- `database/` files are pure async functions executing raw SQL; they return typed rows and own the snake_case ↔ camelCase mapping.
- `stores/` (Zustand) is for transient UI state only — modals, dialogs, toasts, scroll signals. It must NEVER cache business data. Use TanStack Query for that.
- One SQLite handle. Imported from `configs/sqlite.ts` everywhere. Do not call `openDatabaseSync` / `openDatabaseAsync` from anywhere else. Enforced by `tests/sqlite/single-handle.test.ts`. PRAGMA `journal_mode=WAL` and `busy_timeout=5000` are set at startup.

## Financial Guardrails

These are not stylistic preferences — they prevent real bugs and are enforced in tests.

1. **Money is integer pesos in SQLite.** All monetary columns are `INTEGER` and store whole pesos with up to two decimal places — `₱12.50` is stored as `12.5`, not `1250`. `parsePesosInput` rounds input to at most two decimals so the integer-pesos invariant is preserved. ALL parsing on input and formatting on display must go through `lib/money.ts` (`parsePesosInput`, `formatPesos`). No other code path should parse or format money. Avoids float drift over thousands of sales.
2. **Multi-statement writes that touch the ledger use `db.withTransactionAsync`** so partial failure cannot leave balances out of sync.
3. **Suki balance is computed live** from transactions (`SUM(amount) - SUM(amount_paid)` over unpaid credits). Payment allocations are FIFO in `payment_allocations` and are reversible when the payment is deleted.

## Routing

`expo-router` v6 file-based. Groups in `app/`:

- `(tabs)/` — main tab layout (home, inventory, sales/POS, customers/utang, reports, settings).
- `(edit-forms)/` — add/edit screens: add-product, add-credit, add-payment, add-sales, edit-product, credit-details, etc.
- `onboarding/`, `modal/`, `more/`, `gastos-kaha/`, `inventory/`, `settings/` — top-level flows.

`_layout.tsx` files in each group own stack/tab configuration.

## Conventions

- TypeScript strict mode is on, plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `useUnknownInCatchVariables`. New code must compile cleanly under these.
- Path alias `@/*` maps to the repo root (see `tsconfig.json`).
- Styling via NativeWind v4 (`className`) with Tailwind config in `tailwind.config.js`; global styles in `global.css`. Reanimated 4 + Moti for animations. Babel uses `nativewind/babel` and `react-native-reanimated/plugin` (last in the list).
- Forms use `react-hook-form` v7. Server state via TanStack Query v5. Client UI state via Zustand v5.
- i18n via `i18next` + `react-i18next`, setup in `lib/i18n.ts`.
- Prettier: 2-space indent, single quotes, semicolons, trailing commas, 80-col print width (`.prettierrc`).

## Repo Etiquette

See `AGENTS.md` (which simply re-exports this file) and `.agents/` for the workflow catalog. Highlights:

- No emojis or special characters in code or comments.
- Markdown file names use kebab-case (e.g., `some-description-changes.md`).
- Concise, short solutions. Watch for over-engineering and oversized files.
- No external libraries unless absolutely necessary; pin via `package.json`, not ad-hoc installs.
- Commits are focused and atomic; do not auto-push. Don't auto-commit activity logs or docs.
- Write `activity-log.md` in `/docs` when working on something you might want to refer back to.
- Run major changes by the user first; review existing files before refactoring.
- Never commit user personal data or credentials (passwords, API keys, tokens, connection strings).
- Don't include test (`*.test.ts`, `*.spec.ts`) files into my `docs/superpowers/specs` and `docs/superpowers/tasks`.
- Don't auto-commit or auto-push agent tasks. Always review and edit before committing. Use `activity-log.md` for notes.

## Useful Entry Points

- `configs/sqlite.ts` — the SQLite handle + PRAGMAs.
- `database/migrations.ts` — schema migrations; `database/seed.ts` — developer reset/seeding (driven by `scripts/sample-mock-datas.ts`).
- `database/{products,credits,cash,sales,reports,financial,inventory,suppliers,stock-intelligence}.ts` — domain data access.
- `lib/money.ts` — money parsing/formatting.
- `lib/i18n.ts`, `lib/pdfGenerator.ts`, `lib/creditDetails.ts` — cross-cutting utilities.
- `hooks/index.ts` — re-exports for hooks; `stores/index.ts` — re-exports for Zustand stores.
- `app/(tabs)/dev/reset.tsx` — developer-only DB reset/seed screen.
