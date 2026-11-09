import React from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@/database/deliveries', () => ({
  ...jest.requireActual('@/database/deliveries'),
  commitDeliveryReceipt: jest.fn(async () => undefined),
  discardDeliveryDraft: jest.fn(async () => undefined),
}));
jest.mock('@/hooks/useInventory', () => ({ inventoryKeys: { all: ['inv'] } }));
jest.mock('@/hooks/useProducts', () => ({
  invalidateProductDependencies: jest.fn(),
}));
jest.mock('@/hooks/useStockIntelligence', () => ({
  stockIntelligenceKeys: { all: ['stock-intelligence'] },
}));

import {
  deliveryKeys,
  useCommitDeliveryReceipt,
  useDiscardDeliveryDraft,
} from '@/hooks/useDeliveryReceipts';

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

// An inactive open-draft cache entry (no mounted observer) is what the editor
// leaves behind after it moves from `new` to the numeric receipt route.
const seedStaleOpenDraft = (client: QueryClient) => {
  client.setQueryData(deliveryKeys.openDraft('supplier-a'), 5);
  client.setQueryData(deliveryKeys.openDraft('supplier-b'), 6);
};

// gcTime Infinity schedules no garbage-collection timers, so jest can exit.
const newClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { gcTime: Infinity },
    },
  });

describe('open-draft cache after a draft leaves the draft state', () => {
  let client: QueryClient;
  beforeEach(() => {
    client = newClient();
  });
  afterEach(() => {
    client.clear();
  });

  it('is removed after a commit, so a stale id cannot be resumed', async () => {
    seedStaleOpenDraft(client);
    const { result } = await renderHook(() => useCommitDeliveryReceipt(), {
      wrapper: wrapper(client),
    });
    await act(async () => {
      await result.current.mutateAsync(5);
    });
    expect(
      client.getQueryData(deliveryKeys.openDraft('supplier-a')),
    ).toBeUndefined();
    expect(
      client.getQueryData(deliveryKeys.openDraft('supplier-b')),
    ).toBeUndefined();
  });

  it('is removed after a discard', async () => {
    seedStaleOpenDraft(client);
    const { result } = await renderHook(() => useDiscardDeliveryDraft(), {
      wrapper: wrapper(client),
    });
    await act(async () => {
      await result.current.mutateAsync(5);
    });
    expect(
      client.getQueryData(deliveryKeys.openDraft('supplier-a')),
    ).toBeUndefined();
  });
});
