# SariSari 🏪

> **SariSari** is an offline-first mobile assistant and management application designed specifically for Filipino sari-sari store owners. It helps store owners track inventory, execute sales (POS), and maintain customer credit (_utang_) records without requiring internet connectivity.

---

## 📋 Table of Contents

1. [Core Features](#-core-features)
2. [Meet Sari](#-meet-sari)
3. [Stack Cheatsheet](#-stack-cheatsheet)
4. [Architecture & Data Flow](#-architecture--data-flow)
5. [Local Database & Financial Guardrails](#-local-database--financial-guardrails)
6. [Directory Structure](#-directory-structure)
7. [Developer Setup](#%EF%B8%8F-developer-setup)
8. [Testing & Seed Data](#-testing--seed-data)

---

## ✨ Core Features

- **⚡ Fast Point of Sale (POS)**: Quick counter sales registering cash or credit (_utang_) transactions. Supports instant barcode scanning to automatically look up products offline and add them to the sale. Updates inventory automatically and logs movement records in real time.
- **📦 Inventory & Category Tracker**: Complete catalog of products, categories, stock counts, selling prices, and purchase costs (calculating margin/markup). Supports low-stock thresholds and alerts. Features an **offline-first product catalog** pre-loaded with over 150 common Philippine store items (Milo, Lucky Me, Coca-Cola) for instant setup, with auto-learning of custom barcodes. **Multi-tier pricing** is built in: items can be sold by piece (_tingi_) or by wholesale pack (_pakyaw_) with automatic unit conversion, dual barcode collision checks, and per-tier profit snapshots.
- **🤝 Supplier Directory**: Track who you buy stock from, attach suppliers to products, and surface purchase-cost history inside the product details screen.
- **📓 Suki Credit Ledger (Utang)**: Customer registry tracking outstanding suki loans. **Built today:** FIFO allocation of payments against the oldest unpaid credit per suki, with reversible payment deletions; per-suki credit limits; overdue tracking. **Planned:** automated risk/payer profiles and credit-limit enforcement at sale time.
- **📊 Business Analytics & Reports**: Dashboard view tracking daily revenue, profitability, inventory valuation, cash vs. credit breakdowns, fast/slow-moving goods, credit aging buckets, and actionable store tips.
- **✈️ Offline-First by Default**: Inventory CRUD, sales recording, utang tracking, and reports all work end-to-end with airplane mode on. There is no automatic backup yet — keep your device backed up to the cloud through your phone's normal channels.

---

## 🌟 Meet Sari

**Sari** is the interactive assistant and mascot of the application. She is an anthropomorphic interpretation of a traditional Filipino **garapon** (the iconic glass jar found on sari-sari store counters containing candies and snacks).

Sari acts as a contextual system and UI indicator, dynamically updating her state based on store status and workflows:

- **Default / Welcoming State**: Clear, empty glass body representing readiness, wearing a Terracotta Orange lid, waving with a gentle smile.
- **Inventory Management**: Wearing tiny glasses and holding a clipboard, body filled with neatly stacked colorful inventory blocks.
- **Low Stock Alert**: Concerned look with eyebrows tilted, standing next to an empty crate, displaying a red warning symbol.
- **POS / Sales Action**: Ecstatic, jumping pose, holding a large golden coin, body filled with coin elements.
- **Utang / Ledger View**: Calm posture, holding a traditional paper ledger, showing a balance chart.
- **Balance Cleared / Success**: Celebratory pose with raised arms, body glowing with green light.
- **Offline / Database Confident**: Sitting comfortably, hugging a secure silver database disk with a bright green success checkmark.

---

## 🛠️ Stack Cheatsheet

| Layer / Concern    | Choice                      | Notes                                                                      |
| ------------------ | --------------------------- | -------------------------------------------------------------------------- |
| **Framework**      | Expo SDK 54                 | Managed workflow, configuration via `app.json`                             |
| **Runtime**        | React Native 0.81, React 19 | Leveraging React 19 features under New Architecture (Fabric)               |
| **Router**         | `expo-router` v6            | File-based navigation using groups: `(tabs)`, `(edit-forms)`, `onboarding` |
| **Local Database** | `expo-sqlite` v16           | Single connection instance wrapper, SQLite database engine                 |
| **Styling**        | NativeWind v4               | Tailwind CSS configuration adapted for React Native styling (`className`)  |
| **Server State**   | TanStack Query v5           | All SQLite reads, writes, and cache invalidation mutations                 |
| **Client State**   | Zustand v5                  | Ephemeral UI-only states (e.g. search filters, open modals, toasts)        |
| **Forms**          | `react-hook-form` v7        | Interactive input validations and states                                   |
| **Animations**     | Moti + Reanimated 4         | Smooth micro-interactions and gestures                                     |
| **Testing DB**     | `better-sqlite3`            | Used in local Jest configurations to mock sqlite APIs                      |
| **Web Companion**  | Vite + React 19 + Tailwind 4 | Marketing/landing site in `web/` (shadcn/ui, motion, radix-ui)            |

---

## 🔄 Architecture & Data Flow

The application enforces a strict, unidirectional layered structure:

```diagram
Screen (app/) ──reads/writes──▶ Hook (hooks/) ──calls──▶ DB Fn (db/) ──uses──▶ SQLite
       │                            │                       │
       │                            │                       └─ returns plain typed rows
       │                            └─ wraps in useQuery/useMutation
       └─ renders components/, reads from stores/ for UI state
```

### Layering Rules

1. **Screens (`app/`)** never perform direct SQLite calls. All data retrieval and write operations go through TanStack Query hooks.
2. **Hooks (`hooks/`)** manage query caching, query keys, and invalidation rules. On successful mutations, they invalidate target keys to refresh list and detail views.
3. **Database Layer (`db/`)** houses pure async operations executing raw SQL. It maps snake_case SQL columns to camelCase TypeScript structures.
4. **Client State (`stores/`)** uses Zustand to manage transient interface elements (like showing/hiding modals or toast messages). **It is never used to cache business data.**

---

## 🛡️ Local Database & Financial Guardrails

To ensure financial accuracy and protect data integrity on-device:

1. **Money is Stored in Integer pesos**: All monetary columns are SQLite `INTEGER`. The user-facing value `₱12.50` is stored as `1250`. Parsing on form input and formatting on display both go through `lib/money.ts` (`parsePesosInput`, `formatPesos`); no other code path should parse or format money. This prevents floating-point drift over thousands of sales.
2. **Offline-First Design**: No `fetch()`, no auth gating on network, no remote-loading spinners. Every core flow works with airplane mode on. If a feature ever genuinely needs the network, it lives behind a clearly named `onlineOnly/` folder and is documented as such.
3. **Transactional Ledger Integrity**: A suki's outstanding balance is computed live from their transactions (`SUM(amount) - SUM(amount_paid)` per customer, restricted to unpaid credits). Every multi-statement write that touches the ledger is wrapped in `db.withTransactionAsync` so a partial failure can never leave a balance out of sync. Payment allocations are recorded FIFO in `payment_allocations` and are reversible when the payment is deleted.
4. **Single SQLite Handle**: The app opens one SQLite database handle (in `configs/sqlite.ts`) and passes it through every layer. Multiple connections from the same app cause `SQLITE_BUSY` on Android, especially during busy sales hours, so this is enforced by `tests/sqlite/single-handle.test.ts`.

---

## 📂 Directory Structure

```folder
app/                  # App screens and routing routes (expo-router)
  (tabs)/             # Tab layout (Inventory, Sales/POS, Credits, Reports)
  (edit-forms)/       # Add/Edit forms (e.g., add product, add credit, payments)
  onboarding/         # First-run user flow (store initialization)
components/           # Reusable UI component blocks
  elements/           # Core styled wrappers (e.g., StyledText)
  ui/                 # Modals, Dialogs, Toasts, MoneyText, ReceiptHero
db/                   # Raw SQL execution, tables definition, and schema migrations
hooks/                # React custom hooks wrapping DB queries in TanStack Query
configs/              # App config instances (sqlite.ts)
constants/            # Constant lists, dropdown options, and stock thresholds
lib/                  # Local storage and state persist routines
scripts/              # Seed mock datasets
stores/               # Zustand UI stores (modals, dialog, toasts)
types/                # Global and domain-specific typescript declarations
utils/                # Date/Time formatting and mathematical utilities
```

---

## ⚡ Developer Setup

### Prerequisites

- Node.js (LTS version)
- Android Studio / Emulator or Xcode / iOS Simulator

### 1. Installation

Navigate into the project directory and install dependencies:

```bash
pnpm install
```

### 2. Run the App

Start the Expo development server:

```bash
npx expo start
```

_Press `i` to launch in the iOS Simulator, `a` to launch in the Android Emulator, or `w` to run on the Web._

Since the project uses `expo-sqlite` and other native bindings, running in standard Expo Go may not support all features. Run a local build to generate the development client:

```bash
# For iOS
npx expo run:ios

# For Android
npx expo run:android
```

### 3. Linting

Validate the codebase rules:

```bash
npx expo lint
```

---

## 🧪 Testing & Seed Data

### Run Tests

Execute the Jest test runner:

```bash
pnpm test
```

_Note: Jest utilizes `better-sqlite3` internally to mock database instances and run schema/migration tests locally._

### Resetting & Seeding the Database

The app contains a developer-only reset screen located at `app/(tabs)/dev/reset.tsx`. This interface allows you to clear the database and seed it with a rich default dataset of products, transactions, suki records, and payments:

- The mock data structures are located at `scripts/sample-mock-datas.ts`.
- The database cleaning and seeding operations are handled by `db/seed.ts`.
