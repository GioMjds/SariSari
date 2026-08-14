import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { AccessibilityInfo, StyleSheet } from 'react-native';
import { MoreDetailHeader } from '@/components/more/MoreDetailHeader';

const rendererImplementation =
  require('react-native/Libraries/ReactNative/RendererImplementation') as {
    findNodeHandle: (componentOrHandle: unknown) => number | null;
  };

describe('MoreDetailHeader', () => {
  const subtitle =
    'Protect your store data on this device and in Google Drive without truncating this guidance.';

  beforeEach(() => {
    jest.spyOn(rendererImplementation, 'findNodeHandle').mockReturnValue(42);
    jest
      .spyOn(AccessibilityInfo, 'setAccessibilityFocus')
      .mockImplementation(() => undefined);
    jest
      .spyOn(globalThis, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        callback(0);
        return 1;
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders a flexible heading and an accessible 48dp Back control', async () => {
    const onBack = jest.fn();
    const screen = await render(
      <MoreDetailHeader
        title="Backup & restore"
        subtitle={subtitle}
        onBack={onBack}
        backAccessibilityLabel="Back to More"
      />,
    );

    expect(screen.getByRole('header')).toBeTruthy();

    const backButton = screen.getByLabelText('Back to More');
    expect(backButton.props['accessibilityRole']).toBe('button');
    expect(StyleSheet.flatten(backButton.props['style'])).toMatchObject({
      minWidth: 48,
      minHeight: 48,
    });
    fireEvent.press(backButton);
    expect(onBack).toHaveBeenCalledTimes(1);

    expect(screen.getByText(subtitle).props['numberOfLines']).toBeUndefined();
  });

  it('moves screen-reader focus to the heading after the animation frame', async () => {
    await render(
      <MoreDetailHeader
        title="Backup & restore"
        subtitle={subtitle}
        onBack={jest.fn()}
        backAccessibilityLabel="Back to More"
      />,
    );

    expect(AccessibilityInfo.setAccessibilityFocus).toHaveBeenCalledWith(42);
  });
});
