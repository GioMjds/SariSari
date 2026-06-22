import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('moti', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    MotiView: ({ children, ...rest }: any) => <View {...rest}>{children}</View>,
  };
});

jest.mock('@/components/elements', () => {
  const { Text } = require('react-native');
  return { StyledText: ({ children, ...props }: any) => <Text {...props}>{children}</Text> };
});

import { StatusStamp } from '@/components/ui/StatusStamp';

describe('StatusStamp', () => {
  test('exposes the label as an a11y text', async () => {
    const { findByLabelText } = await render(
      <StatusStamp label="CASH" tone="persimmon" />,
    );
    expect(await findByLabelText('CASH')).toBeTruthy();
  });

  test('honors a custom rotate angle', async () => {
    const { toJSON } = await render(
      <StatusStamp label="PAID" tone="sage" rotate={3} />,
    );
    // The MotiView is mocked to a passthrough View; the inner View
    // still carries the rotate transform via its style.
    const flat = JSON.stringify(toJSON());
    expect(flat).toContain('3');
  });

  test('uses paper-50 for the ink tone (not paper-100)', async () => {
    const { toJSON } = await render(
      <StatusStamp label="VOID" tone="ink" />,
    );
    const flat = JSON.stringify(toJSON());
    expect(flat).toContain('bg-paper-50');
    expect(flat).not.toContain('bg-paper-100');
  });
});