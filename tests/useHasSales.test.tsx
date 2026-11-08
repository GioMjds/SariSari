import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@/database/sales', () => ({
  deleteSale: jest.fn(),
  getAllSales: jest.fn(async () => [{ id: 1 }, { id: 2 }]),
  getRecentSales: jest.fn(),
  getSale: jest.fn(),
  getSaleItems: jest.fn(),
  getSalesByDateRange: jest.fn(),
  getTodayStats: jest.fn(async () => ({})),
  hasSales: jest.fn(async () => true),
  insertSale: jest.fn(),
  voidSale: jest.fn(),
  refundSale: jest.fn(),
  correctSalePrice: jest.fn(),
}));
jest.mock('@/database/corrections', () => ({
  getCorrectionsForSale: jest.fn(),
}));
jest.mock('@/hooks/useInventory', () => ({ inventoryKeys: { all: ['inv'] } }));
jest.mock('@/hooks/useProducts', () => ({
  invalidateProductDependencies: jest.fn(),
}));

import { useHasSales, useSales } from '@/hooks/useSales';

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

describe('useHasSales', () => {
  it('stays a boolean when useSales runs in the same tree', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = await renderHook(
      () => ({ has: useHasSales(), all: useSales().getAllSalesQuery }),
      { wrapper: wrapper(client) },
    );

    await waitFor(() => {
      expect(result.current.has.isSuccess).toBe(true);
      expect(result.current.all.isSuccess).toBe(true);
    });

    expect(result.current.has.data).toBe(true);
    expect(Array.isArray(result.current.all.data)).toBe(true);
    client.clear();
  });
});
