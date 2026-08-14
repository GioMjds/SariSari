import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

const mockRouter = {
  navigate: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn(),
};

jest.unmock('expo-router');
jest.doMock('expo-router', () => ({ router: mockRouter }));

jest.mock('@/components/layout', () => ({
  useTabBarBottomOffset: () => 52,
}));

jest.mock('@/components/more/useScreenHeadingFocus', () => ({
  useScreenHeadingFocus: () => ({ current: null }),
}));

jest.mock('@/components/settings/backup', () => {
  const ReactActual = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    CloudBackupSection: () =>
      ReactActual.createElement(View, { testID: 'cloud-backup-section' }),
    LocalSnapshotsSection: () =>
      ReactActual.createElement(View, { testID: 'local-snapshots-section' }),
  };
});

jest.mock('@/components/settings/LanguagePickerDialog', () => ({
  LanguagePickerDialog: () => null,
}));

jest.mock('@/components/settings/OwnerPinSettingsCard', () => {
  const ReactActual = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    OwnerPinSettingsCard: () =>
      ReactActual.createElement(View, { testID: 'owner-pin-settings' }),
  };
});

jest.mock('@/hooks/useProfile', () => ({
  useProfile: () => ({
    profile: { ownerName: 'Ana', storeName: 'Tindahan ni Ana' },
    loading: false,
    refresh: jest.fn(async () => undefined),
  }),
}));

import { initI18n } from '@/lib/i18n';

const BackupScreen = require('@/app/(tabs)/more/backup')
  .default as typeof import('@/app/(tabs)/more/backup').default;
const SettingsScreen = require('@/app/(tabs)/more/settings')
  .default as typeof import('@/app/(tabs)/more/settings').default;

describe('Backup and Settings route split', () => {
  beforeAll(async () => {
    await AsyncStorage.clear();
    await initI18n();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter.canGoBack.mockReturnValue(false);
  });

  it('hosts both backup tools only on the Backup route', async () => {
    const backup = await render(<BackupScreen />);
    expect(backup.getByTestId('cloud-backup-section')).toBeTruthy();
    expect(backup.getByTestId('local-snapshots-section')).toBeTruthy();
    await backup.unmount();

    const settings = await render(<SettingsScreen />);
    expect(settings.queryByTestId('cloud-backup-section')).toBeNull();
    expect(settings.queryByTestId('local-snapshots-section')).toBeNull();
    expect(settings.getByTestId('owner-pin-settings')).toBeTruthy();
    expect(settings.getByText('Tindahan ni Ana')).toBeTruthy();
    expect(settings.getByText('Ana')).toBeTruthy();
  });

  it('uses the shared deep-link Back fallback and tab-aware bottom padding', async () => {
    const settings = await render(<SettingsScreen />);

    const backButton = settings.getByLabelText('Back to More');
    fireEvent.press(backButton);
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/more');

    const [scrollView] = settings.container.queryAll(
      (instance) => instance.type === 'RCTScrollView',
    );
    expect(scrollView).toBeDefined();
    expect(
      StyleSheet.flatten(scrollView?.props['contentContainerStyle']),
    ).toMatchObject({ paddingBottom: 68 });
  });
});
