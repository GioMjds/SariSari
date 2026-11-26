import { FontAwesome } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { format, isValid } from 'date-fns';
import { MotiView } from 'moti';
import { useTranslation } from 'react-i18next';
import { CreditTransaction } from '@/types/credits.types';
import { formatPesos } from '@/lib/money';
import { classifyOverdue } from '@/lib/creditDetails';
import { parseStoredTimestamp } from '@/utils/timezone';
import { StatusPill } from '@/components/ui';
import { StyledText } from '@/components/elements';
import { proximityLabel, shortDate } from './labels';

interface UtangCardProps {
  credit: CreditTransaction;
  /** Omitted for settled credits, which have nothing left to collect. */
  onQuickSettle?: (credit: CreditTransaction) => void;
  /** List position for the entry stagger; omit to skip the animation. */
  index?: number;
}

// Entrance stagger stops after this many rows so long lists appear at once.
const STAGGER_LIMIT = 8;

/**
 * One credit in the Utang tab. Leads with what is still owed, then the
 * due status and a Settle shortcut that prefills the payment form.
 */
export const UtangCard = memo(function UtangCard({
  credit,
  onQuickSettle,
  index,
}: UtangCardProps) {
  const { t } = useTranslation('utang');
  const creditDate = parseStoredTimestamp(credit.date);
  const dueDate = credit.due_date ? parseStoredTimestamp(credit.due_date) : null;
  const proximity = classifyOverdue(credit);

  const name = credit.product_name || t('detailCreditFallback');
  const remaining = credit.amount - credit.amount_paid;
  const isPaid = credit.status === 'paid';
  const hasPartial = !isPaid && credit.amount_paid > 0;
  const progressPct =
    credit.amount > 0
      ? Math.max(0, Math.min(100, (credit.amount_paid / credit.amount) * 100))
      : 0;

  const pill = isPaid
    ? { variant: 'success' as const, label: t('detailPillPaid') }
    : proximity.tier === 'overdue'
      ? { variant: 'danger' as const, label: proximityLabel(t, proximity)! }
      : proximity.tier === 'due-soon'
        ? { variant: 'warning' as const, label: proximityLabel(t, proximity)! }
        : hasPartial
          ? { variant: 'warning' as const, label: t('detailPillPartial') }
          : { variant: 'neutral' as const, label: t('detailPillUnpaid') };

  const meta = [
    creditDate && isValid(creditDate)
      ? format(creditDate, 'MMM d, yyyy · h:mm a')
      : t('detailUnknownDate'),
    credit.quantity != null ? t('detailQty', { qty: credit.quantity }) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const card = (
    <View
      className={`rounded-2xl border mb-3 overflow-hidden ${
        isPaid ? 'bg-paper-100 border-ink-100' : 'bg-paper-50 border-ink-100 shadow-paper'
      }`}
    >
      <View
        accessible
        accessibilityLabel={t('detailCreditA11y', {
          name,
          amount: formatPesos(isPaid ? credit.amount : remaining),
          status: pill.label,
        })}
        className="flex-row items-start justify-between px-4 pt-3.5 pb-3"
      >
        <View className="flex-1 pr-3">
          <StyledText
            variant="extrabold"
            className={`text-base ${isPaid ? 'text-ink-600' : 'text-ink-900'}`}
            numberOfLines={2}
          >
            {name}
          </StyledText>
          <StyledText variant="medium" className="text-mono text-ink-500 mt-0.5">
            {meta}
          </StyledText>
        </View>

        <View className="items-end">
          <StyledText
            variant="black"
            className={`text-lg ${isPaid ? 'text-ink-500 line-through' : 'text-ink-900'}`}
          >
            {formatPesos(isPaid ? credit.amount : remaining)}
          </StyledText>
          {hasPartial && (
            <StyledText variant="medium" className="text-mono text-ink-500">
              {t('detailOfTotal', { amount: formatPesos(credit.amount) })}
            </StyledText>
          )}
          {isPaid && (
            <View className="mt-1">
              <StatusPill variant="success" size="sm" dot>
                {pill.label}
              </StatusPill>
            </View>
          )}
        </View>
      </View>

      {hasPartial && (
        <View className="px-4 pb-3">
          <View className="h-1.5 rounded-full bg-paper-200 overflow-hidden">
            <View
              className="h-full rounded-full bg-sage-500"
              style={{ width: `${progressPct}%` }}
            />
          </View>
          <StyledText variant="medium" className="text-mono text-ink-500 mt-1">
            {t('detailPaidOf', {
              paid: formatPesos(credit.amount_paid),
              total: formatPesos(credit.amount),
            })}
          </StyledText>
        </View>
      )}

      {credit.notes?.trim() ? (
        <View className="mx-4 mb-3 flex-row rounded-xl bg-paper-100 px-3 py-2">
          <FontAwesome name="sticky-note-o" size={12} color="#7A7165" style={{ marginTop: 2 }} />
          <StyledText variant="medium" className="flex-1 ml-2 text-ink-700 text-caption">
            {credit.notes}
          </StyledText>
        </View>
      ) : null}

      {!isPaid && (
        <View className="border-t border-dashed border-ink-200 pl-4 pr-2 py-2 flex-row items-center">
          <View className="flex-1 flex-row items-center flex-wrap gap-x-2 gap-y-1">
            <StatusPill variant={pill.variant} size="sm" dot>
              {pill.label}
            </StatusPill>
            {dueDate && isValid(dueDate) && proximity.tier === 'safe' && (
              <StyledText variant="medium" className="text-mono text-ink-500">
                {t('detailDue', { date: shortDate(dueDate) })}
              </StyledText>
            )}
          </View>
          {onQuickSettle && (
            <Pressable
              onPress={() => onQuickSettle(credit)}
              accessibilityRole="button"
              accessibilityLabel={t('detailSettleA11y', {
                amount: formatPesos(remaining),
                name,
              })}
              className="press-scale ml-2 bg-sage-50 border border-sage-500 rounded-pill px-4 min-h-[44px] flex-row items-center justify-center"
            >
              <FontAwesome name="check" size={12} color="#4F7A24" />
              <StyledText variant="extrabold" className="text-sage-700 text-sm ml-1.5">
                {t('detailSettle')}
              </StyledText>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );

  if (typeof index !== 'number' || index >= STAGGER_LIMIT) return card;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 220, delay: index * 30 }}
    >
      {card}
    </MotiView>
  );
});
