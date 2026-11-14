import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ReadyStep } from '@/components/onboarding/ReadyStep';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}));

describe('ReadyStep', () => {
  it('greets the owner by trimmed name and store', async () => {
    const screen = await render(
      <ReadyStep
        profile={{ ownerName: ' Nena ', storeName: ' Nena Store ' }}
        saving={false}
        onEditProfile={jest.fn()}
      />,
    );
    expect(screen.getByText('readyGreetingNamed:{"name":"Nena"}')).toBeTruthy();
    expect(
      screen.getByText('readySublineNamed:{"storeName":"Nena Store"}'),
    ).toBeTruthy();
    expect(screen.queryByText('readyFirstStepsTitle')).toBeNull();
  });

  it('sends the owner back to the profile step from the edit link', async () => {
    const onEditProfile = jest.fn();
    const screen = await render(
      <ReadyStep
        profile={{ ownerName: 'Nena', storeName: 'Nena Store' }}
        saving={false}
        onEditProfile={onEditProfile}
      />,
    );
    await fireEvent.press(screen.getByText('readyEditProfile'));
    expect(onEditProfile).toHaveBeenCalledTimes(1);
  });
});
