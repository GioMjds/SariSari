/** Scroll offset that centers a tab in the strip, or null until the viewport width is known. */
export function centerOffset(x: number, width: number, viewport: number): number | null {
  if (viewport <= 0) return null;
  return Math.max(0, x - (viewport - width) / 2);
}
