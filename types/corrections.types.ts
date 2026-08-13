import { Pesos } from '@/lib';

export type CorrectionKind = 'void' | 'refund' | 'price_correction';

export type VoidReasonCode =
  'customer_changed_mind' | 'misprinted_price' | 'wrong_item_scanned' | 'other';

export type RefundReasonCode = 'returned_damaged' | 'returned_other';

export type PriceCorrectionReasonCode =
  'misprinted_price' | 'shelf_price_changed';

export type ReasonCodeByKind = {
  void: VoidReasonCode;
  refund: RefundReasonCode;
  price_correction: PriceCorrectionReasonCode;
};

export interface SaleCorrection {
  id: number;
  saleId: number;
  kind: CorrectionKind;
  actorReasonCode: string;
  actorNote: string | null;
  actorUser: string;
  witnessUser: string | null;
  refundPaymentType: 'cash' | null;
  createdAt: Date;
}

export interface SaleCorrectionLine {
  id: number;
  correctionId: number;
  saleItemId: number;
  oldPrice: Pesos;
  newPrice: Pesos;
  priceDelta: number;
}

export interface SaleCorrectionReportRow extends SaleCorrection {
  saleTotalAtCorrection: Pesos;
}
