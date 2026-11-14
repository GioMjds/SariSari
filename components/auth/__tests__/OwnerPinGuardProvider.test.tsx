import React, { useContext } from 'react';
import { act, render } from '@testing-library/react-native';
import {
  OwnerPinGuardContext,
  OwnerPinGuardProvider,
  type OwnerPinGuardContextType,
} from '@/components/auth/OwnerPinGuardProvider';
import { getAppSetting } from '@/database/settings';
import { isOwnerPinConfigured } from '@/database/auth';
import { getBiometricCapability } from '@/lib/auth/biometrics';

jest.mock('@/database/settings', () => ({ getAppSetting: jest.fn() }));
jest.mock('@/database/auth', () => ({ isOwnerPinConfigured: jest.fn() }));
jest.mock('@/lib/auth/biometrics', () => ({
  authenticateOwner: jest.fn(),
  getBiometricCapability: jest.fn(),
}));
jest.mock('@/utils', () => ({ Alert: { alert: jest.fn() } }));
jest.mock('@/stores/useAuthStore', () => {
  const state = {
    setIsPinConfigured: jest.fn(),
    isLockedOut: () => false,
    resetFailedAttempts: jest.fn(),
  };
  const useAuthStore: any = () => state;
  useAuthStore.getState = () => state;
  return { useAuthStore };
});
jest.mock('@/components/auth/OwnerPinModal', () => ({
  OwnerPinModal: () =>
    require('react').createElement('Text', null, 'PIN_CHALLENGE'),
}));
jest.mock('@/components/auth/OwnerPinSetupModal', () => ({
  OwnerPinSetupModal: () =>
    require('react').createElement('Text', null, 'PIN_SETUP'),
}));
jest.mock('@/components/auth/OwnerPinRecoveryModal', () => ({
  OwnerPinRecoveryModal: () =>
    require('react').createElement('Text', null, 'PIN_RECOVERY'),
}));

const mockGetSetting = getAppSetting as jest.Mock;
const mockConfigured = isOwnerPinConfigured as jest.Mock;

let guard: OwnerPinGuardContextType;
const Probe = () => {
  guard = useContext(OwnerPinGuardContext)!;
  return null;
};

const mount = () =>
  render(
    <OwnerPinGuardProvider>
      <Probe />
    </OwnerPinGuardProvider>,
  );

describe('OwnerPinGuardProvider policy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConfigured.mockResolvedValue(true);
    // getAppSetting also feeds the biometric flag, so keep biometrics unavailable.
    (getBiometricCapability as jest.Mock).mockResolvedValue({
      available: false,
      enrolled: false,
      label: 'none',
    });
  });

  it('runs onApproved directly when the action is turned off', async () => {
    mockGetSetting.mockResolvedValue('0');
    const screen = await mount();
    const onApproved = jest.fn();
    await act(async () => {
      await guard.runWithPinGuard({ actionId: 'stock_adjustment', onApproved });
    });
    expect(onApproved).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('PIN_CHALLENGE')).toBeNull();
  });

  it('opens the challenge when the action is on', async () => {
    mockGetSetting.mockResolvedValue('1');
    const screen = await mount();
    const onApproved = jest.fn();
    await act(async () => {
      await guard.runWithPinGuard({ actionId: 'stock_adjustment', onApproved });
    });
    expect(onApproved).not.toHaveBeenCalled();
    expect(screen.getByText('PIN_CHALLENGE')).toBeTruthy();
  });

  it('ignores a stored 0 on a locked action', async () => {
    mockGetSetting.mockResolvedValue('0');
    const screen = await mount();
    const onApproved = jest.fn();
    await act(async () => {
      await guard.runWithPinGuard({ actionId: 'backup_restore', onApproved });
    });
    expect(onApproved).not.toHaveBeenCalled();
    expect(screen.getByText('PIN_CHALLENGE')).toBeTruthy();
  });

  it('requires the PIN when the policy read throws', async () => {
    mockGetSetting.mockRejectedValue(new Error('db down'));
    const screen = await mount();
    const onApproved = jest.fn();
    await act(async () => {
      await guard.runWithPinGuard({ actionId: 'stock_adjustment', onApproved });
    });
    expect(onApproved).not.toHaveBeenCalled();
    expect(screen.getByText('PIN_CHALLENGE')).toBeTruthy();
  });

  it('drops a re-entrant call while the first is in flight, then allows the next', async () => {
    mockGetSetting.mockResolvedValue('0');
    await mount();
    const onApproved = jest.fn();
    await act(async () => {
      await Promise.all([
        guard.runWithPinGuard({ actionId: 'stock_adjustment', onApproved }),
        guard.runWithPinGuard({ actionId: 'stock_adjustment', onApproved }),
      ]);
    });
    expect(onApproved).toHaveBeenCalledTimes(1);
    await act(async () => {
      await guard.runWithPinGuard({ actionId: 'stock_adjustment', onApproved });
    });
    expect(onApproved).toHaveBeenCalledTimes(2);
  });

  it('skips PIN setup when the action is off and no PIN exists', async () => {
    mockGetSetting.mockResolvedValue('0');
    mockConfigured.mockResolvedValue(false);
    const screen = await mount();
    const onApproved = jest.fn();
    await act(async () => {
      await guard.runWithPinGuard({ actionId: 'stock_adjustment', onApproved });
    });
    expect(onApproved).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('PIN_SETUP')).toBeNull();
  });
});
