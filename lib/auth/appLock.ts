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
