import { addDaysIso } from '@/lib/dueDates';
import { isValidIsoDate } from '@/lib/expiry';

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;
export const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

const pad = (n: number) => String(n).padStart(2, '0');

/** m0 is the zero-based month, like Date. */
export const toIso = (y: number, m0: number, d: number): string =>
  `${y}-${pad(m0 + 1)}-${pad(d)}`;

export interface YMD {
  y: number;
  m0: number;
  d: number;
}

export function parseIso(iso: string): YMD | null {
  if (!isValidIsoDate(iso)) return null;
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return { y, m0: m - 1, d };
}

export const todayIso = (): string => addDaysIso(0);

/** Moves a year and month by whole months, carrying across years in both directions. */
export function shiftMonth(
  y: number,
  m0: number,
  delta: number,
): { y: number; m0: number } {
  const total = y * 12 + m0 + delta;
  return { y: Math.floor(total / 12), m0: ((total % 12) + 12) % 12 };
}

/**
 * Always 42 cells (6 weeks, Sunday first): leading blanks, the day numbers,
 * then trailing blanks. A fixed size keeps the sheet from jumping in height.
 */
export function monthCells(y: number, m0: number): (number | null)[] {
  const lead = new Date(y, m0, 1).getDay();
  const days = new Date(y, m0 + 1, 0).getDate();
  const cells: (number | null)[] = Array(lead).fill(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length < 42) cells.push(null);
  return cells;
}

/** "December 5, 2026", or null when the input is not a real date. */
export function formatLong(iso: string): string | null {
  const p = parseIso(iso);
  return p ? `${MONTHS[p.m0]} ${p.d}, ${p.y}` : null;
}

/** "Saturday, December 5, 2026" for screen readers. */
export function formatSpoken(iso: string): string {
  const p = parseIso(iso);
  if (!p) return iso;
  const weekday = WEEKDAY_NAMES[new Date(p.y, p.m0, p.d).getDay()];
  return `${weekday}, ${MONTHS[p.m0]} ${p.d}, ${p.y}`;
}
