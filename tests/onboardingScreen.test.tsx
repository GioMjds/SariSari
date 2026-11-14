import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import OnboardingPage from '@/app/onboarding/index';

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockAddToast = jest.fn();
const mockMarkOnboardingComplete = jest.fn();
let mockReducedMotion = true;

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
}));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View };
});
jest.mock('react-native-keyboard-controller', () => {
  const { ScrollView } = require('react-native');
  return { KeyboardAwareScrollView: ScrollView };
});
jest.mock('moti', () => {
  const { View } = require('react-native');
  return { MotiView: View };
});
jest.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => mockReducedMotion,
}));
jest.mock('@/components/mascot', () => ({ SariMascot: () => null }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));
jest.mock('@/lib/i18n', () => ({ changeAppLanguage: jest.fn() }));
jest.mock('@/lib', () => ({
  markOnboardingComplete: (...args: unknown[]) =>
    mockMarkOnboardingComplete(...args),
}));
jest.mock('@/stores', () => ({
  useToastStore: (
    selector: (state: { addToast: typeof mockAddToast }) => unknown,
  ) => selector({ addToast: mockAddToast }),
}));

type Screen = Awaited<ReturnType<typeof render>>;

const isDisabled = (screen: Screen, label: string) =>
  screen.getByLabelText(label).props['accessibilityState']?.disabled === true;

async function fillProfile(screen: Screen) {
  await fireEvent.changeText(
    screen.getByLabelText('onboarding:profileNameLabel'),
    '  Nena ',
  );
  await fireEvent.changeText(
    screen.getByLabelText('onboarding:profileStoreLabel'),
    ' Nena Sari-Sari  ',
  );
  await fireEvent.press(screen.getByLabelText('letsGo'));
}

async function reachReady(screen: Screen) {
  await fillProfile(screen);
  await fireEvent.press(screen.getByLabelText('skipA11y'));
}

describe('OnboardingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReducedMotion = true;
    mockMarkOnboardingComplete.mockResolvedValue(undefined);
  });

  it('shows inline errors and stays on the profile step when names are blank', async () => {
    const screen = await render(<OnboardingPage />);
    await fireEvent.press(screen.getByLabelText('letsGo'));
    expect(screen.getByText('onboarding:profileNameError')).toBeTruthy();
    expect(screen.getByText('onboarding:profileStoreError')).toBeTruthy();
    expect(screen.queryByLabelText('readyCta')).toBeNull();
    expect(mockMarkOnboardingComplete).not.toHaveBeenCalled();
  });

  it('locks Continue on a beat until the beat is done', async () => {
    const screen = await render(<OnboardingPage />);
    await fillProfile(screen);
    expect(screen.getByText('beatCashScene')).toBeTruthy();
    expect(isDisabled(screen, 'next')).toBe(true);

    await fireEvent.press(screen.getByLabelText('showMeA11y'));

    expect(isDisabled(screen, 'next')).toBe(false);
    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'beatCashOutcome',
        variant: 'success',
      }),
    );
    expect(mockAddToast).toHaveBeenCalledTimes(1);
  });

  it('returns from Ready to the first unfinished beat after a skip', async () => {
    const screen = await render(<OnboardingPage />);
    await fillProfile(screen);
    await fireEvent.press(screen.getByLabelText('showMeA11y'));
    await fireEvent.press(screen.getByLabelText('next'));
    await fireEvent.press(screen.getByLabelText('skipA11y'));
    await fireEvent.press(screen.getByLabelText('backA11y'));
    expect(screen.getByText('beatUtangScene')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('showMeA11y'));
    expect(isDisabled(screen, 'next')).toBe(false);
  });

  it('returns from Ready to the close beat once the whole day is done', async () => {
    const screen = await render(<OnboardingPage />);
    await fillProfile(screen);
    for (const label of ['next', 'next', 'next', 'finishDay']) {
      await fireEvent.press(screen.getByLabelText('showMeA11y'));
      await fireEvent.press(screen.getByLabelText(label));
    }
    await fireEvent.press(screen.getByLabelText('backA11y'));
    expect(screen.getByText('beatCloseOutcome')).toBeTruthy();
  });

  it('plays the whole day with Show me and saves the trimmed profile', async () => {
    const screen = await render(<OnboardingPage />);
    await fillProfile(screen);
    for (const label of ['next', 'next', 'next', 'finishDay']) {
      await fireEvent.press(screen.getByLabelText('showMeA11y'));
      await fireEvent.press(screen.getByLabelText(label));
    }
    await fireEvent.press(screen.getByLabelText('readyCta'));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(tabs)'));
    expect(mockMarkOnboardingComplete).toHaveBeenCalledTimes(1);
    expect(mockMarkOnboardingComplete).toHaveBeenCalledWith({
      ownerName: 'Nena',
      storeName: 'Nena Sari-Sari',
    });
  });

  it('shows the cash receipt, not the day total, when going back', async () => {
    const screen = await render(<OnboardingPage />);
    await fillProfile(screen);
    await fireEvent.press(screen.getByLabelText('showMeA11y'));
    await fireEvent.press(screen.getByLabelText('next'));
    await fireEvent.press(screen.getByLabelText('showMeA11y'));
    await fireEvent.press(screen.getByLabelText('backA11y'));
    expect(screen.getByText('beatCashOutcome')).toBeTruthy();
    expect(isDisabled(screen, 'next')).toBe(false);
    expect(screen.queryByLabelText('showMeA11y')).toBeNull();
    // One toast per finished beat; revisiting a done beat adds none.
    await fireEvent.press(screen.getByLabelText('next'));
    expect(mockAddToast).toHaveBeenCalledTimes(2);
  });

  it('plays Show me step by step without Reduce Motion', async () => {
    jest.useFakeTimers();
    mockReducedMotion = false;
    try {
      const screen = await render(<OnboardingPage />);
      await fillProfile(screen);
      await fireEvent.press(screen.getByLabelText('showMeA11y'));
      expect(isDisabled(screen, 'next')).toBe(true);
      await act(async () => {
        jest.advanceTimersByTime(400 * 9);
      });
      expect(isDisabled(screen, 'next')).toBe(false);
      expect(mockAddToast).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('walks Show me through the payment panels of a cash sale', async () => {
    jest.useFakeTimers();
    mockReducedMotion = false;
    const tick = () =>
      act(async () => {
        jest.advanceTimersByTime(400);
      });
    try {
      const screen = await render(<OnboardingPage />);
      await fillProfile(screen);
      await fireEvent.press(screen.getByLabelText('showMeA11y'));
      // Clear the cart, then 2 Kopiko and 1 pandesal: still on the cart.
      for (let i = 0; i < 4; i++) await tick();
      expect(screen.getByLabelText('posCheckout')).toBeTruthy();
      await tick();
      expect(screen.getByText('posPayWith')).toBeTruthy();
      await tick();
      expect(screen.getByText('posTendered')).toBeTruthy();
      expect(isDisabled(screen, 'next')).toBe(true);
      await tick();
      expect(screen.getByText('posPaidCash')).toBeTruthy();
      expect(isDisabled(screen, 'next')).toBe(false);
    } finally {
      jest.useRealTimers();
    }
  });

  it('opens the delivery panel when Show me plays the restock beat', async () => {
    jest.useFakeTimers();
    try {
      const screen = await render(<OnboardingPage />);
      await fillProfile(screen);
      // Finish the two sales at once, then play the restock tap by tap.
      await fireEvent.press(screen.getByLabelText('showMeA11y'));
      await fireEvent.press(screen.getByLabelText('next'));
      await fireEvent.press(screen.getByLabelText('showMeA11y'));
      mockReducedMotion = false;
      await fireEvent.press(screen.getByLabelText('next'));
      await fireEvent.press(screen.getByLabelText('showMeA11y'));
      await act(async () => {
        jest.advanceTimersByTime(400);
      });
      expect(screen.getByText('invDeliveryTitle')).toBeTruthy();
      expect(isDisabled(screen, 'next')).toBe(true);
      await act(async () => {
        jest.advanceTimersByTime(400);
      });
      expect(isDisabled(screen, 'next')).toBe(false);
    } finally {
      jest.useRealTimers();
    }
  });

  it('drops the rest of Show me when the owner finishes the beat first', async () => {
    jest.useFakeTimers();
    mockReducedMotion = false;
    try {
      const screen = await render(<OnboardingPage />);
      await fillProfile(screen);
      const tile = (i: number) => screen.getAllByLabelText('posAddA11y')[i]!;
      await fireEvent.press(tile(0));
      await fireEvent.press(tile(0));
      await fireEvent.press(tile(1));
      await fireEvent.press(screen.getByLabelText('posCheckout'));
      await fireEvent.press(screen.getByLabelText('posCash'));
      // Ask for Show me, then pay by hand before playback starts.
      await fireEvent.press(screen.getByLabelText('showMeA11y'));
      await fireEvent.press(screen.getAllByLabelText('posTenderA11y')[0]!);
      await act(async () => {
        jest.advanceTimersByTime(400 * 10);
      });
      expect(mockAddToast).toHaveBeenCalledTimes(1);
      // Nothing from the cancelled playback leaks into the next sale.
      await fireEvent.press(screen.getByLabelText('next'));
      expect(screen.getByText('posCartEmpty')).toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  });

  it('still finishes the beat when the owner taps a wrong item during Show me', async () => {
    jest.useFakeTimers();
    mockReducedMotion = false;
    try {
      const screen = await render(<OnboardingPage />);
      await fillProfile(screen);
      await fireEvent.press(screen.getByLabelText('showMeA11y'));
      // Playback has cleared the cart and added the first Kopiko.
      await act(async () => {
        jest.advanceTimersByTime(400 * 2);
      });
      // Tiles render in PRODUCT_ORDER; the last one is Coke Mismo, which
      // Mang Tonyo did not ask for.
      const tiles = screen.getAllByLabelText('posAddA11y');
      await fireEvent.press(tiles[tiles.length - 1]!);
      await act(async () => {
        jest.advanceTimersByTime(400 * 8);
      });
      expect(isDisabled(screen, 'next')).toBe(false);
      expect(mockAddToast).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('cancels pending Show me actions when the owner leaves the beat', async () => {
    jest.useFakeTimers();
    mockReducedMotion = false;
    try {
      const screen = await render(<OnboardingPage />);
      await fillProfile(screen);
      await fireEvent.press(screen.getByLabelText('showMeA11y'));
      await fireEvent.press(screen.getByLabelText('backA11y'));
      await act(async () => {
        jest.advanceTimersByTime(400 * 10);
      });
      await fireEvent.press(screen.getByLabelText('letsGo'));
      expect(isDisabled(screen, 'next')).toBe(true);
      expect(mockAddToast).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it('skips to Ready from a beat', async () => {
    const screen = await render(<OnboardingPage />);
    await reachReady(screen);
    expect(screen.getByLabelText('readyCta')).toBeTruthy();
  });

  it('stays on Ready and reports the failure when the save throws', async () => {
    mockMarkOnboardingComplete.mockRejectedValue(new Error('disk full'));
    const screen = await render(<OnboardingPage />);
    await reachReady(screen);
    await fireEvent.press(screen.getByLabelText('readyCta'));
    await waitFor(() =>
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'toastSaveFailed',
          variant: 'danger',
        }),
      ),
    );
    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.getByLabelText('readyCta')).toBeTruthy();
  });

  it('returns from the Ready edit link to the profile, then straight back to Ready', async () => {
    const screen = await render(<OnboardingPage />);
    await reachReady(screen);
    await fireEvent.press(screen.getByText('readyEditProfile'));
    expect(
      screen.getByLabelText('onboarding:profileNameLabel').props['value'],
    ).toBe('  Nena ');
    await fireEvent.press(screen.getByLabelText('letsGo'));
    expect(screen.getByLabelText('readyCta')).toBeTruthy();
  });
});
