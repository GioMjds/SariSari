export const PHONE_MAX_DIGITS = 11;

/** Strips input to local digits; a pasted +63 prefix becomes a leading 0. */
export function normalizePhoneInput(text: string): string {
  const digits = text.replace(/\D/g, '');
  const local = digits.startsWith('63') ? `0${digits.slice(2)}` : digits;
  return local.slice(0, PHONE_MAX_DIGITS);
}

/** Groups PH mobile numbers as 0917 123 4567; other numbers stay as typed. */
export function formatPhone(digits: string): string {
  if (!digits.startsWith('09')) return digits;
  return [digits.slice(0, 4), digits.slice(4, 7), digits.slice(7)]
    .filter(Boolean)
    .join(' ');
}

/** Returns an error message, or true when the phone is empty or plausible. */
export function validatePhone(digits: string): true | string {
  if (!digits) return true;
  if (digits.startsWith('09') && digits.length !== 11) {
    return 'Mobile numbers have 11 digits, like 0917 123 4567';
  }
  if (digits.length < 7) return 'Number looks too short';
  return true;
}
