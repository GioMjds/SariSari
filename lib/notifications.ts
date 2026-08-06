import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const TAG = '[Notifications]';

// Configure foreground presentation
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (error) {
    console.error(`${TAG} Error requesting notification permissions:`, error);
    return false;
  }
}

export async function getNotificationPermissionStatus(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error(`${TAG} Error checking notification status:`, error);
    return false;
  }
}

export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('low-stock-channel', {
      name: 'Low Stock Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B00',
    });

    await Notifications.setNotificationChannelAsync('overdue-debt-channel', {
      name: 'Overdue Credit Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#E53E3E',
    });
  }
}

export async function updateAppIconBadge(count: number): Promise<void> {
  try {
    const validCount = Math.max(0, count);
    await Notifications.setBadgeCountAsync(validCount);
  } catch (error) {
    console.error(`${TAG} Error setting badge count:`, error);
  }
}

export async function triggerLowStockNotification(
  productName: string,
  quantity: number,
): Promise<string | null> {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Low Stock Alert: ${productName}`,
        body:
          quantity === 0
            ? `${productName} is out of stock! Tap to restock.`
            : `Only ${quantity} item${quantity === 1 ? '' : 's'} remaining in inventory. Tap to restock.`,
        sound: 'default',
        data: { targetPath: '/inventory', type: 'low_stock' },
      },
      trigger:
        Platform.OS === 'android' ? { channelId: 'low-stock-channel' } : null,
    });
    return notificationId;
  } catch (error) {
    console.error(`${TAG} Error triggering low stock notification:`, error);
    return null;
  }
}

export async function triggerOverdueDebtNotification(
  customerName: string,
  amountFormatted: string,
): Promise<string | null> {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Overdue Credit: ${customerName}`,
        body: `Outstanding balance of ${amountFormatted} requires collection.`,
        sound: 'default',
        data: { targetPath: '/(tabs)/customers/credit', type: 'overdue_debts' },
      },
      trigger:
        Platform.OS === 'android'
          ? { channelId: 'overdue-debt-channel' }
          : null,
    });
    return notificationId;
  } catch (error) {
    console.error(`${TAG} Error triggering overdue debt notification:`, error);
    return null;
  }
}
