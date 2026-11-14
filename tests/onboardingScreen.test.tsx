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
        jest.advanceTimersByTime(400 * 6);
      });
      expect(isDisabled(screen, 'next')).toBe(false);
      expect(mockAddToast).toHaveBeenCalledTimes(1);
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
        jest.advanceTimersByTime(400 * 6);
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
