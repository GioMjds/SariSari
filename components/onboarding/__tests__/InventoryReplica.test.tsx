import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { InventoryReplica } from '@/components/onboarding/replicas/InventoryReplica';
import { createDaySeed, dayReducer } from '@/lib/onboardingDay';

jest.mock('moti', () => {
  const { View } = require('react-native');
  return { MotiView: View };
});
jest.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}));

const afterCash = () =>
  dayReducer(createDaySeed(), { type: 'autoplay', beat: 'cash' });

describe('InventoryReplica', () => {
  it('offers Restock only on the low item, then saves the delivery', async () => {
    const dispatch = jest.fn();
    const screen = await render(
      <InventoryReplica state={afterCash()} dispatch={dispatch} />,
    );
    expect(
      screen.queryByLabelText('invRestockA11y:{"name":"dayProductPandesal"}'),
    ).toBeNull();
    await fireEvent.press(
      screen.getByLabelText('invRestockA11y:{"name":"dayProductKopiko"}'),
    );
    await fireEvent.press(screen.getByLabelText('invConfirm'));
    expect(dispatch).toHaveBeenCalledWith({
      type: 'restock',
      id: 'kopiko',
      qty: 24,
    });
  });

  it('shows no Restock button once the beat is done', async () => {
    const done = dayReducer(afterCash(), { type: 'autoplay', beat: 'restock' });
    const screen = await render(
      <InventoryReplica state={done} dispatch={jest.fn()} />,
    );
    expect(screen.queryByLabelText(/^invRestockA11y/)).toBeNull();
    expect(screen.getByText('invStockCount:{"count":27}')).toBeTruthy();
  });
});
