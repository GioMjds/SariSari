import { memo } from 'react';
import { View } from 'react-native';
import { StyledText } from '@/components/elements';
import { formatPesos } from '@/lib';

interface ReceiptDayHeaderProps {
  label: string;
  cash: number;
  utang: number;
}

// Day divider in the receipts ledger with that day's cash and utang totals.
export const ReceiptDayHeader = memo(function ReceiptDayHeader({
  label,
  cash,
  utang,
}: ReceiptDayHeaderProps) {
  return (
    <View
      accessibilityRole="header"
      className="mx-4 mt-3 mb-2 flex-row items-baseline justify-between"
    >
      <StyledText variant="extrabold" className="text-ink-800 text-sm">
        {label}
      </StyledText>
      <StyledText variant="medium" className="text-mono text-ink-500 text-xs">
        <StyledText variant="extrabold" className="text-sage-700 text-xs">
          {formatPesos(cash)}
        </StyledText>{' '}
        cash
        {utang > 0 && (
          <>
            {' · '}
            <StyledText variant="extrabold" className="text-semantic-warning-700 text-xs">
              {formatPesos(utang)}
            </StyledText>{' '}
            utang
          </>
        )}
      </StyledText>
    </View>
  );
});
