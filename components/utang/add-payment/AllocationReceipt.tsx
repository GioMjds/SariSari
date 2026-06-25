import { FontAwesome } from '@expo/vector-icons';
import { View } from 'react-native';
import { format } from 'date-fns';
import { formatPesos } from '@/lib/money';
import { StyledText } from '@/components/elements';
import { AllocationRow } from './useAddPaymentForm';

interface AllocationReceiptProps {
  rows: AllocationRow[];
  unallocated: number;
  /** True when the form has an amount entered (drives visibility). */
  hasAmount: boolean;
}

/**
 * AllocationReceipt — the live FIFO credit-allocation receipt.
 *
 * Renders the suki's unpaid credits oldest-to-newest with three
 * visual states:
 *   • Covered (green, checkmark)   — fully paid by this payment
 *   • Partial (orange)            — partly paid by this payment
 *   • Untouched (standard ink)    — not reached yet
 *
 * The visible state mirrors what `database/credits.ts:insertPayment`
 * will write inside the SQLite transaction.
 */
export function AllocationReceipt({
  rows,
  unallocated,
  hasAmount,
}: AllocationReceiptProps) {
  if (rows.length === 0) {
    return (
      <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4">
        <StyledText variant="black" className="label-caps text-cinnamon-500">
          Allocation Receipt
        </StyledText>
        <View className="mt-3 items-center py-6">
          <FontAwesome name="list-alt" size={28} color="#A89F90" />
          <StyledText
            variant="medium"
            className="text-ink-400 text-sm mt-2 text-center"
          >
            {hasAmount
              ? 'Payment exceeds outstanding balance'
              : 'No unpaid credits for this suki'}
          </StyledText>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-paper-50 rounded-2xl shadow-paper border border-ink-100 p-4 overflow-hidden">
      <View className="mb-2 flex-row items-center justify-between">
        <StyledText variant="black" className="label-caps text-cinnamon-500">
          Allocation Receipt
        </StyledText>
        <StyledText variant="medium" className="text-ink-400 text-xs">
          FIFO · oldest first
        </StyledText>
      </View>

      <View className="bg-paper-100 rounded-xl border border-ink-100 p-3">
        {rows.map((row, index) => (
          <View key={row.credit.id}>
            {index > 0 && (
              <View className="border-t border-dashed border-ink-200 my-2.5" />
            )}
            <AllocationRowItem row={row} />
          </View>
        ))}

        {unallocated > 0 && (
          <>
            <View className="border-t border-dashed border-ink-200 my-2.5" />
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <FontAwesome name="exclamation-circle" size={12} color="#C77B0E" />
                <StyledText
                  variant="semibold"
                  className="text-semantic-warning text-xs ml-1.5"
                >
                  Unallocated
                </StyledText>
              </View>
              <StyledText
                variant="extrabold"
                className="text-semantic-warning text-sm"
              >
                {formatPesos(unallocated)}
              </StyledText>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

interface AllocationRowItemProps {
  row: AllocationRow;
}

function AllocationRowItem({ row }: AllocationRowItemProps) {
  const { credit, applied, owedBefore, remainingAfter } = row;

  const stateColor = row.fullyCovered
    ? 'text-semantic-success'
    : row.partiallyCovered
      ? 'text-semantic-warning'
      : 'text-ink-400';

  const stateBg = row.fullyCovered
    ? 'bg-sage-50'
    : row.partiallyCovered
      ? 'bg-semantic-warning-50'
      : 'bg-paper-50';

  const stateLabel = row.fullyCovered
    ? 'Covered'
    : row.partiallyCovered
      ? 'Partial'
      : 'Unpaid';

  const stateIcon: 'check-circle' | 'circle-o' | 'minus-circle' = row.fullyCovered
    ? 'check-circle'
    : row.partiallyCovered
      ? 'minus-circle'
      : 'circle-o';

  return (
    <View>
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-2">
          <StyledText
            variant="extrabold"
            className={`text-sm ${row.fullyCovered || row.partiallyCovered ? 'text-ink-900' : 'text-ink-500'}`}
            numberOfLines={1}
          >
            {credit.product_name || 'Credit'}
          </StyledText>
          <StyledText variant="medium" className="text-ink-400 text-xs mt-0.5">
            {format(new Date(credit.date), 'MMM dd, yyyy')} ·{' '}
            {formatPesos(credit.amount)}
          </StyledText>
        </View>
        <View
          className={`flex-row items-center px-2 py-1 rounded-pill ${stateBg}`}
        >
          <FontAwesome
            name={stateIcon}
            size={10}
            color={
              row.fullyCovered
                ? '#4F7A24'
                : row.partiallyCovered
                  ? '#C77B0E'
                  : '#7A7165'
            }
          />
          <StyledText
            variant="extrabold"
            className={`text-[10px] uppercase tracking-wider ml-1 ${stateColor}`}
          >
            {stateLabel}
          </StyledText>
        </View>
      </View>

      <View className="mt-1.5 flex-row items-baseline justify-between">
        <StyledText variant="medium" className="text-ink-500 text-xs">
          {row.partiallyCovered
            ? `${formatPesos(applied)} of ${formatPesos(owedBefore)}`
            : `${formatPesos(owedBefore)} owed`}
        </StyledText>
        {applied > 0 && (
          <StyledText
            variant="extrabold"
            className={`text-sm ${stateColor}`}
          >
            −{formatPesos(applied)}
          </StyledText>
        )}
      </View>

      {row.partiallyCovered && (
        <StyledText
          variant="medium"
          className="text-ink-400 text-[11px] mt-0.5"
        >
          {formatPesos(remainingAfter)} still owed
        </StyledText>
      )}
    </View>
  );
}
