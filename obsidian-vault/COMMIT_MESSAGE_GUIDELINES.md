# Commit Message Guidelines

Guidelines and standards for writing git commit messages in the SariSari repository.

## Overview

SariSari follows structured, concise commit message conventions. Clear commit history helps both human contributors and AI agents understand the evolution of the codebase, track bug fixes, and maintain quality assurance.

## Core Rules

1. **No Emojis or Special Characters**: Keep commit messages clean, professional, and ASCII-only. Do not use emoji prefixes (e.g. no `:sparkles:`, no `:bug:`).
2. **Imperative Mood**: Use present tense imperative verbs in the subject line (e.g. `add feature`, `fix balance calculation`, `refactor query hook`). Avoid past tense (`added`, `fixed`) or present participle (`adding`, `fixing`).
3. **Atomic Commits**: Each commit should represent one logical unit of change. Avoid combining unrelated bug fixes, feature work, and refactoring into a single commit.
4. **Subject Line Length**: Limit the title/subject line to 72 characters or fewer.
5. **No Auto-Commits**: Never commit activity logs, draft artifacts, or agent state automatically. Always review diffs before committing.

## Commit Message Format

```text
<type>(<scope>): <short summary in imperative mood>

[optional body explaining the motivation and context behind the change]

[optional footer referencing issues or pull requests]
```

### Allowed Types

| Type | Purpose | Example |
| :--- | :--- | :--- |
| `feat` | New feature or user-facing functionality | `feat(suki): add FIFO credit payment allocation` |
| `fix` | Bug fix for user-facing or internal issue | `fix(money): round peso input to 2 decimal places` |
| `refactor` | Code change that neither fixes a bug nor adds a feature | `refactor(db): use withTransactionAsync for suki updates` |
| `test` | Adding or updating tests | `test(sqlite): enforce single handle database pattern` |
| `docs` | Documentation changes only | `docs(vault): update commit message and testing notes` |
| `perf` | Code changes that improve performance | `perf(pos): optimize query cache invalidation for catalog` |
| `chore` | Build process, tooling, or dependency updates | `chore(deps): update expo sdk to version 54` |
| `ci` | CI pipeline setup or configuration changes | `ci: add verify command to pre-push hook` |

### Common Scopes

- `pos` — Point-of-sale, cart, transaction processing
- `inventory` — Product catalog, stock tracking, reorder alerts
- `suki` — Suki customer credit, utang ledgers, payment allocations
- `db` — SQLite queries, schema migrations, seed scripts
- `financial` — Peso parsing, money calculations, cash control (gastos-kaha)
- `hooks` — TanStack Query hooks, custom React hooks
- `ui` — Components, layout, NativeWind styling, navigation
- `i18n` — Tagalog/English translation updates

## Examples

### Feature Commit

```text
feat(suki): implement FIFO payment allocation for credit ledger

Automatically apply suki credit payments to the oldest outstanding credit 
records first. Ensures payment allocations remain reversible if a payment 
is deleted.
```

### Bug Fix Commit

```text
fix(financial): round pesos input via parsePesosInput

Ensure all monetary inputs conform to the two-decimal whole-peso integer invariant 
in SQLite. Prevents floating-point drift on repeated sales calculations.
```

### Refactoring Commit

```text
refactor(db): wrap ledger mutation functions in db.withTransactionAsync

Enforce atomic database transactions across credit additions and payment log entries, 
preventing partial ledger sync states on app crash or error.
```

## Pre-Commit Checklist

Before staging and committing changes, always execute:

```bash
npm verify
```

This runs both `npm typecheck` (`tsc --noEmit`) and `npm test` (`jest`). Ensure:
- Clean TypeScript compilation with zero errors.
- All Jest unit and database tests pass.
- No personal credentials, keys, or temporary debug logs are included in the diff.
- For major architectural or feature updates, document the rationale in `docs/activity-log.md`.

## Related Notes

- [[DEVELOPMENT_SETUP]]
- [[TESTING_GUIDELINES]]
- [[GETTING_STARTED]]
