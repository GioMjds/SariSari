import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { OwnerPinSetupFlow } from '@/components/auth/OwnerPinSetupFlow';
import { sanitizeCode } from '@/components/auth/CodeBoxes';

const mockSetupOwnerPin = jest.fn();
jest.mock('@/database/auth', () => ({
  setupOwnerPin: (pin: string) => mockSetupOwnerPin(pin),
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success', Error: 'error' },
}));
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn() }));
jest.mock('react-i18next', () => {
  const t = (key: string) => key;
  return { useTranslation: () => ({ t }) };
});
jest.mock('@/hooks/useReducedMotion', () => ({ useReducedMotion: () => true }));
jest.mock('@/components/mascot', () => ({ SariMascot: () => null }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('react-native-keyboard-controller', () => {
  const { ScrollView } = jest.requireActual('react-native');
  return { KeyboardAwareScrollView: ScrollView };
});

const tapPin = async (screen: Awaited<ReturnType<typeof render>>, pin: string) => {
  for (const digit of pin) {
    await fireEvent.press(screen.getByTestId(`pin-key-${digit}`));
  }
};

describe('OwnerPinSetupFlow', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockSetupOwnerPin.mockReset();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('saves a matching 6-digit PIN and shows the recovery code', async () => {
    mockSetupOwnerPin.mockResolvedValue({ recoveryCode: 'ABCD-EFGH' });
    const screen = await render(
      <OwnerPinSetupFlow onDone={jest.fn()} onCancel={jest.fn()} />,
    );

    await tapPin(screen, '123456');
    await act(async () => { jest.advanceTimersByTime(300); });
    await tapPin(screen, '123456');

    await waitFor(() => expect(screen.getByTestId('pin-setup-code-card')).toBeTruthy());
    expect(mockSetupOwnerPin).toHaveBeenCalledWith('123456');
    expect(screen.getByText('ABCD-EFGH')).toBeTruthy();
  });

  it('keeps Done disabled until the recovery code is acknowledged', async () => {
    mockSetupOwnerPin.mockResolvedValue({ recoveryCode: 'ABCD-EFGH' });
    const onDone = jest.fn();
    const screen = await render(
      <OwnerPinSetupFlow onDone={onDone} onCancel={jest.fn()} />,
    );
    await tapPin(screen, '123456');
    await act(async () => { jest.advanceTimersByTime(300); });
    await tapPin(screen, '123456');
    await waitFor(() => expect(screen.getByTestId('pin-setup-done')).toBeTruthy());

    expect(screen.getByTestId('pin-setup-done')).toBeDisabled();

    await fireEvent.press(screen.getByTestId('pin-setup-ack'));
    expect(screen.getByTestId('pin-setup-done')).toBeEnabled();
    await fireEvent.press(screen.getByTestId('pin-setup-done'));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('rejects a mismatched confirmation and never saves', async () => {
    const screen = await render(
      <OwnerPinSetupFlow onDone={jest.fn()} onCancel={jest.fn()} />,
    );
    await tapPin(screen, '123456');
    await act(async () => { jest.advanceTimersByTime(300); });
    await tapPin(screen, '654321');

    await waitFor(() => expect(screen.getByText('pin.pin_mismatch')).toBeTruthy());
    expect(mockSetupOwnerPin).not.toHaveBeenCalled();
  });
});

describe('sanitizeCode', () => {
  it('strips the dash, upper-cases, and caps the length', () => {
    expect(sanitizeCode('abcd-efgh-extra', 8)).toBe('ABCDEFGH');
  });
});
