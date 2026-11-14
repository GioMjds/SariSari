import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { BeatScene } from '@/components/onboarding/BeatScene';
import { createDaySeed, dayReducer } from '@/lib/onboardingDay';

jest.mock('moti', () => {
  const { View } = require('react-native');
  return { MotiView: View };
});
jest.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}));
jest.mock('@/components/mascot', () => ({ SariMascot: () => null }));

const renderScene = (state = createDaySeed(), onShowMe = jest.fn()) =>
  render(
    <BeatScene
      beat="cash"
      state={state}
      storeName="Nena Store"
      autoplaying={false}
      onShowMe={onShowMe}
    >
      <Text>replica</Text>
    </BeatScene>,
  );

describe('BeatScene', () => {
  it('shows the scene line with the store name and the replica', async () => {
    const screen = await renderScene();
    expect(
      screen.getByText('beatCashScene:{"store":"Nena Store"}'),
    ).toBeTruthy();
    expect(screen.getByText('replica')).toBeTruthy();
  });

  it('swaps to the nudge when the cart has extras', async () => {
    const extra = dayReducer(createDaySeed(), {
      type: 'addToCart',
      id: 'luckyMe',
    });
    const screen = await renderScene(extra);
    expect(screen.getByText('beatCashNudge')).toBeTruthy();
  });

  it('calls onShowMe, and hides Show me once the beat is done', async () => {
    const onShowMe = jest.fn();
    const screen = await renderScene(createDaySeed(), onShowMe);
    await fireEvent.press(screen.getByLabelText('showMeA11y'));
    expect(onShowMe).toHaveBeenCalledTimes(1);

    const done = dayReducer(createDaySeed(), {
      type: 'autoplay',
      beat: 'cash',
    });
    const doneScreen = await renderScene(done);
    expect(doneScreen.queryByLabelText('showMeA11y')).toBeNull();
    expect(doneScreen.getByText('beatDone')).toBeTruthy();
    expect(doneScreen.getByText(/^beatCashOutcome:/)).toBeTruthy();
  });
});
