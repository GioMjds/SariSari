import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { MoreDestinationRow } from '@/components/more/MoreDestinationRow';

describe('MoreDestinationRow', () => {
  it('renders an accessible, flexible destination control', async () => {
    const onPress = jest.fn();
    const screen = await render(
      <MoreDestinationRow
        icon="bar-chart"
        title="Reports & insights"
        supportingText="Sales, stock, suki, and cash trends"
        onPress={onPress}
        accessibilityLabel="Reports & insights"
        accessibilityHint="Opens consolidated store reports"
      />,
    );

    expect(screen.getByText('Reports & insights')).toBeTruthy();
    const supportingText = screen.getByText(
      'Sales, stock, suki, and cash trends',
    );
    expect(supportingText).toBeTruthy();
    expect(supportingText.props['numberOfLines']).toBeUndefined();
    expect(screen.getByText('chevron-right')).toBeTruthy();

    const row = screen.getByLabelText('Reports & insights');
    expect(row.props['accessibilityRole']).toBe('button');
    expect(row.props['accessibilityHint']).toBe(
      'Opens consolidated store reports',
    );
    expect(StyleSheet.flatten(row.props['style'])).toMatchObject({
      minHeight: 64,
    });

    await fireEvent.press(row);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
