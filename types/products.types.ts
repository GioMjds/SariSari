export interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  cost_price?: number;
  quantity: number;
  created_at: string;
  updated_at: string;
}

// Parameters for insertProduct function
export interface InsertProductParams {
  name: string;
  sku: string;
  price: number;
  quantity?: number;
}

// Parameters for updateProduct function
export interface UpdateProductParams {
  id: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
}