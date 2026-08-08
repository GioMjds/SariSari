import Constants from 'expo-constants';

export type AppInfo = {
  version: string;
  privacyPolicyUrl: string | null;
};

export const useAppInfo = (): AppInfo => {
  const config = Constants.expoConfig;
  const version =
    (typeof config?.version === 'string' && config.version) || '1.0.0';
  const privacyPolicyUrl =
    (typeof config?.extra?.privacyPolicyUrl === 'string' &&
      config.extra.privacyPolicyUrl) ||
    null;
  return { version, privacyPolicyUrl };
};
