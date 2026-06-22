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

import { MoneyText } from '@/components/ui/MoneyText';

describe('MoneyText', () => {
  test('formats integer centavos as pesos', async () => {
    const { findByText } = await render(<MoneyText value={1250} />);
    expect(await findByText('₱12.50')).toBeTruthy();
  });

  test('treats value as pesos when fromPesos is true', async () => {
    const { findByText } = await render(<MoneyText value={12.5} fromPesos />);
    expect(await findByText('₱12.50')).toBeTruthy();
  });

  test('renders an alternate currency symbol as a prefix', async () => {
    const { toJSON } = await render(<MoneyText value={100} currency="$" />);
    const flat = JSON.stringify(toJSON());
    expect(flat).toContain('$');
  });

  test('applies tabular-nums to prevent number jitter', async () => {
    const { toJSON } = await render(<MoneyText value={1250} />);
    const flat = JSON.stringify(toJSON());
    expect(flat).toContain('tabular-nums');
  });
});