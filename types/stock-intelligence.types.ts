export interface ReorderRecommendation {
  productId: number;
  productName: string;
  sku: string;
  barcode: string | null;
  currentStock: number;
  sales28Days: number;
  suggestedQuantity: number;
  defaultSuggestedQuantity: number;
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

export interface PalengkeRestockItem {
  productId: number;
  productName: string;
  sku: string;
  currentStock: number;
  suggestedQuantity: number;
  retailUnitName: string;
  costPrice: number | null;
  subtotal: number;
  isOutOfStock: boolean;
  supplierId: string | null;
  supplierName: string | null;
  categoryName: string | null;
}

export interface PalengkeRestockGroup {
  key: string;
  label: string;
  items: PalengkeRestockItem[];
  subtotal: number;
}

export interface PalengkeRestockPlan {
  items: PalengkeRestockItem[];
  groups: PalengkeRestockGroup[];
  totalEstimatedCapital: number;
  outOfStockCapital: number;
  lowStockCapital: number;
  totalItemsCount: number;
  outOfStockCount: number;
  missingCostCount: number;
}

export interface PalengkeRestockFilter {
  supplierId?: string | null;
  category?: string | null;
}
