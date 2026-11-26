import type { SariState } from '@/components/mascot';
import type {
  DynamicHomeAlert,
  HomeAlertType,
} from '@/hooks/useSystemNotifications';

export interface AlertSummary {
  out: number;
  low: number;
  nearLimit: number;
  overdueCount: number;
  overdueAmount: number;
  mood: SariState;
}

const MOOD: Record<HomeAlertType, SariState> = {
  low_stock: 'low-stock',
  overdue_debts: 'outstanding-balance',
  near_limit: 'utang',
};

/** Counts per kind plus Sari's mood, taken from the most pressing alert. */
export function summarizeAlerts(alerts: DynamicHomeAlert[]): AlertSummary {
  const s: AlertSummary = {
    out: 0,
    low: 0,
    nearLimit: 0,
    overdueCount: 0,
    overdueAmount: 0,
    mood: 'balance-cleared',
  };
  for (const a of alerts) {
    if (a.type === 'low_stock') {
      if (a.quantity === 0) s.out += 1;
      else s.low += 1;
    } else if (a.type === 'near_limit') s.nearLimit += 1;
    else {
      s.overdueCount += 1;
      s.overdueAmount += a.amount ?? 0;
    }
  }
  const lead = alerts.find((a) => a.urgent) ?? alerts[0];
  if (lead) s.mood = MOOD[lead.type];
  return s;
}
