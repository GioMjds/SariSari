import { useMemo } from 'react';
import { useCollectionQueue } from './useCredits';
import { useLowStockProducts } from './useProducts';
import { formatPesos } from '@/lib/money';
import { LOW_STOCK_THRESHOLD } from '@/constants/stocks';
import type { DynamicHomeAlert } from './useSystemNotifications';

// lastContactAt is stored as UTC "YYYY-MM-DD HH:MM:SS"; compare on the local calendar day.
function isToday(utcStamp: string | null): boolean {
  if (!utcStamp) return false;
  const d = new Date(utcStamp.replace(' ', 'T') + 'Z');
  return d.toDateString() === new Date().toDateString();
}

export function useHomeAlerts() {
  const lowStock = useLowStockProducts();
  const queue = useCollectionQueue();

  const alerts = useMemo<DynamicHomeAlert[]>(() => {
    const list: DynamicHomeAlert[] = [];

    lowStock.data?.forEach((p) => {
      list.push({
        id: `stock-${p.id}`,
        type: 'low_stock',
        urgent: p.quantity === 0,
        entityId: p.id,
        title: p.name,
        subtitle:
          p.quantity === 0
            ? 'Out of stock'
            : `${p.quantity} remaining (Threshold: ${LOW_STOCK_THRESHOLD})`,
        imageUri: p.image_uri ?? null,
        quantity: p.quantity,
      });
    });

    queue.data?.forEach((row) => {
      if (row.bucket === 'oldest_balance') return;
      const overdue = row.bucket === 'overdue';
      list.push({
        id: `${overdue ? 'credit' : 'limit'}-${row.customerId}`,
        type: overdue ? 'overdue_debts' : 'near_limit',
        urgent: overdue,
        entityId: row.customerId,
        title: row.name,
        subtitle: overdue
          ? `${formatPesos(row.balance)} overdue`
          : `${Math.round(row.nearLimitPctUsed * 100)}% of credit limit used`,
        imageUri: row.photoUri,
        amount: row.balance,
        overdueDays: row.overdueDays,
        pctUsed: row.nearLimitPctUsed,
        followUpBy: row.followUp?.followUpBy ?? null,
        contactedToday:
          (row.followUp?.contactsToday ?? 0) > 0 &&
          isToday(row.followUp?.lastContactAt ?? null),
      });
    });

    // Urgent first; out of stock before overdue so the shelf gap leads.
    return list.sort((a, b) => Number(b.urgent) - Number(a.urgent));
  }, [lowStock.data, queue.data]);

  return {
    alerts,
    alertCount: alerts.length,
    isLoading: lowStock.isLoading || queue.isLoading,
  };
}
