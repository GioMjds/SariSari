export interface Sale {
  id: number;
  total: number;
  timestamp: string;
  payment_type: 'cash' | 'credit';
  customer_name?: string;
  customer_credit_id?: number;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
}

export interface SaleWithDetails extends Sale {
  items: SaleItem[];
  items_count: number;
}

export interface SaleWithItems extends Sale {
  items_count: number;
}

export interface SaleStats {
  todayTotal: number;
  itemsSold: number;
  creditSales: number;
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
