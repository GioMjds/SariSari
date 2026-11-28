export const APP_LOCK_GRACE_MS = 300_000;

export const shouldRelockOnResume = (
  lastBackgroundedAt: number | null,
  now: number,
  promptActive: boolean,
): boolean => {
  if (promptActive) return false;
  if (lastBackgroundedAt === null) return false;
  return now - lastBackgroundedAt > APP_LOCK_GRACE_MS;
}

/** Decides the launch lock; a failed read stays locked unless the PIN is known to be absent. */
export const resolveLaunchLock = async (
  readLockFlag: () => Promise<string | null>,
  readHasPin: () => Promise<boolean>,
): Promise<'armed' | 'inert'> => {
  try {
    const [flag, hasPin] = await Promise.all([readLockFlag(), readHasPin()]);
    return flag === '1' && hasPin ? 'armed' : 'inert';
  } catch {
    try {
      return (await readHasPin()) ? 'armed' : 'inert';
    } catch {
      return 'armed';
    }
  }
};
