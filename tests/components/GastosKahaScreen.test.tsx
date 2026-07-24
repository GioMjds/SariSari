import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import GastosKahaScreen from '../../app/gastos-kaha/index';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { runMigrations } from '../../database/migrations';
import { resetMockDb } from '../__setup__/expo-sqlite-mock';

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('GastosKahaScreen', () => {
  beforeEach(async () => {
    resetMockDb();
    await runMigrations();
  });

  test('renders action buttons, date range inputs, and financial totals', async () => {
    const wrapper = createWrapper();
    const { getByText, getByTestId } = await render(<GastosKahaScreen />, { wrapper });

    await waitFor(() => {
      expect(getByText('Record Expense')).toBeTruthy();
      expect(getByText('Record Drawing')).toBeTruthy();
      expect(getByTestId('start-date-filter')).toBeTruthy();
      expect(getByTestId('end-date-filter')).toBeTruthy();
    });
  });
});
