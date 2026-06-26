import { FontAwesome } from '@expo/vector-icons';
import { Href } from 'expo-router';
import type { TFunction } from 'i18next';

export interface Tab {
  name: string;
  href: Href;
  icon: keyof typeof FontAwesome.glyphMap;
}

/**
 * Bottom-tab definitions: Dashboard is home base, Sell is POS,
 * Inventory is product catalog + restock, Utang tracks loans, and
 * Reports handles metrics.
 *
 * `name` is translated via the `common` namespace so the tab labels
 * follow the app's active language. Pass `t` from a `useTranslation()`
 * hook in the consumer.
 */
export const getTabs = (t: TFunction): Tab[] => [
  { name: t('common:dashboardTitle'), href: '/', icon: 'area-chart' },
  { name: t('common:sellTitle'), href: '/sell', icon: 'shopping-cart' },
  { name: t('common:inventoryTitle'), href: '/inventory', icon: 'cube' },
  { name: t('common:utangTitle'), href: '/utang', icon: 'credit-card' },
  { name: t('common:reportsTitle'), href: '/reports', icon: 'bar-chart' },
];