import {
  PIN_ACTIONS,
  getPinAction,
  isPinRequired,
  parsePinOverrides,
  pinActionKey,
} from '@/lib/auth/pin-actions';

const LOCKED_IDS = [
  'backup_restore',
  'drive_unlink',
  'pin_change',
  'pin_policy_change',
  'biometric_enable',
];

describe('pin action registry', () => {
  it('has unique ids', () => {
    const ids = PIN_ACTIONS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('marks exactly the core actions as locked', () => {
    const locked = PIN_ACTIONS.filter((a) => a.risk === 'locked').map(
      (a) => a.id,
    );
    expect(locked.sort()).toEqual([...LOCKED_IDS].sort());
  });

  it('defaults every action to on so existing installs keep their guards', () => {
    expect(PIN_ACTIONS.every((a) => a.defaultEnabled)).toBe(true);
  });

  it('builds the storage key from the id', () => {
    expect(pinActionKey('sale_void')).toBe('owner_pin_action.sale_void');
  });
});

describe('isPinRequired', () => {
  const reader = (value: string | null) => jest.fn().mockResolvedValue(value);

  it('uses the registry default when no row exists', async () => {
    expect(await isPinRequired('stock_adjustment', reader(null))).toBe(true);
  });

  it('honors an override of 0 for a non-locked action', async () => {
    expect(await isPinRequired('stock_adjustment', reader('0'))).toBe(false);
  });

  it('honors an override of 1', async () => {
    expect(await isPinRequired('stock_adjustment', reader('1'))).toBe(true);
  });

  it('ignores a stored 0 on a locked action and never reads it', async () => {
    const read = reader('0');
    expect(await isPinRequired('backup_restore', read)).toBe(true);
    expect(read).not.toHaveBeenCalled();
  });

  it.each(['', '2', 'true'])(
    'falls back to the default for garbage value %p',
    async (raw) => {
      expect(await isPinRequired('sale_void', reader(raw))).toBe(true);
    },
  );

  it('requires the PIN for an unknown action id', async () => {
    expect(await isPinRequired('not_an_action', reader('0'))).toBe(true);
  });

  it('requires the PIN when the read throws', async () => {
    const read = jest.fn().mockRejectedValue(new Error('db down'));
    expect(await isPinRequired('stock_adjustment', read)).toBe(true);
  });
});

describe('parsePinOverrides', () => {
  it('maps known ids to booleans and drops unknown or malformed rows', () => {
    const result = parsePinOverrides([
      { key: 'owner_pin_action.sale_void', value: '0' },
      { key: 'owner_pin_action.stock_adjustment', value: '1' },
      { key: 'owner_pin_action.removed_action', value: '0' },
      { key: 'owner_pin_action.sale_refund', value: 'x' },
    ]);
    expect(result).toEqual({ sale_void: false, stock_adjustment: true });
  });
});

describe('getPinAction', () => {
  it('returns undefined for unknown ids', () => {
    expect(getPinAction('nope')).toBeUndefined();
  });
});
