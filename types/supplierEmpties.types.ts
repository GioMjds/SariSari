export type EmptiesMovementKind =
  | 'received_full'
  | 'handed_back'
  | 'written_off'
  | 'count_adjust';

export interface SupplierEmptiesType {
  id: number;
  supplierId: string;
  name: string;
  depositPesos: number;
}

/** Expected empties still owed to the supplier for one type. */
export interface EmptiesBalance extends SupplierEmptiesType {
  owed: number;
  pesosAtRisk: number;
}

export interface SwapCountInput {
  emptiesId: number;
  receivedFull: number;
  handedBack: number;
  /** Empties the owner physically holds after the swap. */
  physicalCount: number;
}

export interface SwapCountResult {
  expectedOwed: number;
  /** Positive: fewer empties on hand than expected. */
  shortfall: number;
  shortfallPesos: number;
}
