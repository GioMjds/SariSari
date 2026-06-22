import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({
  FontAwesome: () => null,
}));

jest.mock('moti', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    MotiView: ({ children, ...rest }: any) => <View {...rest}>{children}</View>,
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@/components/elements', () => {
  const { Text } = require('react-native');
  return { StyledText: ({ children, ...props }: any) => <Text {...props}>{children}</Text> };
});

import { Pagination } from '@/components/ui/Pagination';

describe('Pagination', () => {
  test('renders the current/total page label', async () => {
    const { findByText } = await render(
      <Pagination currentPage={2} totalPages={5} onPageChange={() => {}} />,
    );
    expect(await findByText('2 / 5')).toBeTruthy();
  });

  test('renders nothing when there is only one page', async () => {
    const { toJSON } = await render(
      <Pagination currentPage={1} totalPages={1} onPageChange={() => {}} />,
    );
    expect(toJSON()).toBeNull();
  });

  test('fires onPageChange with the next page when next is pressed', async () => {
    const onPageChange = jest.fn();
    const { findByLabelText } = await render(
      <Pagination currentPage={2} totalPages={5} onPageChange={onPageChange} />,
    );
    const next = await findByLabelText('Next page');
    fireEvent.press(next);
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  test('does not fire onPageChange when on the first page', async () => {
    const onPageChange = jest.fn();
    const { findByLabelText } = await render(
      <Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />,
    );
    const prev = await findByLabelText('Previous page');
    fireEvent.press(prev);
    expect(onPageChange).not.toHaveBeenCalled();
  });
});