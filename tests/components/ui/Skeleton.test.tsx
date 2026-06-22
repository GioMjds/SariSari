import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, style }: any) => {
    const { View } = require('react-native');
    return <View style={style}>{children}</View>;
  },
}));

// Reanimated's worklets are unwrapped to plain style objects in Jest.
jest.mock('react-native-reanimated', () => {
  return {
    __esModule: true,
    Easing: { linear: (t: number) => t },
    useSharedValue: (initial: number) => ({ value: initial }),
    useAnimatedStyle: (fn: () => any) => fn(),
    withTiming: (toValue: number) => toValue,
    withRepeat: (next: any) => next,
  };
});

import { Skeleton } from '@/components/ui/Skeleton';

describe('Skeleton', () => {
  test('exposes Loading label for screen readers', async () => {
    const { findByLabelText } = await render(
      <Skeleton width={120} height={14} />,
    );
    expect(await findByLabelText('Loading')).toBeTruthy();
  });

  test('uses ink-200 as the placeholder color', async () => {
    const { findByLabelText, toJSON } = await render(
      <Skeleton width={80} height={12} />,
    );
    await findByLabelText('Loading');
    const flat = JSON.stringify(toJSON());
    expect(flat).toContain('#D2CCC1');
  });

  test('circle shorthand rounds the border radius to half the width', async () => {
    const { findByLabelText, toJSON } = await render(
      <Skeleton width={40} height={40} circle />,
    );
    await findByLabelText('Loading');
    const flat = JSON.stringify(toJSON());
    expect(flat).toContain('"borderRadius":20');
  });

  test('respects an explicit borderRadius when circle is not set', async () => {
    const { findByLabelText, toJSON } = await render(
      <Skeleton width={120} height={14} borderRadius={8} />,
    );
    await findByLabelText('Loading');
    const flat = JSON.stringify(toJSON());
    expect(flat).toContain('"borderRadius":8');
  });

  test('default borderRadius is 4 when nothing is supplied', async () => {
    const { findByLabelText, toJSON } = await render(
      <Skeleton width={120} height={14} />,
    );
    await findByLabelText('Loading');
    const flat = JSON.stringify(toJSON());
    expect(flat).toContain('"borderRadius":4');
  });

  test('shimmer overlay nests a flex-1 host when shimmer prop is true', async () => {
    const { findByLabelText, toJSON } = await render(
      <Skeleton width={120} height={14} shimmer />,
    );
    await findByLabelText('Loading');
    const flat = JSON.stringify(toJSON());
    expect(flat).toContain('"flex":1');
  });
});