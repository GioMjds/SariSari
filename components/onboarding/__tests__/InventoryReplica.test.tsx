import React, { useReducer } from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { InventoryReplica } from '@/components/onboarding/replicas/InventoryReplica';
import {
  createDaySeed,
  dayReducer,
  type DayAction,
  type DayState,
} from '@/lib/onboardingDay';

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

/** Runs the replica against the real reducer and records every action. */
function Harness({
  initial,
  onAction,
}: {
  initial: DayState;
  onAction: (action: DayAction) => void;
}) {
  const [state, dispatch] = useReducer(dayReducer, initial);
  return (
    <InventoryReplica
      state={state}
      dispatch={(action) => {
        onAction(action);
        dispatch(action);
      }}
    />
  );
}

describe('InventoryReplica', () => {
  it('offers Restock only on the low item, then saves the delivery', async () => {
    const onAction = jest.fn();
    const screen = await render(
      <Harness initial={afterCash()} onAction={onAction} />,
    );
    expect(
      screen.queryByLabelText('invRestockA11y:{"name":"dayProductPandesal"}'),
    ).toBeNull();
    await fireEvent.press(
      screen.getByLabelText('invRestockA11y:{"name":"dayProductKopiko"}'),
    );
    await fireEvent.press(screen.getByLabelText('invConfirm'));
    expect(onAction).toHaveBeenLastCalledWith({
      type: 'restock',
      id: 'kopiko',
      qty: 24,
    });
    expect(screen.getByText('invStockCount:{"count":27}')).toBeTruthy();
  });

  it('shows the delivery panel the day state names, so Show me can open it', async () => {
    const open = dayReducer(afterCash(), { type: 'openRestock', id: 'kopiko' });
    const screen = await render(
      <InventoryReplica state={open} dispatch={jest.fn()} />,
    );
    expect(
      screen.getByText('invDeliveryTitle:{"name":"dayProductKopiko"}'),
    ).toBeTruthy();
    expect(screen.queryByLabelText(/^invRestockA11y/)).toBeNull();
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
