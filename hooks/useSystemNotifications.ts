import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import {
  requestNotificationPermissions,
  setupNotificationChannels,
  updateAppIconBadge,
} from '@/lib/notifications';

const TAG = '[useSystemNotifications]';

export function useSystemNotifications(activeAlertCount: number) {
  const router = useRouter();

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

  // Sync active alert count to device app icon badge
  useEffect(() => {
    updateAppIconBadge(activeAlertCount);
  }, [activeAlertCount]);

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
