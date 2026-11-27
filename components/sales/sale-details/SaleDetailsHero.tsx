import { StyledText } from '@/components/elements';
import { MoneyText, ReceiptHeroMeta, StatusStamp } from '@/components/ui';
import { formatPesos } from '@/lib/money';
import { ICON_COLOR } from '@/lib/theme';
import { SaleWithItems } from '@/types';
import type { SaleCorrection } from '@/types/corrections.types';
import { formatReceiptRef, getCancelledKind, parseStoredTimestamp } from '@/utils';
import { FontAwesome } from '@expo/vector-icons';
import { format, isToday, isYesterday } from 'date-fns';
import { Pressable, View } from 'react-native';

interface SaleDetailsHeroProps {
  sale: SaleWithItems;
  /** Latest correction on this sale, used to explain a void, refund or price fix. */
  correction?: SaleCorrection | undefined;
  onOpenCustomer?: (() => void) | undefined;
}

type IconName = React.ComponentProps<typeof FontAwesome>['name'];

// Turns a stored reason code like wrong_item_scanned into "Wrong item scanned".
const humanize = (code: string) => {
  const text = code.replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const dayLabel = (d: Date) =>
  isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'EEE, MMM d');

// Top of the resibo: amount, status, correction notice, buyer, and meta rows.
export function SaleDetailsHero({ sale, correction, onOpenCustomer }: SaleDetailsHeroProps) {
  const isCredit = sale.payment_type === 'credit';
  const ts = parseStoredTimestamp(sale.timestamp) || new Date();
  const cancelled = getCancelledKind(sale);
  const cancelledAt = parseStoredTimestamp(sale.cancelled_at);
  const customerName = sale.customer_name?.trim();
  const pieces = sale.items.reduce((sum, item) => sum + item.quantity, 0);
  const lines = sale.items.length;
  const priceFix = !cancelled && correction?.kind === 'price_correction' ? correction : null;
  const priceFixAt = priceFix ? parseStoredTimestamp(String(priceFix.createdAt)) : null;

  const status: { icon: IconName; color: string; text: string; className: string } = cancelled
    ? {
        icon: 'ban',
        color: ICON_COLOR.inkMuted,
        text: `${cancelled.note} · not counted in sales`,
        className: 'text-ink-700',
      }
    : isCredit
      ? {
          icon: 'book',
          color: ICON_COLOR.persimmonStrong,
          text: customerName ? `Added to ${customerName}'s utang` : 'Added to utang',
          className: 'text-persimmon-700',
        }
      : { icon: 'check-circle', color: ICON_COLOR.sageStrong, text: 'Paid in cash', className: 'text-sage-700' };

  return (
    <>
      <View
        accessible
        accessibilityRole="header"
        accessibilityLabel={`${formatPesos(sale.total)}. ${status.text}. ${format(ts, 'EEEE, MMMM d, yyyy, h:mm a')}`}
        className="px-5 pt-6 pb-4"
      >
        <View className="flex-row items-center justify-between">
          <StyledText variant="medium" className="text-sm text-ink-500 flex-1 pr-3">
            {cancelled ? 'Original total' : isCredit ? 'Amount on utang' : 'Total paid'}
          </StyledText>
          <StatusStamp
            label={cancelled?.stamp ?? (isCredit ? 'UTANG' : 'CASH')}
            tone={cancelled ? 'ink' : isCredit ? 'persimmon' : 'sage'}
            size="md"
            rotate={cancelled || isCredit ? -8 : 6}
          />
        </View>
        {/* Full width so five-digit totals fit on small phones without truncating. */}
        <MoneyText
          value={sale.total}
          size="display"
          className={`mt-2 ${cancelled ? 'text-ink-400 line-through' : 'text-ink-900'}`}
        />


        <View className="flex-row items-center mt-3">
          <FontAwesome name={status.icon} size={14} color={status.color} />
          <StyledText variant="extrabold" className={`text-sm ml-2 flex-1 ${status.className}`}>
            {status.text}
          </StyledText>
        </View>
        <StyledText variant="regular" className="text-ink-500 text-sm mt-1">
          {dayLabel(ts)} · {format(ts, 'h:mm a')}
        </StyledText>
      </View>

      {cancelled && (
        <View accessible className="mx-5 mb-3 rounded-xl bg-paper-100 border border-ink-200 px-4 py-3 flex-row items-start">
          <FontAwesome name="info-circle" size={14} color={ICON_COLOR.inkMuted} style={{ marginTop: 2 }} />
          <View className="ml-2 flex-1">
            <StyledText variant="extrabold" className="text-ink-900 text-sm">
              {cancelled.note}
              {cancelledAt ? ` on ${format(cancelledAt, 'MMM d, yyyy · h:mm a')}` : ''}
            </StyledText>
            {correction && correction.kind !== 'price_correction' && (
              <StyledText variant="regular" className="text-ink-700 text-sm mt-1">
                {humanize(correction.actorReasonCode)}
                {correction.actorUser ? ` · by ${correction.actorUser}` : ''}
              </StyledText>
            )}
            {correction?.actorNote ? (
              <StyledText variant="regular" className="text-ink-500 text-sm mt-1">
                {`"${correction.actorNote}"`}
              </StyledText>
            ) : null}
            <StyledText variant="regular" className="text-ink-500 text-xs mt-1.5">
              Stock was restored. Not counted in sales totals.
            </StyledText>
          </View>
        </View>
      )}

      {priceFix && (
        <View accessible className="mx-5 mb-3 rounded-xl bg-paper-100 border border-ink-200 px-4 py-3 flex-row items-start">
          <FontAwesome name="pencil" size={13} color={ICON_COLOR.inkMuted} style={{ marginTop: 2 }} />
          <StyledText variant="medium" className="text-ink-700 text-sm ml-2 flex-1">
            Price corrected
            {priceFixAt ? ` on ${format(priceFixAt, 'MMM d · h:mm a')}` : ''}
            {` · ${humanize(priceFix.actorReasonCode)}`}
          </StyledText>
        </View>
      )}

      {customerName ? (
        <Pressable
          onPress={onOpenCustomer}
          disabled={!onOpenCustomer}
          accessibilityRole={onOpenCustomer ? 'button' : 'text'}
          accessibilityLabel={`${isCredit ? 'Bill to' : 'Sold to'} ${customerName}`}
          {...(onOpenCustomer && { accessibilityHint: 'Opens the utang ledger for this customer' })}
          className="mx-5 mb-1 min-h-12 rounded-xl px-4 py-3 border border-dashed border-ink-200 bg-paper-100 flex-row items-center active:bg-paper-200"
        >
          <View className="flex-1">
            <StyledText variant="medium" className="text-sm text-ink-500">
              {isCredit ? 'Bill to' : 'Sold to'}
            </StyledText>
            <StyledText variant="extrabold" className="text-ink-900 text-lg">
              {customerName}
            </StyledText>
            {onOpenCustomer && (
              <StyledText variant="medium" className="text-persimmon-700 text-xs mt-0.5">
                View utang ledger
              </StyledText>
            )}
          </View>
          {onOpenCustomer && <FontAwesome name="chevron-right" size={12} color={ICON_COLOR.inkMuted} />}
        </Pressable>
      ) : null}

      <ReceiptHeroMeta
        caps={false}
        rows={[
          { label: 'Ref No.', value: formatReceiptRef(sale.id) },
          { label: 'Date', value: format(ts, 'MMM d, yyyy · h:mm a') },
          {
            label: 'Items',
            value: `${lines} ${lines === 1 ? 'line' : 'lines'} · ${pieces} ${pieces === 1 ? 'pc' : 'pcs'}`,
          },
        ]}
      />
    </>
  );
}
