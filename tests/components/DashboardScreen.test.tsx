import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardScreen from '@/app/(tabs)/index';
import * as hooks from '@/hooks';
import { useRouter } from 'expo-router';

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  Href: {},
}));

jest.mock('@/hooks', () => ({
  useSales: jest.fn(),
  useRecentSales: jest.fn(),
  useHasSales: jest.fn(),
  useProducts: jest.fn(),
  useCurrentSession: jest.fn(),
  useCreditKPIs: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (key.includes('quickActions.newSale')) return 'New Sale';
      if (key.includes('quickActions.addProduct')) return 'Add Product';
      if (key.includes('quickActions.addStock')) return 'Add Stock';
      if (key.includes('quickActions.credits')) return 'Utang / Credits';
      if (key.includes('quickActions.reports')) return 'Reports';
      if (key.includes('pulse.todayRevenue')) return "Today's Revenue";
      if (key.includes('pulse.todaySales')) return "Today's Sales";
      if (key.includes('recentActivity.title')) return 'Recent Activity';
      if (key.includes('recentActivity.errorTitle')) return 'Could not load dashboard';
      if (key.includes('recentActivity.retry')) return 'Tap to Retry';
      return options?.defaultValue || key;
    },
  }),
}));

describe('DashboardScreen Integration', () => {
  let queryClient: QueryClient;
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  const setupDefaultMocks = () => {
    (hooks.useSales as jest.Mock).mockReturnValue({
      getTodayStatsQuery: {
        data: { total: 1000, transaction_count: 5, items_sold: 10, credit_sales: 0 },
        isLoading: false,
        isError: false,
      },
    });
    (hooks.useRecentSales as jest.Mock).mockReturnValue({
      data: [
        {
          id: 1,
          total: 200,
          timestamp: '2026-07-25T08:00:00.000Z',
          payment_type: 'cash',
          items_count: 2,
          items: [],
        },
      ],
      isLoading: false,
      isError: false,
    });
    (hooks.useHasSales as jest.Mock).mockReturnValue({
      data: true,
      isLoading: false,
      isError: false,
    });
    (hooks.useProducts as jest.Mock).mockReturnValue({
      getAllProductsQuery: {
        data: [{ id: 1, name: 'Item 1', quantity: 10, price: 50 }],
        isLoading: false,
        isError: false,
      },
    });
    (hooks.useCurrentSession as jest.Mock).mockReturnValue({
      data: { status: 'open', variance: null },
      isLoading: false,
      isError: false,
    });
    (hooks.useCreditKPIs as jest.Mock).mockReturnValue({
      data: { overdueCount: 0, totalOutstanding: 0 },
      isLoading: false,
      isError: false,
    });
  };

  test('renders error state when a core query fails', async () => {
    setupDefaultMocks();
    (hooks.useProducts as jest.Mock).mockReturnValue({
      getAllProductsQuery: {
        data: undefined,
        isLoading: false,
        isError: true,
      },
    });

    const { getByText } = await render(
      <QueryClientProvider client={queryClient}>
        <DashboardScreen />
      </QueryClientProvider>,
    );

    expect(getByText('Could not load dashboard')).toBeTruthy();
    expect(getByText('Tap to Retry')).toBeTruthy();
  });

  test('renders dashboard components in success state and handles action routing', async () => {
    setupDefaultMocks();

    const { getByText, getAllByText } = await render(
      <QueryClientProvider client={queryClient}>
        <DashboardScreen />
      </QueryClientProvider>,
    );

    expect(getByText('New Sale')).toBeTruthy();
    expect(getByText(/today's revenue/i)).toBeTruthy();
    expect(getByText('Recent Activity')).toBeTruthy();

    fireEvent.press(getByText('New Sale'));
    expect(mockPush).toHaveBeenCalledWith('/(edit-forms)/add-sales');

    fireEvent.press(getAllByText('Add Product')[0]);
    expect(mockPush).toHaveBeenCalledWith('/(edit-forms)/add-product');

    fireEvent.press(getByText('₱200.00'));
    expect(mockPush).toHaveBeenCalledWith('/(edit-forms)/sale-details/1');
  });
});
