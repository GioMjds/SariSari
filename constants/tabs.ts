import { FontAwesome } from '@expo/vector-icons';

interface Tab {
  name: string;
  href: string;
  icon: keyof typeof FontAwesome.glyphMap;
}

// Bottom-tab order matters: the home tab (/) is the operational stock
// view — products with their current quantities, restock, low/out filters.
// "Products" is master data only (catalog, SKU, price, cost). They are two
// different jobs and should never collapse into one route.
export const tabs: Tab[] = [
  { name: 'Inventory', href: '/', icon: 'archive' },
  { name: 'Sales', href: '/sales', icon: 'shopping-cart' },
  { name: 'Catalog', href: '/products', icon: 'cube' },
  { name: 'Utang', href: '/credits', icon: 'credit-card' },
  { name: 'Reports', href: '/reports', icon: 'bar-chart' },
];
