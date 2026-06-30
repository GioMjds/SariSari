// Pure-TS parity tests for `validateBarcode` and `BARCODE_REGEX`.
//
// The format gate is the first line of defense for both the camera
// scanner and the manual-entry fallback. Coverage here mirrors the
// spec §6 "Pure logic tests" checklist.

import { describe, expect, test } from '@jest/globals';
import {
  BARCODE_REGEX,
  DEFAULT_BARCODE_THROTTLE_MS,
  validateBarcode,
} from '../../lib/barcodes/format';

describe('validateBarcode', () => {
  test('accepts standard retail barcodes (GTIN-13, GTIN-12, GTIN-8)', () => {
    expect(validateBarcode('4800016112345')).toEqual({
      ok: true,
      barcode: '4800016112345',
    });
    expect(validateBarcode('4800016112')).toEqual({
      ok: true,
      barcode: '4800016112',
    });
    expect(validateBarcode('7622210999999')).toEqual({
      ok: true,
      barcode: '7622210999999',
    });
    expect(validateBarcode('12345678')).toEqual({
      ok: true,
      barcode: '12345678',
    });
  });

  test('rejects empty input', () => {
    expect(validateBarcode('')).toEqual({ ok: false, reason: 'empty' });
  });

  test('rejects non-numeric characters (defends against letter-lookalikes)', () => {
    expect(validateBarcode('abcdef12345')).toEqual({
      ok: false,
      reason: 'format',
    });
    expect(validateBarcode('4800016O12345')).toEqual({
      ok: false,
      reason: 'format',
    });
  });

  test('rejects lengths outside 8-14 digits', () => {
    expect(validateBarcode('1234567')).toEqual({ ok: false, reason: 'format' });
    expect(validateBarcode('123456789012345')).toEqual({
      ok: false,
      reason: 'format',
    });
  });

  test('trims leading/trailing whitespace on success', () => {
    expect(validateBarcode('  12345678  ')).toEqual({
      ok: true,
      barcode: '12345678',
    });
  });

  test('trims whitespace then classifies empty trimmed value as empty', () => {
    expect(validateBarcode('   ')).toEqual({ ok: false, reason: 'empty' });
  });
});

describe('format constants', () => {
  test('BARCODE_REGEX is digits-only 8-14 chars', () => {
    expect(BARCODE_REGEX.test('12345678')).toBe(true);
    expect(BARCODE_REGEX.test('1234567')).toBe(false);
    expect(BARCODE_REGEX.test('123456789012345')).toBe(false);
    expect(BARCODE_REGEX.test('abcdef12345')).toBe(false);
  });

  test('DEFAULT_BARCODE_THROTTLE_MS is 1500ms', () => {
    expect(DEFAULT_BARCODE_THROTTLE_MS).toBe(1500);
  });
});