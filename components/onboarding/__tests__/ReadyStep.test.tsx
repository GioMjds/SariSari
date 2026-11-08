import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ReadyStep } from '@/components/onboarding/ReadyStep';

jest.mock('moti', () => {
  const { View } = require('react-native');
  return { MotiView: View };
});
jest.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}));

const PRODUCT_CARD =
  'readyStepA11y:{"title":"readyStepProductTitle","reason":"readyStepProductReason"}';

describe('ReadyStep first steps', () => {
  it('routes a card tap with its href when the profile is valid', async () => {
    const onOpenStore = jest.fn();
    const screen = await render(
      <ReadyStep
        profile={{ ownerName: 'Nena', storeName: 'Nena Sari-Sari' }}
        saving={false}
        onOpenStore={onOpenStore}
      />,
    );

    await fireEvent.press(screen.getByLabelText(PRODUCT_CARD));
    expect(onOpenStore).toHaveBeenCalledWith('/(edit-forms)/add-product');
  });

  it('ignores card taps when names are blank or whitespace-only', async () => {
    const onOpenStore = jest.fn();
    const screen = await render(
      <ReadyStep
        profile={{ ownerName: '   ', storeName: '' }}
        saving={false}
        onOpenStore={onOpenStore}
      />,
    );

    await fireEvent.press(screen.getByLabelText(PRODUCT_CARD));
    await fireEvent.press(screen.getByLabelText('readyCtaA11y'));
    expect(onOpenStore).not.toHaveBeenCalled();
  });

  it('ignores card taps while saving', async () => {
    const onOpenStore = jest.fn();
    const screen = await render(
      <ReadyStep
        profile={{ ownerName: 'Nena', storeName: 'Nena Sari-Sari' }}
        saving
        onOpenStore={onOpenStore}
      />,
    );

    await fireEvent.press(screen.getByLabelText(PRODUCT_CARD));
    expect(onOpenStore).not.toHaveBeenCalled();
  });

  it('calls onOpenStore with no argument for the primary CTA', async () => {
    const onOpenStore = jest.fn();
    const screen = await render(
      <ReadyStep
        profile={{ ownerName: 'Nena', storeName: 'Nena Sari-Sari' }}
        saving={false}
        onOpenStore={onOpenStore}
      />,
    );

    await fireEvent.press(screen.getByLabelText('readyCtaA11y'));
    expect(onOpenStore).toHaveBeenCalledWith();
  });
});
