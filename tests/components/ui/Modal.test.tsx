import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({
  FontAwesome: () => null,
}));

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}));

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

import { Modal } from '@/components/ui/Modal';

describe('Modal', () => {
  test('renders the title and marks the dialog as a modal for a11y', async () => {
    const { findByText, findByLabelText } = await render(
      <Modal visible title="Delete this product?" onClose={() => {}} />,
    );
    expect(await findByText('Delete this product?')).toBeTruthy();
    expect(await findByLabelText('Delete this product?')).toBeTruthy();
  });

  test('renders nothing when not visible', async () => {
    const { toJSON } = await render(
      <Modal visible={false} title="Hidden" onClose={() => {}} />,
    );
    expect(toJSON()).toBeNull();
  });

  test('fires the close handler when the overlay is pressed', async () => {
    const onClose = jest.fn();
    const { findByLabelText } = await render(
      <Modal visible title="Confirm" onClose={onClose} />,
    );
    const overlay = await findByLabelText('Dismiss');
    fireEvent.press(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('invokes a button onPress when pressed', async () => {
    const onPress = jest.fn();
    const { findByLabelText } = await render(
      <Modal
        visible
        title="Confirm"
        onClose={() => {}}
        buttons={[{ text: 'OK', onPress, style: 'default' }]}
      />,
    );
    const btn = await findByLabelText('OK');
    fireEvent.press(btn);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});