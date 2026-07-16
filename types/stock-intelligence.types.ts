export interface ReorderRecommendation {
  productId: number;
  productName: string;
  sku: string;
  barcode: string | null;
  currentStock: number;
  sales28Days: number;
  suggestedQuantity: number;
  estimatedSpend: number | null;
  preferredSupplierId: string | null;
  preferredSupplierName: string | null;
  category: string | null;
  retailUnitName: string;
  costPrice: number | null;
  isOutOfStock: boolean;
  isLowStock: boolean;
  isSlowMover: boolean;
  isWatchItem: boolean;
  savedPlan: {
    status: 'adjusted' | 'deferred' | 'dismissed';
    adjustedQuantity: number | null;
    deferredUntil: string | null;
  } | null;
}

export interface SaveReorderPlanInput {
  productId: number;
  status: 'adjusted' | 'deferred' | 'dismissed';
  adjustedQuantity?: number | null;
  deferredUntil?: string | null;
  lastStock: number;
  lastDemand: number;
  lastCost: number | null;
  lastSupplierId: string | null;
}
