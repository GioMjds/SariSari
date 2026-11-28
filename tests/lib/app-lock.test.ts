import { resolveLaunchLock } from '@/lib/auth/appLock';

const fail = () => Promise.reject(new Error('db'));

describe('resolveLaunchLock', () => {
  it('arms when the flag is on and a PIN exists', async () => {
    await expect(
      resolveLaunchLock(async () => '1', async () => true),
    ).resolves.toBe('armed');
  });

  it('stays open when the flag is off', async () => {
    await expect(
      resolveLaunchLock(async () => '0', async () => true),
    ).resolves.toBe('inert');
  });

  it('locks when the flag read fails and a PIN exists', async () => {
    await expect(resolveLaunchLock(fail, async () => true)).resolves.toBe(
      'armed',
    );
  });

  it('opens when the flag read fails and no PIN exists', async () => {
    await expect(resolveLaunchLock(fail, async () => false)).resolves.toBe(
      'inert',
    );
  });

  it('locks when every read fails', async () => {
    await expect(resolveLaunchLock(fail, fail)).resolves.toBe('armed');
  });
});
