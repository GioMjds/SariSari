export interface Sale {
  id: number;
  total: number;
  timestamp: string;
  payment_type: 'cash' | 'credit';
  customer_name?: string;
  customer_credit_id?: number;
  /**
   * Back-pointer to the credit_transactions row created for credit sales.
   * Used by `deleteSale` to reverse the ledger entry transactionally.
   * Null for cash sales or for legacy rows written before migration v3.
   */
  credit_transaction_id?: number | null;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  price: number;
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
  }[];
  payment_type: 'cash' | 'credit';
  customer_name?: string;
  customer_credit_id?: number;
}

// Parameters for getSalesByDateRange function
export interface GetSalesByDateRangeParams {
  startDate: string;
  endDate: string;
}