import { fireEvent, render } from '@testing-library/react-native';
import { RepriceRow } from '@/components/pricing/RepriceRow';
import type { RepriceFlag } from '@/types/pricing.types';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}));

const flag: RepriceFlag = {
  productId: 7,
  productName: 'Soda',
  baselineCost: 10,
  newCost: 12,
  priceAtFlag: 13,
  currentPrice: 13,
  receiptId: 4,
  createdAt: '2026-11-13T00:00:00.000Z',
};

describe('RepriceRow', () => {
  it('prefills the suggested price that keeps the markup', async () => {
    const { getByLabelText } = await render(
      <RepriceRow flag={flag} onApply={jest.fn()} onKeep={jest.fn()} />,
    );
    expect(getByLabelText('newPriceLabel').props['value']).toBe('16');
  });

  it('shows the old and new markup', async () => {
    const { getByText } = await render(
      <RepriceRow flag={flag} onApply={jest.fn()} onKeep={jest.fn()} />,
    );
    expect(getByText('markupLine:{"from":30,"to":8.3}')).toBeTruthy();
  });

  it('applies the typed price for this product', async () => {
    const onApply = jest.fn();
    const { getByLabelText, getByText } = await render(
      <RepriceRow flag={flag} onApply={onApply} onKeep={jest.fn()} />,
    );
    await fireEvent.changeText(getByLabelText('newPriceLabel'), '15');
    await fireEvent.press(getByText('updatePrice'));
    expect(onApply).toHaveBeenCalledWith(7, 15);
  });

  it('keeps the price for this product', async () => {
    const onKeep = jest.fn();
    const { getByText } = await render(
      <RepriceRow flag={flag} onApply={jest.fn()} onKeep={onKeep} />,
    );
    await fireEvent.press(getByText('keepPrice'));
    expect(onKeep).toHaveBeenCalledWith(7);
  });

  it('blocks update and explains when the price is empty or zero', async () => {
    const onApply = jest.fn();
    const { getByLabelText, getByText } = await render(
      <RepriceRow flag={flag} onApply={onApply} onKeep={jest.fn()} />,
    );
    await fireEvent.changeText(getByLabelText('newPriceLabel'), '');
    expect(getByText('invalidPrice')).toBeTruthy();
    await fireEvent.press(getByText('updatePrice'));
    await fireEvent.changeText(getByLabelText('newPriceLabel'), '0');
    await fireEvent.press(getByText('updatePrice'));
    expect(onApply).not.toHaveBeenCalled();
  });

  it('warns but still allows a price below the new cost', async () => {
    const onApply = jest.fn();
    const { getByLabelText, getByText } = await render(
      <RepriceRow flag={flag} onApply={onApply} onKeep={jest.fn()} />,
    );
    await fireEvent.changeText(getByLabelText('newPriceLabel'), '11');
    expect(getByText('lossWarning')).toBeTruthy();
    await fireEvent.press(getByText('updatePrice'));
    expect(onApply).toHaveBeenCalledWith(7, 11);
  });

  it('shows no suggestion and an empty field when the baseline cost is zero', async () => {
    const { getByLabelText, getByText } = await render(
      <RepriceRow
        flag={{ ...flag, baselineCost: 0 }}
        onApply={jest.fn()}
        onKeep={jest.fn()}
      />,
    );
    expect(getByLabelText('newPriceLabel').props['value']).toBe('');
    expect(getByText('noSuggestion')).toBeTruthy();
    expect(getByText('markupUnknown')).toBeTruthy();
  });

  it('does not fire actions while busy', async () => {
    const onApply = jest.fn();
    const onKeep = jest.fn();
    const { getByText } = await render(
      <RepriceRow flag={flag} busy onApply={onApply} onKeep={onKeep} />,
    );
    await fireEvent.press(getByText('updatePrice'));
    await fireEvent.press(getByText('keepPrice'));
    expect(onApply).not.toHaveBeenCalled();
    expect(onKeep).not.toHaveBeenCalled();
  });
});
