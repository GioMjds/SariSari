// Temporary debug test to expose swallowed render exceptions.
// Delete once the real test passes.
import { render, screen } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
  router: {
    canGoBack: jest.fn(() => false),
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: jest.fn() },
  }),
  initReactI18next: { type: '3rdParty' },
  Trans: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/hooks/useProfile', () => ({
  useProfile: () => ({
    profile: { storeName: 'Sari Test', ownerName: 'Maria' },
    loading: false,
    refresh: jest.fn(),
  }),
}));

jest.mock('@/components/settings/backup/CloudBackupSection', () => ({
  CloudBackupSection: () => null,
}));
jest.mock('@/components/settings/backup/LocalSnapshotsSection', () => ({
  LocalSnapshotsSection: () => null,
}));
jest.mock('@/components/settings/LanguagePickerDialog', () => ({
  LanguagePickerDialog: () => null,
}));

import Settings from '@/app/(tabs)/more/settings';

describe('debug render', () => {
  it('exposes render-time exceptions via console.error capture', () => {
    const originalError = console.error;
    const captured: string[] = [];
    console.error = (...args: unknown[]) => {
      captured.push(
        args
          .map((entry) =>
            typeof entry === 'string' ? entry : JSON.stringify(entry),
          )
          .join(' '),
      );
      originalError.apply(console, args);
    };
    try {
      render(<Settings />);
      // eslint-disable-next-line no-console
      console.log('RENDER OK, captured.length=', captured.length);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log('RENDER THREW:', (err as Error).message);
    } finally {
      console.error = originalError;
    }
    if (captured.length > 0) {
      throw new Error('CAPTURED CONSOLE.ERROR:\n' + captured.join('\n'));
    }
    expect(true).toBe(true);
  });
});