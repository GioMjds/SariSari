import React from 'react';
import { act, render } from '@testing-library/react-native';
import OwnerPinSetupScreen from '@/app/settings/owner-pin-setup';
import { isOwnerPinConfigured } from '@/database/auth';

const mockRunWithPinGuard = jest.fn();
const mockGoBackToMore = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));
jest.mock('expo-router', () => ({
  router: { canGoBack: () => false, back: jest.fn() },
}));
jest.mock('@/database/auth', () => ({ isOwnerPinConfigured: jest.fn() }));
jest.mock('@/hooks/useOwnerPinGuard', () => ({
  useOwnerPinGuard: () => ({ runWithPinGuard: mockRunWithPinGuard }),
}));
jest.mock('@/components/more', () => ({
  goBackToMore: () => mockGoBackToMore(),
}));
jest.mock('@/components/auth/OwnerPinSetupFlow', () => ({
  OwnerPinSetupFlow: () =>
    require('react').createElement('Text', null, 'SETUP_FLOW'),
}));

const mockConfigured = isOwnerPinConfigured as jest.Mock;

describe('owner-pin-setup route', () => {
  beforeEach(() => jest.clearAllMocks());

  it('asks for the current PIN before showing the flow when a PIN exists', async () => {
    mockConfigured.mockResolvedValue(true);
    const screen = await render(<OwnerPinSetupScreen />);
    await act(async () => {});
    expect(screen.queryByText('SETUP_FLOW')).toBeNull();
    const opts = mockRunWithPinGuard.mock.calls[0][0];
    expect(opts.actionId).toBe('pin_change');
    await act(async () => {
      opts.onApproved();
    });
    expect(screen.getByText('SETUP_FLOW')).toBeTruthy();
  });

  it('leaves the screen when the PIN check is cancelled', async () => {
    mockConfigured.mockResolvedValue(true);
    const screen = await render(<OwnerPinSetupScreen />);
    await act(async () => {});
    await act(async () => {
      mockRunWithPinGuard.mock.calls[0][0].onCancel();
    });
    expect(mockGoBackToMore).toHaveBeenCalled();
    expect(screen.queryByText('SETUP_FLOW')).toBeNull();
  });

  it('shows the flow without a prompt on first-time setup', async () => {
    mockConfigured.mockResolvedValue(false);
    const screen = await render(<OwnerPinSetupScreen />);
    await act(async () => {});
    expect(mockRunWithPinGuard).not.toHaveBeenCalled();
    expect(screen.getByText('SETUP_FLOW')).toBeTruthy();
  });

  it('fails closed and leaves when PIN status cannot be read', async () => {
    mockConfigured.mockRejectedValue(new Error('db'));
    const screen = await render(<OwnerPinSetupScreen />);
    await act(async () => {});
    expect(mockGoBackToMore).toHaveBeenCalled();
    expect(screen.queryByText('SETUP_FLOW')).toBeNull();
  });
});
