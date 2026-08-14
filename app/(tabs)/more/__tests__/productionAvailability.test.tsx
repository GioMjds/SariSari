import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('expo-router', () => {
  const mockReact = require('react');
  const mockReactNative = require('react-native');
  return {
    Slot: () =>
      mockReact.createElement(mockReactNative.View, { testID: 'more-slot' }),
  };
});

jest.mock('@/components/more', () => {
  const mockReact = require('react');
  const mockReactNative = require('react-native');
  return {
    MoreHomeScreen: () =>
      mockReact.createElement(mockReactNative.View, { testID: 'more-home' }),
  };
});

import MoreLayout from '@/app/(tabs)/more/_layout';
import MoreIndex from '@/app/(tabs)/more/index';

describe('More production availability', () => {
  it('renders the More stack in production', async () => {
    const runtime = global as typeof global & { __DEV__: boolean };
    const previous = runtime.__DEV__;

    try {
      runtime.__DEV__ = false;
      const layout = await render(<MoreLayout />);
      expect(layout.getByTestId('more-slot')).toBeTruthy();
      await layout.unmount();

      const index = await render(<MoreIndex />);
      expect(index.getByTestId('more-home')).toBeTruthy();
      await index.unmount();
    } finally {
      runtime.__DEV__ = previous;
    }
  });
});
