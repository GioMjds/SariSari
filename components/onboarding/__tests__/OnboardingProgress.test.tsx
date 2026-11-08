import React from 'react';
import { render } from '@testing-library/react-native';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';

jest.mock('moti', () => {
  const { View } = require('react-native');
  return { MotiView: View };
});

describe('OnboardingProgress', () => {
  it('is one accessible progressbar with a 1-based value', async () => {
    const screen = await render(
      <OnboardingProgress
        currentIndex={2}
        totalSteps={7}
        label="Step 3 of 7"
        counterText="3 of 7"
      />,
    );

    const bar = screen.getByLabelText('Step 3 of 7');
    expect(bar.props['accessibilityRole']).toBe('progressbar');
    expect(bar.props['accessibilityValue']).toEqual({
      min: 1,
      max: 7,
      now: 3,
    });
    expect(screen.getByText('3 of 7')).toBeTruthy();
  });
});
