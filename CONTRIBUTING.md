# Contributing to SariSari

Thank you for your interest in contributing to **SariSari**! This guide outlines our project architecture, coding rules, development workflows, and guidelines to make contributing as smooth and consistent as possible.

SariSari is an offline-first mobile app built using Expo and React Native to assist Filipino sari-sari store owners in managing inventory, recording sales, and tracking suki loans (utang).

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Non-Negotiable Core Rules

All contributors must respect the following core invariants. Pull requests that violate these will be rejected:

1. **Hard Offline-First**: Inventory CRUD, sales recording, loan tracking, and reports must work completely with airplane mode on. No network calls in core flow.
2. **Money is Integer Pesos**: All monetary columns in SQLite and variables in JS/TS are stored as `INTEGER` representing centavo-equivalent values (e.g., `₱12.50` is stored as `1250`). Never use float variables for calculations. Use `parsePesosInput` and `formatPesos` from `@/lib/money`.
3. **Utang Invariant**: A customer's outstanding balance is dynamically computed as `SUM(amount) - SUM(amount_paid)` per customer (for active, unpaid transactions). Do not store a mutable, denormalized balance column on the customer table. Always wrap credit ledger updates inside `db.withTransactionAsync`.
4. **Single SQLite Connection**: SQLite locks at the file level. Never call `openDatabaseAsync` from screens or hooks. Use the shared database connection context.
5. **No Direct DB Calls from Screens**: Follow the layering rule:

   ```text
   Screen (app/) ──▶ Hook (hooks/) ──▶ Database Fns (database/) ──▶ SQLite
   ```

   All reads and mutations must route through TanStack Query hooks so that screens automatically stay reactive and invalidate query caches.

---

## Development Setup

### Prerequisites

- Node.js v20+
- pnpm (or npm/yarn if preferred, but we use lockfile-integrated pnpm packages)
- Android Studio (emulator) or Xcode (simulator) for running native SQLite tests

### Installation Steps

1. Clone the repository and navigate to the directory:

   ```bash
   git clone https://github.com/GioMjds/sarisari.git
   cd sarisari
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Prepare the native database driver:

   ```bash
   pnpm run postinstall
   ```

### Running Locally

- Start the Expo development server:

  ```bash
  pnpm start

  ```text
  - Press `i` to open in the iOS Simulator.
  - Press `a` to open in the Android Emulator.
  - Press `w` to open in the browser (web platform mode).

- Running native builds (necessary if modifying native SQLite wrappers or libraries):

  ```bash
  npx expo run:android
  npx expo run:ios
  ```

---

## Workflow & Guidelines

### Branch Naming Conventions

- **Features**: `feat/feature-name`
- **Bug Fixes**: `fix/bug-name`
- **Configuration / Chore**: `config/config-name` or `chore/chore-name`

### Coding Style & Linting

We enforce linting and formatting via ESLint. Run verification before committing:

```bash
pnpm lint
pnpm typecheck
```

### Writing Tests

We use Jest for unit tests and `better-sqlite3` to mock the `expo-sqlite` database driver.

- Database operations tests go to `tests/database/` (e.g., `cash.test.ts`).
- Run the test suite:

  ```bash
  pnpm test
  ```

---

## Pull Request Process

1. **Verify your changes**: Ensure your code passes all type checks, linters, and tests.
2. **Update the Changelog**: Document user-facing changes under the `Unreleased` or current version section in `CHANGELOG.md`.
3. **Commit clearly**: Write descriptive commit messages following the Conventional Commits specification (e.g., `feat: ...`, `fix: ...`).
4. **Submit PR**: Open a pull request against the `main` branch. Provide a detailed description of what your changes accomplish.
