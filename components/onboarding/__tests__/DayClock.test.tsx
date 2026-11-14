import React from 'react';
import { render } from '@testing-library/react-native';
import { DayClock } from '@/components/onboarding/DayClock';

jest.mock('moti', () => {
  const { View } = require('react-native');
  return { MotiView: View };
});
jest.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

describe('DayClock', () => {
  it('exposes one progressbar with the time and step', async () => {
    const screen = await render(
      <DayClock
        currentIndex={2}
        totalSteps={6}
        timeLabel="10:00 AM"
        counterText="3 of 6"
        label="10:00 AM, step 3 of 6"
      />,
    );
    const bar = screen.getByLabelText('10:00 AM, step 3 of 6');
    expect(bar.props['accessibilityRole']).toBe('progressbar');
    expect(bar.props['accessibilityValue']).toEqual({ min: 1, max: 6, now: 3 });
    expect(screen.getByText('10:00 AM')).toBeTruthy();
    expect(screen.getByText('3 of 6')).toBeTruthy();
  });
});
