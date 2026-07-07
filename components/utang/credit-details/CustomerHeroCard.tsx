import { FontAwesome } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Pressable, View } from 'react-native';
import { t } from 'i18next';
import { dialPhone, smsPhone } from '@/utils';
import {
  CreditTransaction,
  CustomerWithDetails,
  Payment,
} from '@/types/credits.types';
import {
  classifyDebtLimit,
  deriveTrustTags,
  lifetimeCreditVolume,
} from '@/lib/creditDetails';
import { formatPesos } from '@/lib/money';
import { MoneyText, StatusPill } from '@/components/ui';
import { StyledText } from '@/components/elements';
import { ContactRow } from './ContactRow';
import { Perforations } from './Perforations';
import { DebtLimitBar } from './DebtLimitBar';
import { TrustTagPill } from './TrustTagPill';
import { ContactLink } from './ContactLink';
import { StatementShareButton } from './StatementShareButton';

interface CustomerHeroCardProps {
  customer: CustomerWithDetails;
  /** All credits for the suki (paid + unpaid) — used for trust tags. */
  credits: CreditTransaction[];
  /** All payments on file — used for payback-speed tag. */
  payments: Payment[];
  /**
   * Name of the store, used in the statement template. Falls back
   * to a generic line if the profile isn't loaded yet.
   */
  storeName: string;
  /**
   * Currently active credit count — passed so the hero can surface
   * the number of unpaid items at a glance next to the balance.
   */
  activeCreditCount: number;
  onAddPayment: () => void;
  onAddCredit: () => void;
  onMarkAllPaid: () => void;
}

/**
 * CustomerHeroCard — the receipt-style hero that anchors the
 * credit-details screen.
 *
 * Composition:
 *   • ReceiptHero (cinnamon tone) for the receipt-shaped outer card
 *     with a hero money line and a primary CTA row.
 *   • Debt-to-limit warning bar — colored by utilization.
 *   • Trust tags (good payer / frequent suki / needs follow-up).
 *   • Quick contact row (Call / SMS) plus the Statement Share button.
 *
 * The hero carries zero state of its own. Statement text and trust
 * tags are derived here at render time from props — pure
 * presentation, easy to test.
 */
export function CustomerHeroCard({
  customer,
  credits,
  payments,
  storeName,
  activeCreditCount,
  onAddPayment,
  onAddCredit,
  onMarkAllPaid,
}: CustomerHeroCardProps) {
  const trustTags = deriveTrustTags(customer, credits, payments, {
    daysOverdue: customer.days_overdue,
  });
  const debtLimit = classifyDebtLimit(
    customer.outstanding_balance,
    customer.credit_limit ?? null,
  );
  const overdue = (customer.days_overdue ?? 0) > 0;
  const hasOutstanding = customer.outstanding_balance > 0;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 14 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 480, delay: 60 }}
    >
      <View className="rounded-3xl overflow-hidden bg-paper-50 border border-ink-100 shadow-paper-lift">
        {/* Cinnamon header strip — the receipt's "who" band */}
        <View className="bg-cinnamon-500 px-5 pt-4 pb-4 flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <StyledText
              variant="medium"
              className="label-caps text-paper-200 opacity-90"
            >
              Suki Profile
            </StyledText>
            <StyledText
              variant="black"
              className="text-paper-50 text-2xl mt-1"
              style={{ letterSpacing: -0.4 }}
              numberOfLines={1}
            >
              {customer.name}
            </StyledText>
            <ContactRow customer={customer} />
          </View>

          <View className="items-end">
            {overdue && (
              <View className="mb-1.5">
                <StatusPill variant="danger" size="sm" dot>
                  {customer.days_overdue}d overdue
                </StatusPill>
              </View>
            )}
            {trustTags.includes('good_payer') && !overdue && (
              <View className="mb-1.5">
                <StatusPill variant="success" size="sm" dot>
                  Good payer
                </StatusPill>
              </View>
            )}
          </View>
        </View>

        {/* Perforation row that breaks the cinnamon band from the body */}
        <View className="bg-cinnamon-500 h-3" />
        <Perforations negativeTop />

        {/* Hero money — featured plate */}
        <View className="px-5 py-5 bg-paper-100 border-y border-dashed border-ink-200">
          <View className="flex-row items-baseline justify-between mb-1">
            <StyledText variant="extrabold" className="label-caps text-ink-400">
              Outstanding Balance
            </StyledText>
            <StyledText variant="medium" className="text-mono text-ink-500">
              {activeCreditCount} active{' '}
              {activeCreditCount === 1 ? 'item' : 'items'}
            </StyledText>
          </View>

          <View className="flex-row items-baseline">
            <MoneyText
              value={customer.outstanding_balance}
              size="hero"
              variant={hasOutstanding ? 'danger' : 'success'}
              className="text-ink-900"
              style={{ fontSize: 44, letterSpacing: -1.2 }}
            />
          </View>

          {customer.last_transaction_date && (
            <StyledText
              variant="medium"
              className="text-mono text-ink-500 mt-2"
            >
              Lifetime purchases: {formatPesos(lifetimeCreditVolume(credits))}
            </StyledText>
          )}
        </View>

        {/* Debt-to-limit warning */}
        {debtLimit && (
          <DebtLimitBar
            ratio={debtLimit.ratio}
            tone={debtLimit.tone}
            surplusPesos={debtLimit.surplusPesos}
            limit={customer.credit_limit ?? 0}
          />
        )}

        {/* Trust tags row */}
        {trustTags.length > 0 && (
          <View className="px-5 py-3 flex-row flex-wrap items-center gap-2 border-b border-dashed border-ink-200">
            <StyledText
              variant="extrabold"
              className="label-caps text-ink-400 mr-1"
            >
              Trust
            </StyledText>
            {trustTags.map((t) => (
              <TrustTagPill key={t} tag={t} />
            ))}
          </View>
        )}

        {/* Quick contact + statement share row */}
        <View className="px-5 py-4 flex-row gap-2">
          {customer.phone && (
            <ContactLink
              icon="phone"
              label={t('common:call', 'Call')}
              tone="sage"
              onPress={() => dialPhone(customer.phone!)}
            />
          )}
          {customer.phone && (
            <ContactLink
              icon="comment"
              label={t('common:sms', 'SMS')}
              tone="persimmon"
              onPress={() => smsPhone(customer.phone!, customer.name)}
            />
          )}
          <StatementShareButton
            customer={customer}
            credits={credits}
            storeName={storeName}
            disabled={!hasOutstanding}
          />
        </View>

        {/* Primary CTAs — sage Add Payment, cinnamon Add Credit */}
        <View className="px-5 pb-5 pt-1 flex-row gap-2.5">
          <Pressable
            onPress={onAddPayment}
            disabled={!hasOutstanding}
            accessibilityRole="button"
            accessibilityLabel="Add payment for this suki"
            className={`press-scale flex-1 rounded-xl py-3 flex-row items-center justify-center ${
              hasOutstanding
                ? 'bg-sage-500'
                : 'bg-paper-200 border border-ink-200 opacity-50'
            }`}
            style={
              hasOutstanding
                ? {
                    shadowColor: '#4F7A24',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.22,
                    shadowRadius: 8,
                    elevation: 3,
                  }
                : undefined
            }
          >
            <FontAwesome
              name="money"
              size={14}
              color={hasOutstanding ? '#FBF7EE' : '#7A7165'}
            />
            <StyledText
              variant="extrabold"
              className={`text-sm ml-2 ${
                hasOutstanding ? 'text-paper-50' : 'text-ink-500'
              }`}
            >
              {t('common:addPayment', 'Add Payment')}
            </StyledText>
          </Pressable>
          <Pressable
            onPress={onAddCredit}
            accessibilityRole="button"
            accessibilityLabel="Add credit for this suki"
            className="press-scale flex-1 bg-paper-50 border border-ink-200 rounded-xl py-3 flex-row items-center justify-center"
          >
            <FontAwesome name="plus" size={14} color="#623418" />
            <StyledText
              variant="extrabold"
              className="text-cinnamon-700 text-sm ml-2"
            >
              {t('common:addCredit', 'Add Credit')}
            </StyledText>
          </Pressable>
        </View>

        {/* Mark-all-paid — only when there's something to settle */}
        {hasOutstanding && (
          <View className="border-t border-dashed border-ink-200 px-5 py-3">
            <Pressable
              onPress={onMarkAllPaid}
              accessibilityRole="button"
              accessibilityLabel="Mark all credits as paid"
              className="press-scale bg-paper-100 border border-ink-200 rounded-xl py-2.5 flex-row items-center justify-center"
            >
              <FontAwesome name="check-circle" size={12} color="#623418" />
              <StyledText
                variant="extrabold"
                className="text-cinnamon-700 text-xs ml-2"
              >
                {t('common:markAllAsPaid', 'Mark All as Paid')}
              </StyledText>
            </Pressable>
          </View>
        )}

        <Perforations negativeBottom />
      </View>
    </MotiView>
  );
}
