import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { PinPolicyCard } from '@/components/settings/PinPolicyCard';

const mockSetOverride = jest.fn().mockResolvedValue(undefined);
const mockRunWithPinGuard = jest.fn();
const mockAddToast = jest.fn();
let mockOverrides: Record<string, boolean> = {};
let mockPinConfigured = true;

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));
jest.mock('@/hooks/usePinPolicy', () => ({
  usePinPolicy: () => ({
    overrides: mockOverrides,
    isLoading: false,
    setOverride: mockSetOverride,
  }),
}));
jest.mock('@/hooks/useOwnerPinGuard', () => ({
  useOwnerPinGuard: () => ({ runWithPinGuard: mockRunWithPinGuard }),
}));
jest.mock('@/stores/useAuthStore', () => ({
  useAuthStore: (sel: (s: unknown) => unknown) =>
    sel({ isPinConfigured: mockPinConfigured }),
}));
jest.mock('@/stores', () => ({
  useToastStore: (sel: (s: unknown) => unknown) =>
    sel({ addToast: mockAddToast }),
}));

describe('PinPolicyCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOverrides = {};
    mockPinConfigured = true;
  });

  it('shows a switch for non-locked actions only', async () => {
    const screen = await render(<PinPolicyCard />);
    expect(screen.getByTestId('pin-policy-switch-sale_void')).toBeTruthy();
    expect(screen.queryByTestId('pin-policy-switch-backup_restore')).toBeNull();
    expect(screen.getAllByText('pin_policy.locked').length).toBe(4);
  });

  it('disables switches until a PIN is configured', async () => {
    mockPinConfigured = false;
    const screen = await render(<PinPolicyCard />);
    const sw = screen.getByTestId('pin-policy-switch-sale_void');
    expect(sw.props['disabled']).toBe(true);
  });

  it('toggling asks for the PIN under pin_policy_change, then saves', async () => {
    const screen = await render(<PinPolicyCard />);
    await fireEvent(
      screen.getByTestId('pin-policy-switch-stock_adjustment'),
      'valueChange',
      false,
    );
    const opts = mockRunWithPinGuard.mock.calls[0][0];
    expect(opts.actionId).toBe('pin_policy_change');
    expect(mockSetOverride).not.toHaveBeenCalled();
    await act(async () => {
      await opts.onApproved();
    });
    expect(mockSetOverride).toHaveBeenCalledWith({
      id: 'stock_adjustment',
      enabled: false,
    });
  });

  it('toasts and does not throw when the save fails', async () => {
    mockSetOverride.mockRejectedValueOnce(new Error('db'));
    const screen = await render(<PinPolicyCard />);
    await fireEvent(
      screen.getByTestId('pin-policy-switch-sale_void'),
      'valueChange',
      false,
    );
    await act(async () => {
      await mockRunWithPinGuard.mock.calls[0][0].onApproved();
    });
    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'danger' }),
    );
  });

  it('shows New for unreviewed actions and keeping the default saves without a PIN', async () => {
    const screen = await render(<PinPolicyCard />);
    expect(screen.getAllByText('pin_policy.new_badge').length).toBe(6);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('pin-policy-new-sale_void'));
    });
    expect(mockRunWithPinGuard).not.toHaveBeenCalled();
    expect(mockSetOverride).toHaveBeenCalledWith({
      id: 'sale_void',
      enabled: true,
    });
  });

  it('hides New for actions that already have an override', async () => {
    mockOverrides = { sale_void: false };
    const screen = await render(<PinPolicyCard />);
    expect(screen.queryByTestId('pin-policy-new-sale_void')).toBeNull();
    expect(screen.getByTestId('pin-policy-switch-sale_void').props['value']).toBe(
      false,
    );
  });
});
