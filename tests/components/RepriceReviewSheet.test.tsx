import type React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import type { RepriceFlag } from '@/types/pricing.types';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}));

jest.mock('@/components/inventory/modals/_shared', () => {
  const { View } = require('react-native');
  return {
    Sheet: ({
      visible,
      children,
    }: {
      visible: boolean;
      children: React.ReactNode;
    }) => (visible ? <View testID="sheet">{children}</View> : null),
  };
});

const mockAddToast = jest.fn();
jest.mock('@/stores', () => ({
  useToastStore: (selector: (s: { addToast: jest.Mock }) => unknown) =>
    selector({ addToast: mockAddToast }),
}));

const mockApply = jest.fn();
const mockDismiss = jest.fn();
let mockFlags: RepriceFlag[] = [];
let mockIsSuccess = true;

jest.mock('@/hooks/usePriceHistory', () => ({
  useRepriceFlagsForReceipt: () => ({
    data: mockFlags,
    isSuccess: mockIsSuccess,
  }),
  useApplyReprice: () => ({ mutate: mockApply, isPending: false }),
  useDismissRepriceFlag: () => ({ mutate: mockDismiss, isPending: false }),
}));

import { RepriceReviewSheet } from '@/components/pricing/RepriceReviewSheet';

const flag = (productId: number, productName: string): RepriceFlag => ({
  productId,
  productName,
  baselineCost: 10,
  newCost: 12,
  priceAtFlag: 13,
  currentPrice: 13,
  receiptId: 4,
  createdAt: '2026-11-13T00:00:00.000Z',
});

describe('RepriceReviewSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFlags = [flag(1, 'Soda'), flag(2, 'Noodles')];
    mockIsSuccess = true;
  });

  it('stays closed when receiptId is null', async () => {
    const { queryByTestId } = await render(
      <RepriceReviewSheet receiptId={null} onClose={jest.fn()} />,
    );
    expect(queryByTestId('sheet')).toBeNull();
  });

  it('lists every flagged product with the count in the subtitle', async () => {
    const { getByText } = await render(
      <RepriceReviewSheet receiptId={4} onClose={jest.fn()} />,
    );
    expect(getByText('Soda')).toBeTruthy();
    expect(getByText('Noodles')).toBeTruthy();
    expect(getByText('sheetSubtitle:{"count":2}')).toBeTruthy();
  });

  it('Later closes without touching any flag', async () => {
    const onClose = jest.fn();
    const { getByText } = await render(
      <RepriceReviewSheet receiptId={4} onClose={onClose} />,
    );
    await fireEvent.press(getByText('later'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockApply).not.toHaveBeenCalled();
    expect(mockDismiss).not.toHaveBeenCalled();
  });

  it('closes by itself once the last flag is handled', async () => {
    const onClose = jest.fn();
    const view = await render(
      <RepriceReviewSheet receiptId={4} onClose={onClose} />,
    );
    expect(onClose).not.toHaveBeenCalled();
    mockFlags = [];
    await view.rerender(<RepriceReviewSheet receiptId={4} onClose={onClose} />);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close while the first load is still pending', async () => {
    mockFlags = [];
    mockIsSuccess = false;
    const onClose = jest.fn();
    await render(<RepriceReviewSheet receiptId={4} onClose={onClose} />);
    expect(onClose).not.toHaveBeenCalled();
  });
});
