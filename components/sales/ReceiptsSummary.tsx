import { memo } from 'react';
import { View } from 'react-native';
import { StyledText } from '@/components/elements';
import { formatPesos } from '@/lib';
import { ReceiptTotals } from '@/utils';

// Totals for the filtered receipts: cash received, utang owed, cancelled count.
export const ReceiptsSummary = memo(function ReceiptsSummary({
  count,
  cash,
  utang,
  cancelledCount,
}: ReceiptTotals) {
  return (
    <View className="mx-4 mb-1 rounded-card border border-ink-100 bg-paper-50 px-4 py-3">
      <StyledText variant="medium" className="text-ink-500 text-xs">
        {count} {count === 1 ? 'receipt' : 'receipts'}
        {cancelledCount > 0 &&
          ` · ${cancelledCount} cancelled, not counted`}
      </StyledText>
      <View className="flex-row mt-1.5">
        <View className="flex-1">
          <StyledText variant="extrabold" className="label-caps text-ink-500">
            Cash received
          </StyledText>
          <StyledText variant="extrabold" className="text-mono text-sage-700 text-xl">
            {formatPesos(cash)}
          </StyledText>
        </View>
        <View className="flex-1 pl-4 border-l border-dashed border-ink-200">
          <StyledText variant="extrabold" className="label-caps text-ink-500">
            Utang given
          </StyledText>
          <StyledText
            variant="extrabold"
            className="text-mono text-semantic-warning-700 text-xl"
          >
            {formatPesos(utang)}
          </StyledText>
        </View>
      </View>
    </View>
  );
});
