// Money formatting — display shows ₱ with 2 decimals.
import { formatPesos, formatPesosCompact } from '../../lib/money';

describe('formatPesos', () => {
	test('formats round numbers with two decimals', () => {
		expect(formatPesos(12)).toBe('₱12.00');
		expect(formatPesos(0)).toBe('₱0.00');
	});

	test('formats fractional pesos with two decimals', () => {
		expect(formatPesos(12.5)).toBe('₱12.50');
		expect(formatPesos(12.34)).toBe('₱12.34');
	});

	test('formats thousands with locale separator', () => {
		expect(formatPesos(1234.56)).toBe('₱1,234.56');
	});

	test('formats large values without loss of precision in display', () => {
		expect(formatPesos(1_000_000)).toBe('₱1,000,000.00');
	});
});

describe('formatPesosCompact', () => {
	test('formats sub-thousand values as plain pesos', () => {
		expect(formatPesosCompact(0)).toBe('₱0');
		expect(formatPesosCompact(500)).toBe('₱500');
	});

	test('formats thousands as ₱X.Xk', () => {
		expect(formatPesosCompact(1500)).toBe('₱1.5k');
		expect(formatPesosCompact(12_345)).toBe('₱12.3k');
	});

	test('formats millions as ₱X.XM', () => {
		expect(formatPesosCompact(1_500_000)).toBe('₱1.5M');
	});
});
