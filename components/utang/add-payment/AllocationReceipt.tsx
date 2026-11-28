import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatPesos } from '@/lib/money';
import { parseStoredTimestamp } from '@/utils/timezone';
import { StyledText } from '@/components/elements';
import { Skeleton, StatusPill } from '@/components/ui';
import { SariMascot } from '@/components/mascot';
import { Perforations } from '@/components/utang/credit-details/Perforations';
import { shortDate } from '@/components/utang/credit-details/labels';
import { AllocationRow } from './useAddPaymentForm';

interface AllocationReceiptProps {
  rows: AllocationRow[];
  /** Unpaid credits on the account, touched or not. */
  openCount: number;
  hasAmount: boolean;
  quickSettle: boolean;
  /** Credits still loading; avoids a false "Nothing to collect". */
  loading?: boolean;
  customerName: string;
}

// Shows exactly which utang items this payment pays, mirroring the DB allocation.
export function AllocationReceipt({
  rows,
  openCount,
  hasAmount,
  quickSettle,
  loading = false,
  customerName,
}: AllocationReceiptProps) {
  const { t } = useTranslation('utang');

  if (loading) {
    return (
      <View className="bg-paper-50 rounded-2xl border border-ink-100 shadow-paper p-4 gap-3">
        <Skeleton width={90} height={14} />
        <Skeleton width={'100%'} height={36} borderRadius={8} />
      </View>
    );
  }

  if (openCount === 0) {
    return (
      <View className="bg-paper-50 rounded-2xl border border-ink-100 shadow-paper p-5 items-center">
        <SariMascot state="balance-cleared" size={96} />
        <StyledText variant="extrabold" className="text-ink-900 text-base mt-2">
          {t('addPaymentNothingTitle')}
        </StyledText>
        <StyledText
          variant="regular"
          className="text-ink-600 text-sm mt-1 text-center"
        >
          {t('addPaymentNothingBody', { name: customerName })}
        </StyledText>
      </View>
    );
  }

  const touched = rows.filter((r) => r.applied > 0 || quickSettle);
  const untouched = openCount - touched.length;

  return (
    <View className="bg-paper-50 rounded-2xl border border-ink-100 shadow-paper">
      <View className="px-4 pt-4 pb-2 flex-row items-baseline justify-between">
        <StyledText
          variant="semibold"
          accessibilityRole="header"
          className="text-ink-700 text-sm"
        >
          {t('addPaymentAppliesTo')}
        </StyledText>
        <StyledText variant="medium" className="text-ink-500 text-xs">
          {quickSettle
            ? t('addPaymentThisItemOnly')
            : t('addPaymentOldestFirst')}
        </StyledText>
      </View>

      {!hasAmount && !quickSettle ? (
        <StyledText
          variant="regular"
          className="text-ink-600 text-sm px-4 pb-4"
        >
          {t('addPaymentAppliesEmpty')}
        </StyledText>
      ) : (
        <View className="px-4 pb-4">
          {touched.map((row, index) => (
            <View
              key={row.credit.id}
              className={
                index > 0
                  ? 'border-t border-dashed border-ink-200 mt-3 pt-3'
                  : ''
              }
            >
              <AllocationRowItem row={row} />
            </View>
          ))}
          {untouched > 0 && (
            <StyledText variant="medium" className="text-ink-500 text-xs mt-3">
              {t(
                untouched === 1
                  ? 'addPaymentMoreOpenSingular'
                  : 'addPaymentMoreOpenPlural',
                {
                  count: untouched,
                },
              )}
            </StyledText>
          )}
        </View>
      )}

      <Perforations negativeBottom />
    </View>
  );
}

function AllocationRowItem({ row }: { row: AllocationRow }) {
  const { t } = useTranslation('utang');
  const { credit, applied, remainingAfter } = row;
  const name = credit.product_name || t('detailCreditFallback');
  const parsed = parseStoredTimestamp(credit.date);
  const date =
    parsed && !Number.isNaN(parsed.getTime()) ? shortDate(parsed) : '';

  const status = row.fullyCovered
    ? { variant: 'success' as const, label: t('addPaymentStatusPaid') }
    : row.partiallyCovered
      ? { variant: 'warning' as const, label: t('addPaymentStatusPartial') }
      : { variant: 'neutral' as const, label: t('addPaymentStatusOpen') };

  return (
    <View
      accessible
      accessibilityLabel={t('addPaymentRowA11y', {
        name,
        date,
        applied: formatPesos(applied),
        left: formatPesos(remainingAfter),
      })}
    >
      <View className="flex-row items-center justify-between">
        <StyledText
          variant="extrabold"
          className="text-ink-900 text-sm flex-1 mr-2"
          numberOfLines={1}
        >
          {name}
        </StyledText>
        <StatusPill variant={status.variant} size="sm">
          {status.label}
        </StatusPill>
      </View>
      <View className="mt-1 flex-row items-baseline justify-between">
        <StyledText variant="regular" className="text-ink-500 text-xs">
          {date ? `${date} · ` : ''}
          {remainingAfter > 0
            ? t('addPaymentRowLeft', { amount: formatPesos(remainingAfter) })
            : formatPesos(credit.amount)}
        </StyledText>
        {applied > 0 && (
          <StyledText
            variant="extrabold"
            className="text-ink-900 text-sm"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            −{formatPesos(applied)}
          </StyledText>
        )}
      </View>
    </View>
  );
}
