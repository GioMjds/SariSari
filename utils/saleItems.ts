import type { SaleItem } from '@/types';

// Units the price applies to: sold_unit_qty for wholesale lines, since quantity holds pieces deducted.
export const soldQty = (item: Pick<SaleItem, 'quantity' | 'sold_unit_qty'>) =>
  item.sold_unit_qty ?? item.quantity;

export interface SaleProfit {
  profit: number;
  margin: number;
  missingCost: number;
}

// Profit over lines with a cost snapshot at sale time; missingCost counts lines without one.
export const saleProfit = (
  items: Pick<SaleItem, 'quantity' | 'sold_unit_qty' | 'price' | 'cost_price'>[],
): SaleProfit => {
  let profit = 0;
  let revenue = 0;
  let missingCost = 0;
  for (const item of items) {
    if (item.cost_price == null) {
      missingCost += 1;
      continue;
    }
    const units = soldQty(item);
    profit += units * (item.price - item.cost_price);
    revenue += units * item.price;
  }
  return { profit, margin: revenue > 0 ? profit / revenue : 0, missingCost };
};
