import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import {
  SettingsRow,
  SettingsSection,
} from '@/components/settings/SettingsPrimitives';

describe('SettingsPrimitives', () => {
  it('renders section context around its children', async () => {
    const screen = await render(
      <SettingsSection title="Store" subtitle="Store details">
        <SettingsRow label="Store name" value="Tindahan ni Ana" />
      </SettingsSection>,
    );

    expect(screen.getByText('Store')).toBeTruthy();
    expect(screen.getByText('Store details')).toBeTruthy();
    expect(screen.getByText('Tindahan ni Ana')).toBeTruthy();
  });

  it('makes an interactive row an accessible 48dp button', async () => {
    const onPress = jest.fn();
    const screen = await render(
      <SettingsRow
        label="Language"
        value="English"
        accessibilityHint="Opens language choices"
        interactive
        onPress={onPress}
      />,
    );

    const row = screen.getByLabelText('Language');
    expect(row.props['accessibilityRole']).toBe('button');
    expect(row.props['accessibilityHint']).toBe('Opens language choices');
    expect(StyleSheet.flatten(row.props['style'])).toMatchObject({
      minHeight: 48,
    });

    fireEvent.press(row);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
