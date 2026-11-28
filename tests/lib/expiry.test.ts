import {
  daysUntilExpiry,
  formatExpiryInput,
  isValidIsoDate,
} from '@/lib/expiry';
import { getStatus } from '@/types/inventory.types';

const NOW = new Date(2026, 10, 28, 15, 0).getTime();
const base = { quantity: 10, created_at: '2020-01-01' };

describe('expiry helpers', () => {
  it('validates real calendar dates only', () => {
    expect(isValidIsoDate('2026-12-05')).toBe(true);
    expect(isValidIsoDate('2026-02-30')).toBe(false);
    expect(isValidIsoDate('2026-1-5')).toBe(false);
  });

  it('formats typed digits as YYYY-MM-DD', () => {
    expect(formatExpiryInput('20261205')).toBe('2026-12-05');
    expect(formatExpiryInput('2026-12')).toBe('2026-12');
  });

  it('counts whole local days, negative once expired', () => {
    const now = new Date(NOW);
    expect(daysUntilExpiry('2026-11-28', now)).toBe(0);
    expect(daysUntilExpiry('2026-12-05', now)).toBe(7);
    expect(daysUntilExpiry('2026-11-26', now)).toBe(-2);
  });

  it('getStatus applies the store window, the override, and expired stock', () => {
    expect(getStatus({ ...base, expiry_date: '2026-12-05' }, NOW, 7)).toBe(
      'near_expiry',
    );
    expect(getStatus({ ...base, expiry_date: '2026-12-05' }, NOW, 3)).toBe(
      'healthy',
    );
    expect(
      getStatus(
        { ...base, expiry_date: '2026-12-05', expiry_warn_days: 10 },
        NOW,
        3,
      ),
    ).toBe('near_expiry');
    expect(getStatus({ ...base, expiry_date: '2026-11-20' }, NOW, 7)).toBe(
      'near_expiry',
    );
    expect(
      getStatus({ ...base, quantity: 0, expiry_date: '2026-11-20' }, NOW, 7),
    ).toBe('out_of_stock');
  });
});
