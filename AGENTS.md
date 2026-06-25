# AGENTS.md — SariSari

> Conventions for AI agents (Claude Code, Gemini CLI, and others) working on SariSari.
> This file is the source of truth; `CLAUDE.md` and `GEMINI.md` import it via `@AGENTS.md`.

## What SariSari is

An **offline-first** mobile app for Filipino sari-sari store owners.
Three core jobs, all working without internet:

1. **Inventory** — products, categories, stock levels
2. **Sales** — fast POS at the counter
3. **Utang** — customer (suki) loan tracking with per-customer running balance

UI is in English; Filipino domain terms (`utang`, `suki`, `tinda`) are used in code,
column names, and comments where they are the natural term.

## Stack cheatsheet

| Concern      | Choice                             | Notes                                          |
| ------------ | ---------------------------------- | ---------------------------------------------- |
| Framework    | Expo SDK 54                        | Managed workflow, EAS Build ready              |
| Runtime      | React Native 0.81, React 19        | New Architecture (Fabric)                      |
| Router       | expo-router 6 (file-based, `app/`) | Groups: `(tabs)`, `(edit-forms)`, `onboarding` |
| Local DB     | `expo-sqlite` 16                   | One connection, see db/ conventions            |
| Styling      | NativeWind v4 (`className`)        | Tailwind config in `tailwind.config.js`        |
| Server state | TanStack Query v5                  | All DB reads/mutations go through it           |
| Client state | Zustand 5 (`stores/`)              | UI state only — never business data            |
| Forms        | react-hook-form 7                  | Forms live under `app/(edit-forms)/`           |
| Animation    | Moti + Reanimated 4                | Use Moti unless gesture-driven                 |
| Test DB      | `better-sqlite3` (devDep)          | For Jest, mirrors `expo-sqlite` API            |

## Architecture & data flow

### Directory layout (what lives where)

```folder
app/                  Routes (expo-router). One folder per screen group.
  (tabs)/             Bottom-tab screens (inventory, sales, utang, reports)
  (edit-forms)/       Modal/form routes for create/edit
  onboarding/         First-run flow
components/           Cross-screen UI. If used by one screen only, keep it co-located.
db/                   SQLite access. One file per domain. Plain async fns, no classes.
hooks/                TanStack Query hooks. One file per domain, mirrors db/.
stores/               Zustand stores. UI state ONLY — never cached business data.
constants/            Enums, fixed lists, copy strings.
configs/              App config (theme, env wiring). Not for runtime toggles.
lib/                  Pure utilities (date, currency formatting, validators).
types/                Shared TypeScript types. Domain types live with their db/ file.
```

### The layering rule (read this before adding code)

```diagram
Screen (app/) ──reads──▶ Hook (hooks/) ──calls──▶ db fn (db/) ──uses──▶ SQLite
       │                       │                       │
       │                       │                       └─ returns plain typed rows
       │                       └─ wraps in useQuery / useMutation
       └─ renders <Component/> from components/, reads from stores/ for UI state
```

- A screen **never** calls `db/` directly. Always through a hook.
- A hook **never** holds business data in state outside the query cache.
- `db/` functions **never** import from `app/`, `components/`, `hooks/`, or `stores/`.
- `stores/` (Zustand) is for UI state: filters, modals open/closed, draft form values
  that need to survive navigation. **It is not a cache.**

### Domain file pattern

Each domain has the same shape — `products.ts`, `sales.ts`, `credits.ts`, `inventory.ts`,
`categories.ts`, `reports.ts`. New domain = create all three (`db/`, `hooks/`, `types/`).

`db/products.ts` exports pure async functions:

```ts
export async function listProducts(db: SQLiteDatabase): Promise<Product[]>;
export async function createProduct(
  db: SQLiteDatabase,
  input: NewProduct,
): Promise<Product>;
export async function updateProduct(
  db: SQLiteDatabase,
  id: string,
  patch: Partial<Product>,
): Promise<void>;
```

- First arg is the open `SQLiteDatabase` handle — injected by the hook, easy to mock.
- Inputs use a `New*` type for creates; updates accept `Partial<DomainType>`.
- Rows returned are typed; snake_case columns from SQL are mapped to camelCase fields here.

`hooks/useProducts.ts` wires TanStack Query:

```ts
export const productKeys = {
  all: ['products'] as const,
  list: () => [...productKeys.all, 'list'] as const,
};
export function useProducts() {
  return useQuery({
    queryKey: productKeys.list(),
    queryFn: () => listProducts(db),
  });
}
export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewProduct) => createProduct(db, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}
```

- Query keys live next to hooks; one `all` root + one factory per query.
- **Every mutation invalidates by the root** so list + detail views refresh together.

## Guardrails — the non-negotiables

### 1. Money is integer pesos. Always

- All monetary columns in SQLite: `INTEGER` (pesos). The user-facing value
  `₱12.50` is stored as `1250`.
- All money in app state and props: integer pesos. Never `number` with decimals for money.
- **Parse and format in one place.** Use `parsePesosInput` from `lib/money.ts`
  on user input (form fields) and `formatPesos` for display. **Do not call
  `parseFloat` on a money field** — it accepts `"12.5e1"`, `"1,234.56"` (with
  the comma treated as junk in some locales), and similar. The single-source
  parser exists; use it.
- **Why:** `0.1 + 0.2 !== 0.3`. Floating-point money loses pennies over thousands of
  sales and silently corrupts utang balances. This is a financial app — be paranoid.
- **Failure mode this prevents:** drift in a suki's running balance after a year of
  transactions, and reports that don't sum because of accumulated float error.

### 2. Hard offline-first. Zero network calls in core flows

- Inventory CRUD, sales recording, utang tracking, reports — **all must work with airplane mode on.**
- No `fetch()` to a server in core flows. No auth gating on network. No "loading…" spinners
  that wait for a remote response.
- If a feature genuinely needs the network, it lives behind a clearly named
  `onlineOnly/` subfolder and is documented as such.

### 3. Utang invariant: a customer's balance is the sum of their entries

- A suki's outstanding balance is **computed** from their credit and payment
  transactions (`SUM(amount) - SUM(amount_paid)` per customer, restricted to
  transactions that are not yet `paid` in full). There is no denormalized
  `balance` column on `customers` to keep in sync — the value is always live
  by construction.
- Every multi-statement write that touches the ledger **must** be wrapped in
  `db.withTransactionAsync` so a partial write can never leave a balance
  out of sync. The audit-safety work in `database/credits.ts` and
  `database/sales.ts` enforces this for `insertPayment`, `deletePayment`,
  `insertSale`, and `deleteSale`.
- Payments are allocated FIFO against the oldest unpaid credit for that
  suki; the allocation is recorded in `payment_allocations` so it can be
  reversed when the payment is deleted.
- **Why:** sari-sari store owners check customer balances at the counter between sales.
  A balance that's off by ₱5 destroys trust in the app permanently.

### 4. One SQLite connection. Shared everywhere

- `expo-sqlite` opens **one** database per app run. Pass that handle through.
- Never call `openDatabaseAsync` from a screen, a hook, or a `db/` file directly.
- Tests use `better-sqlite3` with the same SQL — `db/` functions should be written so
  this swap is trivial.
- **Why:** SQLite locks at the file level. Multiple connections from the same app
  cause `SQLITE_BUSY` on Android, especially during busy sales hours.

### 5. expo-router conventions, not React Navigation imports

- All navigation happens via `<Link href="...">` or the `useRouter()` hook from
  `expo-router`. Never `import { useNavigation } from '@react-navigation/native'`
  in a screen.
- Route groups are folders wrapped in parens (`(tabs)`, `(edit-forms)`) — they do not
  appear in the URL but affect layout.
- Type-safe routes: rely on the generated `SariSari` global from `expo-router` types.

### 6. Don't bypass the query layer for "just one quick read."

- The temptation: import `listProducts` directly into a screen for an "obvious" read.
- The cost: that screen misses invalidations, gets out of sync after a write, and
  becomes untestable. Every read goes through a hook, every time, including in
  onboarding and forms.

## Playbook: adding a new domain (worked example)

Scenario: you've been asked to add a **`suppliers`** feature — track who you buy
stock from. Walk through this, don't skip steps.

### Step 1 — types first

Create `types/suppliers.ts`:

```ts
export type Supplier = {
  id: string;
  name: string;
  contact: string | null;
  notes: string | null;
  createdAt: number;
};
export type NewSupplier = Omit<Supplier, 'id' | 'createdAt'>;
```

- `id` is generated by the DB layer; the type reflects that.
- `createdAt` is a unix epoch in ms; SQLite stores as `INTEGER`.

### Step 2 — the SQL lives in `db/suppliers.ts` with a migration

```ts
export async function ensureSuppliersTable(db: SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact TEXT,
      notes TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
  `);
}
```

- Each domain owns its own table. Migrations run on app start (call all `ensure*Table`
  functions from your existing init path).
- Add the call to your migrations runner — don't leave it orphaned.

### Step 3 — the query/mutation functions

```ts
export async function listSuppliers(db: SQLiteDatabase): Promise<Supplier[]> {
  const rows = await db.getAllAsync<SupplierRow>(
    'SELECT * FROM suppliers ORDER BY name',
  );
  return rows.map(rowToSupplier);
}

export async function createSupplier(
  db: SQLiteDatabase,
  input: NewSupplier,
): Promise<Supplier> {
  const id = crypto.randomUUID();
  await db.runAsync(
    'INSERT INTO suppliers (id, name, contact, notes, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, input.name, input.contact, input.notes, Date.now()],
  );
  return { id, createdAt: Date.now(), ...input };
}
```

- `SupplierRow` is the snake_case SQL shape; `rowToSupplier` maps to camelCase.
  Keep this mapping here, not in the hook.

### Step 4 — the hooks

```ts
// hooks/useSuppliers.tsx
export const supplierKeys = {
  all: ['suppliers'] as const,
  list: () => [...supplierKeys.all, 'list'] as const,
};
export function useSuppliers() {
  return useQuery({
    queryKey: supplierKeys.list(),
    queryFn: () => listSuppliers(db),
  });
}
export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewSupplier) => createSupplier(db, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: supplierKeys.all }),
  });
}
```

### Step 5 — the screen

- Route: `app/(tabs)/suppliers.tsx` for the list, `app/(edit-forms)/supplier.tsx`
  for create/edit.
- List screen: `useSuppliers()` + a FlatList + a FAB that routes to the edit form.
- Edit form: `useCreateSupplier()` / `useUpdateSupplier()` with react-hook-form.
- Currency rule, offline rule, layering rule all apply.

### Step 6 — verify

- `npx expo start` and exercise the flow on the simulator.
- `pnpm test` for any new tests.
- Confirm the screen works with airplane mode on (offline rule).

## Daily-driver cheatsheet

### Commands

- `npx expo start` — dev server (then `i` for iOS, `a` for Android, `w` for web)
- `npx expo run:ios` / `run:android` — native builds (needed for `expo-sqlite` and
  other modules that don't run in Expo Go)
- `npx expo lint` — ESLint
- `pnpm test` — Jest (uses `better-sqlite3` for DB tests)
- `eas build --platform android` — production build

### File-naming conventions

- React components: `PascalCase.tsx`
- Hooks: `useCamelCase.tsx` (`.tsx` because they often return JSX or use context)
- Domain files in `db/`, `hooks/`, `types/`: `camelCase.ts` matching the domain name
- Routes: `kebab-case.tsx` (expo-router maps URL segments to file names)
- Constants: `SCREAMING_SNAKE_CASE` inside `constants/`

### When you're stuck

- "Where does this code go?" → see the **layering rule** above.
- "Should this be a store or a query?" → UI state → `stores/`. Business data → `hooks/`.
- "Is this safe to call offline?" → if it's not in `onlineOnly/`, yes — and it must be.
- "How do I add a new screen?" → see the **playbook** above.

## One last rule

When in doubt: **the smallest change that keeps the offline-first, integer-pesos,
layered architecture intact.** Don't add abstractions, don't add state, don't add
network. Solve the user's actual problem with the least surface area.
