import { ReportKPIs } from "@/types";

export const DEFAULT_KPIS = {
  totalSales: 0,
  totalProfit: null,
  grossProfit: null,
  operatingProfit: null,
  paidExpenses: 0,
  ownerDrawings: 0,
  totalCreditsIssued: 0,
  totalCreditsCollected: 0,
  totalExpenses: 0,
  inventoryCostOut: 0,
  profitCoverage: null,
  marginPercent: null,
} satisfies ReportKPIs;

export const DEFAULT_SALES_BREAKDOWN = {
  cashSales: 0,
  creditSales: 0,
  averageTransactionValue: 0,
  totalTransactions: 0,
};

export const DEFAULT_INVENTORY_MOVEMENT = {
  itemsSold: 0,
  lowStockCount: 0,
  outOfStockCount: 0,
};

export const DEFAULT_INVENTORY_VALUE = {
  currentStockValue: 0,
  potentialSalesValue: 0,
  costCoverage: null,
};

export const DEFAULT_CREDITS_OVERVIEW = {
  issued: 0,
  collected: 0,
  outstanding: 0,
  activeAccounts: 0,
};