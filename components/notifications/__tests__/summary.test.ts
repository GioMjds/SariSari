import { summarizeAlerts } from '../summary';
import type { DynamicHomeAlert } from '@/hooks/useSystemNotifications';

const base = { title: 'x', subtitle: 'x', imageUri: null };

describe('summarizeAlerts', () => {
  it('is clear and happy with no alerts', () => {
    const s = summarizeAlerts([]);
    expect(s.mood).toBe('balance-cleared');
    expect(s.out + s.low + s.nearLimit + s.overdueCount).toBe(0);
  });

  it('counts each kind and takes mood from the first urgent alert', () => {
    const alerts: DynamicHomeAlert[] = [
      { ...base, id: 'limit-1', type: 'near_limit', urgent: false, entityId: 1, amount: 300 },
      { ...base, id: 'credit-2', type: 'overdue_debts', urgent: true, entityId: 2, amount: 250 },
      { ...base, id: 'credit-3', type: 'overdue_debts', urgent: true, entityId: 3, amount: 100 },
      { ...base, id: 'stock-4', type: 'low_stock', urgent: false, entityId: 4, quantity: 2 },
      { ...base, id: 'stock-5', type: 'low_stock', urgent: true, entityId: 5, quantity: 0 },
    ];
    expect(summarizeAlerts(alerts)).toEqual({
      out: 1,
      low: 1,
      nearLimit: 1,
      overdueCount: 2,
      overdueAmount: 350,
      mood: 'outstanding-balance',
    });
  });
});
