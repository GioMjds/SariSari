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
- Styling via NativeWind v4 (`className`) with Tailwind config in `tailwind.config.js`; global styles in `global.css`. Reanimated 4 + Moti for animations. Babel uses `nativewind/babel` preset and `react-native-reanimated/plugin` (last in the plugins list).
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

## Debugging discipline

- Reproduce first, then theorize. Get the actual stack trace (`adb logcat *:E ReactNativeJS:V` on Android, Xcode console on iOS) before guessing. The crash signature usually points at the culprit library within a couple of hops.
- Track bug diagnoses in `obsidian-vault/05-Bugs-Issues/`. Include: reproduction steps, suspected root causes, the crash trace, the fix that was tried, and links to upstream issues. This is the first place to look when a similar crash recurs.
- For third-party libraries with a history of native crashes (chart libs, view pagers, gesture handlers), wrap their render output in an `ErrorBoundary` so a single bad render does not take down the host screen. See `components/inventory/analytics/ChartErrorBoundary.tsx` as the reference pattern.
- `react-native-pager-view` must be at least `^7.0.2`. Versions in the 6.9.x line recycle `View`s while they are still attached to the window, which crashes Android's `ViewPager2.RecyclerViewImpl` with `Scrapped or attached views may not be recycled` when a top tab is swiped away mid-render. The 7.x line carries the recycling fix forward and stays UIKit-based on iOS; jump to 8.x only when you specifically need the SwiftUI rewrite.
- `npm test -- -t "<pattern>"` runs a focused subset. For Jest, `render` from `@testing-library/react-native@14` returns a `Promise` — always `await render(...)` before destructuring queries.

## Obsidian Vault Workflow (Second Brain)

Treat the `obsidian-vault/` directory as your external knowledge base and planning system. Use these guidelines to maintain alignment between code and documentation:

- **Read before writing**: Always use `Read()` to examine existing notes before creating or modifying them in the vault
- **Use structured folders**: Place files in the appropriate subfolders:
  - `00-Vision/` - Core project vision and principles
  - `01-Roadmap/` - Planning documents, timelines, and status tracking
  - `02-Features/` - Feature specifications and implementation details
  - `03-Technical/` - Technical architecture, decisions, and references
  - `04-Meetings/` - Meeting notes and transcripts
  - `05-Bugs-Issues/` - Bug tracking and issue management
  - `06-Research/` - Research notes and spikes
  - `07-Planning/` - Sprint planning, daily notes, and tactical planning
  - `08-Resources/` - Reference materials, templates, and indices
- **Leverage Obsidian linking**: Use `[[Note Title]]` format to create bidirectional connections between related concepts
- **Use templates effectively**: Read template files from each folder as starting points for new content
- **Maintain bidirectional links**: When implementing features, update both code and relevant Obsidian notes
- **Use daily notes for context**: Before coding sessions, read relevant roadmap and feature notes; after sessions, document what was accomplished
- **Link to code when appropriate**: In Obsidian notes, reference code files using relative paths like `src/components/SyncButton.tsx`
- **Keep implementation details in code/docs**: Use Obsidian for planning, rationale, and high-level design; keep detailed technical specs in the codebase or `docs/` folder
- **Use consistent naming**: Match feature names between Obsidian notes, code components, and documentation
- **Preserve atomicity**: Treat each Obsidian note as a single source of truth for its topic; avoid duplicating information across notes

## Documentation Practices

Follow these practices to ensure documentation captures the _why_ behind decisions and helps both humans and AI agents understand the project:

- **Document decisions, not just code**: Capture the context, constraints, and trade-offs that led to a decision. Code shows _what_ was built; documentation explains _why it was built this way_.
- **When to document significant decisions**:
  - Choosing a framework, library, or major dependency
  - Designing a data model or database schema
  - Selecting an authentication strategy
  - Deciding on an API architecture (REST vs. GraphQL vs. tRPC)
  - Choosing between build tools, hosting platforms, or infrastructure
  - Any decision that would be expensive to reverse
- **Where to document decisions**:
  - Technical architecture decisions: `03-Technical/` folder
  - Feature/product decisions: `01-Roadmap/` or `02-Features/` folders
  - Keep decision notes atomic and link to related concepts using `[[Note Title]]`
- **Commenting guidelines**:
  - Comment the _why_, not the _what_: Explain non-obvious intent, constraints, or trade-offs
  - Avoid commenting self-explanatory code
  - Remove commented-out code (use git history instead)
  - Address TODO comments promptly or convert to proper issues
- **API documentation**: Use inline TypeScript JSDoc for functions and interfaces that are part of public APIs
- **Changelog maintenance**: For significant user-facing changes, document in `activity-log.md` in `/docs` with what was changed and why

## Useful Entry Points

- `configs/sqlite.ts` — the SQLite handle + PRAGMAs.
- `database/migrations.ts` — schema migrations; `database/seed.ts` — developer reset/seeding (driven by `scripts/sample-mock-datas.ts`).
- `database/{products,credits,cash,sales,reports,financial,inventory,suppliers,stock-intelligence}.ts` — domain data access.
- `lib/money.ts` — money parsing/formatting.
- `lib/i18n.ts`, `lib/pdfGenerator.ts`, `lib/creditDetails.ts` — cross-cutting utilities.
- `hooks/index.ts` — re-exports for hooks; `stores/index.ts` — re-exports for Zustand stores.
- `app/(tabs)/dev/reset.tsx` — developer-only DB reset/seed screen.
- `obsidian-vault/05-Bugs-Issues/` — bug diagnoses (reproduction, root cause, fix, upstream links). Check here first when a known-crashy screen misbehaves.
