import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { AccessibilityInfo, StyleSheet } from 'react-native';
import { AlmanacMasthead } from '@/components/reports/AlmanacMasthead';
import i18n, { initI18n } from '@/lib/i18n';
import type { DateRange } from '@/types';

const rendererImplementation =
  require('react-native/Libraries/ReactNative/RendererImplementation') as {
    findNodeHandle: (componentOrHandle: unknown) => number | null;
  };

describe('AlmanacMasthead', () => {
  const dateRange: DateRange = {
    startDate: new Date('2026-08-14T00:00:00'),
    endDate: new Date('2026-08-14T23:59:59'),
    label: 'Today',
  };

  beforeAll(async () => {
    await initI18n();
    await i18n.changeLanguage('tl');
  });

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

  it('provides localized Back-to-More and refresh actions', async () => {
    const onBack = jest.fn();
    const onRefresh = jest.fn();
    const screen = await render(
      <AlmanacMasthead
        dateRange={dateRange}
        onBack={onBack}
        onRefresh={onRefresh}
        isRefreshing={false}
      />,
    );

    const backButton = screen.getByLabelText('Bumalik sa Iba pa');
    expect(backButton.props['accessibilityRole']).toBe('button');
    expect(StyleSheet.flatten(backButton.props['style'])).toMatchObject({
      minWidth: 48,
      minHeight: 48,
    });
    await fireEvent.press(backButton);
    expect(onBack).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByLabelText('Refresh reports'));
    expect(onRefresh).toHaveBeenCalledTimes(1);

    await screen.unmount();
  });
});
