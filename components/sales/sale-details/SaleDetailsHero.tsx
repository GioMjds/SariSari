import { StyledText } from '@/components/elements';
import { ReceiptHeroMeta, StatusStamp } from '@/components/ui';
import { SaleWithItems } from '@/types';
import { parseStoredTimestamp } from '@/utils';
import { FontAwesome } from '@expo/vector-icons';
import { format } from 'date-fns';
import { View } from 'react-native';

const CANCELLED = {
  void: { title: 'Voided Sale', stamp: 'VOIDED', note: 'Voided' },
  refund: { title: 'Refunded Sale', stamp: 'REFUNDED', note: 'Refunded' },
  price_correction: {
    title: 'Price Corrected',
    stamp: 'CORRECTED',
    note: 'Replaced by a price correction',
  },
} as const;

// Top of the resibo: title, status stamp, cancellation notice, buyer, and meta rows.
export function SaleDetailsHero({ sale }: { sale: SaleWithItems }) {
  const isCredit = sale.payment_type === 'credit';
  const ts = parseStoredTimestamp(sale.timestamp) || new Date();
  const cancelledAt = parseStoredTimestamp(sale.cancelled_at);
  const cancelled = sale.cancelled_at
    ? CANCELLED[sale.cancelled_by_kind ?? 'void']
    : null;
  const customerName = sale.customer_name?.trim();
  const pieces = sale.items.reduce((sum, item) => sum + item.quantity, 0);
  const lines = sale.items.length;

  return (
    <>
      <View className="px-5 pt-6 pb-4 flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <StyledText
            variant="black"
            accessibilityRole="header"
            className="text-ink-900 text-3xl"
            style={{ letterSpacing: -0.5 }}
          >
            {cancelled?.title ?? (isCredit ? 'Utang Record' : 'Paid in Full')}
          </StyledText>
          <StyledText variant="regular" className="text-ink-500 text-sm mt-1">
            {format(ts, 'EEE, MMM dd, yyyy · hh:mm a')}
          </StyledText>
        </View>
        <StatusStamp
          label={cancelled?.stamp ?? (isCredit ? 'UTANG' : 'CASH')}
          tone={cancelled ? 'ink' : isCredit ? 'persimmon' : 'sage'}
          size="md"
          rotate={cancelled || isCredit ? -8 : 6}
        />
      </View>

      {cancelled && (
        <View
          accessible
          className="mx-5 mb-3 rounded-xl bg-paper-100 border border-ink-200 px-4 py-3 flex-row items-start"
        >
          <FontAwesome name="info-circle" size={14} color="#564E45" />
          <StyledText variant="medium" className="text-ink-700 text-sm ml-2 flex-1">
            {cancelled.note}
            {cancelledAt ? ` on ${format(cancelledAt, 'MMM dd, yyyy · hh:mm a')}` : ''}
            . Not counted in sales totals.
          </StyledText>
        </View>
      )}

      {customerName ? (
        <View className="mx-5 mb-1 rounded-xl px-4 py-3 border border-dashed border-ink-200 bg-paper-100">
          <StyledText variant="extrabold" className="label-caps text-ink-400 mb-1">
            {isCredit ? 'Bill to' : 'Sold to'}
          </StyledText>
          <StyledText variant="extrabold" className="text-ink-900 text-lg">
            {customerName}
          </StyledText>
          {isCredit && !cancelled && (
            <View className="flex-row items-center mt-1">
              <FontAwesome name="clock-o" size={11} color="#564E45" />
              <StyledText variant="regular" className="text-ink-500 text-xs ml-1.5">
                Due on request
              </StyledText>
            </View>
          )}
        </View>
      ) : null}

      <ReceiptHeroMeta
        rows={[
          { label: 'Ref No.', value: `R-${String(sale.id).padStart(6, '0')}` },
          { label: 'Payment', value: isCredit ? 'Utang (credit)' : 'Cash' },
          {
            label: 'Items',
            value: `${lines} ${lines === 1 ? 'line' : 'lines'} · ${pieces} ${pieces === 1 ? 'pc' : 'pcs'}`,
          },
        ]}
      />
    </>
  );
}
