import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { PosReplica } from '@/components/onboarding/replicas/PosReplica';
import { createDaySeed, dayReducer, type DayAction } from '@/lib/onboardingDay';

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

const addLabel = (key: string) => `posAddA11y:{"name":"${key}"}`;

describe('PosReplica', () => {
  it('dispatches addToCart when a product tile is tapped', async () => {
    const dispatch = jest.fn();
    const screen = await render(
      <PosReplica mode="cash" state={createDaySeed()} dispatch={dispatch} />,
    );
    await fireEvent.press(screen.getByLabelText(addLabel('dayProductKopiko')));
    expect(dispatch).toHaveBeenCalledWith({ type: 'addToCart', id: 'kopiko' });
  });

  it('keeps Checkout disabled until the cart matches the order', async () => {
    const dispatch = jest.fn();
    const partial = dayReducer(createDaySeed(), {
      type: 'addToCart',
      id: 'kopiko',
    });
    const screen = await render(
      <PosReplica mode="cash" state={partial} dispatch={dispatch} />,
    );
    expect(
      screen.getByLabelText('posCheckout').props['accessibilityState'],
    ).toEqual(expect.objectContaining({ disabled: true }));
  });

  it('walks Checkout -> Cash -> P50 to a cash checkout', async () => {
    const dispatch = jest.fn();
    const ready = (
      [
        { type: 'addToCart', id: 'kopiko' },
        { type: 'addToCart', id: 'kopiko' },
        { type: 'addToCart', id: 'pandesal' },
      ] as DayAction[]
    ).reduce(dayReducer, createDaySeed());
    const screen = await render(
      <PosReplica mode="cash" state={ready} dispatch={dispatch} />,
    );
    await fireEvent.press(screen.getByLabelText('posCheckout'));
    await fireEvent.press(screen.getByLabelText('posCash'));
    await fireEvent.press(screen.getByLabelText(/^posTenderA11y:.*50/));
    expect(dispatch).toHaveBeenCalledWith({
      type: 'checkoutCash',
      tendered: 50,
    });
  });

  it('walks Checkout -> Utang -> Aling Nena to an utang checkout', async () => {
    const dispatch = jest.fn();
    const ready = (
      [
        { type: 'addToCart', id: 'luckyMe' },
        { type: 'addToCart', id: 'luckyMe' },
        { type: 'addToCart', id: 'cokeMismo' },
      ] as DayAction[]
    ).reduce(dayReducer, createDaySeed());
    const screen = await render(
      <PosReplica mode="utang" state={ready} dispatch={dispatch} />,
    );
    await fireEvent.press(screen.getByLabelText('posCheckout'));
    await fireEvent.press(screen.getByLabelText('posUtang'));
    await fireEvent.press(
      screen.getByLabelText('posPickSukiA11y:{"name":"daySukiNena"}'),
    );
    expect(dispatch).toHaveBeenCalledWith({
      type: 'checkoutUtang',
      suki: 'nena',
    });
  });

  it('shows a minus control that removes an extra item', async () => {
    const dispatch = jest.fn();
    const extra = dayReducer(createDaySeed(), {
      type: 'addToCart',
      id: 'luckyMe',
    });
    const screen = await render(
      <PosReplica mode="cash" state={extra} dispatch={dispatch} />,
    );
    await fireEvent.press(
      screen.getByLabelText('posRemoveA11y:{"name":"dayProductLuckyMe"}'),
    );
    expect(dispatch).toHaveBeenCalledWith({
      type: 'removeFromCart',
      id: 'luckyMe',
    });
  });

  it('shows its own receipt when the beat is done', async () => {
    const done = dayReducer(createDaySeed(), {
      type: 'autoplay',
      beat: 'cash',
    });
    const screen = await render(
      <PosReplica mode="cash" state={done} dispatch={jest.fn()} />,
    );
    expect(screen.getByText(/^posPaidCash:/)).toBeTruthy();
    expect(screen.queryByLabelText('posCheckout')).toBeNull();
  });
});
