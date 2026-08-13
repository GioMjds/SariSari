import { db } from '@/configs';
import { Pesos } from '@/lib';
import {
  SaleCorrection,
  SaleCorrectionLine,
  SaleCorrectionReportRow,
} from '@/types/corrections.types';

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

interface RawSaleCorrectionReportRow extends RawSaleCorrectionRow {
  sale_total: number | null;
}

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
    cursor?: number;
    limit?: number;
  } = {},
): Promise<CorrectionsReportPage> => {
  const limit = Math.max(1, Math.floor(opts.limit ?? 50));
  const cursor = opts.cursor ?? Number.MAX_SAFE_INTEGER;

  const rows = await db.getAllAsync<RawSaleCorrectionReportRow>(
    `SELECT sc.*, s.total AS sale_total
     FROM sale_corrections sc
     LEFT JOIN sales s ON s.id = sc.sale_id
     WHERE sc.id < ?
     ORDER BY sc.id DESC
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
