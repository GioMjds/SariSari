import { useAuthStore } from '@/stores/useAuthStore';

const mockStore: Record<string, string> = {};

jest.mock('@/database/settings', () => ({
  getAppSetting: jest.fn(async (key: string) => mockStore[key] ?? null),
  setAppSetting: jest.fn(async (key: string, value: string) => {
    mockStore[key] = value;
  }),
}));

describe('useAuthStore lockout persistence', () => {
  beforeEach(() => {
    delete mockStore['owner_pin_lockout'];
    useAuthStore.setState({ failedAttempts: 0, lockoutUntil: null });
  });

  it('saves the lockout on the third failed attempt and restores it after a restart', async () => {
    const { registerFailedAttempt } = useAuthStore.getState();
    registerFailedAttempt();
    registerFailedAttempt();
    registerFailedAttempt();
    const until = useAuthStore.getState().lockoutUntil;
    expect(until).toBeGreaterThan(Date.now());

    useAuthStore.setState({ failedAttempts: 0, lockoutUntil: null });
    await useAuthStore.getState().hydrateLockout();

    expect(useAuthStore.getState().failedAttempts).toBe(3);
    expect(useAuthStore.getState().lockoutUntil).toBe(until);
  });

  it('clears the saved lockout on success', async () => {
    useAuthStore.getState().registerFailedAttempt();
    useAuthStore.getState().resetFailedAttempts();
    await useAuthStore.getState().hydrateLockout();

    expect(useAuthStore.getState().failedAttempts).toBe(0);
    expect(useAuthStore.getState().lockoutUntil).toBeNull();
  });

  it('ignores a corrupt saved row', async () => {
    mockStore['owner_pin_lockout'] = '{not json';
    await useAuthStore.getState().hydrateLockout();

    expect(useAuthStore.getState().lockoutUntil).toBeNull();
  });
});
