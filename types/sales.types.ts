import type { OverrideReasonCode } from './credits.types';

export interface Sale {
  id: number;
  total: number;
  payment_type: 'cash' | 'credit';
  customer_name?: string;
  customer_credit_id?: number;
  credit_transaction_id?: number | null;
  timestamp: string;
  cancelled_at?: string | null;
  cancelled_by_kind?: 'void' | 'refund' | 'price_correction' | null;
  cancelled_by_correction_id?: number | null;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  price: number;
  sold_unit_name?: string | null;
  sold_unit_qty?: number | null;
  conversion_factor?: number | null;
  cost_price?: number | null;
}

export interface SaleWithDetails extends Sale {
  items: SaleItem[];
  items_count: number;
}

export interface SaleStats {
  total: number;
  items_sold: number;
  credit_sales: number;
  transaction_count: number;
}

export interface DateFilter {
  label: string;
  startDate: Date;
  endDate: Date;
}

export interface SaleFilters {
  dateRange?: DateFilter;
  paymentType?: 'cash' | 'credit' | 'all';
  productId?: number;
  customerName?: string;
}

export interface NewSaleItem {
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
  stock: number;
  selected_unit: 'retail' | 'wholesale';
  retail_unit_name?: string;
  wholesale_unit_name?: string | null;
  retail_price?: number;
  wholesale_price?: number | null;
  conversion_factor?: number | null;
  sold_unit_name?: string;
  sold_unit_qty?: number;
}

export interface NewSale {
  items: NewSaleItem[];
  payment_type: 'cash' | 'credit';
  customer_name?: string;
  customer_credit_id?: number;
  total: number;
}

export interface SaleItemWithProduct extends SaleItem {
  product_name: string;
}

export interface SaleWithItems extends Sale {
  items: SaleItemWithProduct[];
  items_count: number;
}

export interface InsertSale {
  items: {
    product_id: number;
    quantity: number;
    price: number;
    selected_unit?: 'retail' | 'wholesale';
    sold_unit_name?: string;
    sold_unit_qty?: number;
    conversion_factor?: number | null;
  }[];
  payment_type: 'cash' | 'credit';
  customer_name?: string;
  customer_credit_id?: number;
  total: number;
}

// Parameters for insertSale function
export interface InsertSaleParams {
  items: {
    product_id: number;
    quantity: number;
    price: number;
    selected_unit?: 'retail' | 'wholesale';
    sold_unit_name?: string;
    sold_unit_qty?: number;
    conversion_factor?: number | null;
  }[];
  payment_type: 'cash' | 'credit';
  customer_name?: string;
  customer_credit_id?: number;
  overrideReasonCode?: OverrideReasonCode;
  overrideReasonNote?: string | null;
}

// Parameters for getSalesByDateRange function
export interface GetSalesByDateRangeParams {
  startDate: string;
  endDate: string;
}
