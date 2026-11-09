import type { TFunction } from 'i18next';
import { deliveryErrorMessage } from '@/components/receiving/deliveryErrors';
import {
  QuickAddBarcodeExistsError,
  ReceiptAlreadyVoidedError,
  ReceiptEmptyError,
  ReceiptNotCommittedError,
  ReceiptNotDraftError,
  VoidWouldGoNegativeError,
} from '@/hooks/useDeliveryReceipts';
import { InvalidDeliveryLineError } from '@/lib/deliveryReceipt';

// The hook module pulls in the PDF export chain, which needs native modules.
jest.mock('expo-print', () => ({}));
jest.mock('expo-sharing', () => ({}));

const t = ((key: string, opts?: Record<string, unknown>) =>
  opts ? `${key}:${JSON.stringify(opts)}` : key) as unknown as TFunction;

describe('deliveryErrorMessage', () => {
  it.each([
    [new ReceiptNotDraftError(1, 'committed'), 'errorNotDraft'],
    [new ReceiptNotDraftError(1, 'being committed'), 'errorNotDraft'],
    [new ReceiptEmptyError(1), 'errorEmpty'],
    [new QuickAddBarcodeExistsError('123'), 'errorBarcodeExists'],
    [new ReceiptNotCommittedError(1, 'draft'), 'errorNotCommitted'],
    [new ReceiptAlreadyVoidedError(1), 'errorAlreadyVoided'],
    [new Error('disk I/O'), 'errorGeneric'],
    ['not an error', 'errorGeneric'],
  ])('maps %p to %p', (err, key) => {
    expect(deliveryErrorMessage(err, t)).toBe(key);
  });

  it('names the products that block a void', () => {
    const err = new VoidWouldGoNegativeError([
      { productId: 1, productName: 'Soda', needed: 24, onHand: 10 },
      { productId: 2, productName: 'Rice', needed: 5, onHand: 0 },
    ]);
    expect(deliveryErrorMessage(err, t)).toBe(
      'errorVoidTooLow errorVoidProducts:{"names":"Soda, Rice"}',
    );
  });

  it('shows a line validation error as its own message', () => {
    expect(
      deliveryErrorMessage(
        new InvalidDeliveryLineError('Received is required'),
        t,
      ),
    ).toBe('Received is required');
  });
});
