import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => options?.defaultValue || key,
  }),
}));

import { DashboardDailyPulse } from '@/components/home/DashboardDailyPulse';

describe('DashboardDailyPulse', () => {
  test('renders revenue and sales cards and handles navigation', async () => {
    const onOpenReports = jest.fn();
    const onOpenSales = jest.fn();

    const { getByText } = await render(
      <DashboardDailyPulse
        totalPesos={1500}
        transactionCount={12}
        onOpenReports={onOpenReports}
        onOpenSales={onOpenSales}
      />,
    );

    expect(getByText("Today's Revenue")).toBeTruthy();
    expect(getByText('₱1,500.00')).toBeTruthy();
    expect(getByText("Today's Sales")).toBeTruthy();
    expect(getByText('12')).toBeTruthy();

    fireEvent.press(getByText("Today's Revenue"));
    expect(onOpenReports).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText("Today's Sales"));
    expect(onOpenSales).toHaveBeenCalledTimes(1);
  });
});
