export type SortOption = 'name' | 'price' | 'stock' | 'sku';

interface Option {
    key: SortOption;
    label: string;
    icon: string;
}

export const sortOption: Option[] = [
    { key: 'name', label: 'Name', icon: 'font' },
    { key: 'price', label: 'Price', icon: 'money' },
    { key: 'stock', label: 'Stock', icon: 'cubes' },
    { key: 'sku', label: 'SKU', icon: 'barcode' },
]