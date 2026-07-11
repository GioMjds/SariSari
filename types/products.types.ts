export interface Product {
  id: number;
  name: string;
  sku: string;
  /**
   * Optional printed/barcode identifier on the product packaging.
   * Distinct from `sku` (the store's internal identifier) — a sari-sari
   * store may have `sku = COKE-1.5L` and `barcode = 4800016112345`.
   * Null means no barcode is recorded; legacy rows from before the v5
   * migration stay `null` and continue to resolve via `sku`.
   */
  barcode: string | null;
  price: number;
  cost_price?: number;
  quantity: number;
  category?: string;
  supplier_id?: string | null;
  image_uri?: string | null;
  created_at: string;
  updated_at: string;
  retail_unit_name?: string;
  wholesale_unit_name?: string | null;
  wholesale_price?: number | null;
  wholesale_cost_price?: number | null;
  conversion_factor?: number | null;
  wholesale_barcode?: string | null;
}

// Parameters for insertProduct function
export interface InsertProductParams {
  name: string;
  sku: string;
  /** Optional printed barcode. Empty/whitespace is stored as NULL. */
  barcode?: string | null;
  price: number;
  quantity?: number;
  cost_price?: number;
  category?: string;
  supplier_id?: string | null;
  image_uri?: string | null;
  retail_unit_name?: string;
  wholesale_unit_name?: string | null;
  wholesale_price?: number | null;
  wholesale_cost_price?: number | null;
  conversion_factor?: number | null;
  wholesale_barcode?: string | null;
}

// Parameters for updateProduct function
export interface UpdateProductParams {
  id: number;
  name: string;
  sku: string;
  /** Optional printed barcode. Empty/whitespace is stored as NULL. */
  barcode?: string | null;
  price: number;
  quantity: number;
  cost_price?: number;
  category?: string;
  supplier_id?: string | null;
  image_uri?: string | null;
  retail_unit_name?: string;
  wholesale_unit_name?: string | null;
  wholesale_price?: number | null;
  wholesale_cost_price?: number | null;
  conversion_factor?: number | null;
  wholesale_barcode?: string | null;
}