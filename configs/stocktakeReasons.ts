export const STOCKTAKE_REASONS = [
  'shrinkage',
  'spoilage',
  'miscount',
  'freebie_to_neighbor',
  'customer_return',
  'unexplained',
] as const;

export type StocktakeReason = (typeof STOCKTAKE_REASONS)[number];
