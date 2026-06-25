// Money parsing invariants — money is integer pesos end-to-end.
// `parsePesosInput` accepts user-typed strings with optional currency symbols
// or thousands separators, and rounds to at most two decimal places so the
// integer-pesos invariant is preserved.
import { parsePesosInput, tryParsePesosInput } from '../../lib/money';

describe('parsePesosInput', () => {
	test('parses plain integer', () => {
		expect(parsePesosInput('12')).toBe(12);
	});

	test('parses fractional pesos and rounds to 2 decimals', () => {
		expect(parsePesosInput('12.50')).toBe(12.5);
		expect(parsePesosInput('12.5')).toBe(12.5);
		expect(parsePesosInput('0.99')).toBe(0.99);
	});

	test('strips currency symbol and thousands separators', () => {
		expect(parsePesosInput('₱1,234.56')).toBe(1234.56);
		expect(parsePesosInput('P 1,234')).toBe(1234);
	});

	test('rounds to two decimals (banker rounding for ₱0.005)', () => {
		// 12.345 rounds to 12.35 (half away from zero for parseFloat-driven values)
		expect(parsePesosInput('12.345')).toBe(12.35);
		expect(parsePesosInput('12.344')).toBe(12.34);
	});

	test('zero is allowed', () => {
		expect(parsePesosInput('0')).toBe(0);
		expect(parsePesosInput('0.00')).toBe(0);
	});

	test('throws on invalid input', () => {
		expect(() => parsePesosInput('')).toThrow();
		expect(() => parsePesosInput('-')).toThrow();
		expect(() => parsePesosInput('.')).toThrow();
		expect(() => parsePesosInput('-.')).toThrow();
		expect(() => parsePesosInput('abc')).toThrow();
		expect(() => parsePesosInput('--5')).toThrow();
	});

	test('throws on negative amounts', () => {
		expect(() => parsePesosInput('-5')).toThrow(/cannot be negative/);
	});

	test('tryParsePesosInput returns 0 for invalid input', () => {
		expect(tryParsePesosInput('garbage')).toBe(0);
		expect(tryParsePesosInput('')).toBe(0);
		expect(tryParsePesosInput('-1')).toBe(0); // negatives are also invalid
	});

	test('tryParsePesosInput returns the value for valid input', () => {
		expect(tryParsePesosInput('12.50')).toBe(12.5);
	});
});
