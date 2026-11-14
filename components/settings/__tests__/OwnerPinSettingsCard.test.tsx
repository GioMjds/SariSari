import React from 'react';
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
    .mockResolvedValue({ available: false, enrolled: false, label: 'none' }),
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

describe('OwnerPinSettingsCard change PIN button', () => {
  beforeEach(() => jest.clearAllMocks());

  it('asks for the PIN under pin_change before opening the setup route', async () => {
    const screen = await render(<OwnerPinSettingsCard />);
    await fireEvent.press(screen.getByText('pin.btn_change'));
    expect(router.push).not.toHaveBeenCalled();
    const opts = mockRunWithPinGuard.mock.calls[0][0];
    expect(opts.actionId).toBe('pin_change');
    opts.onApproved();
    expect(router.push).toHaveBeenCalledWith('/settings/owner-pin-setup');
  });
});
