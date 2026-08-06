import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import {
  requestNotificationPermissions,
  setupNotificationChannels,
  triggerLowStockNotification,
  triggerOverdueDebtNotification,
  updateAppIconBadge,
} from '@/lib/notifications';
import { DynamicHomeAlert } from './useHomeDashboardData';

const TAG = '[useSystemNotifications]';

export function useSystemNotifications(alerts: DynamicHomeAlert[]) {
  const router = useRouter();
  const activeAlertCount = alerts.length;
  const notifiedAlertIdsRef = useRef<Set<string>>(new Set());

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

    alerts.forEach((alert) => {
      const alertKey = `${alert.id}-${alert.subtitle}`;
      if (!notifiedAlertIdsRef.current.has(alertKey)) {
        notifiedAlertIdsRef.current.add(alertKey);

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
      }
    });
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
