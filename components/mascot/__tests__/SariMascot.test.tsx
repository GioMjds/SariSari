import React from 'react';
import { render } from '@testing-library/react-native';
import { SariMascot } from '@/components/mascot';

const mockReducedMotion = jest.fn(() => false);
jest.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => mockReducedMotion(),
}));

describe('SariMascot', () => {
  it('renders the default state at the requested size', async () => {
    const screen = await render(<SariMascot size={96} />);
    const root = screen.getByTestId('sari-mascot-default', { includeHiddenElements: true });
    expect(root.props['style']).toEqual(
      expect.arrayContaining([{ width: 96, height: 96 }]),
    );
  });

  it('renders the empty state', async () => {
    const screen = await render(<SariMascot state="empty" size={160} />);
    expect(
      screen.getByTestId('sari-mascot-empty', { includeHiddenElements: true }),
    ).toBeTruthy();
  });

  it('renders the error state', async () => {
    const screen = await render(<SariMascot state="error" size={112} />);
    expect(
      screen.getByTestId('sari-mascot-error', { includeHiddenElements: true }),
    ).toBeTruthy();
  });

  it('renders the loading state', async () => {
    const screen = await render(
      <SariMascot state="loading" accessibilityLabel="Loading" />,
    );
    expect(screen.getByLabelText('Loading')).toBeTruthy();
  });

  it('renders the low stock state', async () => {
    const screen = await render(<SariMascot state="low-stock" size={56} />);
    expect(
      screen.getByTestId('sari-mascot-low-stock', { includeHiddenElements: true }),
    ).toBeTruthy();
  });

  it('renders the balance cleared state', async () => {
    const screen = await render(<SariMascot state="balance-cleared" size={96} />);
    expect(
      screen.getByTestId('sari-mascot-balance-cleared', { includeHiddenElements: true }),
    ).toBeTruthy();
  });

  it('renders the outstanding balance state', async () => {
    const screen = await render(<SariMascot state="outstanding-balance" size={64} />);
    expect(
      screen.getByTestId('sari-mascot-outstanding-balance', { includeHiddenElements: true }),
    ).toBeTruthy();
  });

  it('is decorative unless an accessibility label is given', async () => {
    const screen = await render(<SariMascot />);
    expect(screen.queryByRole('image')).toBeNull();
  });

  it('is announced as an image when labelled', async () => {
    const screen = await render(<SariMascot accessibilityLabel="Sari waving" />);
    expect(screen.getByLabelText('Sari waving')).toBeTruthy();
  });

  it('renders the still pose under Reduced Motion', async () => {
    mockReducedMotion.mockReturnValueOnce(true);
    const screen = await render(<SariMascot />);
    expect(screen.getByTestId('sari-mascot-default', { includeHiddenElements: true })).toBeTruthy();
  });
});
