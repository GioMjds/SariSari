import { useMemo } from 'react';
import { useCreditKPIs, useCustomers } from './useCredits';
import { useLowStockProducts } from './useProducts';
import { formatPesos } from '@/lib/money';
import { LOW_STOCK_THRESHOLD } from '@/constants/stocks';
import type { DynamicHomeAlert } from './useSystemNotifications';

export function useHomeAlerts() {
  const { data: lowStockProducts } = useLowStockProducts();
  const { data: creditKpis } = useCreditKPIs();
  const { data: overdueCustomers } = useCustomers('overdue');

  const alerts = useMemo<DynamicHomeAlert[]>(() => {
    const list: DynamicHomeAlert[] = [];

    lowStockProducts?.forEach((p) => {
      list.push({
        id: `stock-${p.id}`,
        type: 'low_stock',
        title: p.name,
        subtitle:
          p.quantity === 0
            ? 'Out of stock'
            : `${p.quantity} remaining (Threshold: ${LOW_STOCK_THRESHOLD})`,
        actionLabel: 'Restock',
        targetPath: '/inventory',
      });
    });

    if (overdueCustomers && overdueCustomers.length > 0) {
      overdueCustomers.forEach((c) => {
        list.push({
          id: `credit-${c.id}`,
          type: 'overdue_debts',
          title: c.name,
          subtitle: `${formatPesos(c.outstanding_balance ?? 0)} overdue`,
          actionLabel: 'Collect',
          targetPath: '/(tabs)/customers/collection',
        });
      });
    }

    return list;
  }, [lowStockProducts, overdueCustomers]);

  return { alerts, alertCount: alerts.length, creditKpis };
}
