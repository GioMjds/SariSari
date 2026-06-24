import { FontAwesome } from '@expo/vector-icons';
import { Href } from 'expo-router';

export interface Tab {
  name: string;
  href: Href;
  icon: keyof typeof FontAwesome.glyphMap;
}


// Bottom-tab definitions: Dashboard is home base, Sell is POS,
// Inventory is product catalog + restock, Utang tracks loans, and Reports handles metrics.
export const tabs: Tab[] = [
  { name: 'Dashboard', href: '/', icon: 'area-chart' },
  { name: 'Sell', href: '/sell', icon: 'shopping-cart' },
  { name: 'Inventory', href: '/inventory', icon: 'cube' },
  { name: 'Utang', href: '/utang', icon: 'credit-card' },
  { name: 'Reports', href: '/reports', icon: 'bar-chart' },
];
