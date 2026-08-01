import { useEffect, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Network from 'expo-network';

export interface NetworkStatus {
  isOnline: boolean;
  isInternetReachable: boolean | null;
  checkNetworkStatus: () => Promise<boolean>;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);

  const checkNetworkStatus = useCallback(async (): Promise<boolean> => {
    try {
      const state = await Network.getNetworkStateAsync();
      const online = Boolean(state.isConnected && (state.isInternetReachable ?? true));
      setIsOnline(online);
      setIsInternetReachable(state.isInternetReachable ?? null);
      return online;
    } catch {
      // Fallback in test or environments where expo-network is unavailable
      setIsOnline(true);
      setIsInternetReachable(true);
      return true;
    }
  }, []);

  useEffect(() => {
    // Initial check on mount
    checkNetworkStatus();

    // Check network when app comes to foreground
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkNetworkStatus();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Periodic check every 15 seconds
    const intervalId = setInterval(() => {
      checkNetworkStatus();
    }, 15000);

    return () => {
      subscription.remove();
      clearInterval(intervalId);
    };
  }, [checkNetworkStatus]);

  return {
    isOnline,
    isInternetReachable,
    checkNetworkStatus,
  };
}
