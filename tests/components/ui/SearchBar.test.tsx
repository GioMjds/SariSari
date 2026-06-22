import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({
  FontAwesome: () => null,
}));

jest.mock('moti', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    MotiView: ({ children, ...rest }: any) => (
      <View {...rest}>{children}</View>
    ),
    AnimatePresence: ({ children }: any) => children,
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

import { SearchBar } from '@/components/ui/SearchBar';

describe('SearchBar', () => {
  test('exposes the search role and default "Search" label for a11y', async () => {
    const onChange = jest.fn();
    const { findByLabelText, toJSON } = await render(
      <SearchBar value="" onChange={onChange} />,
    );
    const labeled = await findByLabelText('Search');
    expect(labeled).toBeTruthy();
    const flat = JSON.stringify(toJSON());
    expect(flat).toContain('"accessibilityRole":"search"');
  });

  test('honors a custom accessibilityLabel prop', async () => {
    const onChange = jest.fn();
    const { findByLabelText } = await render(
      <SearchBar
        value=""
        onChange={onChange}
        accessibilityLabel="Search products"
      />,
    );
    expect(await findByLabelText('Search products')).toBeTruthy();
  });

  test('renders a clear button only when the input has a value', async () => {
    const onChange = jest.fn();
    const { findByLabelText, queryByLabelText } = await render(
      <SearchBar value="" onChange={onChange} />,
    );
    expect(queryByLabelText('Clear search')).toBeNull();
    expect(await findByLabelText('Search')).toBeTruthy();
  });

  test('typing calls onChange immediately when debounceMs is 0', async () => {
    const onChange = jest.fn();
    const { findByLabelText } = await render(
      <SearchBar value="" onChange={onChange} debounceMs={0} />,
    );
    const input = await findByLabelText('Search');
    act(() => {
      fireEvent.changeText(input, 'rice');
    });
    expect(onChange).toHaveBeenCalledWith('rice');
  });
});