export interface Category {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryWithCount extends Category {
  product_count: number;
}

// Parameters for insertCategory function
export interface InsertCategoryParams {
  name: string;
}

// Parameters for updateCategory function
export interface UpdateCategoryParams {
  id: number;
  name: string;
}
