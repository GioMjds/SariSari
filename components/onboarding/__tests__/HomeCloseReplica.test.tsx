import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { HomeCloseReplica } from '@/components/onboarding/replicas/HomeCloseReplica';
import { createDaySeed, dayReducer, type DayState } from '@/lib/onboardingDay';
import type { BeatId } from '@/constants/onboardingDay';

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

const through = (beats: BeatId[]): DayState =>
  beats.reduce(
    (s, beat) => dayReducer(s, { type: 'autoplay', beat }),
    createDaySeed(),
  );

describe('HomeCloseReplica', () => {
  it('shows the day totals and records the scripted payment', async () => {
    const dispatch = jest.fn();
    const screen = await render(
      <HomeCloseReplica
        state={through(['cash', 'utang', 'restock'])}
        dispatch={dispatch}
      />,
    );
    expect(screen.getByText('6')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText(/^homeRecordPayment:/));
    expect(dispatch).toHaveBeenCalledWith({
      type: 'receivePayment',
      suki: 'nena',
      amount: 40,
    });
  });

  it('replaces the payment button with Paid once done', async () => {
    const screen = await render(
      <HomeCloseReplica
        state={through(['cash', 'utang', 'restock', 'close'])}
        dispatch={jest.fn()}
      />,
    );
    expect(screen.queryByLabelText(/^homeRecordPayment:/)).toBeNull();
    expect(screen.getByText('homePaid')).toBeTruthy();
  });
});
