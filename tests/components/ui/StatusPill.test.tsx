import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({
  FontAwesome: () => null,
}));

import { StatusPill } from '@/components/ui/StatusPill';

describe('StatusPill', () => {
  test('renders the children text in the success tone', async () => {
    const { findByText } = await render(
      <StatusPill variant="success">Paid</StatusPill>,
    );
    expect(await findByText('Paid')).toBeTruthy();
  });

  test('forwards the onPress handler with role="button" and a11y label', async () => {
    const onPress = jest.fn();
    const { findByLabelText } = await render(
      <StatusPill
        variant="danger"
        onPress={onPress}
        accessibilityLabel="Mark paid"
      >
        Out of Stock
      </StatusPill>,
    );
    const btn = await findByLabelText('Mark paid');
    expect(btn).toBeTruthy();
    fireEvent.press(btn);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('renders a leading dot when dot is true', async () => {
    const { findByTestId, findByText } = await render(
      <StatusPill variant="info" dot>
        Low Stock
      </StatusPill>,
    );
    expect(await findByTestId('status-pill-dot')).toBeTruthy();
    expect(await findByText('Low Stock')).toBeTruthy();
  });

  test('uses the children string as the a11y label when no override is given', async () => {
    const { findByLabelText } = await render(
      <StatusPill variant="warning" onPress={() => {}}>
        Inactive
      </StatusPill>,
    );
    expect(await findByLabelText('Inactive')).toBeTruthy();
  });
});