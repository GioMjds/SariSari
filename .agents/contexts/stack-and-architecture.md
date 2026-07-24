# Stack & Architecture

## 1. Stack cheatsheet

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

---

## 2. Directory layout (what lives where)

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

---

## 3. The layering rule

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

---

## 4. Domain file pattern

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
