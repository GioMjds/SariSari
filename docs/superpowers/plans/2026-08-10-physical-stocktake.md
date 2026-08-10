# Physical Stocktake Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide a guided category-by-category physical stocktake flow for Filipino sari-sari store owners to count shelf stock, record reason-coded variances with integer-peso money impacts, freeze sessions, and soft-block conflicting manual stock writes.

**Architecture:** Database-first offline SQLite implementation using single handle `db` (`configs/sqlite.ts`), TanStack Query v5 hooks (`hooks/useStocktake.ts`), modular UI components (`components/inventory/stocktake/*`), file-based tab routing (`app/(tabs)/inventory/stocktake.tsx`), and soft-block guard hooks (`useStocktakeGuard`) applied to manual adjustment surfaces.

**Tech Stack:** Expo SDK 54, React Native 0.81, React 19, SQLite (via `expo-sqlite` / `better-sqlite3`), TanStack Query v5, NativeWind v4, i18next.

## Global Constraints

- **Money is integer pesos in SQLite:** All monetary amounts (`cost_price_at_count`, `total_variance_pesos`) are whole pesos up to two decimal places (e.g. 12.5 = ₱12.50). Parsing and formatting MUST use `lib/money.ts`.
- **Transactions for multi-statement writes:** All multi-row updates (starting session, committing variance, abandoning) MUST use `db.withTransactionAsync`.
- **Single SQLite handle:** All DB functions import `db` from `@/configs/sqlite`.
- **Strict Layering:** `app/` screens NEVER call SQLite directly. All data access goes through hooks in `hooks/`.
- **No placeholders:** All task steps contain full, production-ready code.

---

### Task 1: Database Migration v15, Reason Enum, Types, and DB Layer

**Files:**

- Create: `configs/stocktakeReasons.ts`
- Create: `types/stocktake.types.ts`
- Modify: `database/migrations.ts:507-511`
- Create: `database/stocktake.ts`
- Modify: `database/index.ts`
- Create: `tests/database/stocktake.test.ts`

**Interfaces:**

- Consumes: `db` from `@/configs/sqlite`, `Product` from `@/types/products.types`
- Produces: `initStocktakeTables`, `startSession`, `getActiveSession`, `getSessionById`, `listRecentSessions`, `upsertCount`, `listCounts`, `commitSession`, `abandonSession`, `STOCKTAKE_REASONS`, `StocktakeReason`, `StocktakeSession`, `StocktakeCount`

- [ ] **Step 1: Create `configs/stocktakeReasons.ts`**

Create `configs/stocktakeReasons.ts`:

```ts
export const STOCKTAKE_REASONS = [
  'shrinkage',
  'spoilage',
  'miscount',
  'freebie_to_neighbor',
  'customer_return',
  'unexplained',
] as const;

export type StocktakeReason = (typeof STOCKTAKE_REASONS)[number];
```

- [ ] **Step 2: Create `types/stocktake.types.ts`**

Create `types/stocktake.types.ts`:

```ts
import { StocktakeReason } from '@/configs/stocktakeReasons';

export type StocktakeStatus = 'in_progress' | 'completed' | 'abandoned';

export interface StocktakeSession {
  id: string;
  startedAt: string;
  endedAt: string | null;
  status: StocktakeStatus;
  note: string | null;
  totalProductsCounted: number;
  totalVariancePesos: number;
  createdAt: number;
  updatedAt: number;
}

export interface StocktakeCount {
  id: string;
  sessionId: string;
  productId: number;
  expectedQty: number;
  countedQty: number;
  costPriceAtCount: number | null;
  reasonCode: StocktakeReason | null;
  note: string | null;
  committedAt: string | null;
}

export interface UpsertCountInput {
  sessionId: string;
  productId: number;
  expectedQty: number;
  countedQty: number;
}

export type CommitReasonPerLine = Record<
  number,
  { reasonCode: StocktakeReason; note?: string }
>;
```

- [ ] **Step 3: Modify `database/migrations.ts` to add version 15 migration**

Update `database/migrations.ts` to append version 15 migration block before closing brace:

```ts
if (currentVersion < 15) {
  console.log(
    'Running migration to version 15 (Physical Stocktake Sessions & Counts)...',
  );
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS stocktake_sessions (
          id TEXT PRIMARY KEY,
          started_at TEXT NOT NULL,
          ended_at TEXT,
          status TEXT NOT NULL CHECK(status IN ('in_progress', 'completed', 'abandoned')),
          note TEXT,
          total_products_counted INTEGER NOT NULL DEFAULT 0,
          total_variance_pesos INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `);

    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS stocktake_counts (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL REFERENCES stocktake_sessions(id) ON DELETE CASCADE,
          product_id INTEGER NOT NULL REFERENCES products(id),
          expected_qty INTEGER NOT NULL,
          counted_qty INTEGER NOT NULL,
          cost_price_at_count INTEGER,
          reason_code TEXT,
          note TEXT,
          committed_at TEXT,
          UNIQUE(session_id, product_id)
        );
      `);

    await db.execAsync(
      'CREATE INDEX IF NOT EXISTS idx_stocktake_counts_session ON stocktake_counts(session_id);',
    );
    await db.execAsync(
      'CREATE INDEX IF NOT EXISTS idx_stocktake_counts_committed ON stocktake_counts(committed_at);',
    );

    await db.execAsync('PRAGMA user_version = 15;');
  });
  console.log('Database migrated to version 15.');
}
```

- [ ] **Step 4: Create `database/stocktake.ts`**

Create `database/stocktake.ts`:

```ts
import { db } from '../configs/sqlite';
import * as Crypto from 'expo-crypto';
import type {
  StocktakeSession,
  StocktakeCount,
  UpsertCountInput,
  CommitReasonPerLine,
} from '@/types/stocktake.types';

interface RawSessionRow {
  id: string;
  started_at: string;
  ended_at: string | null;
  status: 'in_progress' | 'completed' | 'abandoned';
  note: string | null;
  total_products_counted: number;
  total_variance_pesos: number;
  created_at: number;
  updated_at: number;
}

interface RawCountRow {
  id: string;
  session_id: string;
  product_id: number;
  expected_qty: number;
  counted_qty: number;
  cost_price_at_count: number | null;
  reason_code: string | null;
  note: string | null;
  committed_at: string | null;
}

function mapSessionRow(row: RawSessionRow): StocktakeSession {
  return {
    id: row.id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    status: row.status,
    note: row.note,
    totalProductsCounted: row.total_products_counted,
    totalVariancePesos: row.total_variance_pesos,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCountRow(row: RawCountRow): StocktakeCount {
  return {
    id: row.id,
    sessionId: row.session_id,
    productId: row.product_id,
    expectedQty: row.expected_qty,
    countedQty: row.counted_qty,
    costPriceAtCount: row.cost_price_at_count,
    reasonCode: row.reason_code as StocktakeCount['reasonCode'],
    note: row.note,
    committedAt: row.committed_at,
  };
}

export async function startSession(note?: string): Promise<string> {
  const sessionId = Crypto.randomUUID();
  const nowIso = new Date().toISOString();
  const nowMs = Date.now();

  await db.withTransactionAsync(async () => {
    // 1. Insert session
    await db.runAsync(
      `INSERT INTO stocktake_sessions (
        id, started_at, status, note, total_products_counted, total_variance_pesos, created_at, updated_at
      ) VALUES (?, ?, 'in_progress', ?, 0, 0, ?, ?)`,
      [sessionId, nowIso, note ?? null, nowMs, nowMs],
    );

    // 2. Read products with quantity > 0 to pre-populate counts baseline
    const products = await db.getAllAsync<{ id: number; quantity: number }>(
      'SELECT id, quantity FROM products WHERE quantity > 0',
    );

    for (const p of products) {
      const countId = Crypto.randomUUID();
      await db.runAsync(
        `INSERT INTO stocktake_counts (
          id, session_id, product_id, expected_qty, counted_qty
        ) VALUES (?, ?, ?, ?, ?)`,
        [countId, sessionId, p.id, p.quantity, 0],
      );
    }
  });

  return sessionId;
}

export async function getActiveSession(): Promise<StocktakeSession | null> {
  const row = await db.getFirstAsync<RawSessionRow>(
    `SELECT * FROM stocktake_sessions WHERE status = 'in_progress' ORDER BY created_at DESC LIMIT 1`,
  );
  return row ? mapSessionRow(row) : null;
}

export async function getSessionById(
  id: string,
): Promise<StocktakeSession | null> {
  const row = await db.getFirstAsync<RawSessionRow>(
    `SELECT * FROM stocktake_sessions WHERE id = ?`,
    [id],
  );
  return row ? mapSessionRow(row) : null;
}

export async function listRecentSessions(
  limit = 20,
): Promise<StocktakeSession[]> {
  const rows = await db.getAllAsync<RawSessionRow>(
    `SELECT * FROM stocktake_sessions ORDER BY created_at DESC LIMIT ?`,
    [limit],
  );
  return rows.map(mapSessionRow);
}

export async function upsertCount({
  sessionId,
  productId,
  expectedQty,
  countedQty,
}: UpsertCountInput): Promise<void> {
  const existing = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM stocktake_counts WHERE session_id = ? AND product_id = ?`,
    [sessionId, productId],
  );

  if (existing) {
    await db.runAsync(
      `UPDATE stocktake_counts SET counted_qty = ? WHERE id = ?`,
      [countedQty, existing.id],
    );
  } else {
    const id = Crypto.randomUUID();
    await db.runAsync(
      `INSERT INTO stocktake_counts (
        id, session_id, product_id, expected_qty, counted_qty
      ) VALUES (?, ?, ?, ?, ?)`,
      [id, sessionId, productId, expectedQty, countedQty],
    );
  }
}

export async function listCounts(sessionId: string): Promise<StocktakeCount[]> {
  const rows = await db.getAllAsync<RawCountRow>(
    `SELECT * FROM stocktake_counts WHERE session_id = ? ORDER BY id ASC`,
    [sessionId],
  );
  return rows.map(mapCountRow);
}

export async function commitSession(
  sessionId: string,
  reasonPerLine: CommitReasonPerLine,
): Promise<void> {
  const nowIso = new Date().toISOString();
  const nowMs = Date.now();

  await db.withTransactionAsync(async () => {
    const counts = await db.getAllAsync<RawCountRow>(
      `SELECT * FROM stocktake_counts WHERE session_id = ? AND committed_at IS NULL`,
      [sessionId],
    );

    let totalProductsCounted = 0;
    let totalVariancePesos = 0;

    for (const count of counts) {
      totalProductsCounted += 1;
      const delta = count.counted_qty - count.expected_qty;
      const lineReason = reasonPerLine[count.product_id];
      const reasonCode =
        lineReason?.reasonCode ?? (delta !== 0 ? 'unexplained' : null);
      const lineNote = lineReason?.note ?? null;

      // Get frozen cost price
      const product = await db.getFirstAsync<{
        cost_price: number | null;
        quantity: number;
      }>(`SELECT cost_price, quantity FROM products WHERE id = ?`, [
        count.product_id,
      ]);

      const costPrice = product?.cost_price ?? 0;
      const variancePesoImpact = Math.round(delta * costPrice * 100) / 100;
      totalVariancePesos += variancePesoImpact;

      if (delta !== 0) {
        const absQty = Math.abs(delta);
        const adjSign = delta > 0 ? 'positive' : 'negative';
        const noteText = lineNote
          ? `[stocktake:${reasonCode}] ${lineNote}`
          : `[stocktake:${reasonCode}]`;

        // 1. Insert inventory_transactions row
        await db.runAsync(
          `INSERT INTO inventory_transactions (
            product_id, type, quantity, note, adjustment_sign, timestamp
          ) VALUES (?, 'adjustment', ?, ?, ?, ?)`,
          [count.product_id, absQty, noteText, adjSign, nowIso],
        );

        // 2. Update products.quantity by delta
        await db.runAsync(
          `UPDATE products SET quantity = quantity + ? WHERE id = ?`,
          [delta, count.product_id],
        );
      }

      // 3. Update stocktake_counts record with snapshot cost and committed_at
      await db.runAsync(
        `UPDATE stocktake_counts 
         SET cost_price_at_count = ?, reason_code = ?, note = ?, committed_at = ? 
         WHERE id = ?`,
        [costPrice, reasonCode, lineNote, nowIso, count.id],
      );
    }

    // 4. Finalize stocktake_sessions row
    await db.runAsync(
      `UPDATE stocktake_sessions 
       SET status = 'completed', ended_at = ?, total_products_counted = ?, total_variance_pesos = ?, updated_at = ?
       WHERE id = ?`,
      [
        nowIso,
        totalProductsCounted,
        Math.round(totalVariancePesos * 100) / 100,
        nowMs,
        sessionId,
      ],
    );
  });
}

export async function abandonSession(sessionId: string): Promise<void> {
  const nowIso = new Date().toISOString();
  const nowMs = Date.now();

  await db.runAsync(
    `UPDATE stocktake_sessions SET status = 'abandoned', ended_at = ?, updated_at = ? WHERE id = ?`,
    [nowIso, nowMs, sessionId],
  );
}
```

- [ ] **Step 5: Export stocktake module in `database/index.ts`**

Update `database/index.ts` to add:

```ts
export * from './stocktake';
```

- [ ] **Step 6: Write failing DB tests in `tests/database/stocktake.test.ts`**

Create `tests/database/stocktake.test.ts`:

```ts
import { runMigrations } from '@/database/migrations';
import {
  startSession,
  getActiveSession,
  upsertCount,
  listCounts,
  commitSession,
  abandonSession,
} from '@/database/stocktake';
import { db } from '@/configs/sqlite';

describe('database/stocktake', () => {
  beforeEach(async () => {
    await runMigrations();
    // Clean tables before test
    await db.execAsync('DELETE FROM stocktake_counts;');
    await db.execAsync('DELETE FROM stocktake_sessions;');
    await db.execAsync('DELETE FROM inventory_transactions;');
    await db.execAsync('DELETE FROM products;');

    // Insert sample product
    await db.runAsync(
      `INSERT INTO products (id, name, sku, price, cost_price, quantity, retail_unit_name, created_at, updated_at)
       VALUES (1, 'Instant Noodles', 'SKU1', 15.00, 10.00, 20, 'Pc', 1000, 1000)`,
    );
  });

  it('starts session and captures baseline products quantity', async () => {
    const sessionId = await startSession('Test Note');
    expect(sessionId).toBeTruthy();

    const active = await getActiveSession();
    expect(active).not.toBeNull();
    expect(active?.id).toBe(sessionId);
    expect(active?.status).toBe('in_progress');

    const counts = await listCounts(sessionId);
    expect(counts.length).toBe(1);
    expect(counts[0].productId).toBe(1);
    expect(counts[0].expectedQty).toBe(20);
    expect(counts[0].countedQty).toBe(0);
  });

  it('upserts count and commits session atomically updating products and ledger', async () => {
    const sessionId = await startSession();
    await upsertCount({
      sessionId,
      productId: 1,
      expectedQty: 20,
      countedQty: 18, // -2 variance
    });

    await commitSession(sessionId, {
      1: { reasonCode: 'spoilage', note: 'Expired on shelf' },
    });

    const active = await getActiveSession();
    expect(active).toBeNull();

    // Check product quantity updated to 18
    const product = await db.getFirstAsync<{ quantity: number }>(
      'SELECT quantity FROM products WHERE id = 1',
    );
    expect(product?.quantity).toBe(18);

    // Check inventory_transactions adjustment row created
    const txns = await db.getAllAsync<{
      type: string;
      quantity: number;
      adjustment_sign: string;
    }>(
      'SELECT type, quantity, adjustment_sign FROM inventory_transactions WHERE product_id = 1',
    );
    expect(txns.length).toBe(1);
    expect(txns[0].type).toBe('adjustment');
    expect(txns[0].quantity).toBe(2);
    expect(txns[0].adjustment_sign).toBe('negative');
  });

  it('abandons session without altering product quantity or ledger', async () => {
    const sessionId = await startSession();
    await upsertCount({
      sessionId,
      productId: 1,
      expectedQty: 20,
      countedQty: 15,
    });

    await abandonSession(sessionId);

    const active = await getActiveSession();
    expect(active).toBeNull();

    const product = await db.getFirstAsync<{ quantity: number }>(
      'SELECT quantity FROM products WHERE id = 1',
    );
    expect(product?.quantity).toBe(20); // Unchanged

    const txns = await db.getAllAsync('SELECT * FROM inventory_transactions');
    expect(txns.length).toBe(0);
  });
});
```

- [ ] **Step 7: Run test to verify DB implementation passes**

Run command:
`npm test -- tests/database/stocktake.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit Task 1**

```bash
git add configs/stocktakeReasons.ts types/stocktake.types.ts database/migrations.ts database/stocktake.ts database/index.ts tests/database/stocktake.test.ts
git commit -m "feat(stocktake): add v15 migration and database functions for stocktake"
```

---

### Task 2: i18n Translations and Locale Resources

**Files:**

- Create: `locales/en/stocktake.json`
- Create: `locales/tl/stocktake.json`
- Modify: `lib/i18n.ts:1-74`

**Interfaces:**

- Consumes: `i18next` resources
- Produces: `stocktake` i18n namespace keys (`stocktake:title`, `stocktake:lastSessionSummary`, etc.)

- [ ] **Step 1: Create `locales/en/stocktake.json`**

Create `locales/en/stocktake.json`:

```json
{
  "title": "Physical Stocktake",
  "lastSessionSummary": "Last count: {{date}} · {{counted}} counted · {{netPesos}} net",
  "startCta": "Start new stocktake",
  "inProgressBanner": "Stocktake in progress — manual stock edits are paused.",
  "progressLabel": "{{counted}} / {{total}} products counted",
  "finishReviewCta": "Finish & review",
  "saveQuitCta": "Save & quit",
  "abandonTitle": "Abandon stocktake?",
  "abandonConfirm": "Yes, Abandon",
  "varianceHeader": "Variance Summary: {{variances}} variances, {{netPesos}} net impact",
  "commitCta": "Commit Adjustments",
  "commitDisabledReason": "Select a reason for all non-zero variance lines.",
  "noActiveSession": "No active stocktake session.",
  "reason": {
    "shrinkage": "Shrinkage / Theft",
    "spoilage": "Spoilage / Damaged",
    "miscount": "Miscount",
    "freebie_to_neighbor": "Freebie / Suki Gift",
    "customer_return": "Customer Return",
    "unexplained": "Unexplained Gap"
  }
}
```

- [ ] **Step 2: Create `locales/tl/stocktake.json`**

Create `locales/tl/stocktake.json`:

```json
{
  "title": "Inventaryo Stocktake",
  "lastSessionSummary": "Huling bilang: {{date}} · {{counted}} nabilang · {{netPesos}} kabuuan",
  "startCta": "Magsimula ng bagong stocktake",
  "inProgressBanner": "May stocktake na nagaganap — nakahinto ang manual stock adjustments.",
  "progressLabel": "{{counted}} / {{total}} mga produkto ang nabilang",
  "finishReviewCta": "Tapusin at suriin",
  "saveQuitCta": "I-save at lumabas",
  "abandonTitle": "I-abandon ang stocktake?",
  "abandonConfirm": "Oo, I-abandon",
  "varianceHeader": "Buod ng Bawas/Dagdag: {{variances}} pagkakaiba, {{netPesos}} epekto",
  "commitCta": "I-commit ang Adjustments",
  "commitDisabledReason": "Pumili ng dahilan para sa lahat ng may pagkakaiba.",
  "noActiveSession": "Walang aktibong stocktake session.",
  "reason": {
    "shrinkage": "Nawala / Nanaka",
    "spoilage": "Nasira / Napano",
    "miscount": "Maling bilang",
    "freebie_to_neighbor": "Bigay / Libre sa Suki",
    "customer_return": "Isinauli ng customer",
    "unexplained": "Di-maipaliwanag na kulang"
  }
}
```

- [ ] **Step 3: Update `lib/i18n.ts` to register `stocktake` namespace**

Modify `lib/i18n.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initReactI18next } from 'react-i18next';
import i18n from 'i18next';

import commonEn from '../locales/en/common.json';
import inventoryEn from '../locales/en/inventory.json';
import salesEn from '../locales/en/sales.json';
import utangEn from '../locales/en/utang.json';
import onboardingEn from '../locales/en/onboarding.json';
import stocktakeEn from '../locales/en/stocktake.json';

import commonTl from '../locales/tl/common.json';
import inventoryTl from '../locales/tl/inventory.json';
import salesTl from '../locales/tl/sales.json';
import utangTl from '../locales/tl/utang.json';
import onboardingTl from '../locales/tl/onboarding.json';
import stocktakeTl from '../locales/tl/stocktake.json';

const LANGUAGE_KEY = 'sarisari_language_preference';

export type SupportedLanguage = 'en' | 'tl';

const resources = {
  en: {
    common: commonEn,
    inventory: inventoryEn,
    sales: salesEn,
    utang: utangEn,
    onboarding: onboardingEn,
    stocktake: stocktakeEn,
  },
  tl: {
    common: commonTl,
    inventory: inventoryTl,
    sales: salesTl,
    utang: utangTl,
    onboarding: onboardingTl,
    stocktake: stocktakeTl,
  },
};

export const initI18n = async (): Promise<void> => {
  let savedLanguage: string | null = null;
  try {
    savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
  } catch (error) {
    console.warn('Could not read saved language preference:', error);
  }

  const initialLanguage: SupportedLanguage =
    savedLanguage === 'tl' ? 'tl' : 'en';

  await i18n.use(initReactI18next).init({
    resources,
    lng: initialLanguage,
    fallbackLng: 'en',
    ns: ['common', 'inventory', 'sales', 'utang', 'onboarding', 'stocktake'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  });
};

export const changeAppLanguage = async (
  lang: SupportedLanguage,
): Promise<void> => {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  await i18n.changeLanguage(lang);
};

export const getCurrentLanguage = (): SupportedLanguage =>
  (i18n.language as SupportedLanguage) === 'tl' ? 'tl' : 'en';

export default i18n;
```

- [ ] **Step 4: Commit Task 2**

```bash
git add locales/en/stocktake.json locales/tl/stocktake.json lib/i18n.ts
git commit -m "feat(stocktake): add stocktake i18n translations and namespace"
```

---

### Task 3: TanStack Query Hooks and Stocktake Guard

**Files:**

- Create: `hooks/useStocktake.ts`
- Modify: `hooks/index.ts`
- Create: `tests/hooks/useStocktake.test.tsx`

**Interfaces:**

- Consumes: DB helpers in `@/database/stocktake`, TanStack Query `useQuery` / `useMutation`
- Produces: `stocktakeKeys`, `useActiveStocktakeSession`, `useStocktakeSession`, `useStocktakeCounts`, `useRecentStocktakeSessions`, `useStartStocktake`, `useUpsertStocktakeCount`, `useCommitStocktake`, `useAbandonStocktake`, `useStocktakeGuard`

- [ ] **Step 1: Create `hooks/useStocktake.ts`**

Create `hooks/useStocktake.ts`:

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getActiveSession,
  getSessionById,
  listCounts,
  listRecentSessions,
  startSession,
  upsertCount,
  commitSession,
  abandonSession,
} from '@/database/stocktake';
import type {
  UpsertCountInput,
  CommitReasonPerLine,
  StocktakeCount,
} from '@/types/stocktake.types';
import { inventoryKeys } from './useInventory';

export const stocktakeKeys = {
  all: ['stocktake'] as const,
  active: () => [...stocktakeKeys.all, 'active'] as const,
  session: (id: string) => [...stocktakeKeys.all, 'session', id] as const,
  counts: (sessionId: string) =>
    [...stocktakeKeys.all, 'counts', sessionId] as const,
  history: () => [...stocktakeKeys.all, 'history'] as const,
};

export function useActiveStocktakeSession() {
  return useQuery({
    queryKey: stocktakeKeys.active(),
    queryFn: () => getActiveSession(),
  });
}

export function useStocktakeSession(id: string | null) {
  return useQuery({
    queryKey: id ? stocktakeKeys.session(id) : ['stocktake', 'none'],
    queryFn: () => (id ? getSessionById(id) : null),
    enabled: Boolean(id),
  });
}

export function useStocktakeCounts(sessionId: string | null) {
  return useQuery({
    queryKey: sessionId
      ? stocktakeKeys.counts(sessionId)
      : ['stocktake', 'counts', 'none'],
    queryFn: () => (sessionId ? listCounts(sessionId) : []),
    enabled: Boolean(sessionId),
  });
}

export function useRecentStocktakeSessions(limit = 20) {
  return useQuery({
    queryKey: stocktakeKeys.history(),
    queryFn: () => listRecentSessions(limit),
  });
}

export function useStartStocktake() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (note?: string) => startSession(note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stocktakeKeys.all });
      queryClient.invalidateQueries({ queryKey: stocktakeKeys.history() });
    },
  });
}

export function useUpsertStocktakeCount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertCountInput) => upsertCount(input),
    onMutate: async (input) => {
      const key = stocktakeKeys.counts(input.sessionId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<StocktakeCount[]>(key);

      if (previous) {
        const updated = [...previous];
        const idx = updated.findIndex((x) => x.productId === input.productId);
        if (idx >= 0 && updated[idx]) {
          updated[idx] = {
            ...updated[idx],
            countedQty: input.countedQty,
          };
        }
        queryClient.setQueryData(key, updated);
      }

      return { previous };
    },
    onError: (_err, input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          stocktakeKeys.counts(input.sessionId),
          context.previous,
        );
      }
    },
    onSettled: (_data, _error, input) => {
      queryClient.invalidateQueries({
        queryKey: stocktakeKeys.counts(input.sessionId),
      });
    },
  });
}

export function useCommitStocktake() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      reasonPerLine,
    }: {
      sessionId: string;
      reasonPerLine: CommitReasonPerLine;
    }) => commitSession(sessionId, reasonPerLine),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stocktakeKeys.all });
      queryClient.invalidateQueries({ queryKey: stocktakeKeys.history() });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

export function useAbandonStocktake() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => abandonSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stocktakeKeys.all });
    },
  });
}

export function useStocktakeGuard(): {
  isActive: boolean;
  reason: string | null;
} {
  const { data: activeSession } = useActiveStocktakeSession();
  const isActive = Boolean(activeSession);
  return {
    isActive,
    reason: isActive
      ? 'Stocktake in progress — manual stock changes are paused.'
      : null,
  };
}
```

- [ ] **Step 2: Export `useStocktake` hooks in `hooks/index.ts`**

Modify `hooks/index.ts` to add:

```ts
export * from './useStocktake';
```

- [ ] **Step 3: Write tests for hooks in `tests/hooks/useStocktake.test.tsx`**

Create `tests/hooks/useStocktake.test.tsx`:

```ts
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useActiveStocktakeSession,
  useStartStocktake,
  useStocktakeGuard,
} from '@/hooks/useStocktake';
import { runMigrations } from '@/database/migrations';
import { db } from '@/configs/sqlite';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useStocktake hooks', () => {
  beforeEach(async () => {
    await runMigrations();
    await db.execAsync('DELETE FROM stocktake_sessions;');
  });

  it('useActiveStocktakeSession returns null initially', async () => {
    const { result } = renderHook(() => useActiveStocktakeSession(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it('useStocktakeGuard returns isActive true when session active', async () => {
    const wrapper = createWrapper();
    const { result: startMut } = renderHook(() => useStartStocktake(), {
      wrapper,
    });

    await act(async () => {
      await startMut.current.mutateAsync('Guard test');
    });

    const { result: guard } = renderHook(() => useStocktakeGuard(), {
      wrapper,
    });

    await waitFor(() => expect(guard.current.isActive).toBe(true));
    expect(guard.current.reason).toContain('Stocktake in progress');
  });
});
```

- [ ] **Step 4: Run test to verify hooks implementation**

Run command:
`npm test -- tests/hooks/useStocktake.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit Task 3**

```bash
git add hooks/useStocktake.ts hooks/index.ts tests/hooks/useStocktake.test.tsx
git commit -m "feat(stocktake): add TanStack query hooks and useStocktakeGuard"
```

---

### Task 4: Presentational Components for Stocktake

**Files:**

- Create: `components/inventory/stocktake/StocktakeBanner.tsx`
- Create: `components/inventory/stocktake/StocktakeStartCard.tsx`
- Create: `components/inventory/stocktake/StocktakeHistoryList.tsx`
- Create: `components/inventory/stocktake/StocktakeCategorySection.tsx`
- Create: `components/inventory/stocktake/StocktakeCountRow.tsx`
- Create: `components/inventory/stocktake/StocktakeVarianceRow.tsx`
- Create: `components/inventory/stocktake/StocktakeVarianceSummary.tsx`
- Create: `components/inventory/stocktake/index.ts`
- Create: `tests/components/StocktakeBanner.test.tsx`

**Interfaces:**

- Consumes: UI components (`StyledText`, `MoneyText`, `@expo/vector-icons`)
- Produces: Components for rendering Idle, Counting, Variance states, and top Banner.

- [ ] **Step 1: Create `StocktakeBanner.tsx`**

Create `components/inventory/stocktake/StocktakeBanner.tsx`:

```tsx
import { Pressable, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { StyledText } from '@/components/elements';
import { useActiveStocktakeSession } from '@/hooks/useStocktake';

export function StocktakeBanner() {
  const { t } = useTranslation('stocktake');
  const router = useRouter();
  const { data: activeSession } = useActiveStocktakeSession();

  if (!activeSession) return null;

  return (
    <Pressable
      onPress={() => router.push('/(tabs)/inventory/stocktake')}
      accessibilityRole="button"
      accessibilityLabel={t('inProgressBanner')}
      className="bg-amber-500 px-4 py-2.5 flex-row items-center justify-between border-b border-amber-600 active:bg-amber-600"
    >
      <View className="flex-row items-center gap-x-2.5 flex-1 pr-2">
        <FontAwesome name="clipboard" size={16} color="#FFFFFF" />
        <StyledText
          variant="semibold"
          className="text-white text-xs flex-1"
          numberOfLines={1}
        >
          {t('inProgressBanner')}
        </StyledText>
      </View>
      <FontAwesome name="chevron-right" size={12} color="#FFFFFF" />
    </Pressable>
  );
}
```

- [ ] **Step 2: Create `StocktakeStartCard.tsx`**

Create `components/inventory/stocktake/StocktakeStartCard.tsx`:

```tsx
import { View, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui';
import type { StocktakeSession } from '@/types/stocktake.types';

interface StocktakeStartCardProps {
  lastSession: StocktakeSession | null;
  onStart: () => void;
  isStarting?: boolean;
}

export function StocktakeStartCard({
  lastSession,
  onStart,
  isStarting = false,
}: StocktakeStartCardProps) {
  const { t } = useTranslation('stocktake');

  return (
    <View className="bg-paper-50 rounded-2xl p-5 border border-paper-300 shadow-sm gap-y-4">
      <View className="flex-row items-center gap-x-3">
        <View className="w-10 h-10 rounded-full bg-persimmon-100 items-center justify-center">
          <FontAwesome name="clipboard" size={18} color="#E85A1F" />
        </View>
        <View className="flex-1">
          <StyledText variant="extrabold" className="text-ink-900 text-lg">
            {t('title')}
          </StyledText>
          {lastSession ? (
            <StyledText
              variant="medium"
              className="text-ink-500 text-xs mt-0.5"
            >
              {new Date(lastSession.createdAt).toLocaleDateString()} ·{' '}
              {lastSession.totalProductsCounted} counted
            </StyledText>
          ) : (
            <StyledText
              variant="medium"
              className="text-ink-500 text-xs mt-0.5"
            >
              No recent counts
            </StyledText>
          )}
        </View>
      </View>

      {lastSession ? (
        <View className="bg-paper-100 rounded-xl p-3 flex-row items-center justify-between border border-paper-200">
          <StyledText variant="semibold" className="text-ink-600 text-xs">
            Net Variance:
          </StyledText>
          <MoneyText
            value={lastSession.totalVariancePesos}
            className={`text-sm font-bold ${
              lastSession.totalVariancePesos < 0
                ? 'text-semantic-danger'
                : 'text-sage-700'
            }`}
          />
        </View>
      ) : null}

      <TouchableOpacity
        onPress={onStart}
        disabled={isStarting}
        accessibilityRole="button"
        accessibilityLabel={t('startCta')}
        className="w-full bg-persimmon-500 rounded-xl py-3.5 items-center justify-center flex-row gap-x-2 active:bg-persimmon-600"
      >
        <FontAwesome name="play" size={14} color="#FFFFFF" />
        <StyledText variant="extrabold" className="text-paper-50 text-sm">
          {t('startCta')}
        </StyledText>
      </TouchableOpacity>
    </View>
  );
}
```

- [ ] **Step 3: Create `StocktakeHistoryList.tsx`**

Create `components/inventory/stocktake/StocktakeHistoryList.tsx`:

```tsx
import { View, FlatList } from 'react-native';
import { StyledText } from '@/components/elements';
import { MoneyText, StatusPill } from '@/components/ui';
import type { StocktakeSession } from '@/types/stocktake.types';

interface StocktakeHistoryListProps {
  sessions: StocktakeSession[];
}

export function StocktakeHistoryList({ sessions }: StocktakeHistoryListProps) {
  if (sessions.length === 0) return null;

  return (
    <View className="gap-y-2 mt-4">
      <StyledText
        variant="extrabold"
        className="text-ink-800 text-sm uppercase px-1"
      >
        Recent Stocktakes
      </StyledText>
      {sessions.map((s) => (
        <View
          key={s.id}
          className="bg-paper-50 rounded-xl p-4 border border-paper-200 flex-row items-center justify-between"
        >
          <View className="gap-y-1 flex-1">
            <StyledText variant="semibold" className="text-ink-900 text-sm">
              {new Date(s.createdAt).toLocaleDateString()}
            </StyledText>
            <StyledText variant="medium" className="text-ink-500 text-xs">
              {s.totalProductsCounted} products counted
            </StyledText>
          </View>
          <View className="items-end gap-y-1">
            <StatusPill
              variant={s.status === 'completed' ? 'success' : 'neutral'}
            >
              {s.status}
            </StatusPill>
            {s.status === 'completed' ? (
              <MoneyText
                value={s.totalVariancePesos}
                className={`text-xs font-semibold ${
                  s.totalVariancePesos < 0
                    ? 'text-semantic-danger'
                    : 'text-sage-700'
                }`}
              />
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}
```

- [ ] **Step 4: Create `StocktakeCountRow.tsx`**

Create `components/inventory/stocktake/StocktakeCountRow.tsx`:

```tsx
import { View, TextInput, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import type { Product } from '@/types/products.types';

interface StocktakeCountRowProps {
  product: Product;
  expectedQty: number;
  countedQty: number;
  onCountChange: (qty: number) => void;
}

export function StocktakeCountRow({
  product,
  expectedQty,
  countedQty,
  onCountChange,
}: StocktakeCountRowProps) {
  const addChip = (amount: number) => {
    onCountChange(countedQty + amount);
  };

  return (
    <View className="bg-paper-50 rounded-xl p-3 border border-paper-200 gap-y-2 mb-2">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-2">
          <StyledText
            variant="extrabold"
            className="text-ink-900 text-sm"
            numberOfLines={1}
          >
            {product.name}
          </StyledText>
          <StyledText variant="medium" className="text-ink-500 text-xs">
            Expected: {expectedQty} {product.retail_unit_name || 'Pc'}
          </StyledText>
        </View>
        {countedQty !== expectedQty ? (
          <View
            className={`px-2 py-0.5 rounded-full ${
              countedQty - expectedQty < 0 ? 'bg-rose-100' : 'bg-sage-100'
            }`}
          >
            <StyledText
              variant="extrabold"
              className={`text-xs ${
                countedQty - expectedQty < 0 ? 'text-rose-700' : 'text-sage-800'
              }`}
            >
              {countedQty - expectedQty > 0
                ? `+${countedQty - expectedQty}`
                : countedQty - expectedQty}
            </StyledText>
          </View>
        ) : null}
      </View>

      <View className="flex-row items-center gap-x-2">
        {/* Decrement */}
        <TouchableOpacity
          onPress={() => onCountChange(Math.max(0, countedQty - 1))}
          className="w-10 h-10 rounded-lg bg-paper-100 border border-paper-300 items-center justify-center active:bg-paper-200"
          accessibilityLabel="Decrease count"
        >
          <FontAwesome name="minus" size={12} color="#564E45" />
        </TouchableOpacity>

        {/* Input */}
        <TextInput
          value={String(countedQty)}
          onChangeText={(txt) => {
            const val = parseInt(txt.replace(/[^0-9]/g, ''), 10);
            onCountChange(Number.isNaN(val) ? 0 : val);
          }}
          keyboardType="number-pad"
          className="flex-1 h-10 bg-paper-100 border border-paper-300 rounded-lg text-center font-bold text-ink-900"
        />

        {/* Quick chips +1, +2, +5 */}
        {[1, 2, 5].map((inc) => (
          <TouchableOpacity
            key={inc}
            onPress={() => addChip(inc)}
            className="h-10 px-3 rounded-lg bg-persimmon-50 border border-persimmon-200 items-center justify-center active:bg-persimmon-100"
          >
            <StyledText
              variant="extrabold"
              className="text-persimmon-700 text-xs"
            >
              +{inc}
            </StyledText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
```

- [ ] **Step 5: Create `StocktakeCategorySection.tsx`**

Create `components/inventory/stocktake/StocktakeCategorySection.tsx`:

```tsx
import { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { StyledText } from '@/components/elements';
import { StocktakeCountRow } from './StocktakeCountRow';
import type { Product } from '@/types/products.types';
import type { StocktakeCount } from '@/types/stocktake.types';

interface StocktakeCategorySectionProps {
  categoryName: string;
  products: Product[];
  countsMap: Record<number, StocktakeCount>;
  onCountChange: (
    productId: number,
    expectedQty: number,
    countedQty: number,
  ) => void;
}

export function StocktakeCategorySection({
  categoryName,
  products,
  countsMap,
  onCountChange,
}: StocktakeCategorySectionProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <View className="mb-3">
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        className="bg-paper-100 p-3 rounded-xl border border-paper-300 flex-row items-center justify-between mb-2"
      >
        <StyledText variant="extrabold" className="text-ink-800 text-sm">
          {categoryName} ({products.length})
        </StyledText>
        <FontAwesome
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={12}
          color="#564E45"
        />
      </TouchableOpacity>

      {expanded ? (
        <View className="pl-1">
          {products.map((p) => {
            const count = countsMap[p.id];
            const expected = count ? count.expectedQty : p.quantity;
            const counted = count ? count.countedQty : 0;

            return (
              <StocktakeCountRow
                key={p.id}
                product={p}
                expectedQty={expected}
                countedQty={counted}
                onCountChange={(newQty) =>
                  onCountChange(p.id, expected, newQty)
                }
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
```

- [ ] **Step 6: Create `StocktakeVarianceSummary.tsx`**

Create `components/inventory/stocktake/StocktakeVarianceSummary.tsx`:

```tsx
import { View } from 'react-native';
import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui';

interface StocktakeVarianceSummaryProps {
  totalProducts: number;
  varianceCount: number;
  netVariancePesos: number;
}

export function StocktakeVarianceSummary({
  totalProducts,
  varianceCount,
  netVariancePesos,
}: StocktakeVarianceSummaryProps) {
  return (
    <View className="bg-paper-50 rounded-xl p-4 border border-paper-300 gap-y-1 mb-4">
      <StyledText variant="extrabold" className="text-ink-900 text-base">
        Variance Review
      </StyledText>
      <View className="flex-row items-center justify-between mt-1">
        <StyledText variant="medium" className="text-ink-600 text-xs">
          {varianceCount} of {totalProducts} lines have variance
        </StyledText>
        <MoneyText
          value={netVariancePesos}
          className={`text-base font-extrabold ${
            netVariancePesos < 0 ? 'text-semantic-danger' : 'text-sage-700'
          }`}
        />
      </View>
    </View>
  );
}
```

- [ ] **Step 7: Create `StocktakeVarianceRow.tsx`**

Create `components/inventory/stocktake/StocktakeVarianceRow.tsx`:

```tsx
import { View, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { MoneyText } from '@/components/ui';
import { STOCKTAKE_REASONS, StocktakeReason } from '@/configs/stocktakeReasons';
import type { Product } from '@/types/products.types';
import type { StocktakeCount } from '@/types/stocktake.types';

interface StocktakeVarianceRowProps {
  product: Product;
  count: StocktakeCount;
  reasonCode: StocktakeReason | null;
  note: string;
  onReasonChange: (reason: StocktakeReason) => void;
  onNoteChange: (note: string) => void;
}

export function StocktakeVarianceRow({
  product,
  count,
  reasonCode,
  note,
  onReasonChange,
  onNoteChange,
}: StocktakeVarianceRowProps) {
  const { t } = useTranslation('stocktake');
  const delta = count.countedQty - count.expectedQty;
  const isZero = delta === 0;
  const pesoImpact = Math.round(delta * (product.cost_price ?? 0) * 100) / 100;

  return (
    <View className="bg-paper-50 rounded-xl p-3 border border-paper-200 gap-y-2 mb-2">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-2">
          <StyledText
            variant="extrabold"
            className="text-ink-900 text-sm"
            numberOfLines={1}
          >
            {product.name}
          </StyledText>
          <StyledText variant="medium" className="text-ink-500 text-xs">
            Expected: {count.expectedQty} | Counted: {count.countedQty}
          </StyledText>
        </View>
        <View className="items-end">
          <StyledText
            variant="extrabold"
            className={`text-xs ${delta < 0 ? 'text-semantic-danger' : delta > 0 ? 'text-sage-700' : 'text-ink-500'}`}
          >
            Delta: {delta > 0 ? `+${delta}` : delta}
          </StyledText>
          <MoneyText
            value={pesoImpact}
            className={`text-xs font-semibold ${
              pesoImpact < 0 ? 'text-semantic-danger' : 'text-sage-700'
            }`}
          />
        </View>
      </View>

      {!isZero ? (
        <View className="gap-y-2 border-t border-paper-200 pt-2">
          <StyledText variant="semibold" className="text-ink-700 text-xs">
            Select Reason (Required):
          </StyledText>
          <View className="flex-row flex-wrap gap-1">
            {STOCKTAKE_REASONS.map((r) => {
              const isSelected = reasonCode === r;
              return (
                <View
                  key={r}
                  onTouchEnd={() => onReasonChange(r)}
                  className={`px-2.5 py-1.5 rounded-lg border ${
                    isSelected
                      ? 'bg-persimmon-500 border-persimmon-600'
                      : 'bg-paper-100 border-paper-300'
                  }`}
                >
                  <StyledText
                    variant="semibold"
                    className={`text-xs ${
                      isSelected ? 'text-paper-50' : 'text-ink-700'
                    }`}
                  >
                    {t(`reason.${r}`)}
                  </StyledText>
                </View>
              );
            })}
          </View>

          <TextInput
            placeholder="Optional line note..."
            value={note}
            onChangeText={onNoteChange}
            placeholderTextColor="#A1978A"
            className="bg-paper-100 border border-paper-300 rounded-lg px-3 py-1.5 text-xs text-ink-900"
          />
        </View>
      ) : null}
    </View>
  );
}
```

- [ ] **Step 8: Create `components/inventory/stocktake/index.ts`**

Create `components/inventory/stocktake/index.ts`:

```ts
export * from './StocktakeBanner';
export * from './StocktakeStartCard';
export * from './StocktakeHistoryList';
export * from './StocktakeCategorySection';
export * from './StocktakeCountRow';
export * from './StocktakeVarianceRow';
export * from './StocktakeVarianceSummary';
```

- [ ] **Step 9: Write component unit tests in `tests/components/StocktakeBanner.test.tsx`**

Create `tests/components/StocktakeBanner.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { StocktakeBanner } from '@/components/inventory/stocktake/StocktakeBanner';
import { useActiveStocktakeSession } from '@/hooks/useStocktake';

jest.mock('@/hooks/useStocktake', () => ({
  useActiveStocktakeSession: jest.fn(),
}));

describe('StocktakeBanner', () => {
  it('renders null when no session is active', () => {
    (useActiveStocktakeSession as jest.Mock).mockReturnValue({ data: null });
    const { queryByText } = render(<StocktakeBanner />);
    expect(queryByText(/Stocktake in progress/i)).toBeNull();
  });

  it('renders banner when active session exists', () => {
    (useActiveStocktakeSession as jest.Mock).mockReturnValue({
      data: { id: 'sess-1', status: 'in_progress' },
    });
    const { getByText } = render(<StocktakeBanner />);
    expect(getByText(/Stocktake in progress/i)).toBeTruthy();
  });
});
```

- [ ] **Step 10: Run component unit tests**

Run command:
`npm test -- tests/components/StocktakeBanner.test.tsx`
Expected: PASS.

- [ ] **Step 11: Commit Task 4**

```bash
git add components/inventory/stocktake/ tests/components/StocktakeBanner.test.tsx
git commit -m "feat(stocktake): add stocktake presentational UI components"
```

---

### Task 5: Tab Navigation & Inventory Layout Integration

**Files:**

- Modify: `constants/tabs.ts:65-76`
- Modify: `components/inventory/InventoryHeader.tsx:23 border-28`
- Modify: `app/(tabs)/inventory/_layout.tsx`

**Interfaces:**

- Consumes: `StocktakeBanner` from `@/components/inventory/stocktake`
- Produces: Stocktake tab registration in Inventory tab group.

- [ ] **Step 1: Update `constants/tabs.ts`**

Update `INVENTORY_SUB_TABS` array in `constants/tabs.ts`:

```ts
export const INVENTORY_SUB_TABS = [
  'products',
  'stock',
  'movements',
  'analytics',
  'stocktake',
] as const;
```

- [ ] **Step 2: Update `components/inventory/InventoryHeader.tsx`**

Update `INVENTORY_TAB_META` in `components/inventory/InventoryHeader.tsx`:

```ts
const INVENTORY_TAB_META = {
  products: { icon: 'cube', label: 'PRODUCTS' },
  stock: { icon: 'archive', label: 'STOCK' },
  movements: { icon: 'exchange', label: 'MOVEMENTS' },
  analytics: { icon: 'line-chart', label: 'ANALYTICS' },
  stocktake: { icon: 'clipboard', label: 'STOCKTAKE' },
} satisfies Record<InventorySubTab, InventoryTabMeta>;
```

- [ ] **Step 3: Update `app/(tabs)/inventory/_layout.tsx`**

Modify `app/(tabs)/inventory/_layout.tsx` to mount `<StocktakeBanner />` above `TopTabs` and register `stocktake` tab:

```tsx
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import {
  Href,
  Stack,
  useLocalSearchParams,
  useRouter,
  useSegments,
} from 'expo-router';
import { TopTabs } from '@/components/navigation';
import { InventoryHeader, InventorySpeedDialFab } from '@/components/inventory';
import { StocktakeBanner } from '@/components/inventory/stocktake';
import { LogTransactionForm } from '@/components/inventory/ledger';
import type { InventorySubTab } from '@/constants/tabs';
import type { InventoryEventType } from '@/types/inventory.types';
import { InventoryModalsHost } from './modals';

const SUB_TAB_SEGMENTS = [
  'products',
  'stock',
  'movements',
  'analytics',
  'stocktake',
] satisfies InventorySubTab[];

function isInventorySubTab(segment: string): segment is InventorySubTab {
  return (SUB_TAB_SEGMENTS as readonly string[]).includes(segment);
}

export default function InventoryLayout() {
  const segments = useSegments();
  const router = useRouter();
  const { q } = useLocalSearchParams<{
    q?: string;
  }>();
  const search = q ?? '';
  const [scannerOpen, setScannerOpen] = useState(false);
  const [fabForm, setFabForm] = useState<{
    visible: boolean;
    type: InventoryEventType;
  }>({
    visible: false,
    type: 'adjustment',
  });

  const activeTab = useMemo<InventorySubTab>(() => {
    const last = segments[segments.length - 1] ?? '';
    return isInventorySubTab(last) ? last : 'products';
  }, [segments]);

  const lastSegment = segments[segments.length - 1] ?? '';
  const isDetail =
    segments.length > 0 &&
    lastSegment !== '(tabs)' &&
    lastSegment !== 'inventory' &&
    !isInventorySubTab(lastSegment);

  const handleTabChange = useCallback(
    (t: InventorySubTab) => {
      router.push(`/(tabs)/inventory/${t}` as Href);
    },
    [router],
  );

  const handleSearchChange = useCallback(
    (next: string) => {
      router.setParams({ q: next });
    },
    [router],
  );

  const handlePillPress = useCallback(
    (kind: 'low' | 'out' | 'near_expiry' | 'overstock') => {
      router.push({ pathname: '/inventory/stock', params: { filter: kind } });
    },
    [router],
  );

  const openAddProduct = useCallback(() => {
    router.push('/(edit-forms)/add-product' as Href);
  }, [router]);

  return (
    <View className="flex-1 bg-paper-200">
      <Stack.Screen options={{ headerShown: false }} />
      {!isDetail ? (
        <>
          <InventoryHeader
            active={activeTab}
            search={search}
            onSearchChange={handleSearchChange}
            onOpenScanner={() => setScannerOpen(true)}
            onTabChange={handleTabChange}
            onPillPress={handlePillPress}
          />
          <StocktakeBanner />
        </>
      ) : null}

      <View className="flex-1 bg-paper-200 relative">
        <TopTabs
          initialRouteName="products"
          screenOptions={{
            swipeEnabled: true,
            lazy: true,
            lazyPreloadDistance: 0,
            tabBarStyle: { display: 'none' },
          }}
        >
          <TopTabs.Screen name="products" />
          <TopTabs.Screen name="stock" />
          <TopTabs.Screen name="movements" />
          <TopTabs.Screen name="analytics" />
          <TopTabs.Screen name="stocktake" />
        </TopTabs>

        {!isDetail ? (
          <InventorySpeedDialFab
            onAddProduct={openAddProduct}
            onAddCategory={() =>
              router.push('/(edit-forms)/add-category' as Href)
            }
            onAddSupplier={() =>
              router.push('/(edit-forms)/add-supplier' as Href)
            }
            onScanBarcode={() => setScannerOpen(true)}
          />
        ) : null}

        <LogTransactionForm
          initialType={fabForm.type}
          visible={fabForm.visible}
          onClose={() => setFabForm({ visible: false, type: fabForm.type })}
          onSuccess={() => setFabForm({ visible: false, type: fabForm.type })}
        />
      </View>

      <InventoryModalsHost
        scannerOpen={scannerOpen}
        onCloseScanner={() => setScannerOpen(false)}
      />
    </View>
  );
}
```

- [ ] **Step 4: Commit Task 5**

```bash
git add constants/tabs.ts components/inventory/InventoryHeader.tsx app/\(tabs\)/inventory/_layout.tsx
git commit -m "feat(stocktake): register stocktake tab and mount sticky banner in layout"
```

---

### Task 6: Main Screen Flow (`app/(tabs)/inventory/stocktake.tsx`)

**Files:**

- Create: `app/(tabs)/inventory/stocktake.tsx`

**Interfaces:**

- Consumes: `useActiveStocktakeSession`, `useStocktakeCounts`, `useRecentStocktakeSessions`, `useStartStocktake`, `useUpsertStocktakeCount`, `useCommitStocktake`, `useAbandonStocktake`, presentational stocktake components
- Produces: Stocktake sub-tab screen with Idle, Counting, Variance states.

- [ ] **Step 1: Create `app/(tabs)/inventory/stocktake.tsx`**

Create `app/(tabs)/inventory/stocktake.tsx`:

```tsx
import React, { useState, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import {
  useActiveStocktakeSession,
  useStocktakeCounts,
  useRecentStocktakeSessions,
  useStartStocktake,
  useUpsertStocktakeCount,
  useCommitStocktake,
  useAbandonStocktake,
} from '@/hooks/useStocktake';
import { useProducts } from '@/hooks/useProducts';
import {
  StocktakeStartCard,
  StocktakeHistoryList,
  StocktakeCategorySection,
  StocktakeVarianceSummary,
  StocktakeVarianceRow,
} from '@/components/inventory/stocktake';
import type { StocktakeReason } from '@/configs/stocktakeReasons';
import type { StocktakeCount } from '@/types/stocktake.types';

export default function StocktakeScreen() {
  const { t } = useTranslation('stocktake');
  const [viewState, setViewState] = useState<'counting' | 'variance'>(
    'counting',
  );

  // Queries & Mutations
  const { data: activeSession, isLoading: loadingSession } =
    useActiveStocktakeSession();
  const { data: counts = [] } = useStocktakeCounts(activeSession?.id ?? null);
  const { data: recentSessions = [] } = useRecentStocktakeSessions();
  const { getAllProductsQuery } = useProducts();
  const products = getAllProductsQuery.data ?? [];

  const startMut = useStartStocktake();
  const upsertMut = useUpsertStocktakeCount();
  const commitMut = useCommitStocktake();
  const abandonMut = useAbandonStocktake();

  // Local state for variance reason selection
  const [reasonsMap, setReasonsMap] = useState<
    Record<number, { reasonCode: StocktakeReason; note: string }>
  >({});

  // Map counts by product_id
  const countsMap = useMemo(() => {
    const map: Record<number, StocktakeCount> = {};
    for (const c of counts) {
      map[c.productId] = c;
    }
    return map;
  }, [counts]);

  // Group products by category
  const categoriesMap = useMemo(() => {
    const map: Record<string, typeof products> = {};
    for (const p of products) {
      const cat = p.category || 'Uncategorized';
      if (!map[cat]) map[cat] = [];
      map[cat].push(p);
    }
    return map;
  }, [products]);

  // Compute total counted and variances
  const totalProducts = products.length;
  const countedCount = Object.keys(countsMap).length;

  const varianceRows = useMemo(() => {
    return counts.filter((c) => c.countedQty !== c.expectedQty);
  }, [counts]);

  const netVariancePesos = useMemo(() => {
    let sum = 0;
    for (const c of counts) {
      const p = products.find((x) => x.id === c.productId);
      const cost = p?.cost_price ?? 0;
      const delta = c.countedQty - c.expectedQty;
      sum += delta * cost;
    }
    return Math.round(sum * 100) / 100;
  }, [counts, products]);

  const allVariancesHaveReasons = useMemo(() => {
    return varianceRows.every((v) =>
      Boolean(reasonsMap[v.productId]?.reasonCode),
    );
  }, [varianceRows, reasonsMap]);

  // Action handlers
  const handleStart = async () => {
    await startMut.mutateAsync(undefined);
    setViewState('counting');
  };

  const handleCountChange = (
    productId: number,
    expectedQty: number,
    countedQty: number,
  ) => {
    if (!activeSession) return;
    upsertMut.mutate({
      sessionId: activeSession.id,
      productId,
      expectedQty,
      countedQty,
    });
  };

  const handleAbandon = () => {
    if (!activeSession) return;
    Alert.alert(t('abandonTitle'), '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: t('abandonConfirm'),
        style: 'destructive',
        onPress: () => abandonMut.mutate(activeSession.id),
      },
    ]);
  };

  const handleCommit = async () => {
    if (!activeSession || !allVariancesHaveReasons) return;
    await commitMut.mutateAsync({
      sessionId: activeSession.id,
      reasonPerLine: reasonsMap,
    });
  };

  // State branch 1: Idle
  if (!activeSession) {
    const lastSession =
      recentSessions.find((s) => s.status === 'completed') ?? null;
    return (
      <ScrollView
        className="flex-1 bg-paper-200 p-4"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <StocktakeStartCard
          lastSession={lastSession}
          onStart={handleStart}
          isStarting={startMut.isPending}
        />
        <StocktakeHistoryList sessions={recentSessions} />
      </ScrollView>
    );
  }

  // State branch 2: Variance Review
  if (viewState === 'variance') {
    return (
      <ScrollView
        className="flex-1 bg-paper-200 p-4"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <StocktakeVarianceSummary
          totalProducts={totalProducts}
          varianceCount={varianceRows.length}
          netVariancePesos={netVariancePesos}
        />

        {counts.map((c) => {
          const product = products.find((x) => x.id === c.productId);
          if (!product) return null;

          return (
            <StocktakeVarianceRow
              key={c.id}
              product={product}
              count={c}
              reasonCode={reasonsMap[c.productId]?.reasonCode ?? null}
              note={reasonsMap[c.productId]?.note ?? ''}
              onReasonChange={(reasonCode) => {
                setReasonsMap((prev) => ({
                  ...prev,
                  [c.productId]: {
                    reasonCode,
                    note: prev[c.productId]?.note ?? '',
                  },
                }));
              }}
              onNoteChange={(note) => {
                setReasonsMap((prev) => ({
                  ...prev,
                  [c.productId]: {
                    reasonCode: prev[c.productId]?.reasonCode ?? 'unexplained',
                    note,
                  },
                }));
              }}
            />
          );
        })}

        <View className="flex-row gap-x-3 mt-4">
          <TouchableOpacity
            onPress={() => setViewState('counting')}
            className="flex-1 bg-paper-100 border border-paper-300 py-3.5 rounded-xl items-center"
          >
            <StyledText variant="bold" className="text-ink-700">
              Back to Count
            </StyledText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCommit}
            disabled={!allVariancesHaveReasons || commitMut.isPending}
            className={`flex-1 py-3.5 rounded-xl items-center ${
              allVariancesHaveReasons ? 'bg-persimmon-500' : 'bg-paper-300'
            }`}
          >
            <StyledText
              variant="extrabold"
              className={
                allVariancesHaveReasons ? 'text-paper-50' : 'text-ink-400'
              }
            >
              {t('commitCta')}
            </StyledText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // State branch 3: Counting
  return (
    <View className="flex-1 bg-paper-200">
      <View className="bg-paper-50 px-4 py-3 border-b border-paper-300 flex-row items-center justify-between">
        <StyledText variant="semibold" className="text-ink-800 text-xs">
          {t('progressLabel', { counted: countedCount, total: totalProducts })}
        </StyledText>
      </View>

      <ScrollView
        className="flex-1 p-4"
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {Object.entries(categoriesMap).map(([catName, catProducts]) => (
          <StocktakeCategorySection
            key={catName}
            categoryName={catName}
            products={catProducts}
            countsMap={countsMap}
            onCountChange={handleCountChange}
          />
        ))}
      </ScrollView>

      {/* Footer controls */}
      <View className="bg-paper-50 p-4 border-t border-paper-300 flex-row gap-x-3">
        <TouchableOpacity
          onPress={handleAbandon}
          className="bg-rose-50 border border-rose-200 px-4 py-3 rounded-xl items-center"
        >
          <StyledText variant="bold" className="text-rose-700 text-xs">
            {t('saveQuitCta')}
          </StyledText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setViewState('variance')}
          className="flex-1 bg-persimmon-500 py-3 rounded-xl items-center"
        >
          <StyledText variant="extrabold" className="text-paper-50 text-sm">
            {t('finishReviewCta')}
          </StyledText>
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Commit Task 6**

```bash
git add app/\(tabs\)/inventory/stocktake.tsx
git commit -m "feat(stocktake): add stocktake main screen flow"
```

---

### Task 7: Soft-Block Guards on Stock Adjustments

**Files:**

- Modify: `components/inventory/products/ProductActionMenuModal.tsx:80-97`
- Modify: `components/inventory/ledger/LogTransactionForm.tsx:75-105`
- Create: `tests/components/LogTransactionForm.guards.test.tsx`
- Create: `tests/components/ProductActionMenuModal.guards.test.tsx`

**Interfaces:**

- Consumes: `useStocktakeGuard` from `@/hooks/useStocktake`
- Produces: Soft-blocked manual stock adjustments during active stocktake session.

- [ ] **Step 1: Update `ProductActionMenuModal.tsx`**

Modify `components/inventory/products/ProductActionMenuModal.tsx` to read `useStocktakeGuard()` and disable "Mark Damaged" and "Adjust Stock" when active:

```tsx
// Add import at top
import { useStocktakeGuard } from '@/hooks/useStocktake';

// Inside ProductActionMenuModal component:
export function ProductActionMenuModal({
  visible,
  product,
  onClose,
  onEdit,
  onAdjustStock,
  onMarkDamaged,
  onViewLedger,
  onDelete,
}: ProductActionMenuModalProps) {
  const stocktakeGuard = useStocktakeGuard();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* ... header ... */}
      <View className="gap-y-1 mt-2">
        <ActionRow
          icon="ban"
          iconColor={stocktakeGuard.isActive ? '#A1978A' : '#C22D2D'}
          label={stocktakeGuard.isActive ? 'Mark Damaged (Stocktake in progress)' : 'Mark Damaged'}
          disabled={stocktakeGuard.isActive}
          onPress={() => {
            if (stocktakeGuard.isActive) return;
            onClose();
            onMarkDamaged(product.id);
          }}
        />
        <ActionRow
          icon="sliders"
          iconColor={stocktakeGuard.isActive ? '#A1978A' : '#564E45'}
          label={stocktakeGuard.isActive ? 'Adjust Stock (Stocktake in progress)' : 'Adjust Stock'}
          disabled={stocktakeGuard.isActive}
          onPress={() => {
            if (stocktakeGuard.isActive) return;
            onClose();
            onAdjustStock(product.id);
          }}
        />
        {/* ... remaining actions ... */}
```

And update `ActionRowProps`:

```tsx
interface ActionRowProps {
  icon: keyof typeof FontAwesome.glyphMap;
  iconColor?: string;
  label: string;
  disabled?: boolean;
  onPress: () => void;
}

function ActionRow({
  icon,
  iconColor = '#564E45',
  label,
  disabled = false,
  onPress,
}: ActionRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      className={`min-h-[44px] px-3 rounded-xl flex-row items-center gap-x-3 ${
        disabled ? 'opacity-50' : 'active:bg-paper-100'
      }`}
    >
      <FontAwesome name={icon} size={16} color={iconColor} />
      <StyledText variant="extrabold" className="text-base text-ink-800">
        {label}
      </StyledText>
    </Pressable>
  );
}
```

- [ ] **Step 2: Update `LogTransactionForm.tsx`**

Modify `components/inventory/ledger/LogTransactionForm.tsx` to read `useStocktakeGuard()` and render warning when `initialType` is `adjustment` or `damaged` during an active session:

```tsx
// Add import
import { useStocktakeGuard } from '@/hooks/useStocktake';

// Inside LogTransactionFormInner:
const stocktakeGuard = useStocktakeGuard();
const isBlocked =
  stocktakeGuard.isActive &&
  (form.type === 'adjustment' || form.type === 'damaged');

if (isBlocked) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="w-full bg-paper-50 rounded-t-2xl p-6 shadow-modal border-t border-ink-100 gap-y-4">
          <StyledText variant="extrabold" className="text-xl text-ink-900">
            Stocktake in Progress
          </StyledText>
          <StyledText variant="medium" className="text-ink-600 text-sm">
            Manual adjustments and marking damaged goods are paused during a
            physical count to prevent inventory drift.
          </StyledText>
          <TouchableOpacity
            onPress={onClose}
            className="bg-persimmon-500 py-3 rounded-xl items-center"
          >
            <StyledText variant="extrabold" className="text-paper-50 text-sm">
              Got it
            </StyledText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
```

- [ ] **Step 3: Write tests for guards in `tests/components/LogTransactionForm.guards.test.tsx` and `tests/components/ProductActionMenuModal.guards.test.tsx`**

Create `tests/components/LogTransactionForm.guards.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { LogTransactionForm } from '@/components/inventory/ledger/LogTransactionForm';
import { useStocktakeGuard } from '@/hooks/useStocktake';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@/hooks/useStocktake', () => ({
  useStocktakeGuard: jest.fn(),
}));

jest.mock('@/hooks/useProducts', () => ({
  useProducts: () => ({
    getAllProductsQuery: {
      data: [
        { id: 1, name: 'Sample Product', sku: 'SKU1', price: 10, quantity: 5 },
      ],
    },
  }),
}));

describe('LogTransactionForm guards', () => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('blocks adjustment type when stocktake is active', () => {
    (useStocktakeGuard as jest.Mock).mockReturnValue({
      isActive: true,
      reason: 'Stocktake in progress',
    });

    const { getByText } = render(
      <LogTransactionForm
        visible
        initialType="adjustment"
        onClose={jest.fn()}
      />,
      { wrapper },
    );

    expect(getByText(/Stocktake in Progress/i)).toBeTruthy();
  });
});
```

Create `tests/components/ProductActionMenuModal.guards.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { ProductActionMenuModal } from '@/components/inventory/products/ProductActionMenuModal';
import { useStocktakeGuard } from '@/hooks/useStocktake';

jest.mock('@/hooks/useStocktake', () => ({
  useStocktakeGuard: jest.fn(),
}));

describe('ProductActionMenuModal guards', () => {
  it('disables Adjust Stock and Mark Damaged during active stocktake', () => {
    (useStocktakeGuard as jest.Mock).mockReturnValue({
      isActive: true,
      reason: 'Stocktake in progress',
    });

    const product = {
      id: 1,
      name: 'Test Prod',
      sku: 'SKU1',
      price: 10,
      quantity: 5,
      cost_price: 5,
      category: 'General',
      created_at: 1000,
      updated_at: 1000,
    };

    const { getByText } = render(
      <ProductActionMenuModal
        visible
        product={product}
        onClose={jest.fn()}
        onEdit={jest.fn()}
        onAdjustStock={jest.fn()}
        onMarkDamaged={jest.fn()}
        onViewLedger={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    expect(getByText(/Mark Damaged \(Stocktake in progress\)/i)).toBeTruthy();
    expect(getByText(/Adjust Stock \(Stocktake in progress\)/i)).toBeTruthy();
  });
});
```

- [ ] **Step 4: Run guard unit tests**

Run command:
`npm test -- tests/components/LogTransactionForm.guards.test.tsx tests/components/ProductActionMenuModal.guards.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit Task 7**

```bash
git add components/inventory/products/ProductActionMenuModal.tsx components/inventory/ledger/LogTransactionForm.tsx tests/components/LogTransactionForm.guards.test.tsx tests/components/ProductActionMenuModal.guards.test.tsx
git commit -m "feat(stocktake): apply useStocktakeGuard soft-blocks to adjustment surfaces"
```

---

### Task 8: Verification & Verification Suite

**Files:**

- None (runs validation commands)

- [ ] **Step 1: Run typecheck**

Run: `npm run typecheck`
Expected: 0 errors.

- [ ] **Step 2: Run full test suite**

Run: `npm test`
Expected: All tests pass.

- [ ] **Step 3: Run verify command**

Run: `npm run verify`
Expected: PASS.
