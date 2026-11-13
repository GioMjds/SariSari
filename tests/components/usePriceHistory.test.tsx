import React from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockApplyReprice = jest.fn(async () => undefined);
const mockDismiss = jest.fn(async () => undefined);
const mockFlagsForReceipt = jest.fn(async () => [{ productId: 1 }]);
const mockInvalidateProducts = jest.fn();

jest.mock('@/database/priceHistory', () => ({
  InvalidRepriceError: class InvalidRepriceError extends Error {},
  applyReprice: (...args: unknown[]) => mockApplyReprice(...(args as [])),
  dismissRepriceFlag: (...args: unknown[]) => mockDismiss(...(args as [])),
  getPriceHistory: jest.fn(async () => []),
  getRepriceFlags: jest.fn(async () => []),
  getRepriceFlagsForReceipt: (...args: unknown[]) =>
    mockFlagsForReceipt(...(args as [])),
}));
jest.mock('@/hooks/useProducts', () => ({
  invalidateProductDependencies: (...args: unknown[]) =>
    mockInvalidateProducts(...args),
}));

import {
  priceHistoryKeys,
  useApplyReprice,
  useDismissRepriceFlag,
  useFetchRepriceFlagsForReceipt,
} from '@/hooks/usePriceHistory';

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

// gcTime Infinity schedules no garbage-collection timers, so jest can exit.
const newClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { gcTime: Infinity },
    },
  });

describe('usePriceHistory mutations', () => {
  let client: QueryClient;
  beforeEach(() => {
    client = newClient();
    jest.clearAllMocks();
  });
  afterEach(() => {
    client.clear();
  });

  it('applyReprice passes the price through and invalidates flags and products', async () => {
    client.setQueryData(priceHistoryKeys.flags(), [{ productId: 3 }]);
    const { result } = await renderHook(() => useApplyReprice(), {
      wrapper: wrapper(client),
    });
    await act(async () => {
      await result.current.mutateAsync({ productId: 3, newPrice: 16 });
    });
    expect(mockApplyReprice).toHaveBeenCalledWith(3, 16);
    expect(client.getQueryState(priceHistoryKeys.flags())?.isInvalidated).toBe(
      true,
    );
    expect(mockInvalidateProducts).toHaveBeenCalledWith(client, 3);
  });

  it('dismiss invalidates flags and leaves product queries alone', async () => {
    client.setQueryData(priceHistoryKeys.flags(), [{ productId: 3 }]);
    const { result } = await renderHook(() => useDismissRepriceFlag(), {
      wrapper: wrapper(client),
    });
    await act(async () => {
      await result.current.mutateAsync(3);
    });
    expect(mockDismiss).toHaveBeenCalledWith(3);
    expect(client.getQueryState(priceHistoryKeys.flags())?.isInvalidated).toBe(
      true,
    );
    expect(mockInvalidateProducts).not.toHaveBeenCalled();
  });

  it('fetchRepriceFlagsForReceipt always reads fresh data', async () => {
    client.setQueryData(priceHistoryKeys.flagsForReceipt(9), []);
    const { result } = await renderHook(
      () => useFetchRepriceFlagsForReceipt(),
      {
        wrapper: wrapper(client),
      },
    );
    let flags: unknown;
    await act(async () => {
      flags = await result.current(9);
    });
    expect(mockFlagsForReceipt).toHaveBeenCalledWith(9);
    expect(flags).toEqual([{ productId: 1 }]);
  });
});
