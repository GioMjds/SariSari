import { useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { safeNavigate } from '@/lib/navigation';

const DISMISS_KEY = 'cloud_newer_banner_dismissed_at';

export function useCloudNewerBanner() {
  const [dismissed, setDismissed] = useState(false);

  const restore = useCallback(() => {
    safeNavigate.push('/settings/backup');
  }, []);

  const dismiss = useCallback(async () => {
    setDismissed(true);
    try {
      await AsyncStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch (error) {
      console.warn('Failed to persist banner dismissal', error);
    }
  }, []);

  return { dismissed, restore, dismiss };
}
