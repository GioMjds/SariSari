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
  '/home',
  '/sales',
  '/inventory',
  '/customers',
  '/more',
] as const;

export function isPrimaryTabPath(path: Href): boolean {
  const pathname = typeof path == 'string' ? path : path.pathname;
  if (!pathname) return false;

  const cleanPath = pathname.replace(/\/$/, '');
  return PRIMARY_TAB_PATHS.some((p) => p === cleanPath);
}

export const getTabs = (t: TFunction): Tab[] => [
  {
    name: t('common:homeTitle', { defaultValue: 'Home' }),
    href: '/home',
    icon: 'home',
  },
  {
    name: t('common:salesTitle', { defaultValue: 'Sales' }),
    href: '/sales',
    icon: 'shopping-cart',
  },
  {
    name: t('common:inventoryTitle', { defaultValue: 'Inventory' }),
    href: '/inventory',
    icon: 'cube',
  },
  {
    name: t('common:customersTitle', { defaultValue: 'Customers' }),
    href: '/customers',
    icon: 'users',
  },
  {
    name: t('common:moreTitle', { defaultValue: 'More' }),
    href: '/more',
    icon: 'ellipsis-h',
  },
];

export const getSellAction = (t: TFunction): Tab => ({
  name: t('common:sellAction', { defaultValue: 'Sell' }),
  href: '/(tabs)/sales',
  icon: 'shopping-cart',
});

export const HOME_SUB_TABS = ['overview', 'today'] as const;
export const SALES_SUB_TABS = ['pos', 'receipts'] as const;
export const INVENTORY_SUB_TABS = [
  'products',
  'movements',
  'stocktake',
  'damaged',
] as const;
export const CUSTOMERS_SUB_TABS = ['all', 'credit'] as const;
export const MORE_SUB_TABS = [] as const;

export type HomeSubTab = (typeof HOME_SUB_TABS)[number];
export type SalesSubTab = (typeof SALES_SUB_TABS)[number];
export type InventorySubTab = (typeof INVENTORY_SUB_TABS)[number];
export type CustomersSubTab = (typeof CUSTOMERS_SUB_TABS)[number];
export type MoreSubTab = (typeof MORE_SUB_TABS)[number];
