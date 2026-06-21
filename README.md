# SariSari 🏪

> **SariSari** is an offline-first mobile assistant and management application designed specifically for Filipino sari-sari store owners. Built on the core principle of offline reliability, it empowers store owners to seamlessly track inventory, execute sales (POS), and maintain customer credit (_utang_) records without requiring internet connectivity.

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

- **⚡ Fast Point of Sale (POS)**: Quick counter sales registering cash or credit (_utang_) transactions. Updates inventory automatically and logs movement records in real time.
- **📦 Inventory & Category Tracker**: Complete catalog of products, categories, stock counts, selling prices, and purchase costs (calculating margin/markup). Supports low-stock thresholds and alerts.
- **📓 Suki Credit Ledger (Utang)**: Customer registry tracking outstanding suki loans. Features automatic credit allocation using FIFO (First-in, First-out) matching for payments, custom credit limits, overdue tracking, and automated risk/payer profiles.
- **📊 Business Analytics & Reports**: Dashboard view tracking daily revenue, profitability, inventory valuation, cash vs. credit breakdowns, fast/slow-moving goods, credit aging buckets, and actionable store tips.
- **✈️ Hard Offline-First Resilience**: Zero server or API connection requirements. Fully local data storage, ensuring 100% operation even in airplane mode.

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

1. **Money is Stored in Integer Centavos**: To prevent floating-point decimal drift, all cash values are stored as integers in centavos (e.g., `₱12.50` is stored in SQLite as `1250`). Conversion to pesos is processed solely at the UI edge using the `formatCurrency` utility.
2. **Hard Offline-First Design**: Zero dependency on external APIs or network calls. All core functions operate smoothly with airplane mode turned on.
3. **Transactional Credit Integrity**: A suki's outstanding balance is a denormalized cache field. It is updated inside the exact same SQL transaction that writes a transaction or payment to the ledger, guaranteeing the running balance matches individual logs.
4. **Single SQLite Handle**: The application opens a single SQLite database handle via `openDatabaseSync` to prevent file-level lock contention and `SQLITE_BUSY` errors on Android devices.

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
npm install
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
npm test
```

_Note: Jest utilizes `better-sqlite3` internally to mock database instances and run schema/migration tests locally._

### Resetting & Seeding the Database

The app contains a developer-only reset screen located at `app/(tabs)/dev/reset.tsx`. This interface allows you to clear the database and seed it with a rich default dataset of products, transactions, suki records, and payments:

- The mock data structures are located at `scripts/sample-mock-datas.ts`.
- The database cleaning and seeding operations are handled by `db/seed.ts`.
