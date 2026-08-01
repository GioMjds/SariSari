import { StyledText } from '@/components/elements';
import {
  ReceiptHero,
  ReceiptHeroMeta,
  ReceiptHeroTotal,
  StatusStamp,
} from '@/components/ui';
import { FontAwesome } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { View } from 'react-native';

interface SaleDetailsHeroProps {
  /** Cash or credit — drives the stamp label, tone, and rotation. */
  paymentType: 'cash' | 'credit';
  /** Whether a customer name was captured on the sale. */
  hasCustomerName: boolean;
  /** The buyer name to render (may be a registered Suki or one-off). */
  customerName?: string | null;
  /** Pre-formatted date/time strings, ready to render. */
  dateLine: string;
  dateShort: string;
  timeShort: string;
  /** Aggregate item count for the Items row. */
  itemsCount: number;
  /** Sale id — used to render the `R-000123` ref number on the meta. */
  saleId: number;
  /** Integer-pesos total — drives the printed-plate `ReceiptHeroTotal`. */
  total: number;
  /** Override eyebrow title ("Utang Record" / "Paid in Full") —
   *  varies per payment type so it stays as a prop. */
  heroTitleLabel: string;
  /** Override label for the credit-mode total plate. */
  creditTotalLabel: string;
  /** Override label for the cash-mode total plate. */
  cashTotalLabel: string;
}

// Static UI copy that never varies — kept here so the parent screen
// doesn’t need to pass (and diff) ten identical string literals every render.
const LABELS = {
  date: 'Date',
  time: 'Time',
  items: 'Items',
  pc: 'pc',
  pcs: 'pcs',
  refNo: 'Ref No.',
  billTo: 'Bill to',
  soldTo: 'Sold to',
  dueOnRequest: 'Due on request',
} as const;

/**
 * SaleDetailsHero — the receipt-style hero card that anchors the top
 * of the Sale Details (resibo) screen.
 *
 * Wraps the standard `ReceiptHero` and renders:
 *   • Eyebrow title ("Utang Record" / "Paid in Full") + status stamp.
 *   • Customer card — "Bill to" for credit (with "Due on request"),
 *     "Sold to" for cash (no due dates / terms).
 *   • Meta rows (date, time, items, ref no.) via ReceiptHeroMeta.
 *   • Printed-plate total at the bottom via ReceiptHeroTotal.
 *
 * Pure presentational — every string and number is pre-computed by
 * the screen so this component has zero formatting logic.
 */
export function SaleDetailsHero({
  paymentType,
  hasCustomerName,
  customerName,
  dateLine,
  dateShort,
  timeShort,
  itemsCount,
  saleId,
  total,
  heroTitleLabel,
  creditTotalLabel,
  cashTotalLabel,
}: SaleDetailsHeroProps) {
  const isCredit = paymentType === 'credit';
  const stampTone = isCredit ? 'persimmon' : 'sage';
  const stampLabel = isCredit ? 'UTANG' : 'CASH';
  const itemsValue = `${itemsCount} ${itemsCount === 1 ? LABELS.pc : LABELS.pcs}`;
  const refNo = `R-${String(saleId).padStart(6, '0')}`;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 18 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 480, delay: 60 }}
    >
      <ReceiptHero tone="persimmon">
        {/* Eyebrow stamp + customer block */}
        <View className="px-5 pt-6 pb-3 flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <StyledText
              variant="black"
              className="text-ink-900 text-3xl"
              style={{ letterSpacing: -0.5 }}
            >
              {heroTitleLabel}
            </StyledText>
            <StyledText variant="regular" className="text-ink-500 text-sm mt-1">
              {dateLine}
            </StyledText>
          </View>
          <StatusStamp
            label={stampLabel}
            tone={stampTone}
            size="md"
            rotate={isCredit ? -8 : 6}
          />
        </View>

        {/* Customer card — credit shows "Bill to" with payment terms,
            cash shows "Sold to" (no due dates / terms). Rendered only
            when a name was captured. */}
        {hasCustomerName && customerName && (
          <View
            className={`mx-5 mt-1 mb-2 rounded-xl px-4 py-3 border border-dashed ${
              isCredit
                ? 'bg-paper-100 border-ink-200'
                : 'bg-paper-50 border-ink-150'
            }`}
          >
            <StyledText className="label-caps text-ink-400 mb-1">
              {isCredit ? LABELS.billTo : LABELS.soldTo}
            </StyledText>
            <StyledText variant="extrabold" className="text-ink-900 text-lg">
              {customerName}
            </StyledText>
            {isCredit && (
              <View className="flex-row items-center mt-1">
                <FontAwesome name="clock-o" size={11} color="#7A7165" />
                <StyledText
                  variant="regular"
                  className="text-ink-500 text-xs ml-1.5"
                >
                  {LABELS.dueOnRequest}
                </StyledText>
              </View>
            )}
          </View>
        )}

        {/* Meta block — date, time, item count, ref no. */}
        <ReceiptHeroMeta
          rows={[
            { label: LABELS.date, value: dateShort },
            { label: LABELS.time, value: timeShort },
            { label: LABELS.items, value: itemsValue },
            { label: LABELS.refNo, value: refNo },
          ]}
        />

        {/* Grand total — printed plate */}
        <ReceiptHeroTotal
          label={isCredit ? creditTotalLabel : cashTotalLabel}
          amount={total}
        />
      </ReceiptHero>
    </MotiView>
  );
}
