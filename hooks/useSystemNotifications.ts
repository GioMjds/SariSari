import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  requestNotificationPermissions,
  setupNotificationChannels,
  triggerLowStockNotification,
  triggerOverdueDebtNotification,
  updateAppIconBadge,
} from '@/lib/notifications';
import { DynamicHomeAlert } from './useHomeDashboardData';

const TAG = '[useSystemNotifications]';
const NOTIFIED_KEYS_STORAGE_KEY = 'notified_alert_keys';

export function useSystemNotifications(alerts: DynamicHomeAlert[]) {
  const router = useRouter();
  const activeAlertCount = alerts.length;
  const notifiedAlertIdsRef = useRef<Set<string>>(new Set());
  const loadedRef = useRef(false);

  // Initialize channels and request permissions on mount
  useEffect(() => {
    async function initNotifications() {
      await requestNotificationPermissions();
      await setupNotificationChannels();
    }
    initNotifications().catch((err) => {
      console.error(`${TAG} Failed initializing notification system:`, err);
    });
  }, []);

  // Sync active alert count to device app icon badge & trigger status bar alerts for new items
  useEffect(() => {
    updateAppIconBadge(activeAlertCount);

    let cancelled = false;
    (async () => {
      // Persisted so dev reloads / app restarts do not re-notify known alerts.
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
            : match && match[0]
              ? parseInt(match[0], 10)
              : 0;
          triggerLowStockNotification(alert.title, qty);
        } else if (alert.type === 'overdue_debts') {
          triggerOverdueDebtNotification(alert.title, alert.subtitle);
        }
      });

      if (changed) {
        try {
          await AsyncStorage.setItem(
            NOTIFIED_KEYS_STORAGE_KEY,
            JSON.stringify([...notifiedAlertIdsRef.current].slice(-200)),
          );
        } catch {}
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [alerts, activeAlertCount]);

  // Set up deep linking listener on notification interaction
  useEffect(() => {
    const subscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data && typeof data['targetPath'] === 'string') {
          const targetPath = data['targetPath'];
          console.log(
            `${TAG} Notification tapped -> navigating to: ${targetPath}`,
          );
          router.push(targetPath as any);
        }
      });

    return () => {
      subscription.remove();
    };
  }, [router]);
}
