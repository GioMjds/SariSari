import { memo, useMemo } from 'react';
import { View } from 'react-native';
import { MotiView } from 'moti';
import { useTranslation } from 'react-i18next';
import { dialPhone, smsPhone } from '@/utils';
import {
  classifyDebtLimit,
  classifyOverdue,
  deriveTrustTags,
  lifetimeCreditVolume,
  paymentStats,
} from '@/lib/creditDetails';
import { formatPesos } from '@/lib/money';
import { parseStoredTimestamp } from '@/utils/timezone';
import type {
  CreditTransaction,
  CustomerWithDetails,
} from '@/types/credits.types';
import { MoneyText, StatusPill } from '@/components/ui';
import { StyledText } from '@/components/elements';
import { DebtLimitBar } from './DebtLimitBar';
import { TrustTagPill } from './TrustTagPill';
import { ContactLink } from './ContactLink';
import { Perforations } from './Perforations';
import { proximityLabel, shortDate } from './labels';

interface BalanceCardProps {
  customer: CustomerWithDetails;
  /** Unpaid and partial credits, oldest first. */
  openCredits: CreditTransaction[];
}

// One answer up top: how much this suki owes and how urgent it is.
export const BalanceCard = memo(function BalanceCard({
  customer,
  openCredits,
}: BalanceCardProps) {
  const { t } = useTranslation('utang');
  const balance = customer.outstanding_balance;
  const owes = balance > 0;

  const view = useMemo(() => {
    const { totalPaid, lastPaymentDate } = paymentStats(customer.payments);
    const overdueDays = customer.days_overdue ?? 0;

    // The overdue pill already covers the follow-up signal.
    const trustTags = deriveTrustTags(
      customer,
      customer.credits,
      customer.payments,
      { daysOverdue: overdueDays },
    ).filter((tag) => tag !== 'needs_followup');

    // Closest due date wins when nothing is overdue yet.
    const nearest = openCredits
      .map((c) => classifyOverdue(c))
      .filter((p) => p.tier === 'overdue' || p.tier === 'due-soon')
      .sort((a, b) => b.daysOffset - a.daysOffset)[0];

    const oldest = openCredits[0]
      ? parseStoredTimestamp(openCredits[0].date)
      : null;

    return {
      totalPaid,
      lastPaymentDate,
      trustTags,
      nearest,
      overdueDays,
      oldest: oldest && !Number.isNaN(oldest.getTime()) ? oldest : null,
      lifetime: lifetimeCreditVolume(customer.credits),
      limitState: classifyDebtLimit(balance, customer.credit_limit ?? null),
    };
  }, [customer, openCredits, balance]);

  const status = !owes
    ? { variant: 'success' as const, label: t('detailStatusSettled') }
    : view.overdueDays > 0
      ? {
          variant: 'danger' as const,
          label: proximityLabel(t, {
            tier: 'overdue',
            daysOffset: view.overdueDays,
          }),
        }
      : view.nearest
        ? {
            variant: 'warning' as const,
            label: proximityLabel(t, view.nearest),
          }
        : null;

  const openCount = openCredits.length;
  const summary = owes
    ? [
        t(
          openCount === 1 ? 'detailOpenItemsSingular' : 'detailOpenItemsPlural',
          { count: openCount },
        ),
        view.oldest
          ? t('detailOpenSince', { date: shortDate(view.oldest) })
          : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : t('detailSettledMessage');

  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 240 }}
    >
      <View className="rounded-3xl overflow-hidden bg-paper-50 border border-ink-100 shadow-paper-lift">
        <View className="px-5 pt-5 pb-4">
          <View className="flex-row items-center justify-between">
            <StyledText variant="semibold" className="text-ink-600 text-sm">
              {t('detailBalanceLabel')}
            </StyledText>
            {status?.label ? (
              <StatusPill variant={status.variant} size="sm" dot>
                {status.label}
              </StatusPill>
            ) : null}
          </View>

          <MoneyText
            value={balance}
            size="hero"
            className={`mt-1 ${owes ? 'text-ink-900' : 'text-sage-700'}`}
            style={{ fontSize: 44, letterSpacing: -0.9 }}
          />

          <StyledText variant="medium" className="text-mono text-ink-500 mt-1">
            {summary}
          </StyledText>

          {view.trustTags.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mt-3">
              {view.trustTags.map((tag) => (
                <TrustTagPill key={tag} tag={tag} />
              ))}
            </View>
          )}
        </View>

        {view.limitState && (
          <View className="px-5 pb-4">
            <DebtLimitBar
              state={view.limitState}
              balance={balance}
              limit={customer.credit_limit ?? 0}
            />
          </View>
        )}

        <View className="flex-row border-t border-dashed border-ink-200 bg-paper-100">
          <Stat
            label={t('detailStatTotalUtang')}
            value={formatPesos(view.lifetime)}
          />
          <Stat
            label={t('detailStatTotalPaid')}
            value={formatPesos(view.totalPaid)}
            divider
          />
          <Stat
            label={t('detailStatLastPayment')}
            value={
              view.lastPaymentDate
                ? shortDate(view.lastPaymentDate)
                : t('detailStatNone')
            }
            divider
          />
        </View>

        {customer.phone ? (
          <View className="px-5 py-3 flex-row gap-2 border-t border-dashed border-ink-200">
            <ContactLink
              icon="phone"
              label={t('detailCall')}
              accessibilityLabel={t('detailCallA11y', { name: customer.name })}
              tone="sage"
              onPress={() => dialPhone(customer.phone!)}
            />
            <ContactLink
              icon="comment"
              label={t('detailSms')}
              accessibilityLabel={t('detailSmsA11y', { name: customer.name })}
              tone="persimmon"
              onPress={() => smsPhone(customer.phone!, customer.name)}
            />
          </View>
        ) : null}

        <Perforations negativeBottom />
      </View>
    </MotiView>
  );
});

function Stat({
  label,
  value,
  divider,
}: {
  label: string;
  value: string;
  divider?: boolean;
}) {
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      className={`flex-1 px-3 py-3 ${divider ? 'border-l border-dashed border-ink-200' : ''}`}
    >
      <StyledText variant="medium" className="text-ink-500 text-xs" numberOfLines={1}>
        {label}
      </StyledText>
      <StyledText
        variant="extrabold"
        className="text-ink-900 text-sm mt-0.5"
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </StyledText>
    </View>
  );
}
