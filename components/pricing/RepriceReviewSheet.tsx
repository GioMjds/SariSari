import { useEffect } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyledText } from '@/components/elements';
import { Sheet } from '@/components/inventory/modals/_shared';
import {
  useApplyReprice,
  useDismissRepriceFlag,
  useRepriceFlagsForReceipt,
} from '@/hooks/usePriceHistory';
import { useToastStore } from '@/stores';
import { RepriceRow } from './RepriceRow';

export interface RepriceReviewSheetProps {
  /** Null keeps the sheet closed. */
  receiptId: number | null;
  onClose: () => void;
}

export function RepriceReviewSheet({
  receiptId,
  onClose,
}: RepriceReviewSheetProps) {
  const { t } = useTranslation('pricing');
  const addToast = useToastStore((s) => s.addToast);
  const flagsQuery = useRepriceFlagsForReceipt(receiptId);
  const applyMutation = useApplyReprice();
  const dismissMutation = useDismissRepriceFlag();

  const flags = flagsQuery.data ?? [];
  const busy = applyMutation.isPending || dismissMutation.isPending;
  const finished =
    receiptId !== null && flagsQuery.isSuccess && flags.length === 0;

  // Once every flagged item is handled there is nothing left to review.
  useEffect(() => {
    if (finished) onClose();
  }, [finished, onClose]);

  const handleApply = (productId: number, newPrice: number) => {
    applyMutation.mutate(
      { productId, newPrice },
      {
        onSuccess: () =>
          addToast({ message: t('updatedToast'), variant: 'success' }),
        onError: () =>
          addToast({ message: t('errorToast'), variant: 'danger' }),
      },
    );
  };

  const handleKeep = (productId: number) => {
    dismissMutation.mutate(productId, {
      onSuccess: () =>
        addToast({ message: t('keptToast'), variant: 'success' }),
      onError: () => addToast({ message: t('errorToast'), variant: 'danger' }),
    });
  };

  return (
    <Sheet visible={receiptId !== null && !finished} onClose={onClose}>
      <View>
        <StyledText variant="extrabold" className="text-xl text-ink-900">
          {t('sheetTitle')}
        </StyledText>
        <StyledText variant="regular" className="mt-1 text-sm text-ink-600">
          {t('sheetSubtitle', { count: flags.length })}
        </StyledText>
      </View>

      <ScrollView
        style={{ maxHeight: 420 }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ rowGap: 12 }}
      >
        {flags.map((flag) => (
          <RepriceRow
            key={flag.productId}
            flag={flag}
            busy={busy}
            onApply={handleApply}
            onKeep={handleKeep}
          />
        ))}
      </ScrollView>

      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        className="min-h-[48px] items-center justify-center rounded-xl border border-ink-200 bg-paper-100 active:opacity-80"
      >
        <StyledText variant="semibold" className="text-sm text-ink-800">
          {t('later')}
        </StyledText>
      </Pressable>
    </Sheet>
  );
}
