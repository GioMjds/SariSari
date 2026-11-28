/** Split a typed amount into what the ledger records and the change to hand back. */
export function capPayment(typed: number, owed: number) {
  const recorded = Math.max(0, Math.min(typed, owed));
  // Round to centavos so float drift never shows as change.
  const change = Math.round(Math.max(0, typed - recorded) * 100) / 100;
  return { recorded, change };
}
