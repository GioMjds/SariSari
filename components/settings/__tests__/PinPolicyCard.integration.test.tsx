import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PinPolicyCard } from '@/components/settings/PinPolicyCard';

const mockStore: Record<string, boolean> = {};
const mockSet = jest.fn(async (id: string, enabled: boolean) => {
  mockStore[id] = enabled;
});
const mockAddToast = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));
jest.mock('@/database/pin-policy', () => ({
  getPinPolicyOverrides: async () => ({ ...mockStore }),
  setPinPolicyOverride: (id: string, enabled: boolean) =>
    mockSet(id, enabled),
}));
jest.mock('@/hooks/useOwnerPinGuard', () => ({
  useOwnerPinGuard: () => ({
    runWithPinGuard: async (o: { onApproved: () => Promise<void> }) => {
      await o.onApproved();
    },
  }),
}));
jest.mock('@/stores/useAuthStore', () => ({
  useAuthStore: (sel: (s: unknown) => unknown) =>
    sel({ isPinConfigured: true }),
}));
jest.mock('@/stores', () => ({
  useToastStore: (sel: (s: unknown) => unknown) =>
    sel({ addToast: mockAddToast }),
}));

const renderCard = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <PinPolicyCard />
    </QueryClientProvider>,
  );
};

describe('PinPolicyCard with the real policy hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    for (const k of Object.keys(mockStore)) delete mockStore[k];
  });

  it('keeps the switch value and toasts when the write fails', async () => {
    mockSet.mockRejectedValueOnce(new Error('db'));
    const screen = await renderCard();
    const sw = await screen.findByTestId('pin-policy-switch-sale_void');
    expect(sw.props['value']).toBe(true);
    await fireEvent(sw, 'valueChange', false);
    await waitFor(() => expect(mockAddToast).toHaveBeenCalled());
    expect(
      screen.getByTestId('pin-policy-switch-sale_void').props['value'],
    ).toBe(true);
  });

  it('applies the new value and clears the New badge after a write', async () => {
    const screen = await renderCard();
    const sw = await screen.findByTestId('pin-policy-switch-sale_void');
    expect(screen.getByTestId('pin-policy-new-sale_void')).toBeTruthy();
    await fireEvent(sw, 'valueChange', false);
    await waitFor(() =>
      expect(screen.queryByTestId('pin-policy-new-sale_void')).toBeNull(),
    );
    expect(
      screen.getByTestId('pin-policy-switch-sale_void').props['value'],
    ).toBe(false);
  });

  it('shows a stored 0 as off instead of the default', async () => {
    mockStore['sale_void'] = false;
    const screen = await renderCard();
    const sw = await screen.findByTestId('pin-policy-switch-sale_void');
    expect(sw.props['value']).toBe(false);
    expect(screen.queryByTestId('pin-policy-new-sale_void')).toBeNull();
  });
});
