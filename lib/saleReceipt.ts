import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { format } from 'date-fns';
import type { SaleWithItems } from '@/types';
import { formatReceiptRef, getCancelledKind } from '@/utils/receipts';
import { soldQty } from '@/utils/saleItems';
import { parseStoredTimestamp } from '@/utils/timezone';
import { formatPesos } from './money';
import { escapeHtml } from './pdfGenerator';

// Customer-facing lines only: never cost or profit.
const receiptLines = (sale: SaleWithItems) =>
  sale.items.map((item) => {
    const qty = soldQty(item);
    const unit = item.sold_unit_name ?? 'pc';
    return {
      name: item.product_name,
      detail: `${qty} ${unit} x ${formatPesos(item.price)}`,
      total: formatPesos(qty * item.price),
    };
  });

const receiptHeader = (sale: SaleWithItems) => {
  const ts = parseStoredTimestamp(sale.timestamp) ?? new Date();
  const cancelled = getCancelledKind(sale);
  const payment = sale.payment_type === 'credit' ? 'Utang (credit)' : 'Cash';
  return {
    ref: formatReceiptRef(sale.id),
    date: format(ts, 'MMM d, yyyy h:mm a'),
    status: cancelled ? cancelled.stamp : payment,
    customer: sale.customer_name?.trim() || null,
  };
};

// Plain-text resibo for SMS or chat apps.
export function buildSaleReceiptText(sale: SaleWithItems, storeName: string): string {
  const head = receiptHeader(sale);
  const rows = receiptLines(sale).map((l) => `${l.name}\n  ${l.detail}  ${l.total}`);
  return [
    storeName,
    `Resibo ${head.ref}`,
    head.date,
    head.customer ? `Customer: ${head.customer}` : null,
    `Payment: ${head.status}`,
    '------------------------',
    ...rows,
    '------------------------',
    `TOTAL: ${formatPesos(sale.total)}`,
    '',
    'Salamat sa iyong pagbili!',
  ]
    .filter((line) => line !== null)
    .join('\n');
}

// Black-and-white, narrow layout that also prints cleanly on 58mm or 80mm thermal paper.
export function buildSaleReceiptHtml(sale: SaleWithItems, storeName: string): string {
  const head = receiptHeader(sale);
  const rows = receiptLines(sale)
    .map(
      (l) => `<tr><td><b>${escapeHtml(l.name)}</b><br/><span class="muted">${escapeHtml(l.detail)}</span></td><td class="amt">${escapeHtml(l.total)}</td></tr>`,
    )
    .join('');
  const struck = sale.cancelled_at ? ' style="text-decoration:line-through"' : '';

  return `<!doctype html><html><head><meta charset="utf-8"/>
<style>
  body { font-family: -apple-system, Roboto, sans-serif; color: #000; max-width: 80mm; margin: 0 auto; padding: 12px; font-size: 13px; }
  h1 { font-size: 18px; text-align: center; margin: 0 0 4px; }
  .center { text-align: center; } .muted { color: #444; font-size: 12px; }
  .rule { border-top: 1px dashed #000; margin: 10px 0; }
  table { width: 100%; border-collapse: collapse; } td { padding: 4px 0; vertical-align: top; }
  .amt { text-align: right; white-space: nowrap; padding-left: 8px; }
  .total { font-size: 18px; font-weight: 800; }
  .stamp { display: inline-block; border: 2px solid #000; padding: 2px 8px; font-weight: 800; letter-spacing: 1px; }
</style></head><body>
  <h1>${escapeHtml(storeName)}</h1>
  <div class="center muted">Resibo ${escapeHtml(head.ref)} &middot; ${escapeHtml(head.date)}</div>
  <div class="center" style="margin-top:8px"><span class="stamp">${escapeHtml(head.status.toUpperCase())}</span></div>
  ${head.customer ? `<div class="center" style="margin-top:6px">Customer: <b>${escapeHtml(head.customer)}</b></div>` : ''}
  <div class="rule"></div>
  <table>${rows}</table>
  <div class="rule"></div>
  <table><tr><td class="total">TOTAL</td><td class="amt total"${struck}>${escapeHtml(formatPesos(sale.total))}</td></tr></table>
  <div class="rule"></div>
  <div class="center muted">Salamat sa iyong pagbili.</div>
</body></html>`;
}

// Renders the resibo to PDF and opens the native share drawer; returns false on failure.
export async function shareSaleReceiptPdf(sale: SaleWithItems, storeName: string): Promise<boolean> {
  try {
    const { uri } = await Print.printToFileAsync({ html: buildSaleReceiptHtml(sale, storeName), base64: false });
    const ref = formatReceiptRef(sale.id);
    const pdf = new File(Paths.cache, `SariSari_Resibo_${ref}.pdf`);
    if (pdf.exists) pdf.delete();
    new File(uri).copy(pdf);

    if (!(await Sharing.isAvailableAsync())) return false;
    await Sharing.shareAsync(pdf.uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Resibo ${ref}`,
      UTI: 'com.adobe.pdf',
    });

    try {
      if (pdf.exists) pdf.delete();
    } catch {
      // Cache cleanup is best effort.
    }
    return true;
  } catch (error) {
    console.error('Failed to generate or share sale resibo PDF:', error);
    return false;
  }
}
