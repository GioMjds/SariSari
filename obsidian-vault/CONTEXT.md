---
title: SariSari AI Context (Always-Loaded)
description: Dense entry point for AI agents. Read this first, then Grep the relevant vault folder, then Read top 1-3 matching notes.
type: ai-context
status: active
last_updated: 2026-08-11
---

## Project

SariSari is an offline-first mobile assistant for Filipino sari-sari store owners. It tracks inventory, runs a POS, and maintains suki credit (utang) ledgers on-device. No backend.

Stack: Expo SDK 54 / React Native 0.81 / React 19, New Architecture (Fabric). Local SQLite via `expo-sqlite`. TanStack Query v5, Zustand v5, react-i18next, NativeWind v4.

## Principles (non-negotiable)

- Offline-first; local SQLite is the source of truth.
- Money is integer pesos in SQLite. All parse/format goes through `lib/money.ts` (`parsePesosInput`, `formatPesos`).
- Screens never call SQLite. All data access via hooks in `hooks/`.
- One SQLite handle, imported from `configs/sqlite.ts`. Enforced by `tests/sqlite/single-handle.test.ts`.
- Suki balance is computed live. FIFO allocations in `payment_allocations`. Reversible when payment is deleted.

## Conventions to respect

- Strict unidirectional flow: `app/` -> `hooks/` -> `database/` -> SQLite.
- `stores/` is transient UI state only. Never cache business data there.
- Multi-statement writes that touch the ledger use `db.withTransactionAsync`.
- TypeScript strict mode plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `useUnknownInCatchVariables`.
- i18n namespace `utang` for suki-related UI. See `lib/i18n.ts`.
- No emojis in code or comments. Markdown filenames kebab-case.

## Domain Routing

Map a question to a vault folder before Grepping. If a question spans multiple folders, Grep each in order.

| Question about...               | Look in...                 | Grep hint                      |
| ------------------------------- | -------------------------- | ------------------------------ |
| Architecture, stack, ADRs       | `03-Technical/`            | full-text on keyword           |
| Feature spec, rationale, scopes | `02-Features/<id>-name.md` | exact filename or feature name |
| Roadmap, status, milestones     | `01-Roadmap/`              | "roadmap" or "status"          |
| Bug, known crash, root cause    | `05-Bugs-Issues/`          | symptom or library name        |
| Vision, principles, values      | `00-Vision/`               | "principle" or "vision"        |
| Meeting context, decisions      | `04-Meetings/`             | date (YYYY-MM-DD) or topic     |
| Sprint planning, daily tasks    | `07-Planning/`             | topic name                     |
| Market research, competitors    | `06-Research/`             | topic name                     |
| Marketing, channels, captions   | `09-Marketing/`            | only when explicitly asked     |
| Templates, reference materials  | `08-Resources/`            | only when creating a note      |

## Token Discipline

- Read `CONTEXT.md` first (this file), then Grep, then Read top 1-3 hits only.
- Never Read whole folders. Never Read every match in a Grep result. Never recursively read the whole vault.
- Skip `09-Marketing/` for technical questions.
- Skip `08-Resources/` templates unless the task is to create a note.
- Skip `obsidian-vault/CLAUDE-CODE-INTEGRATION.md` mid-session. Its actionable content is summarized above.
- If a Grep returns more than 5 hits, narrow the pattern (add a 2nd keyword, restrict glob) before reading any file.
- Search first, retrieve second, reason third. Do NOT "read everything, then reason."

## Avoid Redundant Investigation

If the vault contains an explicit accepted decision (e.g., feature spec, ADR-style note, or `status: accepted` in frontmatter) for a question, do NOT re-evaluate the decision from first principles. Cite the decision and proceed. Only re-investigate if:

- the user explicitly asks to reconsider,
- the implementation has materially changed since the decision,
- new requirements conflict with it, or
- the decision is explicitly marked obsolete.

## If sources conflict

Surface it. Do not pick. Cite both. Ask if implementation matters.

- Two vault notes disagree: cite both verbatim, ask the user which is authoritative.
- Vault note contradicts code: code is the source of current behavior. Cite the vault note, flag the discrepancy, suggest the vault note may need updating.
- Stale vault note (`status: draft` in frontmatter, or `created:` older than 90 days): still cite, but flag the staleness.

## Token budget pressure

If context pressure mounts, the agent may drop already-cited vault notes from the response but must keep the lookup step. Do not skip the Grep. For the next question, restart from `CONTEXT.md` rather than relying on residual context. The routing table is the cheap, durable entry point.

## Non-project questions

If the question is unrelated to SariSari (e.g., "what is React Native?", "help me write a poem"), skip the vault entirely. No Grep, no citation, direct answer.

## Full etiquette

Vault write rules (folder placement, naming, link conventions, no `.obsidian/`, no credentials, no auto-push) live in `obsidian-vault/AGENTS.md`. Read that before writing to the vault.
