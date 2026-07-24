import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { RecordEntryModal } from '@/components/financial/RecordEntryModal';

describe('RecordEntryModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with initial date and allows updating businessDate', async () => {
    const { getByTestId, getByText } = await render(
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

    fireEvent.changeText(amountInput, '150');
    fireEvent.changeText(dateInput, '2026-07-22');
    fireEvent.press(getByText('Save Entry'));

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
