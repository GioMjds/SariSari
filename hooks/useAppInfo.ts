import Constants from 'expo-constants';

export type AppInfo = {
  version: string;
  privacyPolicyUrl: string | null;
};

export const useAppInfo = (): AppInfo => {
  const config = Constants.expoConfig;
  const version =
    (typeof config?.version === 'string' && config.version) || '1.0.0';
  const rawPrivacyUrl = config?.extra?.['privacyPolicyUrl'];
  const privacyPolicyUrl =
    (typeof rawPrivacyUrl === 'string' && rawPrivacyUrl) || null;
  return { version, privacyPolicyUrl };
};
