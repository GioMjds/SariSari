import { db } from '../configs/sqlite';
import type {
  EmptiesBalance,
  EmptiesMovementKind,
  SwapCountInput,
  SwapCountResult,
} from '../types/supplierEmpties.types';
import { getCurrentLocalTimestamp } from '../utils/timezone';

const isCount = (n: number) => Number.isInteger(n) && n >= 0;

const addMovementTx = async (
  emptiesId: number,
  delta: number,
  kind: EmptiesMovementKind,
  note: string | null,
) => {
  if (delta === 0) return;
  await db.runAsync(
    `INSERT INTO empties_movements (empties_id, delta, kind, note, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [emptiesId, delta, kind, note, getCurrentLocalTimestamp()],
  );
};

const getOwed = async (emptiesId: number): Promise<number> => {
  const row = await db.getFirstAsync<{ owed: number }>(
    'SELECT COALESCE(SUM(delta), 0) AS owed FROM empties_movements WHERE empties_id = ?',
    [emptiesId],
  );
  return row?.owed ?? 0;
};

export const createEmptiesType = async (
  supplierId: string,
  name: string,
  depositPesos: number,
): Promise<number> => {
  if (!name.trim()) throw new Error('Name is required');
  if (!isCount(depositPesos)) throw new Error('Deposit must be a whole peso amount');
  const result = await db.runAsync(
    'INSERT INTO supplier_empties (supplier_id, name, deposit_pesos) VALUES (?, ?, ?)',
    [supplierId, name.trim(), depositPesos],
  );
  return result.lastInsertRowId;
};

export const getEmptiesBalances = async (
  supplierId: string,
): Promise<EmptiesBalance[]> => {
  const rows = await db.getAllAsync<{
    id: number;
    supplier_id: string;
    name: string;
    deposit_pesos: number;
    owed: number;
  }>(
    `SELECT e.id, e.supplier_id, e.name, e.deposit_pesos,
            COALESCE(SUM(m.delta), 0) AS owed
     FROM supplier_empties e
     LEFT JOIN empties_movements m ON m.empties_id = e.id
     WHERE e.supplier_id = ? AND e.archived_at IS NULL
     GROUP BY e.id ORDER BY e.name`,
    [supplierId],
  );
  return rows.map((r) => ({
    id: r.id,
    supplierId: r.supplier_id,
    name: r.name,
    depositPesos: r.deposit_pesos,
    owed: r.owed,
    pesosAtRisk: Math.max(r.owed, 0) * r.deposit_pesos,
  }));
};

/** Empties still owed per supplier, for list badges; only positive totals are returned. */
export const getAllEmptiesOwed = async (): Promise<Map<string, number>> => {
  const rows = await db.getAllAsync<{ supplier_id: string; owed: number }>(
    `SELECT e.supplier_id, SUM(m.delta) AS owed
     FROM supplier_empties e
     JOIN empties_movements m ON m.empties_id = e.id
     WHERE e.archived_at IS NULL
     GROUP BY e.supplier_id
     HAVING SUM(m.delta) > 0`,
  );
  return new Map(rows.map((r) => [r.supplier_id, r.owed]));
};

/** Preview of a swap count: owed after the swap versus what the owner holds. */
export const previewSwapCount = async (
  input: SwapCountInput,
): Promise<SwapCountResult> => {
  const type = await db.getFirstAsync<{ deposit_pesos: number }>(
    'SELECT deposit_pesos FROM supplier_empties WHERE id = ?',
    [input.emptiesId],
  );
  if (!type) throw new Error('Empties type not found');
  const expectedOwed =
    (await getOwed(input.emptiesId)) + input.receivedFull - input.handedBack;
  // Owner keeps no full bottles in this count, so owed empties should equal physical holdings.
  const shortfall = expectedOwed - input.physicalCount;
  return {
    expectedOwed,
    shortfall,
    shortfallPesos: Math.max(shortfall, 0) * type.deposit_pesos,
  };
};

/** Records one swap: full received, empties handed back, and the physical count as an adjustment. */
export const recordSwapCount = async (
  input: SwapCountInput,
  note: string | null = null,
): Promise<SwapCountResult> => {
  for (const n of [input.receivedFull, input.handedBack, input.physicalCount]) {
    if (!isCount(n)) throw new Error('Counts must be whole numbers, zero or more');
  }
  let result!: SwapCountResult;
  await db.withTransactionAsync(async () => {
    result = await previewSwapCount(input);
    await addMovementTx(input.emptiesId, input.receivedFull, 'received_full', note);
    await addMovementTx(input.emptiesId, -input.handedBack, 'handed_back', note);
    // Writing off the gap resets the ledger to what the owner physically holds.
    await addMovementTx(input.emptiesId, -result.shortfall, 'count_adjust', note);
  });
  return result;
};
