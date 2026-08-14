import React from 'react';
import { render } from '@testing-library/react-native';
import { initI18n } from '@/lib/i18n';

jest.mock('@/components/layout', () => ({
  useTabBarBottomOffset: () => 80,
}));

jest.mock('@/components/more', () => {
  const mockReact = require('react');
  const mockReactNative = require('react-native');
  return {
    goBackToMore: jest.fn(),
    MoreDetailHeader: () =>
      mockReact.createElement(mockReactNative.View, {
        testID: 'more-detail-header',
      }),
  };
});

jest.mock('@/components/settings/backup', () => {
  const mockReact = require('react');
  const mockReactNative = require('react-native');
  return {
    CloudBackupSection: () =>
      mockReact.createElement(mockReactNative.View, {
        testID: 'cloud-backup-section',
      }),
    LocalSnapshotsSection: () =>
      mockReact.createElement(mockReactNative.View, {
        testID: 'local-snapshots-section',
      }),
  };
});

jest.mock('@/components/settings/LanguagePickerDialog', () => {
  const mockReact = require('react');
  const mockReactNative = require('react-native');
  return {
    LanguagePickerDialog: () =>
      mockReact.createElement(mockReactNative.View, {
        testID: 'language-picker-dialog',
      }),
  };
});

jest.mock('@/components/settings/OwnerPinSettingsCard', () => {
  const mockReact = require('react');
  const mockReactNative = require('react-native');
  return {
    OwnerPinSettingsCard: () =>
      mockReact.createElement(mockReactNative.View, {
        testID: 'owner-pin-settings',
      }),
  };
});

jest.mock('@/hooks/useProfile', () => ({
  useProfile: () => ({
    profile: { storeName: 'SariSari Test Store', ownerName: 'Test Owner' },
    loading: false,
  }),
}));

import BackupScreen from '@/app/(tabs)/more/backup';
import SettingsScreen from '@/app/(tabs)/more/settings';

describe('Backup and Settings route split', () => {
  beforeAll(async () => {
    await initI18n();
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
    await settings.unmount();
  });
});
