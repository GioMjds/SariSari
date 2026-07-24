import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { RecordEntryModal } from '@/components/financial/RecordEntryModal';

describe('RecordEntryModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with initial date and allows updating businessDate', async () => {
    const { getByTestId } = await render(
      <RecordEntryModal
        visible={true}
        type="expense"
        initialBusinessDate="2026-07-20"
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const amountInput = getByTestId('amount-input');
    const dateInput = getByTestId('date-input');

    expect(dateInput.props.value).toBe('2026-07-20');

    await act(async () => {
      amountInput.props.onChangeText('150');
      dateInput.props.onChangeText('2026-07-22');
    });

    await act(async () => {
      await getByTestId('save-entry-button').props.onPress();
    });

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        type: 'expense',
        amount: 150,
        businessDate: '2026-07-22',
        expenseCategory: 'other',
        note: undefined,
      });
    });
  });
});
