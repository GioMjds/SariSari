import { addDaysIso, DUE_PRESETS, formatDueChip } from '@/lib/dueDates';

describe('dueDates', () => {
  it('adds days across a month boundary', () => {
    const jan30 = new Date(2026, 0, 30, 12).getTime();
    expect(addDaysIso(7, jan30)).toBe('2026-02-06');
  });

  it('formats a due chip and rejects bad input', () => {
    expect(formatDueChip('2026-02-06')).toBe('Feb 6');
    expect(formatDueChip('')).toBeNull();
    expect(formatDueChip('bad')).toBeNull();
  });

  it('keeps no-limit preset empty', () => {
    expect(DUE_PRESETS.find((p) => p.id === 'none')?.resolve()).toBe('');
  });
});
