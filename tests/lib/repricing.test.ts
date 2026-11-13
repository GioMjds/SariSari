import { markupPercent, suggestPrice } from '@/lib/repricing';

describe('suggestPrice', () => {
  it('keeps the same markup percent and rounds up to a whole peso', () => {
    // 13 on cost 10 is a 30% markup. 12 * 1.3 = 15.6, rounded up to 16.
    expect(suggestPrice(10, 12, 13)).toBe(16);
  });

  it('returns an exact whole number unchanged', () => {
    expect(suggestPrice(10, 20, 15)).toBe(30);
  });

  it('review focus: floating-point noise does not push the price up a peso', () => {
    // 0.3 * 10 / 0.1 evaluates to 30.000000000000004 in IEEE-754.
    expect(suggestPrice(0.1, 0.3, 10)).toBe(30);
  });

  it('returns null when the baseline cost is zero or negative', () => {
    expect(suggestPrice(0, 12, 13)).toBeNull();
    expect(suggestPrice(-5, 12, 13)).toBeNull();
  });

  it('returns null when the price at flag is zero or negative', () => {
    expect(suggestPrice(10, 12, 0)).toBeNull();
  });

  it('returns null for non-finite input', () => {
    expect(suggestPrice(10, Number.NaN, 13)).toBeNull();
    expect(suggestPrice(10, Number.POSITIVE_INFINITY, 13)).toBeNull();
  });
});

describe('markupPercent', () => {
  it('returns markup over cost with one decimal', () => {
    expect(markupPercent(10, 13)).toBe(30);
    expect(markupPercent(12, 13)).toBe(8.3);
  });

  it('returns a negative markup when selling below cost', () => {
    expect(markupPercent(20, 15)).toBe(-25);
  });

  it('returns null when cost is missing, zero, or negative', () => {
    expect(markupPercent(null, 13)).toBeNull();
    expect(markupPercent(undefined, 13)).toBeNull();
    expect(markupPercent(0, 13)).toBeNull();
    expect(markupPercent(-1, 13)).toBeNull();
  });
});
