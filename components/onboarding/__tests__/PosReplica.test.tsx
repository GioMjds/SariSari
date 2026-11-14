import React, { useReducer } from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { PosReplica } from '@/components/onboarding/replicas/PosReplica';
import {
  createDaySeed,
  dayReducer,
  type DayAction,
  type DayState,
} from '@/lib/onboardingDay';
import { formatPesos } from '@/lib/money';
import type { SaleBeat } from '@/constants/onboardingDay';

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

/** Runs the replica against the real reducer and records every action. */
function Harness({
  mode,
  initial,
  onAction,
}: {
  mode: SaleBeat;
  initial: DayState;
  onAction: (action: DayAction) => void;
}) {
  const [state, dispatch] = useReducer(dayReducer, initial);
  return (
    <PosReplica
      mode={mode}
      state={state}
      dispatch={(action) => {
        onAction(action);
        dispatch(action);
      }}
    />
  );
}

const withCart = (actions: DayAction[]) =>
  actions.reduce(dayReducer, createDaySeed());

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
    const onAction = jest.fn();
    const ready = withCart([
      { type: 'addToCart', id: 'kopiko' },
      { type: 'addToCart', id: 'kopiko' },
      { type: 'addToCart', id: 'pandesal' },
    ]);
    const screen = await render(
      <Harness mode="cash" initial={ready} onAction={onAction} />,
    );
    await fireEvent.press(screen.getByLabelText('posCheckout'));
    await fireEvent.press(screen.getByLabelText('posCash'));
    await fireEvent.press(screen.getByLabelText(/^posTenderA11y:.*50/));
    expect(onAction).toHaveBeenLastCalledWith({
      type: 'checkoutCash',
      tendered: 50,
    });
    expect(screen.getByText(/^posPaidCash:/)).toBeTruthy();
  });

  it('walks Checkout -> Utang -> Aling Nena to an utang checkout', async () => {
    const onAction = jest.fn();
    const ready = withCart([
      { type: 'addToCart', id: 'luckyMe' },
      { type: 'addToCart', id: 'luckyMe' },
      { type: 'addToCart', id: 'cokeMismo' },
    ]);
    const screen = await render(
      <Harness mode="utang" initial={ready} onAction={onAction} />,
    );
    await fireEvent.press(screen.getByLabelText('posCheckout'));
    await fireEvent.press(screen.getByLabelText('posUtang'));
    await fireEvent.press(
      screen.getByLabelText('posPickSukiA11y:{"name":"daySukiNena"}'),
    );
    expect(onAction).toHaveBeenLastCalledWith({
      type: 'checkoutUtang',
      suki: 'nena',
    });
  });

  it('shows the panel the day state names, so Show me can open it', async () => {
    const atTender = withCart([
      { type: 'addToCart', id: 'kopiko' },
      { type: 'addToCart', id: 'kopiko' },
      { type: 'addToCart', id: 'pandesal' },
      { type: 'setPosStage', beat: 'cash', stage: 'pay' },
      { type: 'setPosStage', beat: 'cash', stage: 'tender' },
    ]);
    const screen = await render(
      <PosReplica mode="cash" state={atTender} dispatch={jest.fn()} />,
    );
    expect(screen.getByText('posTendered')).toBeTruthy();
    expect(screen.queryByLabelText('posCheckout')).toBeNull();
  });

  it('goes back to the cart from Edit cart', async () => {
    const onAction = jest.fn();
    const atPay = withCart([
      { type: 'addToCart', id: 'kopiko' },
      { type: 'addToCart', id: 'kopiko' },
      { type: 'addToCart', id: 'pandesal' },
      { type: 'setPosStage', beat: 'cash', stage: 'pay' },
    ]);
    const screen = await render(
      <Harness mode="cash" initial={atPay} onAction={onAction} />,
    );
    await fireEvent.press(screen.getByLabelText('posEditCart'));
    expect(screen.getByLabelText('posCheckout')).toBeTruthy();
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

  it('keeps the cash receipt at its own numbers after the utang sale', async () => {
    const afterBoth = (['cash', 'utang'] as const).reduce(
      (s, beat) => dayReducer(s, { type: 'autoplay', beat }),
      createDaySeed(),
    );
    const screen = await render(
      <PosReplica mode="cash" state={afterBoth} dispatch={jest.fn()} />,
    );
    expect(
      screen.getByText(
        `posPaidCash:${JSON.stringify({
          total: formatPesos(38),
          change: formatPesos(12),
        })}`,
      ),
    ).toBeTruthy();
  });
});
