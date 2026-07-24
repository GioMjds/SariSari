import React from 'react';
import { render } from '@testing-library/react-native';
import { FinancialResultSection } from '../../components/reports/FinancialResultSection';
import { ReportKPIs } from '../../types/reports.types';

const mockKPIs: ReportKPIs = {
  totalSales: 1000,
  totalProfit: 400,
  grossProfit: 500,
  operatingProfit: 400,
  paidExpenses: 100,
  ownerDrawings: 200,
  totalCreditsIssued: 0,
  totalCreditsCollected: 0,
  totalExpenses: 100,
  inventoryCostOut: 500,
  profitCoverage: 1.0,
  marginPercent: 40,
};

describe('FinancialResultSection Component', () => {
  test('renders sales, COGS, gross profit, paid gastos, true operating profit, and owner drawings', async () => {
    const { getByText } = await render(
      <FinancialResultSection kpis={mockKPIs} onOpenLedger={jest.fn()} />,
    );

    expect(getByText('₱1,000.00')).toBeTruthy();
    expect(getByText('-₱500.00')).toBeTruthy();
    expect(getByText('-₱100.00')).toBeTruthy();
    expect(getByText('₱400.00')).toBeTruthy();
    expect(getByText('₱200.00')).toBeTruthy();
  });

  test('shows cost warning when operating profit is null', async () => {
    const nullProfitKPIs = {
      ...mockKPIs,
      operatingProfit: null,
      grossProfit: null,
    };
    const { getByText } = await render(
      <FinancialResultSection kpis={nullProfitKPIs} onOpenLedger={jest.fn()} />,
    );

    expect(
      getByText(/Record cost prices for all sold items/i),
    ).toBeTruthy();
  });
});
