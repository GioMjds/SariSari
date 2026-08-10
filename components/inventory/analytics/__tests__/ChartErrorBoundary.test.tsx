import React from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChartErrorBoundary } from '@/components/inventory/analytics/ChartErrorBoundary';

function Bomb(): React.ReactElement {
  throw new Error('synthetic chart failure');
}

function wrapping(qc: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('ChartErrorBoundary', () => {
  it('shows the fallback message when a child throws during render', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { getByText } = await render(
      <ChartErrorBoundary message="bar chart unavailable">
        <Bomb />
      </ChartErrorBoundary>,
      { wrapper: wrapping(qc) },
    );
    expect(getByText('bar chart unavailable')).toBeTruthy();
  });

  it('uses the default fallback when no message prop is given', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { getByText } = await render(
      <ChartErrorBoundary>
        <Bomb />
      </ChartErrorBoundary>,
      { wrapper: wrapping(qc) },
    );
    expect(getByText(/Chart unavailable/)).toBeTruthy();
  });

  it('renders children when no error is thrown', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { queryByText } = await render(
      <ChartErrorBoundary>
        <React.Fragment />
      </ChartErrorBoundary>,
      { wrapper: wrapping(qc) },
    );
    expect(queryByText(/Chart unavailable/)).toBeNull();
  });
});