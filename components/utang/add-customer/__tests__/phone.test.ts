import { formatPhone, normalizePhoneInput, validatePhone } from '../phone';

describe('add-customer phone helpers', () => {
  it('normalizes pasted and dashed numbers to local digits', () => {
    expect(normalizePhoneInput('+63 917 123 4567')).toBe('09171234567');
    expect(normalizePhoneInput('0917-123-4567')).toBe('09171234567');
    expect(normalizePhoneInput('091712345678')).toBe('09171234567');
  });

  it('groups mobile numbers and leaves landlines as typed', () => {
    expect(formatPhone('09171234567')).toBe('0917 123 4567');
    expect(formatPhone('09171')).toBe('0917 1');
    expect(formatPhone('0281234567')).toBe('0281234567');
  });

  it('accepts empty or complete numbers and rejects partial ones', () => {
    expect(validatePhone('')).toBe(true);
    expect(validatePhone('09171234567')).toBe(true);
    expect(validatePhone('0281234567')).toBe(true);
    expect(typeof validatePhone('0917123')).toBe('string');
    expect(typeof validatePhone('12345')).toBe('string');
  });
});
