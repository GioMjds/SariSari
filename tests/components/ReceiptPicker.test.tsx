import React from 'react';
import { render } from '@testing-library/react-native';
import { ReceiptPicker } from '../../components/financial/ReceiptPicker';

describe('ReceiptPicker Component', () => {
  test('renders photo slots up to 5 for expense entries', async () => {
    const { getByText } = await render(
      <ReceiptPicker receipts={[]} onAddReceipt={jest.fn()} onDeleteReceipt={jest.fn()} />
    );
    expect(getByText('Receipts (0/5)')).toBeTruthy();
  });
});
