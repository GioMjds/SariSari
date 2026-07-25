import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SaleWithItems } from '@/types/sales.types';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => options?.defaultValue || key,
  }),
}));

import { DashboardRecentSales } from '@/components/dashboard/DashboardRecentSales';

describe('DashboardRecentSales', () => {
  test('returns null when sales list is empty', async () => {
    const { queryByText } = await render(
      <DashboardRecentSales sales={[]} onOpenSale={jest.fn()} />,
    );
    expect(queryByText('Recent Activity')).toBeNull();
  });

  test('renders recent sales list items and fires onOpenSale callback', async () => {
    const onOpenSale = jest.fn();
    const mockSales: SaleWithItems[] = [
      {
        id: 101,
        total: 250,
        timestamp: '2026-07-25T08:30:00.000Z',
        payment_type: 'cash',
        items_count: 3,
        items: [],
      },
    ];

    const { getByText } = await render(
      <DashboardRecentSales sales={mockSales} onOpenSale={onOpenSale} />,
    );

    expect(getByText('Recent Activity')).toBeTruthy();
    expect(getByText('₱250.00')).toBeTruthy();

    fireEvent.press(getByText('₱250.00'));
    expect(onOpenSale).toHaveBeenCalledWith(101);
  });
});
