import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import OnboardingPage from '@/app/onboarding/index';

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockAddToast = jest.fn();
const mockMarkOnboardingComplete = jest.fn();

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
  useReducedMotion: () => false,
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

/** Fill both names, leave the profile step, and skip the tour to Ready. */
async function reachReady(screen: Awaited<ReturnType<typeof render>>) {
  await fireEvent.changeText(
    screen.getByLabelText('onboarding:profileNameLabel'),
    '  Nena ',
  );
  await fireEvent.changeText(
    screen.getByLabelText('onboarding:profileStoreLabel'),
    ' Nena Sari-Sari  ',
  );
  await fireEvent.press(screen.getByLabelText('letsGo'));
  await fireEvent.press(screen.getByLabelText('skipA11y'));
}

describe('OnboardingPage footer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it('saves the trimmed profile and opens the tabs from the Ready CTA', async () => {
    const screen = await render(<OnboardingPage />);
    await reachReady(screen);

    await fireEvent.press(screen.getByLabelText('readyCta'));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(tabs)'));
    expect(mockMarkOnboardingComplete).toHaveBeenCalledWith({
      ownerName: 'Nena',
      storeName: 'Nena Sari-Sari',
    });
    expect(mockPush).not.toHaveBeenCalled();
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
