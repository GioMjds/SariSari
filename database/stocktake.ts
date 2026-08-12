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
        [countId, sessionId, p.id, p.quantity, p.quantity],
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
