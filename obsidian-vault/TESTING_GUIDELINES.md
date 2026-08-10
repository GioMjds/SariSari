# Testing Guidelines

Comprehensive testing guidelines and standards for the SariSari mobile application.

## Overview

SariSari is an offline-first React Native / Expo app that manages core store operations (POS transactions, inventory management, and Suki credit ledgers). Because the app relies entirely on a local SQLite database with zero backend fallback, thorough automated testing is critical to prevent data corruption and financial inaccuracies.

## Test Commands

All test commands are executed from the project root using `npm`.

| Command | Purpose |
| :--- | :--- |
| `npm test` | Run the complete Jest unit and integration test suite |
| `npm verify` | Run full verification suite (`npm typecheck` + `npm test`) |
| `npm test -- tests/sqlite/single-handle.test.ts` | Run a specific test file |
| `npm test -- -t "pattern"` | Run tests matching a specific `describe` or `it` pattern |

## Test Environment Setup

### SQLite Mocking (`better-sqlite3`)

- Unit tests run under Node.js using `better-sqlite3` as an in-memory mock for `expo-sqlite`.
- Mock definitions are configured in `jest.setup.ts`.
- **Environment Override**: A top-level `jest-environment-node` override is configured in `package.json`. React Native 0.81 bundles a nested Jest 29.7.0 environment that crashes on `clearMocksOnScope`. **Do not remove or alter this override**.

### Single Handle Enforcement

SariSari enforces a strict single-database-handle pattern across the entire application:
- Database connection must be imported exclusively from `configs/sqlite.ts`.
- Calling `openDatabaseSync` or `openDatabaseAsync` anywhere else in the codebase is prohibited.
- This constraint is automatically validated by `tests/sqlite/single-handle.test.ts`.

## Financial Guardrails Testing Rules

Testing monetary logic requires strict adherence to SariSari financial guardrails:

### 1. Whole Pesos Integer Representation
- All monetary values are stored in SQLite as `INTEGER` representing whole pesos with up to two decimal places (e.g. `₱12.50` is stored as `12.5`, not `1250` and not floating point `12.500000001`).
- All tests touching monetary amounts must use `lib/money.ts` (`parsePesosInput`, `formatPesos`).
- Test inputs must verify that `parsePesosInput` rounds values to at most two decimal places to prevent floating-point drift over cumulative transactions.

### 2. Database Transaction Integrity
- Any function executing multi-statement ledger writes (e.g., recording a credit transaction and allocating a payment) must use `db.withTransactionAsync`.
- Tests must verify rollback behavior when an intermediate SQL statement fails, ensuring balances never desynchronize.

### 3. Live Suki Balance Computation
- Suki balances are calculated dynamically from transaction history (`SUM(amount) - SUM(amount_paid)` over unpaid credits).
- Payment allocations are processed FIFO in `payment_allocations`.
- Tests must verify:
  - FIFO allocation correctness when partial payments are made across multiple credits.
  - Reversibility: deleting a payment correctly restores the original outstanding credit balance.

## Testing Architecture by Layer

```text
Screen (app/) ──▶ Hook (hooks/) ──▶ DB Function (database/) ──▶ SQLite
```

### 1. Database Layer (`database/`)
- Unit test database functions independently using the `better-sqlite3` in-memory SQLite handle.
- Verify raw SQL queries, parameter binding, constraint enforcement, and snake_case row mapping to camelCase TypeScript interfaces.

### 2. Utility Layer (`lib/`)
- Unit test pure utility functions (`lib/money.ts`, `lib/creditDetails.ts`, `lib/pdfGenerator.ts`).
- Focus test cases on edge cases (e.g., zero amounts, negative inputs, invalid string formats, maximum peso bounds).

### 3. Hooks Layer (`hooks/`)
- Test TanStack Query wrapper hooks for proper query key invalidation on mutation success.
- Ensure UI components receive updated state following mutations without manual refresh signals.

## Test Writing Best Practices

1. **No Masking or Deleting Tests**: Never resolve test failures by commenting out assertions, skipping tests with `it.skip`, or returning dummy fallback data. Always diagnose and fix the root cause.
2. **Deterministic & Isolated**: Each test must run in isolation with clean state. Reset in-memory database schema and seed data before each test block.
3. **No Emojis in Test Descriptions**: Use plain ASCII text in `describe` and `it` block labels.
4. **Fast Execution**: Keep unit and database tests lightweight so `npm verify` executes within seconds.

## Related Notes

- [[DEVELOPMENT_SETUP]]
- [[COMMIT_MESSAGE_GUIDELINES]]
- [[GETTING_STARTED]]
