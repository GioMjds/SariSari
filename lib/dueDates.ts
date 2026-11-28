export type DuePreset = 'none' | '1w' | '2w' | '1m';

export interface DuePresetConfig {
  id: DuePreset;
  label: string;
  description: string;
  resolve: () => string;
}

/** Add N days to now and return as YYYY-MM-DD in local time. */
export function addDaysIso(days: number, now = Date.now()): string {
  const d = new Date(now + days * 24 * 60 * 60 * 1000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/** Format a YYYY-MM-DD string into "Mon DD" for chip display. */
export function formatDueChip(iso: string): string | null {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export const DUE_PRESETS = [
  { id: 'none', label: 'No Limit', description: 'Open-ended', resolve: () => '' },
  { id: '1w', label: '1 Wk', description: '7 days', resolve: () => addDaysIso(7) },
  { id: '2w', label: '2 Wks', description: '14 days', resolve: () => addDaysIso(14) },
  { id: '1m', label: '1 Mo', description: '30 days', resolve: () => addDaysIso(30) },
] satisfies DuePresetConfig[];
