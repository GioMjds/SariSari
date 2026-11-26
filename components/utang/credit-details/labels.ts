import type { TFunction } from 'i18next';
import { format } from 'date-fns';
import type { OverdueProximity } from '@/lib/creditDetails';
import type { Payment } from '@/types/credits.types';

/** Localized due/overdue label, or null when nothing is due soon. */
export function proximityLabel(
  t: TFunction,
  p: OverdueProximity,
): string | null {
  if (p.tier === 'overdue') {
    return p.daysOffset === 1
      ? t('detailStatusOverdueSingular')
      : t('detailStatusOverduePlural', { count: p.daysOffset });
  }
  if (p.tier === 'due-soon') {
    if (p.daysOffset === 0) return t('detailStatusDueToday');
    if (p.daysOffset === -1) return t('detailStatusDueTomorrow');
    return t('detailStatusDueIn', { count: Math.abs(p.daysOffset) });
  }
  return null;
}

export function methodLabel(t: TFunction, method: Payment['payment_method']) {
  if (method === 'cash') return t('detailMethodCash');
  if (method === 'bank_transfer') return t('detailMethodBank');
  return t('detailMethodOther');
}

/** Short date that only shows the year when it is not the current one. */
export function shortDate(date: Date, now: Date = new Date()): string {
  return format(
    date,
    date.getFullYear() === now.getFullYear() ? 'MMM d' : 'MMM d, yyyy',
  );
}
