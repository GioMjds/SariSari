import { db } from '@/configs';
import { Pesos } from '@/lib';
import {
  SaleCorrection,
  SaleCorrectionLine,
  SaleCorrectionReportRow,
} from '@/types/corrections.types';

export const initCorrectionsTable = async (): Promise<void> => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sale_corrections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL REFERENCES sales(id),
      kind TEXT NOT NULL CHECK(kind IN ('void','refund','price_correction')),
      actor_reason_code TEXT NOT NULL,
      actor_note TEXT,
      actor_user TEXT NOT NULL,
      witness_user TEXT,
      refund_payment_type TEXT CHECK(refund_payment_type IN ('cash') OR refund_payment_type IS NULL),
      sale_total INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CHECK (kind <> 'refund' OR refund_payment_type IS NOT NULL)
    );

    CREATE INDEX IF NOT EXISTS idx_sale_corrections_sale_id ON sale_corrections(sale_id);
    CREATE INDEX IF NOT EXISTS idx_sale_corrections_created_at ON sale_corrections(created_at DESC, id DESC);

    CREATE TABLE IF NOT EXISTS sale_correction_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      correction_id INTEGER NOT NULL REFERENCES sale_corrections(id) ON DELETE CASCADE,
      sale_item_id INTEGER NOT NULL REFERENCES sale_items(id),
      old_price INTEGER NOT NULL,
      new_price INTEGER NOT NULL,
      price_delta INTEGER NOT NULL,
      CHECK (price_delta <> 0)
    );

    CREATE INDEX IF NOT EXISTS idx_sale_correction_lines_correction_id ON sale_correction_lines(correction_id);
  `);
};

interface SaleCorrectionWithLines extends SaleCorrection {
  lines: SaleCorrectionLine[];
}

interface RawSaleCorrectionRow {
  id: number;
  sale_id: number;
  kind: SaleCorrection['kind'];
  actor_reason_code: string;
  actor_note: string | null;
  actor_user: string;
  witness_user: string | null;
  refund_payment_type: SaleCorrection['refundPaymentType'] | null;
  sale_total: number | null;
  created_at: Date;
}

interface RawSaleCorrectionLineRow {
  id: number;
  correction_id: number;
  sale_item_id: number;
  old_price: number;
  new_price: number;
  price_delta: number;
}

interface RawSaleCorrectionReportRow extends RawSaleCorrectionRow {}

const mapRow = (row: RawSaleCorrectionRow): SaleCorrection => ({
  id: row.id,
  saleId: row.sale_id,
  kind: row.kind,
  actorReasonCode: row.actor_reason_code,
  actorNote: row.actor_note ?? null,
  actorUser: row.actor_user,
  witnessUser: row.witness_user ?? null,
  refundPaymentType: row.refund_payment_type ?? null,
  createdAt: row.created_at,
});

export const getCorrectionsForSale = async (
  saleId: number,
): Promise<SaleCorrectionWithLines[]> => {
  const headerRows = await db.getAllAsync<RawSaleCorrectionRow>(
    `SELECT * FROM sale_corrections WHERE sale_id = ? ORDER BY created_at ASC, id ASC`,
    [saleId],
  );
  if (headerRows.length === 0) return [];

  const correctionIds = headerRows.map((r) => r.id);
  const placeholders = correctionIds.map(() => '?').join(',');
  const lineRows = await db.getAllAsync<RawSaleCorrectionLineRow>(
    `SELECT * FROM sale_correction_lines WHERE correction_id IN (${placeholders})`,
    correctionIds,
  );

  const linesByCorrection = new Map<number, SaleCorrectionLine[]>();
  for (const row of lineRows) {
    const line = {
      id: row.id,
      correctionId: row.correction_id,
      saleItemId: row.sale_item_id,
      oldPrice: row.old_price as Pesos,
      newPrice: row.new_price as Pesos,
      priceDelta: row.price_delta,
    } satisfies SaleCorrectionLine;
    const list = linesByCorrection.get(row.correction_id) ?? [];
    list.push(line);
    linesByCorrection.set(row.correction_id, list);
  }

  return headerRows.map((row) => ({
    ...mapRow(row),
    lines: linesByCorrection.get(row.id) ?? [],
  }));
};

export interface CorrectionsReportPage {
  items: SaleCorrectionReportRow[];
  nextCursor: number | null;
}

/**
 * Paginated audit log, newest first. Cursor is the `id` of the last row
 * in the previous page (DESC scan, simple keyset pagination).
 */
export const getCorrectionsReport = async (
  opts: {
    cursor?: number | undefined;
    limit?: number | undefined;
  } = {},
): Promise<CorrectionsReportPage> => {
  const limit = Math.max(1, Math.floor(opts.limit ?? 50));
  const cursor = opts.cursor ?? Number.MAX_SAFE_INTEGER;

  const rows = await db.getAllAsync<RawSaleCorrectionReportRow>(
    `SELECT *
     FROM sale_corrections
     WHERE id < ?
     ORDER BY id DESC
     LIMIT ?`,
    [cursor, limit],
  );

  const items = rows.map((row) => ({
    ...mapRow(row),
    saleTotalAtCorrection: (row.sale_total ?? 0) as Pesos,
  })) satisfies SaleCorrectionReportRow[];

  const lastId = items[items.length - 1]?.id ?? null;
  const nextCursor = items.length === limit && lastId !== null ? lastId : null;

  return { items, nextCursor };
};
