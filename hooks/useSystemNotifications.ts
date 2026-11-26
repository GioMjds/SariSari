import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Href } from 'expo-router';
import {
  requestNotificationPermissions,
  setupNotificationChannels,
  triggerAlertSummaryNotification,
  triggerLowStockNotification,
  triggerOverdueDebtNotification,
  updateAppIconBadge,
} from '@/lib/notifications';

export type HomeAlertType = 'low_stock' | 'overdue_debts' | 'near_limit';

export interface DynamicHomeAlert {
  id: string;
  type: HomeAlertType;
  /** Urgent alerts list under "Act now"; the rest under "Keep an eye on". */
  urgent: boolean;
  /** Product id for stock alerts, customer id for utang alerts. */
  entityId: number;
  title: string;
  /** English line used for push bodies and push de-duplication keys. */
  subtitle: string;
  imageUri: string | null;
  quantity?: number;
  amount?: number;
  overdueDays?: number;
  pctUsed?: number;
  followUpBy?: string | null;
  contactedToday?: boolean;
}

const TAG = '[useSystemNotifications]';
const NOTIFIED_KEYS_STORAGE_KEY = 'notified_alert_keys';
const MAX_STORED_KEYS = 200;

export function useSystemNotifications(alerts: DynamicHomeAlert[]) {
  const router = useRouter();
  const notifiedAlertIdsRef = useRef<Set<string>>(new Set());
  const loadedRef = useRef(false);

  const activeAlertCount = alerts.length;

  useEffect(() => {
    async function initNotifications() {
      await requestNotificationPermissions();
      await setupNotificationChannels();
    }
    initNotifications().catch((err) => {
      console.error(`${TAG} Failed initializing notification system:`, err);
    });
  }, []);

  useEffect(() => {
    updateAppIconBadge(activeAlertCount);

    if (alerts.length === 0 && loadedRef.current) return;

    let cancelled = false;
    (async () => {
      if (!loadedRef.current) {
        try {
          const raw = await AsyncStorage.getItem(NOTIFIED_KEYS_STORAGE_KEY);
          const stored: unknown = raw ? JSON.parse(raw) : [];
          if (Array.isArray(stored)) {
            stored.forEach((k) => {
              if (typeof k === 'string') notifiedAlertIdsRef.current.add(k);
            });
          }
        } catch {}
        loadedRef.current = true;
      }
      if (cancelled) return;

      const fresh = alerts.filter((alert) => {
        const alertKey = `${alert.id}-${alert.subtitle}`;
        if (notifiedAlertIdsRef.current.has(alertKey)) return false;
        notifiedAlertIdsRef.current.add(alertKey);
        return true;
      });

      // Several new alerts of one type become a single summary, so a backlog never floods native calls.
      const lowStock = fresh.filter((alert) => alert.type === 'low_stock');
      const overdue = fresh.filter((alert) => alert.type === 'overdue_debts');
      const [firstLowStock] = lowStock;
      const [firstOverdue] = overdue;

      if (lowStock.length > 1) {
        void triggerAlertSummaryNotification('low_stock', lowStock.length);
      } else if (firstLowStock) {
        void triggerLowStockNotification(
          firstLowStock.title,
          firstLowStock.quantity ?? 0,
        );
      }

      if (overdue.length > 1) {
        void triggerAlertSummaryNotification('overdue_debts', overdue.length);
      } else if (firstOverdue) {
        void triggerOverdueDebtNotification(firstOverdue.title, firstOverdue.subtitle);
      }

      if (fresh.length > 0) {
        if (notifiedAlertIdsRef.current.size > MAX_STORED_KEYS) {
          const keep = [...notifiedAlertIdsRef.current].slice(-MAX_STORED_KEYS);
          notifiedAlertIdsRef.current = new Set(keep);
        }
        try {
          await AsyncStorage.setItem(
            NOTIFIED_KEYS_STORAGE_KEY,
            JSON.stringify([...notifiedAlertIdsRef.current]),
          );
        } catch {}
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [alerts, activeAlertCount]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        if (data && typeof data['targetPath'] === 'string') {
          router.push(data['targetPath'] as Href);
        }
      },
    );
    return () => subscription.remove();
  }, [router]);
}
