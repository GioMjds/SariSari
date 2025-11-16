interface Tab {
    name: string;
    href: string;
}

export const tabs: Tab[] = [
    { name: 'Credits', href: '/credits' },
    { name: 'Inventory', href: '/inventory' },
    { name: 'Sales', href: '/sales' },
    { name: 'Products', href: '/products' },
    { name: 'Reports', href: '/reports' },
];