import type { SaleItem } from '@/types';

// Units the price applies to: sold_unit_qty for wholesale lines, since quantity holds pieces deducted.
export const soldQty = (item: Pick<SaleItem, 'quantity' | 'sold_unit_qty'>) =>
  item.sold_unit_qty ?? item.quantity;
