import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardScreen from '@/app/(tabs)/home';
import { useHomeDashboardData } from '@/hooks/useHomeDashboardData';
import { useRouter } from 'expo-router';

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  Redirect: () => null,
  Href: {},
}));

jest.mock('@/hooks/useHomeDashboardData', () => ({
  useHomeDashboardData: jest.fn(),
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

  const setupDefaultMocks = (isLoading = false) => {
    (useHomeDashboardData as jest.Mock).mockReturnValue({
      stats: {
        todaySalesTotal: 1000,
        transactionCount: 5,
        profitMargin: 200,
        lowStockCount: 0,
        overdueCount: 0,
        overdueAmount: 0,
      },
      products: [{ id: 1, name: 'Item 1', quantity: 10, price: 50 }],
      recentSales: [],
      hourlySales: [],
      topProduct: { name: 'Item 1', unitsSold: 10 },
      alerts: [],
      alertCount: 0,
      currentSession: { status: 'open', variance: null },
      isLoading,
      refreshing: false,
      refetchAll: jest.fn(),
    });
  };

  test('renders skeleton loading state when isLoading is true', async () => {
    setupDefaultMocks(true);

    const { toJSON, queryByText } = await render(
      <QueryClientProvider client={queryClient}>
        <DashboardScreen />
      </QueryClientProvider>,
    );

    expect(toJSON()).toBeTruthy();
    expect(queryByText('New Sale')).toBeNull();
  });

  test('renders dashboard components in success state and handles action routing', async () => {
    setupDefaultMocks(false);

    const { getByText, getAllByText } = await render(
      <QueryClientProvider client={queryClient}>
        <DashboardScreen />
      </QueryClientProvider>,
    );

    expect(getByText('New Sale')).toBeTruthy();
    expect(getByText(/TOTAL SALES TODAY/i)).toBeTruthy();

    fireEvent.press(getByText('New Sale'));
    expect(mockPush).toHaveBeenCalledWith('/(edit-forms)/add-sales');

    fireEvent.press(getAllByText('Add Product')[0]);
    expect(mockPush).toHaveBeenCalledWith('/(edit-forms)/add-product');
  });
});
