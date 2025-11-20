import { FontAwesome } from '@expo/vector-icons';

interface Tab {
    name: string;
    href: string;
    icon: keyof typeof FontAwesome.glyphMap;
}

export const tabs: Tab[] = [
    { name: 'Inventory', href: '/', icon: 'archive' },
    { name: 'Sales', href: '/sales', icon: 'shopping-cart' },
    { name: 'Products', href: '/products', icon: 'cube' },
    { name: 'Credits', href: '/credits', icon: 'credit-card' },
    { name: 'Reports', href: '/reports', icon: 'bar-chart' },
];