import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => options?.defaultValue || key,
  }),
}));

import { DashboardQuickActions } from '@/components/home/DashboardQuickActions';

describe('DashboardQuickActions', () => {
  test('renders hero action and 4 grid actions, firing callbacks on press', async () => {
    const onNewSale = jest.fn();
    const onAddProduct = jest.fn();
    const onAddStock = jest.fn();
    const onOpenCredits = jest.fn();
    const onOpenReports = jest.fn();

    const { getByText } = await render(
      <DashboardQuickActions
        onNewSale={onNewSale}
        onAddProduct={onAddProduct}
        onAddStock={onAddStock}
        onOpenCredits={onOpenCredits}
        onOpenReports={onOpenReports}
      />,
    );

    fireEvent.press(getByText('New Sale'));
    expect(onNewSale).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('Add Product'));
    expect(onAddProduct).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('Add Stock'));
    expect(onAddStock).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('Utang / Credits'));
    expect(onOpenCredits).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('Reports'));
    expect(onOpenReports).toHaveBeenCalledTimes(1);
  });
});
