// useAppInfo — reads the installed app's display version + privacy URL from
// `expo-constants`. `extra` is the typed extension point Expo injects into
// the manifest at build time. We don't surface the runtime build number
// (it's noise for store owners) — just the semver the user sees in their
// store listing.
import Constants from 'expo-constants';

export type AppInfo = {
  version: string;
  privacyPolicyUrl: string | null;
};

/**
 * Returns the app's user-facing version string and the privacy policy URL
 * (configured in `app.json -> expo.extra.privacyPolicyUrl`). If `expo-constants`
 * isn't available (e.g. tests), falls back to sensible defaults so callers
 * don't have to special-case.
 */
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
