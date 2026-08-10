import { useAppInfo } from '@/hooks/useAppInfo';
import Constants from 'expo-constants';

jest.mock('expo-constants', () => ({
  expoConfig: {
    version: '2.0.0',
    extra: {
      privacyPolicyUrl: 'https://giomjds.github.io/SariSari/',
    },
  },
}));

describe('useAppInfo', () => {
  it('returns version and privacyPolicyUrl from expoConfig extra', () => {
    const info = useAppInfo();
    expect(info).toEqual({
      version: '2.0.0',
      privacyPolicyUrl: 'https://giomjds.github.io/SariSari/',
    });
  });

  it('falls back to 1.0.0 and null if expoConfig is missing fields', () => {
    const originalConfig = Constants.expoConfig;
    (Constants as any).expoConfig = null;

    const info = useAppInfo();
    expect(info).toEqual({
      version: '1.0.0',
      privacyPolicyUrl: null,
    });

    (Constants as any).expoConfig = originalConfig;
  });
});
