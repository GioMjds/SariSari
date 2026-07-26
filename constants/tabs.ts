import { FontAwesome } from '@expo/vector-icons';
import { Href } from 'expo-router';
import type { TFunction } from 'i18next';

export interface Tab {
  name: string;
  href: Href;
  icon: keyof typeof FontAwesome.glyphMap;
}

export const PRIMARY_TAB_PATHS = [
  '/',
  '/sell',
  '/utang',
  '/reports',
  '/inventory',
] as const;

export function isPrimaryTabPath(path: string): boolean {
  return PRIMARY_TAB_PATHS.some((p) => p === path);
}

export const getTabs = (t: TFunction): Tab[] => [
  { name: t('common:dashboardTitle'), href: '/', icon: 'area-chart' },
  { name: t('common:salesTitle'), href: '/sales', icon: 'shopping-cart' },
  { name: t('common:inventoryTitle'), href: '/inventory', icon: 'cube' },
  { name: t('common:utangTitle'), href: '/utang', icon: 'credit-card' },
  { name: t('common:reportsTitle'), href: '/reports', icon: 'bar-chart' },
];

export const getSellAction = (t: TFunction): Tab => ({
  name: t('common:sellAction'),
  href: '/(edit-forms)/add-sales',
  icon: 'shopping-cart',
});
