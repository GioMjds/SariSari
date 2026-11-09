import type { TFunction } from 'i18next';
import {
  QuickAddBarcodeExistsError,
  ReceiptAlreadyVoidedError,
  ReceiptEmptyError,
  ReceiptNotCommittedError,
  ReceiptNotDraftError,
  VoidWouldGoNegativeError,
} from '@/hooks/useDeliveryReceipts';
import { InvalidDeliveryLineError } from '@/lib/deliveryReceipt';

/**
 * Maps a receiving error to owner-facing copy in the `receiving` namespace.
 * DraftAlreadyExistsError is not handled here: callers resume that draft.
 */
export function deliveryErrorMessage(err: unknown, t: TFunction): string {
  if (err instanceof ReceiptNotDraftError) return t('errorNotDraft');
  if (err instanceof ReceiptEmptyError) return t('errorEmpty');
  if (err instanceof QuickAddBarcodeExistsError) return t('errorBarcodeExists');
  if (err instanceof ReceiptNotCommittedError) return t('errorNotCommitted');
  if (err instanceof ReceiptAlreadyVoidedError) return t('errorAlreadyVoided');
  if (err instanceof VoidWouldGoNegativeError) {
    const names = err.shortfalls.map((s) => s.productName).join(', ');
    return names
      ? `${t('errorVoidTooLow')} ${t('errorVoidProducts', { names })}`
      : t('errorVoidTooLow');
  }
  if (err instanceof InvalidDeliveryLineError) return err.message;
  return t('errorGeneric');
}
