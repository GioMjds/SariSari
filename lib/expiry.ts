import { addDaysIso } from '@/lib/dueDates';

const DAY_MS = 24 * 60 * 60 * 1000;

/** True for a real calendar date written as YYYY-MM-DD. */
export function isValidIsoDate(iso: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(y, mo - 1, d);
  return (
    date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d
  );
}

/** Keeps digits only and inserts dashes as the owner types YYYYMMDD. */
export function formatExpiryInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

/** Whole days from today (local) to the date; negative once expired, null if unparseable. */
export function daysUntilExpiry(iso: string, now = new Date()): number | null {
  if (!isValidIsoDate(iso)) return null;
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((new Date(y, m - 1, d).getTime() - today.getTime()) / DAY_MS);
}

/** Quick-pick offsets in days for dates printed far from today. */
export const EXPIRY_QUICK_PICKS = [
  { label: '1 mo', days: 30 },
  { label: '3 mo', days: 90 },
  { label: '6 mo', days: 180 },
  { label: '1 yr', days: 365 },
] as const;

export const expiryFromToday = (days: number): string => addDaysIso(days);
