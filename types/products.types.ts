export interface Product {
  id: number;
  name: string;
  sku: string;
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
