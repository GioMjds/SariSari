import {
  formatDualStock,
  formatDualPrice,
  calculateTotalPieces,
  calculateWholesaleSavings,
} from '../../lib/units';

describe('Unit Conversion & Formatting Utilities', () => {
  describe('formatDualStock', () => {
    test('formats stock with cases and pieces when wholesale enabled', () => {
      expect(formatDualStock(29, 'Bottle', 'Case', 12)).toBe('2 Cases, 5 Bottles');
    });

    test('shows only pieces when cases is 0', () => {
      expect(formatDualStock(5, 'Bottle', 'Case', 12)).toBe('5 Bottles');
    });

    test('shows only cases when remainder is 0', () => {
      expect(formatDualStock(24, 'Bottle', 'Case', 12)).toBe('2 Cases');
    });

    test('falls back to single unit when wholesale is disabled or conversion factor < 2', () => {
      expect(formatDualStock(15, 'Pc')).toBe('15 Pcs');
      expect(formatDualStock(1, 'Bottle', null, null)).toBe('1 Bottle');
    });
  });

  describe('formatDualPrice', () => {
    test('formats both prices when wholesale price exists', () => {
      // ₱60 retail, ₱660 case
      expect(formatDualPrice(60, 660, 'Bottle', 'Case')).toBe('₱60.00/Bottle • ₱660.00/Case');
    });

    test('formats only retail price when wholesale price is null', () => {
      expect(formatDualPrice(15)).toBe('₱15.00');
    });
  });

  describe('calculateTotalPieces', () => {
    test('converts wholesale quantity to base pieces', () => {
      expect(calculateTotalPieces(2, 'wholesale', 12)).toBe(24);
    });

    test('returns unitQty directly for retail unit', () => {
      expect(calculateTotalPieces(5, 'retail', 12)).toBe(5);
    });
  });

  describe('calculateWholesaleSavings', () => {
    test('calculates correct savings per piece and percentage', () => {
      // Retail = ₱60, Wholesale = ₱660, conversion = 12
      // Equivalent retail = 660 / 12 = 55 (₱55)
      // Savings per piece = 5 (₱5), Percent = round(5/60 * 100) = 8%
      const res = calculateWholesaleSavings(60, 660, 12);
      expect(res).toEqual({
        equivalentRetailPrice: 55,
        savingsPerPiece: 5,
        savingsPercent: 8,
      });
    });

    test('returns null when conversion factor < 2 or wholesalePrice <= 0', () => {
      expect(calculateWholesaleSavings(60, 0, 12)).toBeNull();
      expect(calculateWholesaleSavings(60, 60, 1)).toBeNull();
    });
  });
});
