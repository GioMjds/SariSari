/**
 * creditDetails — helpers for the credit-details (suki profile) screen.
 *
 * Pure functions used by CustomerHeroCard, UtangCard, and the
 * statement-share feature. Lives in `lib/` because it has no
 * dependency on React, the DB, or any UI primitives — just date math
 * and string formatting.
 *
 * Conventions:
 *   • Money is integer pesos. `formatPesos` is the single source of truth.
 *   • Dates come from `parseStoredTimestamp` (utils/timezone).
 *   • The "current date" is injected (default = now) so tests can pin it.
 */

import { formatPesos } from '@/lib/money';
import {
  CreditHistory,
  CreditTransaction,
  Customer,
  Payment,
} from '@/types/credits.types';
import { parseStoredTimestamp } from '@/utils/timezone';

/* ─── Overdue proximity classification ─────────────────────────────── */

/**
 * Proximity tier for a single credit transaction.
 *  • `overdue` — due_date is in the past.
 *  • `due-soon` — due within 3 days (including today).
 *  • `safe` — due further out, or no due date set.
 *
 * `daysOffset` carries the signed day delta so the caller can render
 * either "X days overdue" or "Due in X days" without re-deriving it.
 */
export type OverdueProximity = {
  tier: 'overdue' | 'due-soon' | 'safe' | 'paid';
  /** Days past due (positive) or days until due (negative). 0 for today. */
  daysOffset: number;
};

const DUE_SOON_WINDOW_DAYS = 3;

export function classifyOverdue(
  credit: Pick<CreditTransaction, 'status' | 'due_date'>,
  now: Date = new Date(),
): OverdueProximity {
  // Paid credits are never "overdue" regardless of due_date.
  if (credit.status === 'paid') return { tier: 'paid', daysOffset: 0 };

  if (!credit.due_date) return { tier: 'safe', daysOffset: 0 };

  const due = parseStoredTimestamp(credit.due_date);
  if (!due) return { tier: 'safe', daysOffset: 0 };

  // Use UTC midnight comparison so timezone shifts can't push a credit
  // a day across the boundary unexpectedly. We compare day-deltas, not
  // raw timestamps.
  const dueDay = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());
  const nowDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const MS_PER_DAY = 86_400_000;
  const daysOffset = Math.round((nowDay - dueDay) / MS_PER_DAY);

  if (daysOffset > 0) return { tier: 'overdue', daysOffset };
  if (daysOffset >= -DUE_SOON_WINDOW_DAYS) {
    return { tier: 'due-soon', daysOffset };
  }
  return { tier: 'safe', daysOffset };
}

/**
 * Human label for the proximity tier — e.g. "3 days overdue",
 * "Due tomorrow", "Due in 3 days".
 */
export function overdueLabel(proximity: OverdueProximity): string {
  if (proximity.tier === 'overdue') {
    return proximity.daysOffset === 1
      ? '1 day overdue'
      : `${proximity.daysOffset} days overdue`;
  }
  if (proximity.tier === 'due-soon') {
    if (proximity.daysOffset === 0) return 'Due today';
    if (proximity.daysOffset === -1) return 'Due tomorrow';
    return `Due in ${Math.abs(proximity.daysOffset)} days`;
  }
  return '';
}

/* ─── Trust score + tags ────────────────────────────────────────────── */

/**
 * Lifetime credit volume in integer pesos. Sums every credit
 * transaction ever taken (paid or not). The store owner uses this to
 * gauge how much business this suki has given over time.
 */
export function lifetimeCreditVolume(credits: CreditTransaction[]): number {
  return credits.reduce((sum, c) => sum + (c.amount ?? 0), 0);
}

/**
 * Suki trust tags derived from the customer's full ledger.
 *  • Good payer — settles credits on average within 7 days of taking them.
 *  • Frequent suki — 10 or more credit transactions on file.
 *  • Needs follow-up — has any credit overdue by more than 15 days.
 *
 * Multiple tags can apply simultaneously. Caller renders each as a
 * pill; absence of any tag means "no signal yet."
 */
export type TrustTag = 'good_payer' | 'frequent_suki' | 'needs_followup';

export function deriveTrustTags(
  customer: Pick<Customer, 'outstanding_balance'>,
  credits: CreditTransaction[],
  payments: Payment[],
  options: { daysOverdue?: number } = {},
  now: Date = new Date(),
): TrustTag[] {
  const tags: TrustTag[] = [];

  if (credits.length >= 10) tags.push('frequent_suki');

  if (
    customer.outstanding_balance > 0 &&
    (options.daysOverdue ?? 0) > 15
  ) {
    tags.push('needs_followup');
  }

  // "Good payer" is the inverse signal: across all *fully paid*
  // credits, average days between credit date and payment date is
  // under 7. Without enough paid credits, the signal is too thin to
  // claim.
  const paidCreditById = new Map<number, CreditTransaction>();
  for (const c of credits) {
    if (c.status === 'paid') paidCreditById.set(c.id, c);
  }

  if (paidCreditById.size >= 1) {
    // Sum (latest payment date - credit date) per fully-paid credit,
    // then average. `payments` already came back from DB ordered by
    // date DESC, so `payments[0]` is the most recent payment for that
    // customer; we re-derive per-credit by joining on credit_transaction_id.
    const daysPerCredit: number[] = [];

    for (const credit of paidCreditById.values()) {
      const settlingPayment = payments.find(
        (p) => p.credit_transaction_id === credit.id,
      );
      // If the payment row didn't pin a single credit (FIFO), the
      // matching can be fuzzy; in that case use the latest payment
      // overall as a reasonable proxy.
      const paymentDateStr = settlingPayment
        ? settlingPayment.date
        : payments[0]?.date;
      if (!paymentDateStr) continue;

      const creditDate = parseStoredTimestamp(credit.date);
      const paymentDate = parseStoredTimestamp(paymentDateStr);
      if (!creditDate || !paymentDate) continue;

      const deltaMs =
        paymentDate.getTime() - creditDate.getTime();
      if (deltaMs < 0) continue; // data glitch, ignore

      daysPerCredit.push(deltaMs / 86_400_000);
    }

    if (daysPerCredit.length > 0) {
      const avgDays =
        daysPerCredit.reduce((a, b) => a + b, 0) / daysPerCredit.length;
      if (avgDays < 7) tags.push('good_payer');
    }
  }

  // Silence unused parameter lint when callers don't pass `now`.
  void now;
  return tags;
}

/* ─── Debt-to-limit warning ─────────────────────────────────────────── */

export type DebtLimitState = {
  /** 0..1 ratio (can exceed 1 when over limit). */
  ratio: number;
  /** Tone used by the CustomerHeroCard to color the warning. */
  tone: 'safe' | 'warning' | 'over-limit';
  /** Human-readable surplus over the limit (only when over). */
  surplusPesos: number;
};

export function classifyDebtLimit(
  outstanding: number,
  creditLimit: number | null | undefined,
): DebtLimitState | null {
  if (!creditLimit || creditLimit <= 0) return null;

  const ratio = outstanding / creditLimit;
  const surplusPesos = Math.max(0, outstanding - creditLimit);
  const tone: DebtLimitState['tone'] =
    ratio >= 1 ? 'over-limit' : ratio >= 0.8 ? 'warning' : 'safe';

  return { ratio, tone, surplusPesos };
}

/* ─── Statement text ────────────────────────────────────────────────── */

/**
 * Build the SMS/Viber-friendly statement for the suki. Aggregates
 * the customer's active (unpaid/partial) credits into a clean
 * plain-text block that the store owner can copy-and-paste.
 *
 * Format mirrors the spec doc; line widths are kept short so the
 * preview pane of most messengers doesn't truncate.
 */
export function buildStatement(opts: {
  storeName: string;
  customer: Pick<Customer, 'name' | 'outstanding_balance'> & {
    days_overdue?: number;
  };
  credits: CreditTransaction[];
}): string {
  const { storeName, customer, credits } = opts;

  const lines: string[] = [];
  lines.push(`Kumusta! Here is a statement from ${storeName}:`);
  lines.push('');
  lines.push(`Suki: ${customer.name}`);
  lines.push(`Outstanding Balance: ${formatPesos(customer.outstanding_balance)}`);
  lines.push(
    `Overdue: ${
      customer.days_overdue && customer.days_overdue > 0
        ? `${customer.days_overdue} ${customer.days_overdue === 1 ? 'day' : 'days'}`
        : 'None'
    }`,
  );
  lines.push('');
  lines.push('Recent Unpaid Items:');

  const active = credits.filter((c) => c.status !== 'paid');
  if (active.length === 0) {
    lines.push('- (no active credits)');
  } else {
    // Sort newest-first so the most pressing item leads.
    const sorted = [...active].sort((a, b) => {
      const aDate = parseStoredTimestamp(a.date)?.getTime() ?? 0;
      const bDate = parseStoredTimestamp(b.date)?.getTime() ?? 0;
      return bDate - aDate;
    });

    for (const c of sorted) {
      const date = parseStoredTimestamp(c.date);
      const dateLabel = date ? date.toISOString().slice(0, 10) : 'unknown';
      const product = c.product_name || 'Credit';
      const remaining = c.amount - c.amount_paid;
      lines.push(
        `- ${dateLabel}: ${product} (${formatPesos(c.amount)} – ${formatPesos(
          remaining,
        )} unpaid)`,
      );
    }
  }

  lines.push('');
  lines.push('Please settle at your convenience. Maraming salamat!');

  return lines.join('\n');
}

/* ─── Local search filter ───────────────────────────────────────────── */

/**
 * Filter credits/payments by a local search term. Matches against
 * product name (for credits), notes (both), and amount-as-string
 * (so typing "120" surfaces ₱120 / ₱1,200 items).
 *
 * Empty query returns the original list untouched.
 */
export function matchesSearch(
  term: string,
  haystacks: Array<string | null | undefined>,
): boolean {
  if (!term.trim()) return true;
  const needle = term.trim().toLowerCase();
  return haystacks.some((h) => (h ?? '').toLowerCase().includes(needle));
}

/* ─── History rendering helpers ─────────────────────────────────────── */

/**
 * Stable label for a history row's `description` field. Falls back
 * through credit → notes → "Credit" / "Payment" so the timeline
 * never shows an empty entry.
 */
export function describeHistoryEntry(
  item: Pick<CreditHistory, 'type' | 'description'>,
): string {
  return item.description?.trim() || (item.type === 'credit' ? 'Credit' : 'Payment');
}
