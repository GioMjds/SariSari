import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { CustomersDemo } from '@/components/onboarding/demos/CustomersDemo';
import { InventoryDemo } from '@/components/onboarding/demos/InventoryDemo';
import { SalesDemo } from '@/components/onboarding/demos/SalesDemo';

jest.mock('moti', () => {
  const { View } = require('react-native');
  return { MotiView: View };
});
jest.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}));

const makeApi = () => ({
  setPose: jest.fn(),
  say: jest.fn(),
  complete: jest.fn(),
});

describe('SalesDemo', () => {
  it('keeps the pay buttons disabled until an item is added', async () => {
    const api = makeApi();
    const screen = await render(<SalesDemo {...api} />);

    await fireEvent.press(screen.getByLabelText('demoSalesCash'));
    expect(api.complete).not.toHaveBeenCalled();

    await fireEvent.press(
      screen.getByLabelText('demoSalesItemA11y:{"name":"Kape sachet"}'),
    );
    await fireEvent.press(screen.getByLabelText('demoSalesCash'));

    expect(api.complete).toHaveBeenCalledTimes(1);
    expect(api.setPose).toHaveBeenCalledWith('sales');
    expect(api.say).toHaveBeenCalledWith('demoSalesDoneBubble', {
      total: '₱8.00',
    });
  });
});

describe('InventoryDemo', () => {
  it('restocks the low item and swaps Sari to the inventory pose', async () => {
    const api = makeApi();
    const screen = await render(<InventoryDemo {...api} />);

    await fireEvent.press(
      screen.getByLabelText('demoInvRestockA11y:{"name":"Kape sachet"}'),
    );

    expect(api.complete).toHaveBeenCalledTimes(1);
    expect(api.setPose).toHaveBeenCalledWith('inventory');
    expect(
      screen.queryByLabelText('demoInvRestockA11y:{"name":"Kape sachet"}'),
    ).toBeNull();
  });
});

describe('CustomersDemo', () => {
  it('clears the balance and swaps Sari to the cleared pose', async () => {
    const api = makeApi();
    const screen = await render(<CustomersDemo {...api} />);

    expect(screen.getByText('₱350.00')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('demoCustMarkPaid'));

    expect(screen.getByText('₱0.00')).toBeTruthy();
    expect(api.setPose).toHaveBeenCalledWith('balanceCleared');
    expect(api.complete).toHaveBeenCalledTimes(1);
  });
});
