import React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react-native';
import { OwnerPinSettingsCard } from '@/components/settings/OwnerPinSettingsCard';
import * as authDb from '@/database/auth';
import * as settingsDb from '@/database/settings';
import * as biometrics from '@/lib/auth/biometrics';
import { useAuthStore } from '@/stores/useAuthStore';
import { initI18n } from '@/lib/i18n';

jest.mock('@/hooks/useAppSetting', () => ({
  useAppSetting: (key: string) => {
    const { useEffect, useState } = require('react') as typeof import('react');
    const [val, setVal] = useState<string | null>(null);
    useEffect(() => {
      require('@/database/settings')
        .getAppSetting(key)
        .then(setVal)
        .catch(() => setVal(null));
    }, [key]);
    return { value: val, isLoading: false };
  },
  useSetAppSetting: (key: string) => ({
    mutateAsync: async (value: string) => {
      await require('@/database/settings').setAppSetting(key, value);
    },
  }),
}));

describe('OwnerPinSettingsCard biometric toggles', () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      isPinConfigured: true,
      failedAttempts: 0,
      lockoutUntil: null,
      isAppUnlocked: true,
      lastBackgroundedAt: null,
    });
    jest.spyOn(authDb, 'isOwnerPinConfigured').mockResolvedValue(true);
    jest.spyOn(settingsDb, 'getAppSetting').mockResolvedValue('0');
    jest.spyOn(settingsDb, 'setAppSetting').mockResolvedValue(undefined);
    jest.spyOn(biometrics, 'getBiometricCapability').mockResolvedValue({
      available: true,
      enrolled: true,
      label: 'fingerprint',
    });
    jest.spyOn(biometrics, 'authenticateOwner').mockResolvedValue('success');
  });

  it('disables the biometric toggle when no PIN is configured', async () => {
    jest.spyOn(authDb, 'isOwnerPinConfigured').mockResolvedValue(false);
    useAuthStore.setState({ isPinConfigured: false });

    const { getByTestId } = await render(<OwnerPinSettingsCard />);

    await waitFor(() => {
      expect(getByTestId('biometric-toggle').props['disabled']).toBe(true);
    });
  });

  it('disables the biometric toggle when hardware is absent', async () => {
    jest.spyOn(biometrics, 'getBiometricCapability').mockResolvedValue({
      available: false,
      enrolled: false,
      label: 'none',
    });

    const { getByTestId } = await render(<OwnerPinSettingsCard />);

    await waitFor(() => {
      expect(getByTestId('biometric-toggle').props['disabled']).toBe(true);
    });
  });

  it('disables the biometric toggle when hardware is present but nothing is enrolled', async () => {
    jest.spyOn(biometrics, 'getBiometricCapability').mockResolvedValue({
      available: true,
      enrolled: false,
      label: 'fingerprint',
    });

    const { getByTestId } = await render(<OwnerPinSettingsCard />);

    await waitFor(() => {
      expect(getByTestId('biometric-toggle').props['disabled']).toBe(true);
    });
  });

  it('shows the risk confirmation before enabling biometrics', async () => {
    const { getByTestId, queryByText } = await render(<OwnerPinSettingsCard />);

    await waitFor(() => {
      expect(getByTestId('biometric-toggle').props['disabled']).toBe(false);
    });

    await act(async () => {
      fireEvent(getByTestId('biometric-toggle'), 'valueChange', true);
    });

    await waitFor(() => {
      expect(queryByText(/Anyone enrolled/i)).toBeTruthy();
    });

    expect(biometrics.authenticateOwner).not.toHaveBeenCalled();
  });

  it('calls authenticateOwner after the risk confirmation is accepted', async () => {
    const { getByTestId, getByText } = await render(<OwnerPinSettingsCard />);

    await waitFor(() => {
      expect(getByTestId('biometric-toggle').props['disabled']).toBe(false);
    });

    await act(async () => {
      fireEvent(getByTestId('biometric-toggle'), 'valueChange', true);
    });
    await waitFor(() => expect(getByText(/I understand/i)).toBeTruthy());
    await act(async () => {
      fireEvent.press(getByText(/I understand/i));
    });

    await waitFor(() => {
      expect(biometrics.authenticateOwner).toHaveBeenCalledTimes(1);
    });
  });

  it('persists the flag only when biometric verification succeeds', async () => {
    const { getByTestId, getByText } = await render(<OwnerPinSettingsCard />);

    await waitFor(() => {
      expect(getByTestId('biometric-toggle').props['disabled']).toBe(false);
    });

    await act(async () => {
      fireEvent(getByTestId('biometric-toggle'), 'valueChange', true);
    });
    await waitFor(() => expect(getByText(/I understand/i)).toBeTruthy());
    await act(async () => {
      fireEvent.press(getByText(/I understand/i));
    });

    await waitFor(() => {
      expect(settingsDb.setAppSetting).toHaveBeenCalledWith(
        'biometric_unlock_enabled',
        '1',
      );
    });
  });

  it('leaves the toggle off when the verification is cancelled', async () => {
    jest.spyOn(biometrics, 'authenticateOwner').mockResolvedValue('cancelled');

    const { getByTestId, getByText } = await render(<OwnerPinSettingsCard />);

    await waitFor(() => {
      expect(getByTestId('biometric-toggle').props['disabled']).toBe(false);
    });

    await act(async () => {
      fireEvent(getByTestId('biometric-toggle'), 'valueChange', true);
    });
    await waitFor(() => expect(getByText(/I understand/i)).toBeTruthy());
    await act(async () => {
      fireEvent.press(getByText(/I understand/i));
    });

    await waitFor(() => {
      expect(biometrics.authenticateOwner).toHaveBeenCalledTimes(1);
    });

    expect(settingsDb.setAppSetting).not.toHaveBeenCalledWith(
      'biometric_unlock_enabled',
      '1',
    );
  });

  it('disables the launch lock toggle when no PIN is configured', async () => {
    jest.spyOn(authDb, 'isOwnerPinConfigured').mockResolvedValue(false);
    useAuthStore.setState({ isPinConfigured: false });

    const { getByTestId } = await render(<OwnerPinSettingsCard />);

    await waitFor(() => {
      expect(getByTestId('launch-lock-toggle').props['disabled']).toBe(true);
    });
  });

  it('saves the launch lock flag when toggled on', async () => {
    const { getByTestId } = await render(<OwnerPinSettingsCard />);

    await waitFor(() => {
      expect(getByTestId('launch-lock-toggle').props['disabled']).toBe(false);
    });

    await act(async () => {
      fireEvent(getByTestId('launch-lock-toggle'), 'valueChange', true);
    });

    await waitFor(() => {
      expect(settingsDb.setAppSetting).toHaveBeenCalledWith(
        'app_launch_lock_enabled',
        '1',
      );
    });
  });

  it('turning off biometrics does not turn off the launch lock', async () => {
    jest.spyOn(settingsDb, 'getAppSetting').mockImplementation(async (key) => {
      if (key === 'biometric_unlock_enabled') return '1';
      if (key === 'app_launch_lock_enabled') return '1';
      return '0';
    });

    const { getByTestId } = await render(<OwnerPinSettingsCard />);

    await waitFor(() => {
      expect(getByTestId('biometric-toggle').props['value']).toBe(true);
      expect(getByTestId('launch-lock-toggle').props['value']).toBe(true);
    });

    await act(async () => {
      fireEvent(getByTestId('biometric-toggle'), 'valueChange', false);
    });

    await waitFor(() => {
      expect(settingsDb.setAppSetting).toHaveBeenCalledWith(
        'biometric_unlock_enabled',
        '0',
      );
    });

    expect(settingsDb.setAppSetting).not.toHaveBeenCalledWith(
      'app_launch_lock_enabled',
      '0',
    );
  });
});
