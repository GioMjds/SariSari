import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Href } from 'expo-router';
import {
  requestNotificationPermissions,
  setupNotificationChannels,
  triggerLowStockNotification,
  triggerOverdueDebtNotification,
  updateAppIconBadge,
} from '@/lib/notifications';

export interface DynamicHomeAlert {
  id: string | number;
  type: 'low_stock' | 'expiring' | 'overdue_debts';
  title: string;
  subtitle: string;
  actionLabel: string;
  targetPath: string;
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

      let changed = false;
      alerts.forEach((alert) => {
        const alertKey = `${alert.id}-${alert.subtitle}`;
        if (notifiedAlertIdsRef.current.has(alertKey)) return;
        notifiedAlertIdsRef.current.add(alertKey);
        changed = true;

        if (alert.type === 'low_stock') {
          const match = alert.subtitle.match(/\d+/);
          const qty = alert.subtitle.includes('Out of stock')
            ? 0
            : match?.[0]
              ? parseInt(match[0], 10)
              : 0;
          triggerLowStockNotification(alert.title, qty);
        } else if (alert.type === 'overdue_debts') {
          triggerOverdueDebtNotification(alert.title, alert.subtitle);
        }
      });

      if (changed) {
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
