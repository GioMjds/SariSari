import AsyncStorage from '@react-native-async-storage/async-storage';

export const GETTING_STARTED_DISMISSED_KEY = 'getting_started_dismissed_v1';

export const loadGettingStartedDismissed = async (): Promise<boolean> => {
  try {
    const raw = await AsyncStorage.getItem(GETTING_STARTED_DISMISSED_KEY);
    return raw === 'true';
  } catch (error) {
    console.warn('Failed to load getting-started dismissed flag', error);
    return false;
  }
};

export const setGettingStartedDismissed = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(GETTING_STARTED_DISMISSED_KEY, 'true');
  } catch (error) {
    console.warn('Failed to save getting-started dismissed flag', error);
  }
};
