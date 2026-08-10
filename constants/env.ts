import Constants from 'expo-constants';

export const APP_VARIANT =
  Constants.expoConfig?.extra?.['appVariant'] ?? 'production';

export const IS_DEV_BUILD = APP_VARIANT === 'development';
export const IS_PREVIEW_BUILD = APP_VARIANT === 'preview';
export const IS_PRODUCTION_BUILD = APP_VARIANT === 'production';
