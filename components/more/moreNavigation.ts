import { type Href, router } from 'expo-router';

export const MORE_ROUTES = {
  home: '/(tabs)/more',
  cash: '/(tabs)/more/cash-entries',
  reports: '/(tabs)/more/reports',
  backup: '/(tabs)/more/backup',
  settings: '/(tabs)/more/settings',
} as const satisfies Record<string, Href>;

export type MoreDestination =
  | typeof MORE_ROUTES.cash
  | typeof MORE_ROUTES.reports
  | typeof MORE_ROUTES.backup
  | typeof MORE_ROUTES.settings;

export function goBackToMore(): void {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(MORE_ROUTES.home);
}
