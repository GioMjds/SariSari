import { FontAwesome } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { format, isValid } from 'date-fns';
import { MotiView } from 'moti';
import { CreditTransaction } from '@/types/credits.types';
import { formatPesos } from '@/lib/money';
import { classifyOverdue, overdueLabel } from '@/lib/creditDetails';
import { parseStoredTimestamp } from '@/utils/timezone';
import { StatusPill } from '@/components/ui';
import { StyledText } from '@/components/elements';

interface UtangCardProps {
  credit: CreditTransaction;
  /**
   * Resolved status tone for the overdue pill. Passed in (rather than
   * derived here) so the parent can pin the same classification across
   * the credits list and any aggregate banner.
   */
  onQuickSettle: (credit: CreditTransaction) => void;
  /**
   * Position in the list — drives the staggered entry animation. When
   * omitted, no entrance animation is rendered (the card appears bare).
   */
  index?: number;
}

/**
 * UtangCard — one row in the Credits tab.
 *
 * Layout follows the receipt-ledger visual language:
 *   • Product name + date on the left, total amount on the right.
 *   • A colored status pill (overdue / due-soon / safe / paid / partial)
 *     sits under the amount so the eye lands on urgency first.
 *   • For unpaid/partial credits, a payment-allocation progress bar
 *     shows how much has been paid toward the total.
 *   • An inline notes callout surfaces anything the cashier wrote
 *     during the sale.
 *   • A "Quick Settle" pill jumps straight to the add-payment screen
 *     with the amount pre-filled.
 *
 * Pure presentation — no queries, no DB calls. The parent owns data
 * fetching and the settle handler. When `index` is provided, the row
 * fades + slides into place on mount via Moti.
 */
export const UtangCard = memo(function UtangCard({ credit, onQuickSettle, index }: UtangCardProps) {
  const creditDate = parseStoredTimestamp(credit.date);
  const dueDate = credit.due_date
    ? parseStoredTimestamp(credit.due_date)
    : null;
  const proximity = classifyOverdue(credit);

  const remaining = credit.amount - credit.amount_paid;
  const isPaid = credit.status === 'paid';
  const isPartial = credit.status === 'partial';
  const showProgress = isPartial || (credit.amount_paid > 0 && !isPaid);
  const progressPct = credit.amount > 0
    ? Math.max(0, Math.min(100, (credit.amount_paid / credit.amount) * 100))
    : 0;

  const card = (
    <View
      className="bg-paper-50 rounded-2xl border border-ink-100 shadow-paper mb-3 overflow-hidden"
      accessibilityLabel={`Credit for ${credit.product_name ?? 'Credit'} worth ${formatPesos(credit.amount)}`}
    >
      {/* Header row: name/date vs amount/pill */}
      <View className="flex-row items-start justify-between p-4 pb-3">
        <View className="flex-1 pr-3">
          <StyledText
            variant="extrabold"
            className="text-ink-900 text-base"
            numberOfLines={2}
          >
            {credit.product_name || 'Credit'}
          </StyledText>
          <View className="flex-row items-center mt-1">
            <FontAwesome name="calendar" size={10} color="#7A7165" />
            <StyledText
              variant="medium"
              className="text-mono text-ink-500 ml-1.5"
            >
              {creditDate && isValid(creditDate)
                ? format(creditDate, 'MMM dd, yyyy · h:mm a')
                : 'Unknown date'}
            </StyledText>
          </View>
          {credit.quantity !== undefined && credit.quantity !== null && (
            <StyledText
              variant="medium"
              className="text-mono text-ink-500 mt-0.5"
            >
              Qty {credit.quantity}
            </StyledText>
          )}
        </View>

        <View className="items-end">
          <StyledText
            variant="black"
            className="text-ink-900 text-lg"
          >
            {formatPesos(credit.amount)}
          </StyledText>
          <View className="mt-1.5">
            <ProximityPill proximity={proximity} status={credit.status} />
          </View>
        </View>
      </View>

      {/* Allocation progress — only when partially paid */}
      {showProgress && (
        <View className="px-4 pb-3">
          <View className="flex-row items-baseline justify-between mb-1.5">
            <StyledText
              variant="medium"
              className="text-mono text-ink-500"
            >
              {formatPesos(credit.amount_paid)} of{' '}
              {formatPesos(credit.amount)} paid
            </StyledText>
            <StyledText
              variant="extrabold"
              className="text-mono text-ink-700"
            >
              {Math.round(progressPct)}%
            </StyledText>
          </View>
          <View className="h-2 rounded-full bg-paper-200 overflow-hidden">
            <View
              className="h-full rounded-full bg-sage-500"
              style={{ width: `${progressPct}%` }}
            />
          </View>
          <StyledText
            variant="medium"
            className="text-mono text-ink-500 mt-1.5"
          >
            Remaining: {formatPesos(remaining)}
          </StyledText>
        </View>
      )}

      {/* Due date row */}
      {dueDate && isValid(dueDate) && !isPaid && (
        <View className="px-4 pb-3 flex-row items-center">
          <FontAwesome name="clock-o" size={11} color="#7A7165" />
          <StyledText
            variant="medium"
            className="text-mono text-ink-500 ml-1.5"
          >
            Due {format(dueDate, 'MMM dd, yyyy')}
          </StyledText>
        </View>
      )}

      {/* Inline notes callout */}
      {credit.notes && credit.notes.trim() !== '' && (
        <View className="mx-4 mb-3 rounded-xl bg-paper-100 px-3 py-2">
          <StyledText
            variant="medium"
            className="text-ink-700 text-caption"
          >
            {credit.notes}
          </StyledText>
        </View>
      )}

      {/* Quick Settle action — hidden when already paid */}
      {!isPaid && (
        <View className="border-t border-dashed border-ink-200 px-4 py-3 flex-row items-center justify-between">
          <StyledText
            variant="medium"
            className="text-mono text-ink-500"
          >
            Owes {formatPesos(remaining)}
          </StyledText>
          <Pressable
            onPress={() => onQuickSettle(credit)}
            accessibilityRole="button"
            accessibilityLabel={`Quick settle ${formatPesos(remaining)} for ${credit.product_name ?? 'credit'}`}
            className="press-scale bg-sage-500 rounded-pill px-4 py-2 flex-row items-center"
            style={{
              shadowColor: '#4F7A24',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.2,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <FontAwesome name="bolt" size={12} color="#FBF7EE" />
            <StyledText
              variant="extrabold"
              className="text-paper-50 text-xs ml-1.5"
            >
              Quick Settle
            </StyledText>
          </Pressable>
        </View>
      )}
    </View>
  );

  if (typeof index !== 'number') return card;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 320, delay: 60 + index * 35 }}
    >
      {card}
    </MotiView>
  );
})

/* ─── Status pill ────────────────────────────────────────────────────── */

function ProximityPill({
  proximity,
  status,
}: {
  proximity: ReturnType<typeof classifyOverdue>;
  status: CreditTransaction['status'];
}) {
  // Paid takes precedence — the pill shows what's done, not when due.
  if (proximity.tier === 'paid' || status === 'paid') {
    return (
      <StatusPill variant="success" size="sm" dot>
        Paid
      </StatusPill>
    );
  }

  if (status === 'partial') {
    return (
      <StatusPill variant="warning" size="sm" dot>
        Partial
      </StatusPill>
    );
  }

  if (proximity.tier === 'overdue') {
    return (
      <StatusPill variant="danger" size="sm" dot>
        {overdueLabel(proximity)}
      </StatusPill>
    );
  }

  if (proximity.tier === 'due-soon') {
    return (
      <StatusPill variant="warning" size="sm" dot>
        {overdueLabel(proximity)}
      </StatusPill>
    );
  }

  return (
    <StatusPill variant="neutral" size="sm" dot>
      Unpaid
    </StatusPill>
  );
}
