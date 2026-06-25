/**
 * SariSari Sample Mock Data (pesos)
 *
 * This file contains mock data for populating the SQLite database during development.
 * All monetary values are stored as integers (pesos) to prevent floating-point drift.
 * 1 Peso = 100 pesos.
 */

export const MOCK_CATEGORIES = [
  {
    id: 1,
    name: 'Canned Goods',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Snacks',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 3,
    name: 'Beverages',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 4,
    name: 'Toiletries',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 5,
    name: 'Others',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

export const MOCK_PRODUCTS = [
  {
    id: 1,
    name: 'Sardines',
    sku: 'CAN-001',
    price: 2500,
    cost_price: 2000,
    quantity: 2,
    category: 'Canned Goods',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }, // Low Stock
  {
    id: 2,
    name: 'Corned Beef',
    sku: 'CAN-002',
    price: 4500,
    cost_price: 3800,
    quantity: 0,
    category: 'Canned Goods',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }, // Out of Stock
  {
    id: 3,
    name: 'Potato Chips',
    sku: 'SNA-001',
    price: 1500,
    cost_price: 1200,
    quantity: 100,
    category: 'Snacks',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 4,
    name: 'Chocolate Bar',
    sku: 'SNA-002',
    price: 2000,
    cost_price: 1500,
    quantity: 60,
    category: 'Snacks',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 5,
    name: 'Coke 1.5L',
    sku: 'BEV-001',
    price: 6500,
    cost_price: 5800,
    quantity: 24,
    category: 'Beverages',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 6,
    name: 'Water 500ml',
    sku: 'BEV-002',
    price: 1500,
    cost_price: 1000,
    quantity: 120,
    category: 'Beverages',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 7,
    name: 'Soap',
    sku: 'TOI-001',
    price: 3000,
    cost_price: 2500,
    quantity: 3,
    category: 'Toiletries',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }, // Low Stock
  {
    id: 8,
    name: 'Toothpaste',
    sku: 'TOI-002',
    price: 5000,
    cost_price: 4200,
    quantity: 0,
    category: 'Toiletries',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }, // Out of Stock
  {
    id: 9,
    name: 'Eggs',
    sku: 'OTH-001',
    price: 700,
    cost_price: 600,
    quantity: 300,
    category: 'Others',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 10,
    name: 'Rice 1kg',
    sku: 'OTH-002',
    price: 5500,
    cost_price: 5000,
    quantity: 100,
    category: 'Others',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

export const MOCK_CUSTOMERS = [
  {
    id: 1,
    name: 'Aling Maria',
    phone: '09171234567',
    address: 'Street 1, Brgy. Central',
    notes: 'Reliable suki',
    credit_limit: 50000,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Mang Jose',
    phone: '09187654321',
    address: 'Street 2, Brgy. Central',
    notes: 'Borrows often',
    credit_limit: 200000,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 3,
    name: 'Sarah',
    phone: '09201112223',
    address: 'Street 3, Brgy. South',
    notes: 'Needs reminders',
    credit_limit: 30000,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 4,
    name: 'Kuya Ben',
    phone: null,
    address: 'Street 1, Brgy. Central',
    notes: null,
    credit_limit: 100000,
    created_at: '2026-05-01T00:00:00Z',
    updated_at: '2026-05-01T00:00:00Z',
  },
];

export const MOCK_CREDIT_TRANSACTIONS = [
  {
    id: 1,
    customer_id: 3,
    product_id: 10,
    product_name: 'Rice 1kg',
    quantity: 4,
    amount: 22000,
    status: 'unpaid',
    amount_paid: 0,
    date: '2026-05-01T10:00:00Z',
    due_date: '2026-05-15T00:00:00Z',
    notes: 'For weekly rice',
    created_at: '2026-05-01T10:00:00Z',
    updated_at: '2026-05-01T10:00:00Z',
  },
  {
    id: 2,
    customer_id: 2,
    product_id: 5,
    product_name: 'Coke 1.5L',
    quantity: 10,
    amount: 65000,
    status: 'partial',
    amount_paid: 20000,
    date: '2026-06-01T08:00:00Z',
    due_date: '2026-06-15T00:00:00Z',
    notes: 'Sari-sari stock',
    created_at: '2026-06-01T08:00:00Z',
    updated_at: '2026-06-02T00:00:00Z',
  },
  {
    id: 3,
    customer_id: 1,
    product_id: 7,
    product_name: 'Soap',
    quantity: 2,
    amount: 6000,
    status: 'paid',
    amount_paid: 6000,
    date: '2026-06-10T14:00:00Z',
    due_date: '2026-06-17T00:00:00Z',
    notes: null,
    created_at: '2026-06-10T14:00:00Z',
    updated_at: '2026-06-11T00:00:00Z',
  },
];

export const MOCK_PAYMENTS = [
  {
    id: 1,
    customer_id: 1,
    credit_transaction_id: 3,
    amount: 6000,
    payment_method: 'cash',
    date: '2026-06-11T09:00:00Z',
    notes: 'Full payment',
    created_at: '2026-06-11T09:00:00Z',
  },
  {
    id: 2,
    customer_id: 2,
    credit_transaction_id: 2,
    amount: 20000,
    payment_method: 'cash',
    date: '2026-06-02T10:00:00Z',
    notes: 'Downpayment',
    created_at: '2026-06-02T10:00:00Z',
  },
];

export const MOCK_SALES = [
  {
    id: 1,
    total: 4000,
    payment_type: 'cash',
    customer_name: null,
    customer_credit_id: null,
    timestamp: '2026-06-18T08:00:00Z',
  },
  {
    id: 2,
    total: 1500,
    payment_type: 'cash',
    customer_name: null,
    customer_credit_id: null,
    timestamp: '2026-06-18T09:30:00Z',
  },
  {
    id: 3,
    total: 22000,
    payment_type: 'credit',
    customer_name: 'Sarah',
    customer_credit_id: 1,
    timestamp: '2026-05-01T10:00:00Z',
  },
  {
    id: 4,
    total: 65000,
    payment_type: 'credit',
    customer_name: 'Mang Jose',
    customer_credit_id: 2,
    timestamp: '2026-06-01T08:00:00Z',
  },
];

export const MOCK_SALE_ITEMS = [
  { id: 1, sale_id: 1, product_id: 1, quantity: 1, price: 2500 }, // Sardines
  { id: 2, sale_id: 1, product_id: 3, quantity: 1, price: 1500 }, // Potato Chips
  { id: 3, sale_id: 2, product_id: 6, quantity: 1, price: 1500 }, // Water
  { id: 4, sale_id: 3, product_id: 10, quantity: 4, price: 5500 }, // Rice
  { id: 5, sale_id: 4, product_id: 5, quantity: 10, price: 6500 }, // Coke
];

export const MOCK_INVENTORY_TRANSACTIONS = [
  {
    id: 1,
    product_id: 1,
    type: 'restock',
    quantity: 50,
    timestamp: '2026-01-01T00:00:00Z',
  },
  {
    id: 2,
    product_id: 2,
    type: 'restock',
    quantity: 30,
    timestamp: '2026-01-01T00:00:00Z',
  },
  {
    id: 3,
    product_id: 3,
    type: 'restock',
    quantity: 100,
    timestamp: '2026-01-01T00:00:00Z',
  },
  {
    id: 4,
    product_id: 4,
    type: 'restock',
    quantity: 60,
    timestamp: '2026-01-01T00:00:00Z',
  },
  {
    id: 5,
    product_id: 5,
    type: 'restock',
    quantity: 24,
    timestamp: '2026-01-01T00:00:00Z',
  },
  {
    id: 6,
    product_id: 6,
    type: 'restock',
    quantity: 120,
    timestamp: '2026-01-01T00:00:00Z',
  },
  {
    id: 7,
    product_id: 7,
    type: 'restock',
    quantity: 40,
    timestamp: '2026-01-01T00:00:00Z',
  },
  {
    id: 8,
    product_id: 8,
    type: 'restock',
    quantity: 20,
    timestamp: '2026-01-01T00:00:00Z',
  },
  {
    id: 9,
    product_id: 9,
    type: 'restock',
    quantity: 300,
    timestamp: '2026-01-01T00:00:00Z',
  },
  {
    id: 10,
    product_id: 10,
    type: 'restock',
    quantity: 100,
    timestamp: '2026-01-01T00:00:00Z',
  },
  {
    id: 11,
    product_id: 1,
    type: 'sale',
    quantity: 1,
    timestamp: '2026-06-18T08:00:00Z',
  },
  {
    id: 12,
    product_id: 3,
    type: 'sale',
    quantity: 1,
    timestamp: '2026-06-18T08:00:00Z',
  },
  {
    id: 13,
    product_id: 6,
    type: 'sale',
    quantity: 1,
    timestamp: '2026-06-18T09:30:00Z',
  },
  {
    id: 14,
    product_id: 10,
    type: 'sale',
    quantity: 4,
    timestamp: '2026-05-01T10:00:00Z',
  },
  {
    id: 15,
    product_id: 5,
    type: 'sale',
    quantity: 10,
    timestamp: '2026-06-01T08:00:00Z',
  },
];
