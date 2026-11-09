export type DeliveryReceiptStatus = 'draft' | 'committed' | 'voided';
export type EnteredUnit = 'retail' | 'wholesale';

export interface QuickAddProductInput {
  name: string;
  price: number;
  barcode?: string | null;
}

export interface DeliveryLineInput {
  productId: number | null;
  newProduct: QuickAddProductInput | null;
  enteredUnit: EnteredUnit;
  enteredExpectedQty: number;
  enteredReceivedQty: number;
  enteredUnitCost: number;
}

export interface SaveDeliveryDraftInput {
  receiptId?: number;
  supplierId: string;
  invoiceNo?: string | null;
  invoicePhotoUri?: string | null;
  note?: string | null;
  lines: DeliveryLineInput[];
}

export interface DeliveryReceiptLine {
  id: number;
  receiptId: number;
  productId: number | null;
  productName: string;
  newProduct: QuickAddProductInput | null;
  enteredUnit: EnteredUnit;
  enteredExpectedQty: number;
  enteredReceivedQty: number;
  enteredUnitCost: number;
  expectedQty: number;
  receivedQty: number;
  expectedUnitCost: number | null;
  actualUnitCost: number;
  shortageQty: number;
  conversionFactorUsed: number;
}

export interface DeliveryReceiptSummary {
  id: number;
  supplierId: string;
  supplierName: string;
  status: DeliveryReceiptStatus;
  invoiceNo: string | null;
  createdAt: string;
  committedAt: string | null;
  voidedAt: string | null;
  lineCount: number;
  totalCost: number;
  shortageQty: number;
}

export interface DeliveryReceiptDetail extends DeliveryReceiptSummary {
  invoicePhotoUri: string | null;
  note: string | null;
  voidReason: string | null;
  lines: DeliveryReceiptLine[];
}

export interface SupplierShortageRow {
  supplierId: string;
  supplierName: string;
  receipts: number;
  lines: number;
  shortLines: number;
  shortageQty: number;
  shortageValue: number;
  shortageRate: number;
}
