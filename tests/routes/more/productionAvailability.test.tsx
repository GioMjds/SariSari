import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('expo-blur', () => {
  const mockReact = require('react');
  const mockReactNative = require('react-native');
  return {
    BlurView: ({ children }: { children?: React.ReactNode }) =>
      mockReact.createElement(mockReactNative.View, null, children),
  };
});

jest.mock('@/components/layout', () => ({
  useTabBarBottomOffset: () => 80,
}));

jest.mock('expo-router', () => {
  const mockReact = require('react');
  const mockReactNative = require('react-native');
  return {
    Slot: () =>
      mockReact.createElement(mockReactNative.View, { testID: 'more-slot' }),
    Stack: ({ screenOptions }: { screenOptions?: unknown }) =>
      mockReact.createElement(mockReactNative.View, {
        accessibilityLabel: JSON.stringify(screenOptions),
        testID: 'more-stack',
      }),
  };
});

import MoreLayout from '@/app/(tabs)/more/_layout';

describe('More production availability', () => {
  it('uses a headerless native stack for More destinations', async () => {
    const layout = await render(<MoreLayout />);
    expect(layout.queryByTestId('more-slot')).toBeNull();
    expect(layout.getByTestId('more-stack').props['accessibilityLabel']).toBe(
      JSON.stringify({ headerShown: false }),
    );
    await layout.unmount();
  });

  it('renders the More home in production', async () => {
    const runtime = global as typeof global & { __DEV__: boolean };
    const previous = runtime.__DEV__;

    try {
      runtime.__DEV__ = false;
      jest.isolateModules(() => {
        const MoreIndex = (
          require('@/app/(tabs)/more/index') as typeof import('@/app/(tabs)/more/index')
        ).default;
        const { MoreHomeScreen } =
          require('@/components/more') as typeof import('@/components/more');

        expect(MoreHomeScreen.name).toBe('MoreHomeScreen');
        expect(MoreIndex().type).toBe(MoreHomeScreen);
      });
    } finally {
      runtime.__DEV__ = previous;
    }
  });
});
