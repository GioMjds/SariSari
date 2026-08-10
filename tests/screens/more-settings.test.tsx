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

// react-i18next has no instance in unit tests; stub t/i18n so the
// Settings screen renders.
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: jest.fn() },
  }),
  initReactI18next: { type: '3rdParty' },
  Trans: ({ children }: { children: React.ReactNode }) => children,
}));

// useProfile reads from onboardingStorage on mount. Stub it so the
// component renders in isolation.
jest.mock('@/hooks/useProfile', () => ({
  useProfile: () => ({
    profile: { storeName: 'Sari Test', ownerName: 'Maria' },
    loading: false,
    refresh: jest.fn(),
  }),
}));

// The backup sections talk to Google Drive / SecureStore; stub them so
// the test only exercises the Settings screen chrome.
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

describe('More settings screen', () => {
  it('renders the Store section header', () => {
    render(<Settings />);
    expect(screen.getByText('common:settingsStoreSection')).toBeTruthy();
  });

  it('renders the Database section header', () => {
    render(<Settings />);
    expect(screen.getByText('common:settingsDatabaseSection')).toBeTruthy();
  });

  it('renders the Language picker row', () => {
    render(<Settings />);
    expect(screen.getByText('common:settingsLanguage')).toBeTruthy();
  });

  it('renders the store and owner values from useProfile', () => {
    render(<Settings />);
    expect(screen.getByText('Sari Test')).toBeTruthy();
    expect(screen.getByText('Maria')).toBeTruthy();
  });
});