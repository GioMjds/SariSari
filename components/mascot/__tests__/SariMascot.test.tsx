import React from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { render } from '@testing-library/react-native';
// @ts-expect-error -- untyped React Native internal; the parser that rejects bad origins.
import processTransformOrigin from 'react-native/Libraries/StyleSheet/processTransformOrigin';
import { SARI_STATES, SariMascot } from '@/components/mascot';

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

  it('gives every loading layer a transformOrigin React Native can parse', async () => {
    const screen = await render(<SariMascot state="loading" size={96} />);
    const origins: unknown[] = [];
    const collect = (node: unknown): void => {
      if (Array.isArray(node)) {
        node.forEach(collect);
        return;
      }
      if (!node || typeof node !== 'object') return;
      const { props, children } = node as {
        props?: { style?: unknown };
        children?: unknown;
      };
      const flat = StyleSheet.flatten(props?.style as StyleProp<ViewStyle>);
      if (flat?.transformOrigin != null) origins.push(flat.transformOrigin);
      collect(children);
    };
    collect(screen.toJSON());

    expect(origins.length).toBeGreaterThan(0);
    for (const origin of origins) {
      expect(() =>
        processTransformOrigin(origin as string | (string | number)[]),
      ).not.toThrow();
    }
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

  it.each(SARI_STATES)(
    'renders the %s state with transformOrigins React Native can parse',
    async (state) => {
      const screen = await render(<SariMascot state={state} size={80} />);
      expect(
        screen.getByTestId(`sari-mascot-${state}`, { includeHiddenElements: true }),
      ).toBeTruthy();
      const origins: unknown[] = [];
      const collect = (node: unknown): void => {
        if (Array.isArray(node)) {
          node.forEach(collect);
          return;
        }
        if (!node || typeof node !== 'object') return;
        const { props, children } = node as {
          props?: { style?: unknown };
          children?: unknown;
        };
        const flat = StyleSheet.flatten(props?.style as StyleProp<ViewStyle>);
        if (flat?.transformOrigin != null) origins.push(flat.transformOrigin);
        collect(children);
      };
      collect(screen.toJSON());
      for (const origin of origins) {
        expect(() =>
          processTransformOrigin(origin as string | (string | number)[]),
        ).not.toThrow();
        // RN's parser reads '92.5%' as '5%' without throwing, so a decimal
        // percent silently moves the pivot. Use whole percents or pixels.
        const parts = Array.isArray(origin) ? origin : String(origin).split(/\s+/);
        for (const part of parts) {
          expect(String(part)).not.toMatch(/\d\.\d+%/);
        }
      }
    },
  );

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
