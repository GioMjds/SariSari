import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';
import { OwnerPinSettingsCard } from '@/components/settings/OwnerPinSettingsCard';

const mockRunWithPinGuard = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/database/auth', () => ({
  isOwnerPinConfigured: jest.fn().mockResolvedValue(true),
}));
jest.mock('@/database/settings', () => ({
  getAppSetting: jest.fn().mockResolvedValue(null),
  setAppSetting: jest.fn(),
}));
jest.mock('@/hooks/useAppSetting', () => ({
  useAppSetting: () => ({ value: null, isLoading: false }),
  useSetAppSetting: () => ({ mutateAsync: jest.fn() }),
}));
jest.mock('@/lib/auth/biometrics', () => ({
  authenticateOwner: jest.fn(),
  getBiometricCapability: jest
    .fn()
    .mockResolvedValue({ available: true, enrolled: true, label: 'fingerprint' }),
}));
jest.mock('@/hooks/useOwnerPinGuard', () => ({
  useOwnerPinGuard: () => ({ runWithPinGuard: mockRunWithPinGuard }),
}));
jest.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => ({
    isPinConfigured: true,
    setIsPinConfigured: jest.fn(),
  }),
}));
jest.mock('@/stores', () => ({
  useToastStore: (sel: (s: unknown) => unknown) =>
    sel({ addToast: jest.fn() }),
}));

describe('OwnerPinSettingsCard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('opens the setup route directly because the route asks for the PIN itself', async () => {
    const screen = await render(<OwnerPinSettingsCard />);
    await fireEvent.press(screen.getByText('pin.btn_change'));
    expect(mockRunWithPinGuard).not.toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith('/settings/owner-pin-setup');
  });

  it('asks for the PIN under biometric_enable before turning biometrics on', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const screen = await render(<OwnerPinSettingsCard />);
    await fireEvent(screen.getByTestId('biometric-toggle'), 'valueChange', true);
    expect(alertSpy).not.toHaveBeenCalled();
    const opts = mockRunWithPinGuard.mock.calls[0][0];
    expect(opts.actionId).toBe('biometric_enable');
    await opts.onApproved();
    expect(alertSpy).toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('turns biometrics off without a PIN prompt', async () => {
    const screen = await render(<OwnerPinSettingsCard />);
    await fireEvent(screen.getByTestId('biometric-toggle'), 'valueChange', false);
    expect(mockRunWithPinGuard).not.toHaveBeenCalled();
  });
});
