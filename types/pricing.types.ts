export type PriceField = 'cost' | 'price';

export type PriceChangeSource =
  'delivery' | 'restock' | 'manual_edit' | 'reprice';

export interface PriceChange {
  id: number;
  productId: number;
  field: PriceField;
  /** Null when the product had no previous value. */
  oldValue: number | null;
  newValue: number;
  source: PriceChangeSource;
  receiptId: number | null;
  createdAt: string;
}

export interface RepriceFlag {
  productId: number;
  productName: string;
  /** Cost in effect when the current selling price was last accepted. */
  baselineCost: number;
  newCost: number;
  /** Selling price when the flag was created. */
  priceAtFlag: number;
  currentPrice: number;
  receiptId: number | null;
  createdAt: string;
}
