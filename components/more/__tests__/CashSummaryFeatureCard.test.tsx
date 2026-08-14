import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { CashSummaryFeatureCard } from '@/components/more/CashSummaryFeatureCard';
import i18n, { initI18n } from '@/lib/i18n';
import type { Pesos } from '@/lib/money';

describe('CashSummaryFeatureCard', () => {
  beforeAll(async () => {
    await initI18n();
    await i18n.changeLanguage('en');
  });

  it('shows loading copy with the Open cash action', async () => {
    const screen = await render(
      <CashSummaryFeatureCard
        state={{ status: 'loading' }}
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText("Checking today's movements")).toBeTruthy();
    expect(screen.getByText('Open cash')).toBeTruthy();
  });

  it('shows valid empty copy when both ready totals are zero', async () => {
    const screen = await render(
      <CashSummaryFeatureCard
        state={{
          status: 'ready',
          paidExpenses: 0 as Pesos,
          ownerDrawings: 0 as Pesos,
        }}
        onPress={jest.fn()}
      />,
    );

    expect(
      screen.getByText('No expenses or owner drawings recorded today'),
    ).toBeTruthy();
    expect(screen.getByText('Review cash')).toBeTruthy();
  });

  it('formats an expenses-only ready state', async () => {
    const screen = await render(
      <CashSummaryFeatureCard
        state={{
          status: 'ready',
          paidExpenses: 1250.5 as Pesos,
          ownerDrawings: 0 as Pesos,
        }}
        onPress={jest.fn()}
      />,
    );

    expect(
      screen.getByText('Expenses ₱1,250.50 · Owner drawings ₱0.00'),
    ).toBeTruthy();
  });

  it('formats an owner-drawings-only ready state', async () => {
    const screen = await render(
      <CashSummaryFeatureCard
        state={{
          status: 'ready',
          paidExpenses: 0 as Pesos,
          ownerDrawings: 500 as Pesos,
        }}
        onPress={jest.fn()}
      />,
    );

    expect(
      screen.getByText('Expenses ₱0.00 · Owner drawings ₱500.00'),
    ).toBeTruthy();
  });

  it('formats both populated financial totals', async () => {
    const screen = await render(
      <CashSummaryFeatureCard
        state={{
          status: 'ready',
          paidExpenses: 1250.5 as Pesos,
          ownerDrawings: 500 as Pesos,
        }}
        onPress={jest.fn()}
      />,
    );

    expect(
      screen.getByText('Expenses ₱1,250.50 · Owner drawings ₱500.00'),
    ).toBeTruthy();
  });

  it('shows query-error copy with the Check cash action', async () => {
    const screen = await render(
      <CashSummaryFeatureCard
        state={{ status: 'error' }}
        onPress={jest.fn()}
      />,
    );

    expect(
      screen.getByText("Open to check today's expenses and owner drawings"),
    ).toBeTruthy();
    expect(screen.getByText('Check cash')).toBeTruthy();
  });

  it('is one labeled button and presses from anywhere on the card', async () => {
    const onPress = jest.fn();
    const screen = await render(
      <CashSummaryFeatureCard
        state={{ status: 'loading' }}
        onPress={onPress}
      />,
    );

    const card = screen.getByLabelText(
      "Cash & expenses. Checking today's movements. Open cash",
    );
    expect(card.props['accessibilityRole']).toBe('button');
    expect(card.props['accessibilityHint']).toBe(
      "Opens today's expenses and owner drawings",
    );

    await fireEvent.press(card);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
