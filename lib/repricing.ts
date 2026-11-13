/**
 * Price that keeps the markup percent the owner last accepted, rounded up to
 * a whole peso. Returns null when no meaningful suggestion exists.
 */
export function suggestPrice(
  baselineCost: number,
  newCost: number,
  priceAtFlag: number,
): number | null {
  if (
    !Number.isFinite(baselineCost) ||
    !Number.isFinite(newCost) ||
    !Number.isFinite(priceAtFlag)
  ) {
    return null;
  }
  if (baselineCost <= 0 || priceAtFlag <= 0) return null;
  const raw = (newCost * priceAtFlag) / baselineCost;
  // Round to centavos first so float noise such as 30.000000000000004 does
  // not get rounded up to the next peso.
  return Math.ceil(Math.round(raw * 100) / 100);
}

/** Markup over cost, in percent, with one decimal. Null when cost is unusable. */
export function markupPercent(
  cost: number | null | undefined,
  price: number,
): number | null {
  if (cost == null || !Number.isFinite(cost) || cost <= 0) return null;
  if (!Number.isFinite(price)) return null;
  return Math.round(((price - cost) / cost) * 1000) / 10;
}
