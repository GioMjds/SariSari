# Getting Started with SariSari

Welcome to the SariSari project! This guide will help you set up your development environment and start contributing to the offline-first mobile assistant for Filipino sari-sari store owners.

## Project Overview

SariSari is an offline-first mobile application built with:

- **Expo SDK 54** / **React Native 0.81** / **React 19**
- **New Architecture (Fabric)** enabled
- **SQLite** (expo-sqlite) for local data persistence
- **TanStack Query v5** for server state management
- **Zustand v5** for client UI state
- **NativeWind v4** (Tailwind CSS) for styling
- **TypeScript** with strict mode

The app tracks inventory, runs a POS, and maintains suki credit (utang) ledgers — all on-device with no backend required.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** >= 20.x (LTS recommended)
- **npm** >= 10.x (comes with Node.js)
- **Git** for version control
- **Expo CLI** (installed via `npx expo` or globally `npm i -g expo-cli`)
- **iOS Simulator** (macOS only) or **Android Emulator** for device testing
- **Physical device** (iOS/Android) with Expo Go app for quick testing

### Recommended Tools

- **VS Code** with extensions:
  - Expo Tools
  - TypeScript Vue Plugin (Volar)
  - Tailwind CSS IntelliSense
  - Prettier - Code formatter
- **React Native Debugger** or **Flipper** for debugging

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd sarisari
npm install
```

The `postinstall` script automatically rebuilds `better-sqlite3` for the current platform.

### 2. Start the Development Server

```bash
npm start
```

This runs `expo start`. Press:

- `i` to open iOS Simulator
- `a` to open Android Emulator
- `w` to open in web browser
- Scan QR code with Expo Go on physical device

### 3. Run Platform-Specific Builds

```bash
# iOS (requires macOS + Xcode)
npm run:ios

# Android (requires Android Studio)
npm run:android

# Web
npm web
```

## Project Structure

```folder
sarisari/
├── app/                    # Expo Router screens (file-based routing)
│   ├── (tabs)/            # Main tab navigation
│   ├── (edit-forms)/      # Add/edit modal screens
│   ├── onboarding/        # First-time setup flow
│   ├── modal/             # Modal presentations
│   └── more/              # Additional screens
├── components/            # Reusable UI components
├── hooks/                 # Custom React hooks (data access layer)
├── database/              # SQLite data access functions
├── stores/                # Zustand stores (UI state only)
├── lib/                   # Utilities (money, i18n, pdf, etc.)
├── configs/               # Configuration (SQLite, etc.)
├── scripts/               # Build/maintenance scripts
├── tests/                 # Jest tests
├── obsidian-vault/        # Project knowledge base (this vault)
└── docs/                  # Implementation documentation
```

## Key Concepts

### Architecture Layers

Screens (`app/`) → Hooks (`hooks/`) → Database Functions (`database/`) → SQLite

**Hard Rules:**

- Screens NEVER call SQLite directly
- All data access goes through hooks
- Database files are pure async functions
- Zustand stores ONLY for transient UI state (modals, toasts)
- TanStack Query for all business data caching

### Financial Guardrails

- Money stored as **integer pesos** in SQLite (₱12.50 → `12.5`)
- All parsing/formatting through `lib/money.ts` (`parsePesosInput`, `formatPesos`)
- Multi-statement ledger writes use `db.withTransactionAsync`
- Suki balance computed live from transactions

### Routing

Expo Router v6 file-based routing with groups:

- `(tabs)/` — Main navigation (Home, Inventory, POS, Customers, Reports, Settings)
- `(edit-forms)/` — Form screens
- `onboarding/`, `modal/`, `more/`, `gastos-kaha/`, `inventory/`, `settings/`

## Development Workflow

### Common Commands

```bash
npm start              # Start Expo dev server
npm web                # Start web version
npm run:ios            # iOS dev client build
npm run:android        # Android dev client build
npm lint               # Run ESLint (expo-config)
npm typecheck          # TypeScript check (tsc --noEmit)
npm test               # Run Jest tests
npm verify             # typecheck + test (run before pushing)
npm doctor             # React Doctor diagnostics
npm start:onboarding   # Reset onboarding flow
```

### Running Single Tests

```bash
# By file
npm test -- tests/sqlite/single-handle.test.ts

# By pattern
npm test -- -t "pattern from describe/it"
```

### Database Reset (Development)

Visit `/dev/reset` in the app (developer-only screen) or run:

```bash
# This clears and reseeds the database
# Access via the app's dev screen or check app/(tabs)/dev/reset.tsx
```

## Code Conventions

- **TypeScript**: Strict mode + additional strict flags
- **Path alias**: `@/*` maps to repo root
- **Styling**: NativeWind v4 `className` with Tailwind config
- **Forms**: react-hook-form v7
- **i18n**: i18next + react-i18next (see `lib/i18n.ts`)
- **Prettier**: 2-space indent, single quotes, semicolons, trailing commas, 80-col

## Useful Entry Points

| File                       | Purpose                                             |
| -------------------------- | --------------------------------------------------- |
| `configs/sqlite.ts`        | SQLite handle + PRAGMAs (WAL, busy_timeout)         |
| `database/migrations.ts`   | Schema migrations                                   |
| `database/seed.ts`         | Developer reset/seeding                             |
| `database/*.{ts}`          | Domain data access (products, credits, sales, etc.) |
| `lib/money.ts`             | Money parsing/formatting                            |
| `hooks/index.ts`           | Hook re-exports                                     |
| `stores/index.ts`          | Zustand store re-exports                            |
| `app/(tabs)/dev/reset.tsx` | Dev DB reset screen                                 |

## Testing Notes

- Jest uses `better-sqlite3` to mock `expo-sqlite` (see `jest.setup.ts`)
- Test environment override to `jest-environment-node` exists — **do not remove**
- Tests live in `tests/` and `utils/__tests__/`

## Next Steps

1. **Explore the vault**: Read `obsidian-vault/00-Vision/project-vision.md` for the project vision
2. **Check the roadmap**: See `obsidian-vault/01-Roadmap/project-roadmap.md` for current priorities
3. **Review features**: Browse `obsidian-vault/02-Features/` for feature specifications
4. **Run the app**: Start with `npm start` and explore the tabs
5. **Read CLAUDE.md**: The project's AI agent instructions contain the same info as this guide

## Getting Help

- Check `docs/` folder for implementation guides
- Search the Obsidian vault with `Grep` for keywords
- Review recent commits: `git log --oneline -20`
- Ask questions in the project's communication channels
